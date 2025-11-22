#!/usr/bin/env python3
"""Diagnóstico: prueba acceso a las URLs de PDF de los artículos.

Usa el mismo entorno del servidor para intentar GET a cada `pdf_url` y variantes (Google Drive).
Imprime estado HTTP y Content-Type para cada intento.
"""
import sys
import os
# Ensure project root is on sys.path so imports like `from app import create_app` work
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
from app import create_app
from urllib.parse import urlparse, parse_qs
import urllib.request
import urllib.error

app = create_app()

with app.app_context():
    from models.article import Article
    articles = Article.query.filter(Article.pdf_url != None).all()
    if not articles:
        print('No articles with pdf_url found')
        sys.exit(0)
    print(f'Found {len(articles)} articles with pdf_url')
    for a in articles:
        print('\n---')
        print(f'Article id={a.id} title="{a.title}"')
        print('pdf_url=', a.pdf_url)
        urls_to_try = [a.pdf_url]
        u = a.pdf_url
        if 'drive.google.com' in (u or ''):
            # try common Drive variants
            m = None
            try:
                import re
                m = re.search(r'/file/d/([A-Za-z0-9_-]+)', u)
            except Exception:
                m = None
            if m:
                did = m.group(1)
                urls_to_try.append(f'https://drive.google.com/uc?export=download&id={did}')
                urls_to_try.append(f'https://drive.google.com/thumbnail?id={did}&sz=w800')
            try:
                parsed = urlparse(u)
                qs = parse_qs(parsed.query)
                if 'id' in qs:
                    idv = qs['id'][0]
                    urls_to_try.append(f'https://drive.google.com/uc?export=download&id={idv}')
                    urls_to_try.append(f'https://drive.google.com/thumbnail?id={idv}&sz=w800')
            except Exception:
                pass

        tried = set()
        for tu in urls_to_try:
            if not tu or tu in tried:
                continue
            tried.add(tu)
            print('\nTrying:', tu)
            try:
                req = urllib.request.Request(tu, headers={'User-Agent': 'Mozilla/5.0'}, method='GET')
                with urllib.request.urlopen(req, timeout=20) as resp:
                    status = resp.getcode()
                    ctype = resp.headers.get('Content-Type')
                    print('  status=', status, 'Content-Type=', ctype)
                    # read small chunk if possible
                    try:
                        chunk = resp.read(64)
                        print('  first bytes:', chunk[:32])
                    except Exception:
                        pass
            except urllib.error.HTTPError as he:
                print('  HTTPError status=', he.code)
                try:
                    body = he.read(200).decode('utf-8', errors='replace')
                    print('  body snippet:', body[:200])
                except Exception:
                    pass
            except Exception as e:
                print('  ERROR:', e)

    print('\nDiagnostic complete')
