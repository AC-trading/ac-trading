package com.acnh.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI(Swagger) 설정
 * API 문서 자동 생성 및 Swagger UI 제공
 */
@Configuration
public class OpenApiConfig {

    @Value("${springdoc.server-url:http://localhost:8080}")
    private String serverUrl;

    @Value("${springdoc.info.contact.name:AC Trading Team}")
    private String contactName;

    @Value("${springdoc.info.contact.url:https://github.com/AC-trading/ac-trading}")
    private String contactUrl;

    @Bean
    public OpenAPI openAPI() {
        // JWT Bearer 인증 스키마 정의
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization")
                .description("JWT 액세스 토큰을 입력하세요. (Bearer 접두사 불필요)");

        SecurityRequirement securityRequirement = new SecurityRequirement()
                .addList("bearerAuth");

        return new OpenAPI()
                .info(apiInfo())
                .servers(List.of(new Server().url(serverUrl).description("API Server")))
                .components(new Components().addSecuritySchemes("bearerAuth", securityScheme))
                .addSecurityItem(securityRequirement);
    }

    private Info apiInfo() {
        return new Info()
                .title("AC Trading API")
                .description("모여봐요 동물의 숲 아이템 거래 플랫폼 API")
                .version("1.0.0")
                .contact(new Contact()
                        .name(contactName)
                        .url(contactUrl));
    }
}
