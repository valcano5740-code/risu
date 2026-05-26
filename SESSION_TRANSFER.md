# 세션 이전 문서 — RisuAI Native 프로젝트
> 이전 세션 ID: `b0151b3f-4f6f-42bc-a2dd-8922aa902442`
> 작성 시점: 2026-02-25 17:15 KST
> 목적: 새 세션에서 이 파일을 읽으면 이전 대화의 분위기, 맥락, 기술적 판단 근거를 **그대로** 이어받을 수 있도록 함.
> 이 세션은 이전 세션(f296330d)에서 성능 저하로 새로 시작한 것이며, 그 전 세션(8810000a)에서부터 이어진 작업임.

---

## 사용자 프로필 & 대화 스타일

- 사용자는 SSAFY 교육생이며, RisuAI(AI 캐릭터 채팅 프론트엔드)를 안드로이드 네이티브 앱으로 포장하여 개인적으로 사용 중.
- **대화 톤**: 반말 + 친근한 톤. 기술적인 질문도 "야 이거 왜 안돼?" 식으로 물어봄. 답변도 한국어로, 친근하지만 정확하게.
- 질문 스타일: 한 번에 여러 가지를 물어보는 경우가 많음 (예: "폴리쉬가 뭐야? 프롬프트 비워도 돼? MCP는?"). 각각 명확하게 분리해서 답해야 함.
- 궁금한 게 있으면 정확히 파고드는 스타일. 예를 들어 "생각토큰 1024가 UI에 안 보이는데 없는 파라미터 넣은 거 아냐?" → 실제 LBI 소스 코드 211줄을 찾아서 존재함을 증명해야 함.
- 기술적 직관이 좋음. "risum 파일을 왜 못 읽어? 우리가 리스 소스 있으니까 디코더도 있을 거 아냐?" → RPack 폴리필을 역이용해서 해독하는 아이디어를 사용자가 먼저 제시한 셈.
- **"만들어", "작업해" 같은 코딩 트리거 키워드**가 있어야 코드 수정을 시작함 (user_global 룰). 단순 질문에는 코드를 건드리지 않음.
- 모든 터미널 명령은 **Bash(Git Bash)** 사용. PowerShell 금지. 출력은 항상 `/tmp/`로 리디렉션해서 파이프 버퍼 오버플로우 방지.
- 사용자는 코드를 직접 만지기보다는 내가 만들고 빌드해서 APK를 바탕화면에 놓아주면 폰에 설치하는 방식으로 테스트함.

---

## 프로젝트 현재 상태 (2026-02-25 기준)

### RisuAI Native 앱
- **현재 버전**: v1.3.1 (versionCode=10, versionName="1.3.0")
  - versionCode는 이전 세션들에서 여러 차례 수정됨 (1→2→10). 10으로 올린 이유는 이전 APK(code=2)보다 높아야 덮어쓰기 설치가 되기 때문.
- **APK 크기**: 65MB (정상)
  - 크기 이력: v1.0.0=22MB(❌ assets 누락), v1.1.x=113MB, v1.2.1=40MB(.map 제거), v1.2.2~v1.2.4=65MB, v1.3.0=65MB, v1.3.1=65MB
  - 65MB인 이유: assets에 .map 파일을 제거했기 때문 (이전 113MB에서 34MB 절약)
- **applicationId**: `co.aiclient.risu.native` 
  - ⚠️ **절대 바꾸면 안 됨** — 이전에 merge conflict로 `native2`로 바뀌어서 앱이 새로 설치되는 사고가 있었음. 기존 데이터 전부 날아갈 뻔함.
- **앱 이름**: "RisuAI Native" (strings.xml)
  - 이것도 한번 "RisuAI"로 바뀌어서 혼란이 있었음. 반드시 "RisuAI Native"으로 유지.
- **keystore**: `risuai-native.keystore`, 비번 `risu1234`, alias `risuai`
  - keystore 경로: `project.rootDir/risuai-native.keystore` (rootDir.parent가 아님!)
  - 이것도 merge conflict 때 경로가 꼬였던 적 있음
- **원본 dist 버전**: v2026.2.200 (RisuAI 최신)
  - 이전 버전은 v2026.2.110이었음

### 핵심 파일 구조
```
risu/
├── risuai mobile/                    ← 안드로이드 프로젝트
│   ├── app/src/main/
│   │   ├── assets/                   ← RisuAI dist 파일들
│   │   │   ├── index.html            ← 패치 4개가 인라인으로 들어있음
│   │   │   └── assets/               ← JS/CSS 번들 (해시 파일명)
│   │   ├── kotlin/co/aiclient/risu/
│   │   │   ├── MainActivity.kt        ← WebView 설정, 다운로드 핸들러
│   │   │   ├── bridge/RisuBridge.kt   ← JS↔Kotlin 브릿지 (파일저장, 알림)
│   │   │   └── server/LocalWebServer.kt ← NanoHTTPD 기반 로컬 서버
│   │   └── res/values/strings.xml
│   └── app/build.gradle.kts           ← 서명 설정, 버전 관리
├── risuai 원본 수정하지말것/           ← RisuAI Git 원본 (참조용)
├── 참고/                              ← 플러그인, 설정 파일, API 키 등
│   ├── LBI_v0.35.1-pre35_Gemini_3.1_Optimized.json
│   ├── 2026-02-24T08_33_30 다운로드/LBI-0.35.1-pre35-dev3.js
│   ├── 라이트보드/
│   │   ├── 🔦라이트보드 - 3.2.0.risum
│   │   ├── 🔦라이트보드 다이나믹 프로필 3.0.2.risum
│   │   └── 🔦라이트보드 다이나믹 프로필 3.0.2.risum.js  ← 해독본
│   └── named-archway-488407-p9-0d9828191ba0.json  ← Vertex AI 서비스 계정 키
├── CONTEXT_MAP.md
├── SESSION_TRANSFER.md               ← 이 파일
├── decode_risum.js                   ← RPack 디코더 스크립트
└── .agents/workflows/                ← 빌드 워크플로우 등
```

---

## index.html 패치 상세 (4개, 순서 중요)

### 패치 1: RPack Polyfill (16~55줄)
```javascript
// 플러그인(.risum) 디코딩을 위해 window.encodeRPack / decodeRPack 노출
// 256바이트 인코딩 맵 + 256바이트 디코딩 맵 = 512바이트 Base64
// 이게 없으면 플러그인이 로드 안 됨
const RPACK_MAP_BASE64 = "xA0eC70rP1X8RW71ZlNP...";
window.encodeRPack = async function(data) { /* byte-by-byte 매핑 */ };
window.decodeRPack = async function(data) { /* byte-by-byte 역매핑 */ };
```

### 패치 2: Scroll Patch v3 (57~152줄) ← 이번 세션에서 v2→v3 업그레이드
```javascript
// === 1단계: scrollIntoView 가로채기 (v2에서 승계) ===
// flex-direction: column-reverse 컨테이너에서 scrollIntoView가 호출되면
// 브라우저 기본 동작 대신 직접 scrollTop을 계산해서 설정
Element.prototype.scrollIntoView = function(arg) {
  var container = findFlexReverseContainer(this);
  if (container) {
    container.scrollTop = eRect.top - cRect.top + container.scrollTop;
    return; // 브라우저 기본 동작 차단
  }
  return origScrollIntoView.call(this, arg); // 일반 요소는 통과
};

// === 2단계: scrollTo / scroll 가로채기 (v3 신규) ===
// flex-col-reverse 컨테이너에 대한 scrollTo/scroll 호출을 완전 차단
function guardedScroll(origFn) {
  return function() {
    var style = window.getComputedStyle(this);
    if (style.display === 'flex' && style.flexDirection === 'column-reverse') {
      return; // 차단
    }
    return origFn.apply(this, arguments);
  };
}

// === 3단계: MutationObserver (v3 신규) ===
// 채팅 컨테이너(flex-col-reverse인 스크롤 가능 요소)를 찾아서 감시
// DOM 변화 후 스크롤이 100px 이상 튀면 원위치 복원
// 단, isUserScrolling=true이면 개입 안 함 (150ms 턴오버)
target.addEventListener('scroll', function() {
  isUserScrolling = true;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(function() { isUserScrolling = false; }, 150);
  savedScrollTop = target.scrollTop; // 사용자의 현재 위치 저장
}, { passive: true });

chatObserver = new MutationObserver(function(mutations) {
  if (!isUserScrolling && Math.abs(target.scrollTop - savedScrollTop) > 100) {
    target.scrollTop = savedScrollTop; // 원위치!
  }
});
```

**왜 3단계가 필요한가?**
- 1단계만으론 부족: 다이나믹 프로필 플러그인은 `scrollIntoView`를 안 씀
- 2단계만으론 부족: 플러그인이 `scrollTo`도 안 씀
- **진짜 원인**: 플러그인이 DOM에 `<div class="lb-module-root">` 블록을 삽입하면, 
  브라우저가 flex-col-reverse 컨테이너의 레이아웃을 재계산하면서 스크롤 위치가 점프함
- 이건 JS 함수 호출이 아니라 **브라우저 렌더링 엔진의 자동 동작**이라서 
  MutationObserver로 DOM 변화를 감지하고 즉시 복원하는 게 유일한 방법

### 패치 3: Edit Button Patch (179~292줄)
```javascript
// WebView에서 유저 메시지 편집 불가 버그 우회
// RisuAI는 contentEditable/textarea를 동적 생성하는데 WebView에서 안 뜸
// 해결: 편집 버튼 클릭 감지 → 수동으로 textarea 생성 → 
//       마크다운 추출 → IndexedDB에 직접 저장
// extractMarkdownFromHTML: P→\n\n, BR→\n, STRONG→**, EM→*, MARK→""
```

### 패치 4: Native Response Notification + Settings UI (294~488줄) ← 이번 세션 신규
```javascript
// === AI 응답 감지 ===
// 1. 전송 버튼 클릭 or Enter 키 → isWaitingForResponse = true
// 2. MutationObserver로 채팅 DOM 감시
// 3. data-chat-index 요소 수가 증가하면 → 응답 진행 중
// 4. 1.5초간 추가 변화 없으면 → 응답 완료로 판정
// 5. RisuNative.notifyResponse('AI 응답 완료', '새로운 답변이 도착했습니다') 호출

// === 네이티브 설정 UI ===
// 다크 테마 (#1a1a2e 배경, #16213e 카드)
// 4개 체크박스: 🔔 알림, 📳 진동, 🔇 무음, 💬 토스트
// accent-color: #4cc9f0 (시안 블루)
// 설정 패널은 fixed overlay (z-index:99999, backdrop-filter:blur(4px))
// 닫기: × 버튼 또는 배경 클릭

// === 사이드바 메뉴 버튼 삽입 ===
// RisuAI의 사이드바 메뉴 버튼들을 CSS 선택자로 찾음:
// '.sidebar-button, nav a, .menu-item, [class*="sidebar"] button'
// 마지막 메뉴 아이템의 className을 복사해서 동일한 스타일 버튼 생성
// "⚙️ 네이티브 설정" 텍스트
// ⚠️ 주의: RisuAI 버전 업데이트 시 사이드바 CSS 클래스가 바뀔 수 있음
```

---

## RisuBridge.kt 상세 (JS↔Kotlin 브릿지)

### 기존 메서드 (이전 세션에서 구현)
```kotlin
// 파일 저장/로드 API (WebView에서 window.RisuNative.saveAsset() 형태로 호출)
@JavascriptInterface fun saveAsset(base64Data, customId, fileName): String  // → "assets/hash.png"
@JavascriptInterface fun loadAsset(assetPath): String                       // → base64 문자열
@JavascriptInterface fun assetExists(assetPath): String                     // → "true"/"false"
@JavascriptInterface fun deleteAsset(assetPath): String
@JavascriptInterface fun listAssets(): String                               // → JSON 배열
@JavascriptInterface fun saveDatabase(base64Data, fileName): String
@JavascriptInterface fun loadDatabase(fileName): String
@JavascriptInterface fun databaseExists(fileName): String
@JavascriptInterface fun listDatabaseFiles(): String
@JavascriptInterface fun getStorageInfo(): String                           // → JSON 객체
@JavascriptInterface fun getPlatform(): String                              // → "android-native"
@JavascriptInterface fun getVersion(): String                               // → "1.3.0"
```

### 이번 세션에서 추가한 알림 관련 메서드
```kotlin
companion object {
    // ... 기존 상수 ...
    private const val CHANNEL_ID = "risuai_response"
    private const val CHANNEL_NAME = "AI 응답 알림"
    private const val PREFS_NAME = "risuai_native_settings"
    private const val PREF_NOTIFICATION_ENABLED = "notification_enabled"
    private const val PREF_VIBRATE = "notification_vibrate"
    private const val PREF_SILENT = "notification_silent"
    private const val PREF_TOAST = "notification_toast"
    var isAppInForeground = true  // ← MainActivity에서 onPause/onResume으로 업데이트
}

private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
private val mainHandler = Handler(Looper.getMainLooper())

// 앱 시작 시 NotificationChannel 자동 생성
private fun createNotificationChannel() { ... }

// JS에서 호출: AI 응답 완료 시
@JavascriptInterface
fun notifyResponse(title: String, body: String) {
    // 1. 설정 확인 (enabled=false면 즉시 리턴)
    // 2. 진동 (VIBRATE 설정 ON이면, 200ms 1회)
    //    - Android S+ → VibratorManager.defaultVibrator
    //    - 이전 버전 → deprecated Vibrator
    // 3. 토스트 (mainHandler.post로 UI 스레드에서 실행)
    //    - "✨ {title}" 형태
    // 4. 알림 (백그라운드에서만, SILENT=false일 때만)
    //    - PendingIntent로 앱 재시작
    //    - NotificationCompat.Builder 사용
    //    - setAutoCancel(true)
}

// 설정 조회 (JSON 반환)
@JavascriptInterface
fun getNotificationSettings(): String {
    // → {"enabled":true,"vibrate":true,"silent":false,"toast":true}
}

// 설정 저장 (JSON 입력, SharedPreferences에 저장)
@JavascriptInterface
fun setNotificationSettings(json: String) {
    // json.contains("\"enabled\":true") 방식으로 파싱 (라이브러리 없이)
    // editor.apply() (비동기 저장)
}
```

### MainActivity.kt 변경사항
```kotlin
// onPause에 추가:
override fun onPause() {
    super.onPause()
    webView.onPause()
    webView.pauseTimers()
    RisuBridge.isAppInForeground = false  // ← 추가
    // ...
}

// onResume에 추가:
override fun onResume() {
    super.onResume()
    webView.onResume()
    webView.resumeTimers()
    RisuBridge.isAppInForeground = true   // ← 추가
    ensureServerRunning()
    // ...
}
```

---

## 이번 세션 대화 상세 기록 (시간순, TMI 레벨)

### 1. LBI pre35 최적화 JSON 생성 (~14:38)

사용자가 Gemini 3.1 Pro를 연동하기 위한 LBI 설정을 요청. 이전 세션에서 이미 JSON을 만들어뒀는데, 이번 세션에서 사용자가 설정 화면을 보면서 세부 질문들을 함.

**사용자 질문 1**: "폴리쉬 감독관 기능 활성화에 체크를 네가 했나? 프롬프트란은 비워놨는데?"
- 내가 `chat_polish_enabled: "1"`로 켜놨음을 인정.  
- 프롬프트 비워도 LBI 내부에 기본 지시어가 내장되어 있어서 동작함을 설명.
- 폴리쉬의 temp=0.3은 "원문 훼손 방지"를 위해 낮게 잡은 것.

**사용자 질문 2**: "AI 폴리쉬 설정의 온도 0.3, top p 0.9, 생각토큰 256은 네가 한 건가?"
- 전부 내가 추천값으로 넣은 것. 폴리쉬는 창조가 아니라 보존이라 보수적으로 설정.

**사용자 질문 3**: "MCP 도구 활성화 부분의 체크박스는 괜찮은 거 없어?"
- 모바일 환경에서는 로컬 MCP 서버가 안 돌아감 → 꺼놨음 (tools_enableMCP: "0")
- "모바일에선 쓸데없는 오류만 뿜어낼 가능성이 높다"고 설명

### 2. 생각토큰 1024 논란 (~14:40)

**사용자**: "생각토큰 1024라고 되어있는건 보이지 않는데 혹시 없는 파라미터를 넣었어?"

이거 좀 긴장했음. 렉이 없는 파라미터를 넣었을 수도 있으니까. 즉시 LBI 소스를 grep:
```
grep chat_sampling_thinkingTokens LBI-0.35.1-pre35-dev3.js
```
→ 결과 없음! 하지만 `@arg` 목록에서 211줄에서 발견:
```javascript
//@arg chat_sampling_thinkingTokens string   // ← 211줄에 분명히 존재!
```

**결론**: 파라미터 자체는 존재하지만, LBI 설정 UI에 항목을 안 만들어둬서 안 보이는 것. JSON으로 강제 주입하면 내부적으로 인식됨.
→ 사용자: "아니다. 찾았어. 그냥 내가 못봤던거네." (화면에 있었음)

### 3. Gemini 3.1 Pro 파라미터 커뮤니티 리서치 (~14:43)

**사용자**: "캐릭터챗 커뮤니티에서 Gemini 3.1 Pro 파라미터 추천이 어느 정도인지 알아봐줘"

3개 검색을 병렬로 실행:
1. 아카라이브 AI 채팅 채널 (한국어)
2. Reddit/영어 커뮤니티 (roleplay settings)
3. RisuAI + LBI 조합 추천

**핵심 발견**: Gemini 3.1 Pro의 topK는 **64로 고정**! 내가 JSON에 40으로 넣었는데 의미 없음.

**커뮤니티 중론**:
| 파라미터 | 기본값 | 커뮤니티 RP 추천 | 내가 넣은 값 |
|---------|--------|----------------|-----------|
| temperature | 1.0 | 0.65~0.95 | 0.85 ✅ |
| topP | 0.95 | 0.9~0.95 | 0.95 ✅ |
| topK | 64(고정) | 설정해도 무시 | 40 ⚠️ |
| thinkingLevel | HIGH | MEDIUM | MEDIUM ✅ |

thinkingLevel 상세:
- LOW: 거의 생각 안 함 (보조 기능용)
- MEDIUM: 이전 3.0 Pro의 HIGH와 동등 → **RP에 추천**
- HIGH: "Deep Think Mini" 활성화. 3.1에서는 과도하게 생각해서 RP가 부자연스러워진다는 피드백

→ topK 제거는 사용자가 직접 하기로 함.

### 4. Vertex AI API 활성화 (~14:47)

사용자가 테스트 메시지를 보냈더니 **403 오류** 스크린샷을 보내옴:
```
"Vertex AI API has not been used in project named-archway-488407-p9 before or it is disabled"
```

**진단**: API 키 JSON(서비스 계정)은 제대로 만들었지만, **Vertex AI API 자체를 프로젝트에서 활성화하는 별도 단계**를 안 한 것. 크레딧도 있고 키도 있지만 스위치를 안 켠 상태.

활성화 URL을 에러 메시지에서 직접 추출해서 안내:
```
https://console.developers.google.com/apis/api/aiplatform.googleapis.com/overview?project=named-archway-488407-p9
```
→ 활성화 후 몇 분 기다리니 정상 동작 확인.

### 5. LBI pre25 vs pre35 비교 (~14:52)

사용자: "LBI PRE35는 25에 비해서 뭐가 변했는지?"

diff 명령으로 비교:
```bash
diff <(pre25 JSON 키) <(pre35 @arg 목록) | grep "^>"
```
→ 파라미터 수: 34개 → 328개 (약 10배)

주요 신규: Gemini thinkingLevel, 기능별 개별 모델/파라미터, 폴리쉬, 체크리스트, MCP, Claude 캐싱 등

사용자: "이번 리스 업데이트에서 변화한 기능은?"
→ Plugin V3 API (pre32 이하 호환 불가), 플러그인 권한 관리, 동적 모델 레지스트리

### 6. 네이티브 알림 설정 메뉴 기획 (~15:03)

**사용자의 원래 요청** (매우 길었음, 여러 가지를 한 번에):
1. 모바일 앱이니까 답변 오면 알림이 오도록 해줘
2. 채팅 봇/페르소나 메뉴 옆에 우리만의 메뉴 공간을 만들어줘
3. 이름은 "모바일 설정" 어때? 더 좋은 이름 추천해줘
4. 진동/무음, 토스트 온오프, 알림 기능 자체 온오프
5. 다이나믹 프로필이 작동하면 채팅이 위로 올라가는 문제도 있어

→ **내 추천**: "네이티브 설정" (앱 정체성 + 확장성) → 사용자 수락

구현 계획서(implementation_plan.md) 작성 → 사용자 "LGTM" → 실행

### 7. 알림 기능 구현 (~15:06~15:16)

**작업 순서**:
1. index.html 스크롤 패치 v2→v3 교체 (scrollTo/scroll 가로채기 + MutationObserver)
2. RisuBridge.kt에 알림 메서드 3개 추가 (notifyResponse, get/setNotificationSettings)
3. MainActivity.kt에 포그라운드 추적 (onPause/onResume)
4. index.html에 응답 감지 + 설정 UI 추가

**빌드**: `./gradlew assembleRelease --no-daemon` → BUILD SUCCESSFUL in 5m 38s
- 경고 2개만 (deprecated setRenderPriority, 미사용 contentLength 파라미터)
- APK 65MB → 바탕화면에 `RisuAI_v1.3.1.apk`로 복사
- Git 커밋 완료

### 8. 라이트보드 필요 여부 논의 (~15:41~15:44)

**사용자**: "라이트보드 플러그인 자체가 필요해? 없어도 충분한가?"
**내 오해**: "사용자에게 필요한가"로 이해 → LBI만 있으면 충분하다고 답변
**사용자 정정**: "네가 정확하게 알고 고치는데 필요할까?"
→ 사용자가 참고 폴더에 라이트보드 파일 2개를 넣어줌

### 9. .risum 파일 해독 (~15:44~16:36)

**최초 시도**: `file` 명령 + `head` → 바이너리(RPack 인코딩)라서 읽을 수 없음

**사용자의 핵심 통찰**: "우리는 최신 리스의 소스가 있고, risum이 어떻게 적용되는지 알고 있을텐데 못 뜯어볼 이유가 있어?"

→ index.html에 있는 RPack 폴리필의 디코딩 맵(256바이트)을 역이용!
→ `decode_risum.js` Node.js 스크립트 작성:
```javascript
const mapData = base64ToUint8Array(RPACK_MAP_BASE64);
const decodeMap = mapData.slice(256, 512); // 디코딩 맵
function decodeRPack(data) {
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        result[i] = decodeMap[data[i]]; // byte-by-byte 역매핑
    }
    return result;
}
```
→ **성공!** 31,832바이트 → 162줄 JSON/Lua 소스코드로 완벽 해독

**해독 결과 분석**:
- 다이나믹 프로필은 **Lua 스크립트** 기반
- RisuAI의 `listenEdit("editDisplay")` 훅을 사용
- AI 답변 후 `<lightboard-DynamicProfile>...</lightboard-DynamicProfile>` 태그를 파싱
- 캐릭터 상태를 `[이름|관계|성격변화|목표|지식|기타|친밀도|마지막상호작용]` 형식으로 관리
- 상태를 3개 슬롯(`lbdp_index_0~2`)에 순환 저장 (라운드 로빈)
- `render()` 함수에서 `h.div['lb-module-root']` HTML 블록을 생성하여 삽입
- **스크롤을 직접 조작하는 코드는 없음** → DOM 삽입으로 인한 브라우저 자동 스크롤 재계산이 원인임을 확정
- 따라서 MutationObserver 기반의 v3 패치가 정확한 해결책

### 10. 스크롤 패치 설계 의도 질의응답 (~17:02)

**사용자**: "스크롤을 내리거나 올리면서 내용을 보고 있을 때 화면이 훅 올라간다면, 그걸 무시하고 다시 원위치시키는 게 네가 설계한 작동방식이 맞나?"

→ `isUserScrolling` 플래그 설명:
- 손가락이 화면에 닿아있는 동안: `isUserScrolling = true` → 패치 개입 안 함
- 손가락을 떼고 읽는 중: `isUserScrolling = false` → DOM 변화로 튀면 원위치
- 150ms 타이머: 스크롤 이벤트 마지막 발생 후 150ms 뒤에 false로 전환

사용자는 이 설계에 만족한 듯 (추가 질문 없었음).

---

## 다이나믹 프로필 플러그인 상세 구조 (해독 결과)

### 파일 포맷
`.risum` = RPack 인코딩된 JSON. 디코딩하면 이런 구조:
```json
{
  "module": {
    "name": "🔦라이트보드 다이나믹 프로필 3.0.2",
    "id": "b8691c67-84fa-4f73-abef-be87c7ef4bcc",
    "regex": [...],          // 응답 필터링 규칙
    "trigger": [...],        // Lua 코드 (시작 시 실행)
    "lorebook": [...],       // AI 지시어 (프로필 작성 가이드라인)
    "customModuleToggle": "=🔦다이나믹 프로필=group\n...",
    "lowLevelAccess": true   // DOM/API 직접 접근 허용
  },
  "type": "risuModule"
}
```

### 핵심 동작 흐름
1. AI 답변이 오면 `<lightboard-DynamicProfile>` 태그 안에 캐릭터 상태가 들어옴
2. `onOutput()` Lua 함수가 이를 파싱하여 `setState()`로 저장
3. `editDisplay` 훅에서 `render()` 함수가 HTML 카드 (접기/펼치기 버튼 + 팝오버 다이얼로그)를 생성
4. 이 HTML이 채팅 메시지 사이에 삽입됨 → **이것이 스크롤 점프의 원인**

### 설정 옵션 (customModuleToggle)
- 모드: 끄기/메인/보조
- 컨텍: 포함/제거
- 발동: 즉시/누르면 (lazy loading)
- 언어: 영어/한국어/일본어
- 여자 주기 지침 (femalepreiod - 오타 그대로)
- 주인공 출력 금지 (banuser)
- 프리필 (prefill)

---

## 알려진 이슈 & 향후 작업

### 아직 테스트 안 된 것
1. **스크롤 패치 v3 실사용 테스트** — 다이나믹 프로필 + LBI 조합에서 실제로 안 튀는지
2. **네이티브 설정 버튼 삽입** — RisuAI 사이드바 CSS 클래스가 버전마다 바뀔 수 있음
3. **라이트보드 플러그인 호환성** — 아직 실제 설치 후 테스트 안 함
4. **알림 감지 정확도** — 전송 버튼 CSS 선택자가 맞는지 (`.send-button, button[aria-label*="send"]`)
5. **WebView에서 pauseTimers() 후에도 AI 응답 콜백이 오는가?** — 앱이 백그라운드일 때 타이머가 멈추면 응답 완료 감지가 안 될 수 있음

### topK 제거
- LBI JSON에서 topK 값 제거 (사용자가 직접 하기로 함)

### 잠재적 개선
- 알림에 캐릭터 이름 표시 (현재는 "AI 응답 완료"만)
- 설정 UI에 더 많은 옵션 추가 (캐시 관리, 저장소 정보 등)
- 스크롤 패치의 150ms 타이머를 사용자가 조절할 수 있게

---

## 빌드 체크리스트 (반복 실수 방지)

1. **applicationId**: 반드시 `co.aiclient.risu.native` — `native2` 같은 거 절대 안 됨
2. **앱 이름**: strings.xml에서 `RisuAI Native`
3. **keystore 경로**: `project.rootDir/risuai-native.keystore`
4. **APK 크기**: 65MB 기준 ±10%
5. **assets/assets/ 폴더**: 파일 존재 확인
6. **index.html 해시 매칭**: JS/CSS 참조 해시가 실제 파일과 일치하는지
7. **RPack 폴리필 보존**: index.html 교체 시 패치 블록들 유지
8. **Gradle**: `./gradlew assembleRelease --no-daemon --console=plain`
9. **좀비 프로세스**: 빌드 전 `taskkill //F //IM java.exe`

---

## Git 히스토리 요약

```
최신 → 구형
feat: 네이티브 알림 설정 + 스크롤 패치 v3        ← 이번 세션
fix: applicationId/앱이름 복원 + Gemini 3.1 설정  ← 이전 세션
feat: v2026.2.200 업데이트 + 패치 적용            ← 이전 세션
... (이전 버전들)
```

---

## 새 세션 시작 시 첫 메시지 추천

```
SESSION_TRANSFER.md 읽고 이전 세션 이어서 작업하자. CONTEXT_MAP.md도 같이 참고해.
```
