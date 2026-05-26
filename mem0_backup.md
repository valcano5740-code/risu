# Mem0 백업 (최종 업데이트: 2026-03-25 15:52)

> 이 파일은 Mem0에 저장된 내용의 백업입니다.
> Mem0 데이터가 사라질 경우 이 파일에서 복원합니다.
> 새로운 메모 추가 시 이 파일도 함께 업데이트해야 합니다.

---

## 1. RisuAI 빌드 핵심 정보
- v1.5.7 APK의 실제 versionCode=36, versionName=1.5.7
- **현재 최신**: versionCode=37, versionName=1.5.8
- 새 빌드 시 versionCode를 반드시 37보다 높게 설정
- Android는 versionCode 다운그레이드를 **절대** 허용하지 않음

## 2. RisuAI 프로젝트 구조
- 경로: `C:\Users\SSAFY\Desktop\risu`
- `risuai mobile` — **실제 개발/빌드** 프로젝트 (master 브랜치)
- `risu-git` — 초기 버전/백업 (applicationId=native2, 사용 금지)

## 3. RisuAI 서명 정보
- keystore: `risuai-native.keystore` (루트 디렉토리)
- storePassword: `risu1234`, keyAlias: `risuai`, keyPassword: `risu1234`
- applicationId: `co.aiclient.risu.native`

## 4. APK 빌드 워크플로우
1. `risuai mobile`에서 `./gradlew clean assembleRelease`
2. `app/build/outputs/apk/release/app-release.apk` → 루트로 복사
3. 네이버 메일로 폰 전송
- 좀비 Gradle 데몬 시 `./gradlew --stop` 또는 PC 재부팅

## 5. Mem0 MCP 서버 구성
- **LLM 1순위**: GPT-4.1 (Copilot 프록시 `localhost:4141`)
- **LLM 폴백**: Gemini 3 Flash (Copilot 프록시 미실행 시)
- **임베딩**: Voyage AI `voyage-3-large`
- **벡터DB**: ChromaDB (`~/.mem0/`)
- **저장 폴백**: `add()` 빈 결과 시 ChromaDB 직접 저장

## 6. Copilot API 프록시
- 실행: `npx copilot-api@latest start --port 4141`
- 시작 프로그램 등록: `CopilotAPI.lnk` (PC 부팅 시 자동 실행)
- 배치 파일: `C:\Users\SSAFY\.gemini\antigravity\mcp_servers\start_copilot_api.bat`

## 7. 성공 패턴
- Mem0 v1.1은 Gemini LLM과 비호환 (GitHub #4061, #2758)
- GPT-4.1로 전환 시 해결, 폴백 시 직접 ChromaDB 저장

## 8. 시스템 설정
- Mem0 저장소: `~/.mem0` 단일 저장소 (변경 금지)
