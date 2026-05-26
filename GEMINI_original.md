# Antigravity Core Intelligence & Operations Rule

## 1. Execution Logic (Gate System)
- **Coding Trigger:** Source code modification is LOCKED unless triggered by: **"만들어", "작업해", "실행해", "수정해", "고쳐", "변경해", "만들어봐"**.
- **Documentation Autonomy:** FULL AUTONOMY to manage `.md` files (task.md). Update immediately on technical decisions.
- **🚨 HARD-GATE: RTK (Rust Token Killer) 의무 사용**
  - 대량의 로그를 출력하는 터미널 명령어(`npm install`, `cargo build`, `pip install`, 트리/디렉토리 구조 탐색 등) 실행 시 **반드시 명령어 앞에 `rtk `를 붙여 실행**하여 토큰을 최적화할 것.
  - *예외 조항:* RTK가 핵심 에러 추적 단서(Stack Trace, 예외 구문 등)를 부적절하게 잘라내어 디버깅이 블록된 경우에 한해서만, 원본 로그 확인을 위해 순정 명령어 재실행을 허용한다.

## 2. Context & Memory (최우선 적용)

### 🚨 HARD-GATE: 이중 기억 시스템 (예외 없음)
기억은 **두 시스템**으로 관리된다:
1. **Memdir (파일 기반):** `~/.gemini/memory/` 폴더에 `.md` 파일로 저장. `memory-agent` MCP 서버가 관리.
2. **Graph Memory (벡터/그래프):** Mem0 + Neo4j. `mem0` MCP 서버가 관리.

- **세션 시작 시 (필수):** `mcp_memory-agent_smart_recall` + `mcp_mem0_search_memory` 호출하여 기억 복원.
- **기억 추출:** `notify_user` 직전 또는 주제 전환 시 `mcp_memory-agent_auto_extract` 호출 후 핵심은 `mcp_mem0_add_memory`로 이중 저장.
- **가시성:** 기억 저장/검색 시 반드시 한 줄 보고 (🧠/📂 이모지 접두).
- **상충 정보:** 최신 정보 우선 적용, 사용자에게 변경 보고.

상세 절차(A~G): `memory-management\SKILL.md` 참조.

## 3. Terminal & Shell

### 🚨 HARD-GATE: 절대 금지 목록
- **서브쉘 중첩 금지:** `cmd.exe`, `bash.exe` 호출 금지. ConPTY 교착 원인.
- **Unix 파이프 + Unix 유틸 금지:** `cat | head`, `cat | grep` 등 사용 금지.
- **Primary Shell:** ALWAYS PowerShell. Path는 반드시 Windows 절대경로(`\`).
- **로그 리다이렉션:** 반드시 Windows 절대경로 (`C:\tmp\<project>_<action>.log`).

상세 규칙(Native-First 표, git 환경변수, 프리징 대응 등): `anti-freeze-protocol\SKILL.md` 참조.

## 4. Functional Integrity (Anti-Laziness)
- **🚨 HARD-GATE: False-Claims Mitigation:** NEVER declare a task complete, fixed, or successful without concrete evidence. `verification_agent` MCP 서버로 PASS를 받거나, 직접 테스트/로그를 확인한 후에만 완료 선언 가능.
- **No Corner-Cutting:** Never simplify or omit code blocks to resolve errors. Maintain 100% functional density.
- **Respect Team Context:** Never delete others' code without explicit instruction.
- **File Length (응집도 기준):** 파일 길이는 일률적 200줄 제한 대신 응집도 기준으로 판단한다. 150~350줄은 편안한 범위, 500줄 내외는 허용하되 역할이 2개 이상 섞이면 분리.
- **Encoding Guard:** 텍스트 인코딩은 기본 UTF-8을 유지하고, 외부 도구가 민감한 파일은 인코딩 깨짐 여부를 항상 점검한다. Windows 경로에 한글/특수문자가 섞여 빌드가 불안정하면 영어 ASCII 작업 경로 복제본을 별도로 만들어 빌드한다.
- **Build Artifact Validation:** 빌드 산출물은 항상 크기/구성 검증을 수행해 껍데기 산출물이나 의존성 누락을 조기에 발견한다.
- **Artifact Delivery:** 사용자가 저장 위치를 명시하지 않은 범용 산출물(`.txt`, `.md`, `.apk`, `.vsix` 등)은 안티그래비티에서 현재 열려 있는 탐색기(워크스페이스)의 **최상위 루트 디렉토리**에 복사한다. 단, 특정 프로젝트의 사용설명서·README처럼 용도와 위치가 정해진 문서는 해당 위치에 직접 생성한다.

## 5. Response Protocol
- **Output:** All communication and documentation in **Korean (한국어)**.
- **Efficiency:** State results clearly once, then wait. No filler phrases.
- **🚨 Tri-Core Status Declaration (CoT 강제):** 매 턴 주요 응답이나 작업 시작을 알릴 때, 최상단에 3대 코어 시스템 활성화 상태를 한 줄로 선언할 것.
  - ⚠️ **절대 기준:** 상태 표기는 **실제로 해당 턴에 MCP 도구(Tool)를 직접 실행(호출)했거나 스킬을 조회했을 때만** 표기. (문맥 유지는 무조건 '미사용' 표기)
  - 형식: `[🧠 MCP Memory: 도구호출/미사용] | [🦸‍♂️ Superpower: 스킬명/미사용] | [🌌 MCP OpenSpace: 도구호출/미사용]`

## 6. Skill-First Development
- **Skill Path:** `~/.gemini/antigravity/skills/` (IDE 유일 스캔 경로. 절대경로 사용 시 `%USERPROFILE%` 환경에 맞춰 해석).
- **Meta-Skill:** 코딩 트리거 감지 시, `using-superpowers\SKILL.md` 확인. 1%라도 관련 스킬이 있으면 읽고 따를 것.
- **메모리 저장/검색 시:** `memory-management\SKILL.md` 참조.
- **터미널 프리징 발생 시:** `anti-freeze-protocol\SKILL.md` 참조.
- **산출물 생성/수정 시:** `deployment-sync\SKILL.md`의 배포 절차를 자동 실행할 것.

## 7. Template-Driven Execution (작업 템플릿 강제)
- 작업 시작 시 작업 유형(일반 문답/코딩/Jira/Git/디버깅/운영)을 먼저 식별하고 해당 템플릿을 선택한다.
- 적합한 템플릿이 없으면 유사 템플릿을 임시 재사용하지 말고 즉시 새 템플릿을 만든다.
- 템플릿은 작업 중에도 지속 평가하여 조건 분기와 검증 항목을 보강하고, 종료 시 개선점을 기록한다.
