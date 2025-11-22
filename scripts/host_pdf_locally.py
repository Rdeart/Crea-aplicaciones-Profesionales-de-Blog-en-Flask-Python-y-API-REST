#!/usr/bin/env python3
"""Save article PDF locally and generate thumbnail.

Usage: python scripts/host_pdf_locally.py <article_id>

The script will:
- read the article.pdf_url
- if it's a data: URL, decode and save as PDF
- if it's a Drive file link (/file/d/<id> or id=...), try uc?export=download and save
- update article.pdf_url to local static path and generate thumbnail using service helper
"""
import sys, os, base64, re

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app import create_app
app = create_app()

if len(sys.argv) < 2:
    print('Usage: host_pdf_locally.py <article_id>')
    sys.exit(1)

aid = int(sys.argv[1])

with app.app_context():
    from models.article import Article
    from models import db
    from services.article_service import _generate_pdf_thumbnail_dataurl
    from urllib.parse import urlparse, parse_qs
    import urllib.request

    a = Article.query.get(aid)
    if not a:
        print('Article not found')
        sys.exit(2)

    pdf_src = a.pdf_url
    if not pdf_src:
        print('No pdf_url for this article')
        sys.exit(0)

    upload_dir = os.path.join(PROJECT_ROOT, 'static', 'uploads', 'pdfs')
    os.makedirs(upload_dir, exist_ok=True)

    saved_path = None
    # data: URL
    if pdf_src.startswith('data:'):
        try:
            b64 = pdf_src.split(',',1)[1]
            data = base64.b64decode(b64)
            fname = f'article-{aid}.pdf'
            saved_path = os.path.join(upload_dir, fname)
            with open(saved_path, 'wb') as fh:
                fh.write(data)
            print('Saved data: PDF to', saved_path)
        except Exception as e:
            print('Failed to decode data URL:', e)
    else:
        # try Drive file id
        if 'drive.google.com' in pdf_src:
            m = re.search(r'/file/d/([A-Za-z0-9_-]+)', pdf_src)
            fid = None
            if m:
                fid = m.group(1)
            else:
                try:
                    qs = parse_qs(urlparse(pdf_src).query)
                    fid = qs.get('id',[None])[0]
                except Exception:
                    fid = None
            if fid:
                alt = f'https://drive.google.com/uc?export=download&id={fid}'
                print('Attempting to fetch drive file id=', fid)
                try:
                    req = urllib.request.Request(alt, headers={'User-Agent':'Mozilla/5.0'}, method='GET')
                    with urllib.request.urlopen(req, timeout=20) as r:
                        content = r.read()
                        if content[:4] == b'%PDF':
                            fname = f'article-{aid}.pdf'
                            saved_path = os.path.join(upload_dir, fname)
                            with open(saved_path, 'wb') as fh:
                                fh.write(content)
                            print('Saved drive PDF to', saved_path)
                        else:
                            print('Downloaded content is not a PDF (len=', len(content),')')
                except Exception as e:
                    print('Error fetching drive uc URL:', e)
            else:
                print('No drive file id found in URL; cannot auto-download')
        else:
            # try direct fetch
            try:
                req = urllib.request.Request(pdf_src, headers={'User-Agent':'Mozilla/5.0'}, method='GET')
                with urllib.request.urlopen(req, timeout=20) as r:
                    content = r.read()
                    if content[:4] == b'%PDF':
                        fname = f'article-{aid}.pdf'
                        saved_path = os.path.join(upload_dir, fname)
                        with open(saved_path, 'wb') as fh:
                            fh.write(content)
                        print('Saved remote PDF to', saved_path)
                    else:
                        print('Remote content not a PDF; content-type=', r.headers.get('Content-Type'))
            except Exception as e:
                print('Error fetching remote URL:', e)

    if not saved_path:
        print('Could not save PDF for article', aid)
        sys.exit(3)

    # Update DB pdf_url to local static path
    public_path = f'/static/uploads/pdfs/{os.path.basename(saved_path)}'
    a.pdf_url = public_path
    try:
        db.session.commit()
        print('Updated article.pdf_url ->', public_path)
    except Exception as e:
        db.session.rollback()
        print('Failed to update DB:', e)

    # generate thumbnail
    try:
        with open(saved_path, 'rb') as fh:
            b = fh.read()
            data_url = 'data:application/pdf;base64,' + base64.b64encode(b).decode('ascii')
            thumb = _generate_pdf_thumbnail_dataurl(data_url, target_width=800)
            if thumb:
                a.image_url = thumb
                db.session.commit()
                print('Generated and saved thumbnail for article', aid)
            else:
                print('Thumbnail generation failed')
    except Exception as e:
        db.session.rollback()
        print('Error generating thumbnail:', e)

    print('Done')
