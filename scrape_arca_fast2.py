import os
import json
import time
from playwright.sync_api import sync_playwright
from curl_cffi import requests
from bs4 import BeautifulSoup

URLS = [
    "https://arca.live/b/characterai/164370546?target=all&keyword=%EC%BD%94%ED%8C%8C%EC%9D%BC%EB%9F%BF+%EB%A7%A4%EB%8B%88%EC%A0%80&p=1",
    "https://arca.live/b/characterai/155147680",
    "https://arca.live/b/characterai/164258634?target=all&keyword=%EC%BD%94%ED%8C%8C%EC%9D%BC%EB%9F%BF+%EB%A7%A4%EB%8B%88%EC%A0%80&p=1"
]

def scrape_with_saved_profile():
    print("🍪 arca_profile에서 쿠키 블러오는 중...")
    cookie_dict = {}
    
    with sync_playwright() as p:
        user_data_dir = os.path.join(os.getcwd(), "arca_profile")
        browser = p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=True
        )
        # Background page to fetch cookies
        cookies = browser.cookies("https://arca.live")
        cookie_dict = {cookie['name']: cookie['value'] for cookie in cookies}
        print("✅ 쿠키 추출 완료!")
        # Don't call browser.close() because it might hang, just let context manager exit

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
    
    print("\n🎉 완료! arca_copilot_data.json 파일에 모든 데이터가 저장되었습니다.")

if __name__ == "__main__":
    scrape_with_saved_profile()
