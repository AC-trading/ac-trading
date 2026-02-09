import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 메시지 타입 정의
export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderNickname: string;
  messageType: 'TEXT' | 'IMAGE';
  content: string | null;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

// 메시지 전송 요청 타입
export interface ChatMessageRequest {
  chatRoomId: number;
  messageType?: string;
  content?: string;
  imageUrl?: string;
}

// 읽음 처리 요청 타입
export interface ChatReadRequest {
  chatRoomId: number;
}

// Before: SockJS 사용 → Railway 프록시에서 /ws/info, XHR 트랜스포트 실패로 연결 불가
// After: 네이티브 WebSocket 사용 → 프록시 호환성 우수, SockJS 의존성 제거
// + 연결 세대(generation) 추적으로 이전 연결의 콜백이 현재 연결 상태를 덮어쓰는 경합 조건 수정

// WebSocket URL 생성 (http → ws, https → wss)
function getWebSocketUrl(): string {
  return API_URL.replace(/^http/, 'ws') + '/ws';
}

// WebSocket 클라이언트 클래스
class WebSocketClient {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  // 연결 세대 카운터 - 이전 연결의 콜백이 현재 연결을 방해하지 않도록 추적
  private connectionGeneration = 0;

  // 연결
  async connect(
    accessToken: string,
    onConnect?: () => void,
    onDisconnect?: () => void
  ): Promise<void> {
    // 이미 연결된 상태면 콜백만 호출
    if (this.client?.connected) {
      console.log('WebSocket 이미 연결됨');
      onConnect?.();
      return;
    }

    // 기존 클라이언트 정리
    if (this.client) {
      console.log('기존 WebSocket 클라이언트 정리');
      try {
        await this.client.deactivate();
      } catch (e) {
        console.warn('WebSocket deactivate 실패:', e);
      }
      this.client = null;
    }

    // 새 연결 세대 - 이전 연결의 콜백 무시용
    const generation = ++this.connectionGeneration;
    // Before: onWebSocketError + onWebSocketClose 연속 발생 시 onDisconnect 중복 호출
    // After: hasDisconnected 가드로 연결당 1회만 호출
    let hasDisconnected = false;

    this.client = new Client({
      // 네이티브 WebSocket 사용 (SockJS 대신 - 프록시 호환성 우수)
      brokerURL: getWebSocketUrl(),

      // STOMP 연결 헤더 (JWT 토큰)
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },

      // 디버그 로그
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[STOMP]', str);
        }
      },

      // STOMP.js 내장 재연결 (5초 간격)
      reconnectDelay: 5000,

      // 하트비트 설정 (서버와 연결 유지 확인)
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      // 연결 성공 (STOMP.js 자동 재연결 시에도 호출됨)
      onConnect: () => {
        // 현재 세대가 아니면 무시 (이전 연결의 콜백)
        if (generation !== this.connectionGeneration) return;
        // Before: 재연결 시 hasDisconnected가 true인 채로 유지 → 이후 disconnect 콜백 무시됨
        // After: 재연결 성공 시 리셋하여 다음 disconnect 감지 가능
        hasDisconnected = false;
        console.log('WebSocket 연결 성공');
        onConnect?.();
      },

      // 연결 해제
      onDisconnect: () => {
        if (generation !== this.connectionGeneration || hasDisconnected) return;
        hasDisconnected = true;
        console.log('WebSocket 연결 해제');
        onDisconnect?.();
      },

      // STOMP 프로토콜 에러
      onStompError: (frame) => {
        console.error('STOMP 에러:', frame.headers['message']);
        console.error('에러 상세:', frame.body);
      },

      // WebSocket 에러
      onWebSocketError: (event) => {
        if (generation !== this.connectionGeneration || hasDisconnected) return;
        hasDisconnected = true;
        console.error('WebSocket 에러:', event);
        onDisconnect?.();
      },

      // WebSocket 종료
      onWebSocketClose: (event) => {
        if (generation !== this.connectionGeneration || hasDisconnected) return;
        hasDisconnected = true;
        console.log('WebSocket 종료:', event);
        onDisconnect?.();
      },
    });

    this.client.activate();
  }

  // 연결 해제
  disconnect(): void {
    // 세대 증가로 이전 콜백 무효화
    this.connectionGeneration++;

    if (this.client) {
      // 모든 구독 해제
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();

      this.client.deactivate();
      this.client = null;
      console.log('WebSocket 연결 해제 완료');
    }
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  // 채팅방 구독
  subscribeToChatRoom(
    roomId: number,
    onMessage: (message: ChatMessage) => void,
    onRead?: (userId: number) => void
  ): void {
    if (!this.client?.connected) {
      console.error('WebSocket이 연결되지 않음');
      return;
    }

    const destination = `/topic/chat.${roomId}`;

    // 이미 구독 중이면 무시
    if (this.subscriptions.has(destination)) {
      console.log(`이미 구독 중: ${destination}`);
      return;
    }

    // 메시지 구독
    const messageSub = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        onMessage(chatMessage);
      } catch (e) {
        console.error('메시지 파싱 에러:', e);
      }
    });
    this.subscriptions.set(destination, messageSub);

    // 읽음 알림 구독
    if (onRead) {
      const readDestination = `/topic/chat.${roomId}.read`;
      const readSub = this.client.subscribe(readDestination, (message: IMessage) => {
        try {
          const userId = JSON.parse(message.body);
          onRead(userId);
        } catch (e) {
          console.error('읽음 알림 파싱 에러:', e);
        }
      });
      this.subscriptions.set(readDestination, readSub);
    }

    console.log(`채팅방 구독 완료: ${roomId}`);
  }

  // 채팅방 구독 해제
  unsubscribeFromChatRoom(roomId: number): void {
    const destination = `/topic/chat.${roomId}`;
    const readDestination = `/topic/chat.${roomId}.read`;

    const messageSub = this.subscriptions.get(destination);
    if (messageSub) {
      messageSub.unsubscribe();
      this.subscriptions.delete(destination);
    }

    const readSub = this.subscriptions.get(readDestination);
    if (readSub) {
      readSub.unsubscribe();
      this.subscriptions.delete(readDestination);
    }

    console.log(`채팅방 구독 해제: ${roomId}`);
  }

  // 메시지 전송
  sendMessage(request: ChatMessageRequest): void {
    if (!this.client?.connected) {
      console.error('WebSocket이 연결되지 않음');
      return;
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(request),
    });
  }

  // 읽음 처리
  markAsRead(roomId: number): void {
    if (!this.client?.connected) {
      console.error('WebSocket이 연결되지 않음');
      return;
    }

    const request: ChatReadRequest = { chatRoomId: roomId };
    this.client.publish({
      destination: '/app/chat.read',
      body: JSON.stringify(request),
    });
  }
}

// 싱글톤 인스턴스
export const webSocketClient = new WebSocketClient();
