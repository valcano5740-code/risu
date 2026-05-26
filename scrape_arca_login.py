import json
import time
import urllib.parse
from traceback import format_exc
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

keywords = ["코파일럿", "코파", "copilot", "콥"]
base_url = "https://arca.live/b/aichating"

def run_scraper():
    all_posts = []
    seen_links = set()
    
    with sync_playwright() as p:
        # 1. 브라우저 및 컨텍스트 시작
        print("Starting browser...")
        browser = p.chromium.launch(headless=True)
        # Cloudflare 회피를 돕기 위한 기본 HTTP 헤더 설정 등
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        # 2. 로그인 페이지 접근 및 수행
        login_url = "https://arca.live/u/login"
        print(f"Navigating to {login_url}...")
        try:
            page.goto(login_url, wait_until="networkidle", timeout=30000)
            print("Executing login actions...")
            # 로그인 페이지가 떴는지 확실히 확인 (또는 Cloudflare 챌린지에 걸려있는지)
            page.wait_for_selector('input[name="username"]', timeout=5000)
            
            page.fill('input[name="username"]', "valcano574")
            page.fill('input[name="password"]', "rosha5544!")
            page.click('button#btnLogin')
            print("Login button clicked, waiting for network idle...")
            page.wait_for_load_state("networkidle", timeout=15000)
            time.sleep(3)
            print("Login sequence completed. Current URL:", page.url)
        except Exception as e:
            print("Login failed:", e)
            print("Dumping HTML and Screenshot for debugging...")
            with open("c:/Users/SSAFY/Desktop/risu/arca_login_error_debug.html", "w", encoding="utf-8") as df:
                df.write(page.content())
            page.screenshot(path="c:/Users/SSAFY/Desktop/risu/arca_login_error.png")
            print(format_exc())
            browser.close()
            return

        # 3. 로그인된 상태로 검색 순회
        for kw in keywords:
            kw_encoded = urllib.parse.quote(kw)
            for page_num in range(1, 4): # Pages 1, 2, 3
                url = f"{base_url}?target=all&keyword={kw_encoded}&p={page_num}"
                print(f"Scraping: {url}")
                try:
                    page.goto(url, wait_until="networkidle", timeout=30000)
                    html = page.content()
                    
                    if page_num == 1 and kw == keywords[0]:
                        with open("c:/Users/SSAFY/Desktop/risu/arca_login_debug.html", "w", encoding="utf-8") as df:
                            df.write(html)
                            
                    soup = BeautifulSoup(html, "html.parser")
                    items = soup.select("a.vrow")
                    
                    if not items:
                        print("No items found, end of pagination or blocked.")
                        continue
                    
                    for item in items:
                        title_el = item.select_first("span.title")
                        if not title_el:
                            title_el = item.select_first(".title")
                            
                        title = title_el.get_text(strip=True) if title_el else "No Title"
                        link = item.get("href", "")
                        
                        if link and not link.startswith("http"):
                            link = link.split('?')[0] # remove query params
                            link = "https://arca.live" + link

                        if link and link not in seen_links and "/b/aichating/" in link:
                            seen_links.add(link)
                            all_posts.append({
                                "title": title,
                                "link": link,
                                "keyword": kw
                            })
                    
                    time.sleep(2)
                except Exception as e:
                    print(f"Failed to scrape {url}: {e}")
                    time.sleep(5)
                    
        browser.close()

    with open("c:/Users/SSAFY/Desktop/risu/arca_posts_login.json", "w", encoding="utf-8") as f:
        json.dump(all_posts, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully scraped {len(all_posts)} unique posts.")

if __name__ == "__main__":
    run_scraper()
