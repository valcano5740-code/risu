# RisuAI Mobile - Context Map

## Shared Cluster (Global Context)

### 빌드 규칙
- APK 파일명에 버전 포함: `RisuAI_v{버전}.apk`
- **빌드 후 APK 용량 반드시 확인** — 이전 버전 대비 크게 변동 시 즉시 원인 파악
- 정상 범위: 65MB 전후 (v2026.2.291 기준, .map 제외)

### APK 크기 이력
| 버전 | 크기 | 비고 |
|------|------|------|
| Final-Fixed (기준) | 113MB | 폰에 설치된 원본 |
| v1.0.0 | 22.7MB | ❌ assets 더미 포함 — 사용 금지 |
| v1.1.0~v1.1.3 | 113MB | ✅ Final-Fixed assets 복원 + Kotlin 수정 + 백업 완성 |
| v1.2.0 | 74MB | ✅ 최신 원본 dist(v2026.2.110) 기반 — 정상 축소 |
| v1.2.1 | 40MB | ✅ scrollIntoView 패치 + .map 제거(34MB 절약) |
| v1.2.2 | 65MB | ✅ LocalWebServer 캐시 헤더 추가 — 화면 전환 속도 개선 |
| v1.2.3 | 65MB | ✅ 스크롤 패치 v2 — scrollIntoView 완전 차단 + scrollTop 직접 계산 |
| v1.2.4 | 65MB | ✅ 편집 패치 — WebView에서 user 메시지 수정 불가 버그 우회 |
| v1.2.5 | 65MB | ✅ data: URL 다운로드 핸들러 — 플러그인 설정 내보내기 수정 |
| v1.3.0 | 65MB | ✅ **RisuAI v2026.2.200 업데이트** — Gemini 3.1, Claude 4.6, Plugin V3 API |
| v1.3.2 | 65MB | ❌ 프리즈 발생 — DPoP IndexedDB 교착 (v2026.2.200의 `getDPoPKeys()`) |
| v1.4.5 | 65MB | ✅ 전체 백업 기능 구현 |
| v1.4.6 | 65MB | ✅ 스트리밍 백업 API (네이티브 `createBackupFile`/`appendBackupData`/`closeBackupFile`) |
| v1.4.7 | 65MB | ⚠️ dosync=avoid 우회 시도 (효과 없음) |
| v1.4.8 | 65MB | ⚠️ 네이티브 URL 차단 시도 (WebView fetch는 인터셉트 불가) |
| v1.4.9 | 65MB | ✅ **SPA 번들 v2026.2.291로 교체** — 프리즈 근본 해결 |
| v1.5.0 | 65MB | ✅ 렌더링 최적화 + KaTeX/Google Fonts CDN 로컬화 + 코드 정리 |

### 업데이트 프로세스
```bash
# 1. 원본에서 빌드
cd "risuai 원본 수정하지말것" && pnpm run build

# 2. 모바일 assets 업데이트 (자동)
cd "risuai mobile" && bash scripts/update_risuai.sh

# 3. APK 빌드
bash gradlew assembleRelease
```

### 프로젝트 구조
| 폴더 | 역할 |
|------|------|
| `risuai 원본 수정하지말것/` | RisuAI 원본 git (v2026.2.291) — 참조용 소스 |
| `risuai mobile/` | Android WebView 래퍼 앱 (RisuAI Native) |
| `risuai mobile/app/src/main/assets/local-cdn/` | CDN 로컬화 에셋 (KaTeX CSS, Google Fonts) |
| `risu-git/` | 이전 빌드 시도 (RisuAI Dev) — 별도 keystore |

### 서명 정보
| 항목 | `risuai mobile` (현재 사용) |
|------|--------------------------|
| Keystore | `risuai-native.keystore` (루트 + risu-git에도 있음) |
| 비밀번호 | `risu1234` |
| applicationId | `co.aiclient.risu.native` |

> [!CAUTION]
> 이전에 `risuai-release.keystore`(risuai2024native)로 기록했으나, 폰에 설치된 앱은 `risuai-native.keystore`(risu1234)로 서명됨.
> 잘못된 keystore로 빌드하면 설치 불가 (서명 충돌).

### 데이터 저장 방식
- [Verified] 웹(IndexedDB) via `localforage({ name: "risuai" })`
- [Verified] 원본 모바일(Capacitor) 지원 완전 제거됨 (최신 원본에서)
- [Verified] localhost 포트 변경 시 IndexedDB origin이 달라져 데이터 접근 불가 → **8080 고정**

---

## Cluster: 앱 빌드

### Current Understanding
- [2026-02-25] `gradlew assembleRelease` → `app-release.apk` (서명 포함, 65MB)
- [Verified] `build.gradle.kts`에 signingConfig 내장 → 별도 jarsigner 불필요
- [Verified] `risuai-native.keystore` + `risu1234` 조합 필수 (다른 keystore → 기존 앱 삭제 필요 → 데이터 소실)

### Key Decisions
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-12 | 웹 소스 수정 없이 Kotlin만 수정 | 데이터 안전성 최우선 |
| 2026-02-12 | keystore를 `risuai-native.keystore`로 변경 | 폰 기존 앱과 서명 일치 필요 |
| 2026-02-12 | streamsaver → 네이티브 HTTP 스트리밍 교체 | WebView에서 Service Worker 미동작 |
| 2026-02-12 | 바이너리 직접 전송 (application/octet-stream) | base64는 스택오버플로우 + 메모리 오버헤드 |
| 2026-02-12 | ✅ 백업 기능 완성 (v1.1.3) | 7.19GB 백업 성공. 앱 표시 9.89GB와 차이는 IndexedDB 오버헤드+캐시 |
| 2026-02-12 | LocalWebServer 캐시 헤더 추가 | assets/ → 1년 immutable, index.html → no-cache. 원본 웹서버와 동일하게 |
| 2026-02-13 | scrollIntoView 패치 v2: 완전 차단 + scrollTop | v1의 block 값 변환은 WebView에서 효과 없음. 직접 스크롤 계산 |
| 2026-02-13 | 편집 패치: 수동 textarea + IndexedDB 직접 저장 | WebView에서 Svelte 5 reactivity 미동작(user msg만). Chrome에서는 정상 |
| 2026-02-24 | data: URL 다운로드 핸들러 추가 | DownloadManager는 HTTP/HTTPS만 지원. data: URL base64 디코딩 후 Downloads 저장 |
| 2026-02-25 | RisuAI v2026.2.200 업데이트 | Gemini 3.1 Preview + LBI pre35 호환 위해. V2 플러그인 지원 제거됨 |
| 2026-03-06 | SPA 번들 v2026.2.291로 교체 | DPoP IndexedDB 교착 해결 — getDPoPKeys() → getKeypairStore() 변경 |
| 2026-03-06 | CDN 로컬화 (KaTeX CSS + Google Fonts) | 수식 렌더링/폰트 로딩 네트워크 지연 제거 |
| 2026-03-06 | shouldOverrideUrlLoading 30줄→2줄 단순화 | 마지막이 return false이므로 모든 분기 불필요 |
| 2026-03-06 | enableSlowWholeDocumentDraw() + OVER_SCROLL_NEVER | 채팅 렌더링 품질 + 네이티브 느낌 |

### Rejected Approaches & 교훈
- [Rejected] `risuai-release.keystore`(risuai2024native)로 서명 → 폰 앱과 서명 불일치, 설치 불가
- [Rejected] assets 더미 파일 상태로 빌드(22MB) → 앱 UI 깨짐, 백업 기능 오히려 악화
- [Rejected] `risuai.xyz`에서 assets 다운로드 → SPA fallback으로 HTML만 반환, 실패
- [Rejected] assets만 교체하고 index.html 유지 → JS/CSS 해시 불일치로 흰 화면
- [Rejected] **`| tail -N` 으로 빌드 로그 필터링** → 빌드 완료까지 출력이 버퍼링되어 수분간 무응답 상태처럼 보임. **빌드 명령에는 `tail` 삽입 금지**
- [Rejected] **base64 인코딩으로 바이너리 전송** → (1) `String.fromCharCode.apply()` 스택 오버플로우, (2) 33% 메모리 오버헤드로 1.5GB에서 끊김. **WebView↔서버 간 대용량 바이너리는 반드시 `application/octet-stream`으로 직접 전송**

### ⚠️ 빌드 체크리스트 (반복 실수 방지)
1. **APK 크기 확인**: 113MB 기준 ±10% 이내인지 (22MB 같은 극단적 변화 = assets 누락)
2. **서명 keystore**: 반드시 `risuai-native.keystore` + `risu1234` 사용
3. **assets/ 폴더**: 118개 파일 존재 확인 (v2026.2.200 기준, .map 제외)
4. **dexopt/ 폴더**: 소스에 포함하면 빌드 실패 — 제외할 것
5. **index.html 해시 매칭**: `index.html`의 JS/CSS 참조 해시가 `assets/assets/` 내 실제 파일과 일치하는지 확인
6. **RPack 폴리필 보존**: index.html 교체 시 `<script>` 블록의 RPack 폴리필이 유지되는지 확인
7. **versionCode 증가**: 덮어쓰기 설치 위해 매 릴리스마다 versionCode +1 필요

---

## Cluster: 백업 기능

### Current Understanding
- [2026-02-12] `SaveLocalBackup()` → `LocalWriter` → `streamsaver` → blob폴백(p=true) → `<a>.click()` → 다운로드 리스너
- [2026-02-12] 기존 문제: blob 다운로드 리스너가 콘솔 로그만 찍고 실제 저장 안 함
- [2026-02-12] 수정: `RisuNativeInterface` JS Bridge 추가, blob → fetch → base64 → `saveToDownloads()` (MediaStore API)
- [Estimated] 10GB+ 백업 시 base64 방식 메모리 문제 가능 → 스트리밍 방식 전환 필요할 수 있음

### Key Decisions
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-12 | blob 핸들러만 수정 (원본 streamsaver 방식 유지) | 사용자 요청: 원본 방식 따르고 길만 뚫기 |

### Rejected Approaches
- NanoHTTPD POST 엔드포인트 + StreamSaver.js 교체 → 과도한 변경, 원본 방식 유지가 우선

---

## Cluster: 알려진 이슈 (미수정)

### Current Understanding
- [2026-02-12] **스크롤**: `scrollIntoView({ block: 'start' })`가 WebView에서 전체 viewport를 스크롤시킴 (데스크톱 브라우저에서는 컨테이너 내부만 스크롤 → WebView 호환성 문제). `scroll_patch.js`로 보정
- [Resolved] **플러그인**: 최신 버전(v2026.2.110) 업데이트로 자연 해결
- [Resolved] **내보내기 경로**: StreamSaver 교체로 모든 파일 다운로드가 Downloads 폴더로 정상 저장됨
- [2026-02-12] **모듈 매니저 임포트**: rpack 관련 에러 — 오류창이 빠르게 사라져 확인 불가

### Key Decisions
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-12 | 백업 먼저 수정 → 안전망 확보 → 나머지 순차 수정 | 데이터 보호가 최우선 |

---

## Cluster: 원본 업데이트

### Current Understanding
- [2026-02-25] git pull 완료: v2026.2.110 → v2026.2.200 (90커밋)
- [2026-02-25] `pnpm install` + `pnpm run build` 완료 (dist 118파일, .map 50파일)
- [Verified] V2.0 플러그인 지원 제거됨 → LBI pre32 이하 호환 불가, pre35 필수
- [Verified] 데스크톱(Tauri) 버전을 참고해야 함 — 원본 모바일 버전은 지원 중단
- [Verified] `platform.ts`에 `isNativeApp` 플래그 추가 필요 (향후)

### Rejected Approaches
- 원본 모바일(Capacitor) 코드 참고 → 지원 중단되어 참고 가치 없음

---

## Cluster: 프리즈 해결 (v1.3.2→v1.4.9)

### 원인
- v2026.2.200의 `sionyw.ts` → `getDPoPKeys()` → `indexedDB.open("DPoPDB", 1)` → WebView에서 교착
- v2026.2.291에서 `getKeypairStore()`로 리팩토링되어 해결
- `fetch` 타임아웃/네이티브 URL 차단은 효과 없었음 (`fetch()`까지 도달 전에 IndexedDB에서 멈춤)

### 교훈
- `shouldInterceptRequest`는 JS `fetch()` API를 인터셉트하지 않음 (리소스 로딩만)
- 원본 코드의 DPoP 인증 로직은 플랫폼별로 동작 다름 (Chrome OK, WebView 교착)
- SPA 번들 버전 차이가 근본 원인일 때는 패치보다 업데이트가 정답

---

## Cluster: CDN 로컬화 (v1.5.0)

### 로컬 에셋
| CDN 리소스 | 로컬 경로 | 크기 |
|---|---|---|
| KaTeX CSS | `local-cdn/katex/katex.min.css` | 24KB |
| Tilt Prism | `local-cdn/fonts/TiltPrism.ttf` | 175KB |
| Yellowtail | `local-cdn/fonts/Yellowtail.ttf` | 60KB |
| 폰트 CSS | `local-cdn/fonts/fonts.css` | ~350B |

### 인터셉트 로직
`shouldInterceptRequest`에서 CDN URL 매칭 → 로컬 에셋 반환 (네트워크 실패 시 원본 CDN 폴백)

---

## Cluster: risum 파일 형식

### 바이너리 구조
```
[1B: magic=111] [1B: version=0]
[4B LE: mainData 길이] [rpack 인코딩된 JSON]
[1B: mark=1] [4B LE: asset1 길이] [rpack 인코딩된 에셋1]
...반복...
[1B: mark=0] ← 파일 끝
```

### JSON 본문
```json
{ "type": "risuModule", "module": { RisuModule } }
```

### RisuModule 인터페이스
`name`, `description`, `id`, `lorebook[]`, `regex[]`, `cjs` (커스텀 JS), `trigger[]` (Lua 스크립트), `assets[]`, `lowLevelAccess`, `namespace`, `customModuleToggle`

### 관련 코드
- `process/modules.ts` → `readModule()`, `exportModule()`, `importModule()`
- `processzip.ts` → 캐릭터 카드 내 `module.risum` 파싱
- `App.svelte` → `.risum` 확장자 드래그앤드롭 감지

---

## Cluster: WebView 전환 이슈 (업데이트 시 체크리스트)

> [!IMPORTANT]
> SPA 번들을 업데이트할 때마다 이 목록을 확인하여 패치가 유지되는지 검증할 것.

### 패치 필요 (현재 적용됨)

| # | 이슈 | 원본 동작 | WebView 문제 | 패치 위치 | 적용 버전 |
|---|---|---|---|---|---|
| 1 | **scrollIntoView 뷰포트 튀기** | `scrollIntoView({block:'start'})` — 컨테이너 내부만 스크롤 | 전체 뷰포트가 스크롤됨 (라이트보드 다이나믹 프로필 등 모듈이 DOM 변경 시 위로 확 튐) | `getNativeBridgeScript()` — `Element.prototype.scrollIntoView` 오버라이드 | v1.2.3, v1.5.1 복원 |
| 2 | **다운로드 핸들링 (blob/data URL)** | 브라우저가 blob:, data: URL 다운로드 처리 | `DownloadManager`는 HTTP/HTTPS만 지원, blob/data URL 무시 | `downloadListener` — blob: fetch→base64, data: base64 디코딩 후 MediaStore 저장 | v1.2.5 |
| 3 | **StreamSaver.js 미동작** | Service Worker로 스트리밍 다운로드 | WebView에서 Service Worker 미동작 → 백업 실패 | `RisuNativeInterface` — 네이티브 스트리밍 API (`createBackupFile`/`appendBackupData`/`closeBackupFile`) | v1.4.6 |
| 4 | **CDN 리소스 네트워크 지연** | 브라우저 캐시가 CDN 응답 캐싱 | WebView 캐시 효율 낮음 → 매번 네트워크 요청 | `shouldInterceptRequest` — KaTeX CSS, Google Fonts를 로컬 에셋으로 서빙 | v1.5.0 |

### 패치 불필요 (원본 업데이트로 해결됨)

| # | 이슈 | 원인 | 해결 | 해결 버전 |
|---|---|---|---|---|
| 5 | **DPoP IndexedDB 교착 (앱 프리즈)** | `getDPoPKeys()` → `indexedDB.open("DPoPDB")` WebView에서 교착 | 원본에서 `getKeypairStore()`로 리팩토링 | v2026.2.291 (v1.4.9) |

### 미확인 (테스트 필요)

| # | 이슈 | 이전 상태 | 현재 상태 | 확인 방법 |
|---|---|---|---|---|
| 6 | **유저 메시지 수정 버튼** | v1.2.4에서 textarea+IndexedDB 직접 패치 → SPA 교체로 제거됨 | 최신 SPA(v2026.2.291)에서 Svelte 5 reactivity가 WebView에서 동작하는지 미확인 | 채팅 중 유저 메시지 편집 시도 |
| 7 | **LBI 플러그인 설정 내보내기** | data: URL 다운로드 핸들러 추가(v1.2.5)로 해결 | 핸들러가 여전히 동작하는지 미확인 | 플러그인 설정 > 내보내기 > Downloads 폴더 확인 |

### WebView 고유 제약 (패치 불가, 알아두어야 할 사항)

| 제약 | 설명 |
|---|---|
| `shouldInterceptRequest`는 `fetch()` 미인터셉트 | JS의 `fetch()` API 호출은 `shouldInterceptRequest`가 가로채지 않음. 리소스 로딩(`<script>`, `<link>`, `<img>` 등)만 인터셉트 가능. |
| Service Worker 미지원 | WebView에서 SW 등록/실행 불가 → PWA 기능, 오프라인 캐시, StreamSaver.js 등 사용 불가 |
| Chrome DevTools 제한 | 프로덕션 빌드에서는 `chrome://inspect` 불가 → `onConsoleMessage` 로깅으로 대체 필요 |
| IndexedDB 동시성 제한 | Chrome보다 보수적인 트랜잭션 관리 → 복잡한 IDB 조작 시 교착 가능성 있음 |

