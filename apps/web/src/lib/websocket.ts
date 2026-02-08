import SockJS from 'sockjs-client';
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

// WebSocket 클라이언트 클래스
class WebSocketClient {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private accessToken: string | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  // 연결
  // Before: 기존 client가 연결 실패 상태일 때 정리 안 함 → 좀비 클라이언트 생성
  // After: 기존 client를 deactivate 후 새로 생성, STOMP.js 내장 재연결 활용
  async connect(accessToken: string, onConnect?: () => void, onDisconnect?: () => void): Promise<void> {
    // 이미 연결된 상태면 콜백만 업데이트 후 호출
    if (this.client?.connected) {
      console.log('WebSocket 이미 연결됨');
      this.onConnectCallback = onConnect || null;
      this.onDisconnectCallback = onDisconnect || null;
      onConnect?.();
      return;
    }

    // Before: deactivate()가 비동기인데 await 없이 호출 → 두 개의 연결이 동시에 존재할 수 있음
    // After: await로 이전 클라이언트 정리 완료 후 새 클라이언트 생성
    if (this.client) {
      console.log('기존 WebSocket 클라이언트 정리');
      try {
        await this.client.deactivate();
      } catch (e) {
        console.warn('WebSocket deactivate 실패:', e);
      }
      this.client = null;
    }

    this.accessToken = accessToken;
    this.onConnectCallback = onConnect || null;
    this.onDisconnectCallback = onDisconnect || null;

    this.client = new Client({
      // SockJS를 통한 연결
      webSocketFactory: () => new SockJS(`${API_URL}/ws`) as WebSocket,

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

      // 연결 성공
      onConnect: () => {
        console.log('WebSocket 연결 성공');
        this.onConnectCallback?.();
      },

      // 연결 해제
      onDisconnect: () => {
        console.log('WebSocket 연결 해제');
        this.onDisconnectCallback?.();
      },

      // STOMP 프로토콜 에러 (구독 권한 거부 등 - 연결 해제가 아닐 수 있음)
      // Before: onDisconnectCallback 호출 → UI에 "연결 해제" 잘못 표시
      // After: 에러 로깅만 수행, 실제 연결 해제는 onDisconnect/onWebSocketClose에서 처리
      onStompError: (frame) => {
        console.error('STOMP 에러:', frame.headers['message']);
        console.error('에러 상세:', frame.body);
      },

      // WebSocket 에러 - STOMP.js가 reconnectDelay로 자동 재연결 시도
      onWebSocketError: (event) => {
        console.error('WebSocket 에러:', event);
        this.onDisconnectCallback?.();
      },

      // WebSocket 종료
      onWebSocketClose: () => {
        console.log('WebSocket 종료');
        this.onDisconnectCallback?.();
      },
    });

    this.client.activate();
  }

  // 연결 해제
  disconnect(): void {
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
