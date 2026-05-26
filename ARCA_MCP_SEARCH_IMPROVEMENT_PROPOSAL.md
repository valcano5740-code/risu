# ArcaSearch MCP Search Improvement Proposal

## 목적

아카라이브 검색을 `최근 몇 개 게시물 확인` 수준이 아니라, `합리적인 날짜 범위 안에서 공통 의견과 희소 팁까지 회수`하는 방향으로 개편한다.

이번 조사에서 확인한 핵심 문제는 아래와 같다.

- 종합 속보(`breaking`)는 전역 허브로는 유용하지만, 본검색 채널로 쓰기에는 봇 확인 리스크가 높다.
- 후기성 글은 `후기` 탭에만 있지 않다. 실제로 `일반`, `질문`, `AI대화`에 널려 있다.
- 모델/서비스 언급은 공식 명칭보다 은어가 더 많다.
- 탐색을 고정 개수로 끊으면 커뮤니티의 공통 의견과 특이 팁을 놓친다.
- `검색 -> 사람이 제목 훑어봄 -> 관련 글만 더 읽음` 흐름이 현재 MCP에 충분히 시스템화돼 있지 않다.

## 이번 조사에서 직접 확인한 은어/실사용 표기

다음 표기는 실제 AI 채팅 채널 검색 결과와 본문/댓글에서 확인됐다.

### OpenAI / GPT 계열

- `gpt-5.5`
- `GPT 5.5`
- `짚오오`
- `챗오오`
- `오삼`
- `고`
- `go`

### Claude 계열

- `클로드`
- `클`
- `오푸스`
- `소넷`
- `사칠`
- `사육`

### Gemini 계열

- `제미니`
- `잼`
- `잼삼플`
- `3.1 pro`
- `Gemini 3.1 Pro`

### DeepSeek 계열

- `딥시크`
- `딥식`
- `DS`
- `DeepSeek`

### 기타 보조축

- `GLM`
- `GLM 5`
- `GLM 5.1`
- `Kimi`
- `그록`

## 설계 원칙

1. 종합 속보는 `시드 수집용`으로만 사용한다.
2. 본조사는 원 채널에서 다시 수행한다.
3. 키워드는 공식 명칭 하나로 끝내지 않고 alias set으로 확장한다.
4. 후기 판별은 탭이 아니라 제목/본문/댓글 신호로 한다.
5. 탐색 중단 기준은 `개수`가 아니라 `날짜`, `신규 정보 수렴`, `채널별 포화도`로 둔다.
6. 조사 과정에서 발견한 은어와 채널 힌트는 DB에 누적 저장한다.

## 필요한 DB 테이블

현재 은어 저장용 DB가 이미 있다면 아래 구조만 추가하거나, 유사 컬럼으로 확장하면 된다.

```sql
CREATE TABLE IF NOT EXISTS query_aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canonical_term TEXT NOT NULL,
    alias_term TEXT NOT NULL,
    alias_type TEXT NOT NULL DEFAULT 'community',
    confidence REAL NOT NULL DEFAULT 0.7,
    source_channel TEXT,
    source_post_url TEXT,
    evidence_count INTEGER NOT NULL DEFAULT 1,
    last_seen_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (canonical_term, alias_term)
);

CREATE INDEX IF NOT EXISTS idx_query_aliases_canonical
ON query_aliases (canonical_term);

CREATE INDEX IF NOT EXISTS idx_query_aliases_alias
ON query_aliases (alias_term);
```

```sql
CREATE TABLE IF NOT EXISTS query_channel_hints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canonical_term TEXT NOT NULL,
    channel_slug TEXT NOT NULL,
    hint_score REAL NOT NULL DEFAULT 0.5,
    reason TEXT,
    evidence_count INTEGER NOT NULL DEFAULT 1,
    last_seen_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (canonical_term, channel_slug)
);

CREATE INDEX IF NOT EXISTS idx_query_channel_hints_term
ON query_channel_hints (canonical_term, hint_score DESC);
```

```sql
CREATE TABLE IF NOT EXISTS search_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_label TEXT NOT NULL,
    canonical_term TEXT,
    channel_slug TEXT,
    post_url TEXT NOT NULL,
    post_title TEXT NOT NULL,
    post_created_at TEXT,
    matched_terms_json TEXT NOT NULL,
    signals_json TEXT,
    classification TEXT,
    novelty_score REAL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_url)
);

CREATE INDEX IF NOT EXISTS idx_search_observations_query
ON search_observations (query_label, channel_slug, post_created_at DESC);
```

```sql
CREATE TABLE IF NOT EXISTS search_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_label TEXT NOT NULL,
    canonical_term TEXT,
    mode TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TEXT,
    stop_reason TEXT,
    metadata_json TEXT
);
```

## 바로 넣을 수 있는 alias seed

```sql
INSERT INTO query_aliases (canonical_term, alias_term, alias_type, confidence, source_channel)
VALUES
('gpt-5.5', 'gpt-5.5', 'official', 1.0, 'characterai'),
('gpt-5.5', 'GPT 5.5', 'official', 0.95, 'characterai'),
('gpt-5.5', '짚오오', 'community', 0.9, 'characterai'),
('gpt-5.5', '챗오오', 'community', 0.75, 'characterai'),
('gpt-5.5', '오삼', 'community', 0.6, 'characterai'),
('gpt-5.5', 'go', 'tier', 0.5, 'characterai'),
('claude', '클로드', 'official', 1.0, 'characterai'),
('claude', '클', 'community', 0.85, 'characterai'),
('claude', '오푸스', 'series', 0.9, 'characterai'),
('claude', '소넷', 'series', 0.8, 'characterai'),
('claude', '사칠', 'community', 0.8, 'characterai'),
('claude', '사육', 'community', 0.7, 'characterai'),
('gemini-3.1-pro', '제미니', 'official', 1.0, 'characterai'),
('gemini-3.1-pro', '잼', 'community', 0.85, 'characterai'),
('gemini-3.1-pro', '잼삼플', 'community', 0.9, 'characterai'),
('gemini-3.1-pro', '3.1 pro', 'official', 0.95, 'characterai'),
('deepseek', '딥시크', 'official', 1.0, 'characterai'),
('deepseek', '딥식', 'community', 0.95, 'characterai'),
('deepseek', 'DS', 'community', 0.6, 'characterai'),
('glm', 'GLM', 'official', 1.0, 'characterai'),
('grok', '그록', 'official', 1.0, 'characterai')
ON CONFLICT (canonical_term, alias_term) DO UPDATE SET
    confidence = excluded.confidence,
    source_channel = excluded.source_channel,
    updated_at = CURRENT_TIMESTAMP;
```

## 채널 힌트 seed

```sql
INSERT INTO query_channel_hints (canonical_term, channel_slug, hint_score, reason)
VALUES
('gpt-5.5', 'characterai', 1.0, '실사용 후기와 비교 글이 가장 많이 관측됨'),
('claude', 'characterai', 1.0, 'RP/검열/오푸스 비교 글이 집중됨'),
('gemini-3.1-pro', 'characterai', 1.0, '비용/전개/한글 품질 관련 실사용 글이 집중됨'),
('deepseek', 'characterai', 1.0, '가성비/검열/올라마 연계 글이 집중됨'),
('glm', 'characterai', 0.8, '대체 모델/서빙형 비교 문맥에서 반복 관측됨'),
('grok', 'characterai', 0.6, '뉴스/보조 비교로만 산발 관측됨')
ON CONFLICT (canonical_term, channel_slug) DO UPDATE SET
    hint_score = excluded.hint_score,
    reason = excluded.reason,
    updated_at = CURRENT_TIMESTAMP;
```

## 검색 파이프라인 개편안

### 1단계: 질의 정규화

입력 예시:

- `클로드 후기`
- `딥식`
- `짚오오 캐해`
- `개곰`

처리:

- 공백/대소문자 정리
- canonical term 추론
- alias expansion 수행
- 조사 목적 분류: `topic`, `user`, `comparison`, `review`

예시:

- `짚오오 캐해` -> canonical: `gpt-5.5`, expanded terms: `['짚오오', 'gpt-5.5', 'GPT 5.5', '챗오오']`

### 2단계: 채널 후보 선정

우선순위는 아래 순서로 한다.

1. DB의 `query_channel_hints`
2. 종합 속보 제목 시드 검색 결과에서 추출된 원 채널 빈도
3. 채널 디렉터리 이름/탭 이름과 canonical term의 의미적 일치

`breaking`은 여기서만 쓴다.

### 3단계: 종합 속보 시드 검색

목적:

- 현재 어떤 채널에서 이 주제가 도는지 찾기
- 최근 날짜 분포 파악
- 원 채널 URL 수집

규칙:

- `channel='breaking'`
- `target='title'`
- `fetch_content=false`
- alias마다 1페이지만 훑기
- 봇 확인 회피를 위해 절대 본문 대량 추출 금지

출력:

- 원 채널 slug
- 원글 URL
- 게시 날짜
- 제목

### 4단계: 원 채널 본조사

여기서부터는 사용자가 실제로 하는 방식과 유사하게 간다.

- 특정 탭으로 제한하지 않는다.
- 해당 채널 전체 게시물에서 키워드를 넣고 제목을 우선 훑는다.
- 제목에서 관련성이 높은 글만 본문/댓글 추출로 승격한다.

제목 1차 선별 기준 예시:

- `후기`, `성능`, `어때`, `비교`, `좋`, `별로`, `검열`, `가성비`, `캐해`, `전개`, `한출`, `추천`, `팁`
- 모델명과 비교 접속어가 같이 있으면 우선도 상승
- 질문형 제목은 공통 반응 수집에 유리하므로 보존

즉, `후기` 탭을 찾는 것이 아니라 `후기성 제목`을 찾는다.

### 5단계: 날짜 기반 중단 규칙

고정 개수 대신 아래 중단 규칙을 쓴다.

#### 기본 날짜 컷

- 빠른 조사: 최근 14일
- 일반 조사: 최근 30일
- 모델 교체기/핫이슈: 최근 60일

#### 조기 중단

아래 둘을 동시에 만족하면 중단한다.

- 최근 N개 읽은 글에서 신규 alias/신규 팁/신규 의견축이 거의 안 나옴
- 최근 읽은 글의 날짜가 컷라인을 넘김

#### 추가 확장

아래 조건이면 컷라인을 자동 확장한다.

- 검색 결과가 너무 적음
- 특정 모델이 최근 업데이트 직후라 표본이 얕음
- 비교 키워드(`vs`, `비교`, `차이`) 비율이 높음

## 후기 분류 로직

탭이 아니라 signals 기반으로 점수화한다.

```text
review_score =
  제목에 체감/평가 표현 포함 +2
  본문에 사용 경험 서술 포함 +2
  댓글에 추천/비추천/비교가 다수 포함 +1
  질문글이면서 댓글 3개 이상 +1
  뉴스/공지 형식이면 -3
```

예시 분류:

- `가차섬 제미니 말고 다른 모델로도 먹어보는데 미식이네` -> review
- `오랜만에 왔는데 클로드 4.7까지 나왔구나 사칠이 성능 어때요??` -> question_with_review_signal
- `앤트로픽, 법률 업계 겨냥한 신규 AI 도구 대거 공개` -> news

## 사용자 검색 개편안

사용자 검색은 아래처럼 분리해야 한다.

### 현재 문제

- `breaking` 닉네임 검색 의존도가 높으면 봇 확인 리스크가 큼
- 한 채널만 보고 유저의 실제 활동 축을 놓칠 수 있음

### 개선 흐름

1. `breaking`에서 닉네임 시드 검색을 얕게 수행
2. 최근 원글의 채널 분포를 집계
3. 상위 활동 채널 3~7개를 선정
4. 그 채널들에서 다시 닉네임 검색
5. 결과를 활동 채널/주제/대표 글 단위로 요약

## 새로 필요한 MCP API 제안

### `search_arcalive_smart`

입력:

- `query`
- `mode`: `topic | user | review | comparison`
- `date_window_days`
- `max_channel_candidates`
- `expand_aliases`

동작:

- alias expansion
- breaking 시드 검색
- 원 채널 후보 선정
- 제목 기반 1차 선별
- 고득점 글만 본문/댓글 추출
- 수렴 시 중단

### `discover_channel_candidates`

출력:

- `channel_slug`
- `score`
- `reason`
- `sample_posts`

### `harvest_aliases_from_results`

목적:

- 조사 중 새 은어를 자동 후보로 적재
- 사람이 승인하면 `query_aliases`에 승격

휴리스틱:

- 공식 모델명과 같은 문맥에서 반복 등장
- 댓글/본문에서 교차 치환 가능
- 2개 이상 글에서 독립 재등장

### `summarize_opinions`

결과를 아래 축으로 묶는다.

- 공통 장점
- 공통 단점
- 비용 관련 의견
- 검열 관련 의견
- 희소하지만 강한 팁

## 구현 우선순위

### P0

- alias DB를 실제 검색에서 사용
- breaking을 시드 채널로만 제한
- 후기 탭 의존 제거
- 날짜 기반 탐색 중단 규칙 도입

### P1

- 제목/본문/댓글 signals 기반 분류기
- user search 2단계 파이프라인
- 조사 중 alias 자동 후보 적재

### P2

- 의견 축 자동 군집화
- 채널 추천 점수 자동 업데이트
- 동일 주제 재검색 시 누적 지식 재사용

## 최소 구현 의사코드

```python
def search_arcalive_smart(query, mode='topic', date_window_days=30):
    canonical = normalize_query(query)
    aliases = load_aliases(canonical) or [query]

    seed_hits = search_breaking_titles_only(aliases)
    candidate_channels = rank_channels(seed_hits, canonical)

    observations = []
    cutoff = now() - timedelta(days=date_window_days)

    for channel in candidate_channels:
        for alias in aliases:
            for page in iter_pages_until_cutoff(channel, alias, cutoff):
                posts = search_channel(channel, alias, target='all', fetch_content=False)
                title_candidates = score_titles(posts, canonical, mode)
                promoted = promote_top_posts(title_candidates)
                full_posts = extract_posts(promoted)
                observations.extend(classify_and_store(full_posts))

                if is_converged(observations, cutoff):
                    break

    new_alias_candidates = harvest_aliases(observations, canonical)
    persist_alias_candidates(new_alias_candidates)
    return summarize_opinions(observations)
```

## 이번 확인으로 정리된 결론

- 사용자의 방식이 맞다. `후기 탭`이 아니라 `전체 게시물 검색 후 제목 선별`이 더 현실적이다.
- `최근 5개 확인` 같은 고정 개수 컷은 품질이 낮다.
- `날짜 컷 + 수렴 판정 + 제목 우선 선별 + 필요한 글만 본문 추출`이 더 안전하고 정확하다.
- 은어는 단순 부가 기능이 아니라 검색 정확도의 핵심이다.
- `breaking`은 본조사 채널이 아니라 전역 인덱스처럼 다뤄야 한다.

## 현재 확인 한계

이번 워크스페이스에서는 아카서치 MCP의 실제 내부 DB 파일과 테이블을 직접 열 수 없었다.

- 워크스페이스 내에서 아카서치 전용 sqlite 파일은 확인되지 않음
- SQLite 도구로 노출된 현재 세션 DB는 빈 상태였음

따라서 위 내용은 `현재 실검색 관찰 + 사용자가 알려준 내부 구조 존재 사실`을 바탕으로 작성한 직접 반영용 수정안이다.