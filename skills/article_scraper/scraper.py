# skills/article_scraper/scraper.py

import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from markdownify import markdownify as md
import re


class ArticleScraper:
    """
    A skill to scrape an article from a URL, applying anti-detection measures,
    and converting it to Markdown.
    """

    async def _fetch_html(self, url: str) -> str | None:
        """
        Manually implemented anti-detection version.
        """
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                )
                page = await context.new_page()

                await page.add_init_script("""
                    () => {
                        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                        Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                        Object.defineProperty(navigator, 'languages', {get: () => ['zh-CN', 'zh', 'en']});
                    }
                """)

                await page.goto(url, wait_until="networkidle")
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(500)  # Small delay after scroll

                html = await page.content()
                await browser.close()
                return html
        except Exception as e:
            print(f"[-] Error during Playwright fetch: {e}")
            return None

    def _extract_content(self, html: str) -> tuple[str, str] | None:
        """
        Extracts the title and main content from the HTML.
        Optimized for Zhihu but includes fallbacks.
        """
        soup = BeautifulSoup(html, "lxml")

        title = (
            soup.find("h1", class_="Post-Title").get_text(strip=True)
            if soup.find("h1", class_="Post-Title")
            else "Untitled"
        )

        article_body = soup.find("div", class_="RichText ztext")

        if article_body:
            content_html = str(article_body)
        else:
            article = soup.find("article")
            if article:
                content_html = str(article)
            else:
                potential_containers = soup.select(
                    "main, .post-body, .entry-content, .article-content"
                )
                if potential_containers:
                    content_html = str(potential_containers[0])
                else:
                    print(
                        "[-] Warning: Could not locate the main article content area."
                    )
                    return None

        return title, content_html

    def _save_as_markdown(self, title: str, content_html: str):
        """
        Saves the extracted HTML content as a Markdown file.
        """
        safe_title = re.sub(r"[\\/*?:\"<>|]", "", title)
        filename = f"{safe_title}.md"

        soup = BeautifulSoup(content_html, "lxml")
        for figcaption in soup.select("figcaption"):
            if "查看原图" in figcaption.get_text():
                figcaption.decompose()

        markdown_content = md(str(soup), heading_style="ATX")

        try:
            with open(filename, "w", encoding="utf-8") as f:
                f.write(f"# {title}\n\n")
                f.write(markdown_content)
            print(f"[+] Success! Article saved as: {filename}")
        except IOError as e:
            print(f"[-] Error writing to file: {e}")

    async def scrape_and_save(self, url: str):
        """
        Public method to orchestrate the scraping and saving process.
        """
        print(f"[*] Scraping article from: {url}")
        html = await self._fetch_html(url)
        if not html:
            return

        content = self._extract_content(html)
        if not content:
            return

        title, content_html = content
        self._save_as_markdown(title, content_html)
