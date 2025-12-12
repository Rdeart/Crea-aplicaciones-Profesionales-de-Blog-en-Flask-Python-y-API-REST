#!/usr/bin/env python3
"""Fix chrome-extension:// URLs in article.pdf_url

This script will:
- Find articles with chrome-extension:// URLs
- Extract the real URL from the chrome-extension:// wrapper
- Update the article.pdf_url to the clean URL
"""

import sys, os, re

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app import create_app
app = create_app()

with app.app_context():
    from models.article import Article
    from models import db

    print("Searching for articles with chrome-extension:// URLs...")
    
    articles = Article.query.filter(Article.pdf_url.like('chrome-extension://%')).all()
    
    if not articles:
        print("No articles with chrome-extension:// URLs found.")
        sys.exit(0)
    
    print(f"Found {len(articles)} articles with chrome-extension:// URLs:")
    
    for article in articles:
        print(f"\nArticle ID: {article.id}")
        print(f"Title: {article.title}")
        print(f"Current pdf_url: {article.pdf_url}")
        
        # Extract the real URL from chrome-extension:// wrapper
        # Pattern: chrome-extension://extension-id/https://real-url.com/file.pdf
        match = re.search(r'chrome-extension://[^/]+/(https://.+)', article.pdf_url)
        if match:
            clean_url = match.group(1)
            print(f"Clean URL: {clean_url}")
            
            # Update the article
            article.pdf_url = clean_url
            try:
                db.session.commit()
                print("✅ Updated successfully")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Failed to update: {e}")
        else:
            print("❌ Could not extract clean URL from chrome-extension:// URL")
    
    print("\nFix complete!")
