---
name: web-search
description: 使用各種工具搜尋或擷取網路資訊。tavilySearch 做關鍵字搜尋，webScrape 讀特定頁面全文，arxivSearch 查學術論文。與 ragSearch 互補：ragSearch 查公司內部，其他查外部網路。
---

# 網路資訊獲取指引

## 工具選擇總覽

| 情境 | 用哪個工具 |
|------|-----------|
| 公司內部 Datasheet、Issue | `ragSearch` |
| 關鍵字搜尋外部網頁、找參考資料 | `tavilySearch` |
| 已知 URL，讀取整頁完整內容 | `webScrape` |
| 查學術論文、研究報告 | `arxivSearch` |
| 找最新新聞 | `tavilySearch(topic="news")` |
| 搜尋 YouTube 教學影片 | Python `youtube-search-python` |

---

## tavilySearch — 關鍵字搜尋

```
tavilySearch(query="MIPI I3C vs I2C difference")
tavilySearch(query="touch IC market news 2025", topic="news")
tavilySearch(query="pdfplumber extract table", search_depth="advanced")
```

**搜尋關鍵字建議**：英文優於中文

```
❌ "HX83192 觸控 IC 規格"
✅ "HX83192 touch IC datasheet register map"

❌ "MIPI DSI 傳輸速率"
✅ "MIPI DSI max data rate specification"
```

---

## webScrape — 讀取整頁內容

先用 `tavilySearch` 找到 URL，再用 `webScrape` 讀全文：

```
1. tavilySearch(query="HX83192 datasheet PDF")
   → 取得相關頁面 URL

2. webScrape(url="https://...")
   → 讀取完整頁面內容

3. 從內容中萃取需要的技術規格
```

適合：IC 規格書頁面、技術 blog、library 文件頁。
**不適合**：需要登入的頁面、純 JavaScript 渲染的 SPA。

---

## arxivSearch — 學術論文

```
arxivSearch(query="touch screen noise cancellation algorithm")
arxivSearch(query="MIPI CSI-2 signal integrity", category="eess.SP")
arxivSearch(query="embedded system power optimization", max_results=8)
```

常用分類：`eess.SP`（訊號處理）、`eess.SY`（系統）、`cs.AI`、`cs.LG`

---

## YouTube 搜尋（Python）

crewAI `youtube_video_search_tool` / `youtube_channel_search_tool` 對應做法：

```python
# pip install youtube-search-python
from youtubesearchpython import VideosSearch

results = VideosSearch("MIPI DSI tutorial", limit=5)
for video in results.result()["result"]:
    print(video["title"], video["link"], video["duration"])
```

```python
# 搜尋頻道
from youtubesearchpython import ChannelsSearch

results = ChannelsSearch("embedded systems", limit=3)
for ch in results.result()["result"]:
    print(ch["title"], ch["link"])
```

---

## 進階網頁爬取（Python）

當 `webScrape` 無法處理時（需要 JS 渲染、登入），用 Python：

### Firecrawl（crewAI firecrawl_scrape_website_tool 對應）

```python
# pip install firecrawl-py（需付費 API Key）
from firecrawl import FirecrawlApp

app = FirecrawlApp(api_key="fc-...")
result = app.scrape_url("https://example.com", params={"formats": ["markdown"]})
print(result["markdown"])

# 爬取整個網站
crawl = app.crawl_url("https://docs.example.com", params={"limit": 50})
```

### Selenium（crewAI selenium_scraping_tool 對應）

```python
# pip install selenium webdriver-manager
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
driver.get("https://example.com")

# 等待元素出現
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
element = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.ID, "content"))
)
print(element.text)
driver.quit()
```

### BeautifulSoup（靜態頁面，最輕量）

```python
# pip install requests beautifulsoup4
import requests
from bs4 import BeautifulSoup

resp = requests.get("https://example.com", timeout=10)
soup = BeautifulSoup(resp.text, "html.parser")

# 找特定元素
tables = soup.find_all("table")
for table in tables:
    rows = table.find_all("tr")
    for row in rows:
        cols = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
        print(cols)
```

---

## 多工具組合（最強用法）

```
使用者：「HX83192 的 Touch timeout 問題，業界怎麼處理？有沒有學術研究？」

1. ragSearch(domain="issue_tracker", query="HX83192 Touch timeout")
   → 公司內部 Issue 紀錄

2. tavilySearch(query="touch IC touch timeout solution")
   → 業界做法與外部文章

3. arxivSearch(query="touch screen timeout detection algorithm")
   → 學術研究方向

4. 綜合三份資料給出完整回答
```

---

## 設定

`~/.config/opencode/ms_config.json`：

```json
{
  "tavily_api_key": "tvly-...",
  "jina_api_key": "jina_..."
}
```

- **Tavily**：https://app.tavily.com（免費 1,000 次/月）
- **Jina**（選填，提升 webScrape 速率）：https://jina.ai（免費取得）
- **webScrape 不填 key 也能用**（有速率限制但夠用）
