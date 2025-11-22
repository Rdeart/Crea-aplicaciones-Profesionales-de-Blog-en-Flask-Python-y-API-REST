#!/usr/bin/env python3
"""Batch generate PDF thumbnails for articles.

Usage: run this from repo root after installing PyMuPDF:
    python scripts/generate_pdf_thumbs.py

It will iterate Article rows that have `pdf_url` and no `image_url`, try to generate a thumbnail
using the helper in `services.article_service` and save it to the DB.
"""
import sys
import os
import logging
from app import create_app

APP = create_app()

with APP.app_context():
    from models import db
    from models.article import Article
    try:
        from services.article_service import _generate_pdf_thumbnail_dataurl
    except Exception as e:
        print('Could not import thumbnail generator from services.article_service:', e)
        sys.exit(1)

    articles = Article.query.filter(Article.pdf_url != None).filter((Article.image_url == None) | (Article.image_url == '')).all()
    print(f'Found {len(articles)} articles needing thumbnails')
    success = 0
    for a in articles:
        print(f'Processing Article id={a.id} title="{a.title}" pdf_url={a.pdf_url}')
        try:
            thumb = _generate_pdf_thumbnail_dataurl(a.pdf_url, target_width=800)
            if thumb:
                a.image_url = thumb
                db.session.commit()
                success += 1
                print('  -> thumbnail generated')
            else:
                print('  -> thumbnail generation failed')
        except Exception as e:
            db.session.rollback()
            logging.exception('  -> error generating thumbnail for article id %s', a.id)

    print(f'Done. Generated {success} thumbnails.')
