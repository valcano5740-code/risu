import os, json, time, sys
from playwright.sync_api import sync_playwright
from curl_cffi import requests
from bs4 import BeautifulSoup

URLS = [
    "https://arca.live/b/characterai/164370546?target=all&keyword=%EC%BD%94%ED%8C%8C%EC%9D%BC%EB%9F%BF+%EB%A7%A4%EB%8B%88%EC%A0%80&p=1",
    "https://arca.live/b/characterai/155147680",
    "https://arca.live/b/characterai/164258634?target=all&keyword=%EC%BD%94%ED%8C%8C%EC%9D%BC%EB%9F%BF+%EB%A7%A4%EB%8B%88%EC%A0%80&p=1"
]

cookie_dict = {}

try:
    print("🍪 사용자 세션 탭핑 (창이 작게 뜹니다)")
    p = sync_playwright().start()
    browser = p.chromium.launch_persistent_context(
        os.path.join(os.getcwd(), 'arca_profile'),
        headless=False,
        args=["--window-size=200,200", "--window-position=0,0"]
    )
    time.sleep(1) # Give it a second to load cookies
    cookies = browser.cookies("https://arca.live")
    cookie_dict = {c['name']: c['value'] for c in cookies}
    print("✅ 쿠키 로드 완료:", len(cookie_dict), "개")
    browser.close()
    p.stop()
except Exception as e:
    print("❌ 쿠키 획득 오류:", e)
    sys.exit(1)

print("\n🚀 고속 스크래핑 시작!")
results = []
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

for url in URLS:
    print(f"📥 읽는 중: {url}")
    res = requests.get(url, cookies=cookie_dict, headers=headers, impersonate="chrome120")
    if res.status_code == 200:
        soup = BeautifulSoup(res.text, 'html.parser')
        
        title_tag = soup.select_one(".title-row .title")
        title = title_tag.text.strip() if title_tag else "제목 없음"
        
        body_tag = soup.select_one(".article-content")
        body = body_tag.text.strip() if body_tag else "본문 없음"
        
        links = []
        if body_tag:
            for a in body_tag.find_all('a', href=True):
                links.append(a['href'])
                
        comments = []
        comment_tags = soup.select(".comment-item")
        for c in comment_tags:
            author_tag = c.select_one(".user-info>a")
            author = author_tag.text.strip() if author_tag else "알수없음"
            text_tag = c.select_one(".text>pre") or c.select_one(".text")
            text = text_tag.text.strip() if text_tag else ""
            if text:
                comments.append(f"[{author}] {text}")

        results.append({
            "url": url,
            "title": title,
            "body": body,
            "links": links,
            "comments": comments
        })
        print(f"  👉 성공: {title} (댓글 {len(comments)}개)")
    else:
        print(f"  ❌ 실패 (상태 코드: {res.status_code})")
    
    time.sleep(1)

with open("arca_copilot_data.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\n🎉 모든 데이터 추출 성공!")
