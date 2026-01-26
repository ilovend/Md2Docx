# Article Scraper Skill

This skill is responsible for fetching the content of a web article and converting it to Markdown.

## Usage

```python
import asyncio
from skills.article_scraper import ArticleScraper

async def main():
    scraper = ArticleScraper()
    markdown_content, title = await scraper.scrape("https://example.com/article")
    if markdown_content:
        # Do something with the content
        print(f"Successfully scraped: {title}")

if __name__ == "__main__":
    asyncio.run(main())
```
