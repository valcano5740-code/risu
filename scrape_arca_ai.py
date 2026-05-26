import json
import time
import urllib.parse
from traceback import format_exc
from curl_cffi import requests
from bs4 import BeautifulSoup

keywords = ["코파일럿", "코파", "copilot", "콥"]
base_url = "https://arca.live/b/aichating"

def run_scraper():
    session = requests.Session(impersonate="chrome110")
    all_posts = []
    seen_links = set()
    
    for kw in keywords:
        kw_encoded = urllib.parse.quote(kw)
        for page_num in range(1, 4): # Pages 1, 2, 3
            url = f"{base_url}?target=all&keyword={kw_encoded}&p={page_num}"
            print(f"Scraping: {url}")
            try:
                page = session.get(url)
                html = page.text
                
                # Debug dump
                if page_num == 1 and kw == keywords[0]:
                    with open("c:/Users/SSAFY/Desktop/risu/arca_debug.html", "w", encoding="utf-8") as df:
                        df.write(html)
                        
                soup = BeautifulSoup(html, "html.parser")
                
                items = soup.select("a.vrow")
                if not items:
                    print("No items found, end of pagination or blocked.")
                    break
                
                for item in items:
                    title_el = item.select_first("span.title")
                    if not title_el:
                        title_el = item.select_first(".title")
                    title = title_el.get_text(strip=True) if title_el else "No Title"
                    
                    link = item.get("href", "")
                    if link and not link.startswith("http"):
                        link = link.split('?')[0] # remove query params like '?p=1'
                        link = "https://arca.live" + link

                    if link and link not in seen_links and "/b/aichating/" in link:
                        seen_links.add(link)
                        all_posts.append({
                            "title": title,
                            "link": link,
                            "keyword": kw
                        })
                
                time.sleep(2) # be nice
            except Exception as e:
                print(f"Failed to scrape {url}: {e}")
                time.sleep(5)

    with open("c:/Users/SSAFY/Desktop/risu/arca_posts.json", "w", encoding="utf-8") as f:
        json.dump(all_posts, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully scraped {len(all_posts)} unique posts.")

if __name__ == "__main__":
    run_scraper()
