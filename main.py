# main.py - The "Glue" Code

import asyncio
import sys
from skills.article_scraper import ArticleScraper

async def main():
    """
    This is the main entry point of the application.
    It acts as the "glue" that connects and orchestrates the different skills.
    """
    if len(sys.argv) != 2:
        print("Usage: python main.py <URL>")
        sys.exit(1)
        
    url = sys.argv[1]
    
    # 1. Initialize the skill
    scraper = ArticleScraper()
    
    # 2. Use the skill
    await scraper.scrape_and_save(url)

if __name__ == '__main__':
    # Ensure you have a 'skills' directory with an '__init__.py'
    # and the 'article_scraper' skill inside.
    # To run this, you might need to adjust the Python path if running from the root:
    # python -m my-new-project.main "https://example.com"
    # For simplicity, we assume you run this from within the my-new-project directory.
    
    # Add project root to path to allow skill imports
    sys.path.append('.')
    
    asyncio.run(main())
