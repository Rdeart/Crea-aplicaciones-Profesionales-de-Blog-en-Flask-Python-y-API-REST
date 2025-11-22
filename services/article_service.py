from flask import jsonify, session
from models.article import Article
from models.favorite import Favorite
from models.user import User
from models import db, Notification
import unicodedata
import urllib.request
import urllib.error
import base64
import re
import logging
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

logger = logging.getLogger(__name__)


def _generate_pdf_thumbnail_dataurl(pdf_src: str, target_width: int = 800) -> Optional[str]:
    """Try to fetch the PDF (data URL or remote) and render first page to a JPEG data URL.
    Returns data:image/jpeg;base64,... or None on failure.
    Requires PyMuPDF (fitz)."""
    try:
        try:
            import fitz  # PyMuPDF
        except ModuleNotFoundError as e:
            logger.warning('PyMuPDF not available, cannot generate PDF thumbnails: %s', e)
            return None

        pdf_bytes = None
        if pdf_src.startswith('data:'):
            # data:<mime>;base64,xxxxx
            try:
                b64 = pdf_src.split(',', 1)[1]
                pdf_bytes = base64.b64decode(b64)
            except (IndexError, ValueError, TypeError):
                logger.exception('pdf thumbnail: failed to decode data URL')
                return None
        else:
            # remote URL - try to fetch directly; handle common Google Drive variants
            candidate_urls = [pdf_src]
            if 'drive.google.com' in pdf_src:
                m = re.search(r'/file/d/([A-Za-z0-9_-]+)', pdf_src)
                if m:
                    did = m.group(1)
                    candidate_urls.append(f'https://drive.google.com/uc?export=download&id={did}')
                # also try id= query
                try:
                    from urllib.parse import urlparse, parse_qs
                    q = urlparse(pdf_src).query
                    qs = parse_qs(q)
                    mid = qs.get('id', [None])[0]
                    if mid:
                        candidate_urls.append(f'https://drive.google.com/uc?export=download&id={mid}')
                except (ImportError, ValueError):
                    pass

            for u in candidate_urls:
                try:
                    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}, method='GET')
                    with urllib.request.urlopen(req, timeout=20) as resp:
                        status = resp.getcode()
                        if status >= 400:
                            continue
                        content = resp.read()
                        # quick check for PDF signature
                        if content[:4] != b'%PDF':
                            # not a PDF
                            continue
                        pdf_bytes = content
                        break
                except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
                    logger.exception('pdf thumbnail: failed to fetch or validate URL %s: %s', u, exc)
                    continue

        if not pdf_bytes:
            return None

        # Render first page using PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype='pdf')
        if doc.page_count < 1:
            return None
        page = doc.load_page(0)
        # compute scale to reach target_width
        rect = page.rect
        scale = target_width / rect.width if rect.width > 0 else 1.0
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes(output='jpeg')
        data_url = 'data:image/jpeg;base64,' + base64.b64encode(img_bytes).decode('ascii')
        return data_url
    except Exception as e:
        logger.exception('Error generating PDF thumbnail: %s', e)
        return None



def update_article(article_id, data):
    # Require authenticated user
    current_user = session.get('user_id')
    if not current_user:
        return jsonify({'error': 'Usuario no autenticado'}), 401

    article = Article.query.get_or_404(article_id)
    # Only the author can update
    if article.user_id != current_user:
        return jsonify({'error': 'No autorizado para editar este artículo'}), 403

    # Update fields safely
    if 'title' in data:
        article.title = data.get('title')
    if 'content' in data:
        article.content = data.get('content').replace('\r\n', '\n').replace('\r', '\n')
    if 'image_url' in data:
        article.image_url = data.get('image_url')
    if 'pdf_url' in data:
        # store PDF (base64 data URL or link)
        article.pdf_url = data.get('pdf_url')
    if 'tag' in data:
        article.tag = data.get('tag')

    try:
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    # After commit, if article has a pdf_url but no image_url, try to generate a thumbnail server-side
    try:
        if article.pdf_url and not article.image_url:
            thumb = _generate_pdf_thumbnail_dataurl(article.pdf_url, target_width=800)
            if thumb:
                article.image_url = thumb
                db.session.commit()
    except (SQLAlchemyError, OSError, ValueError) as exc:
        logger.exception('update_article: failed to generate thumbnail or commit: %s', exc)
        db.session.rollback()

    return jsonify({
        'id': article.id,
        'title': article.title,
        'content': article.content,
        'image_url': article.image_url,
        'pdf_url': article.pdf_url,
        'author_photo_url': article.author.photo_url if article.author else None,
        'tag': article.tag,
        'author': article.author.username if article.author else None,
        'created_at': article.created_at.strftime('%d-%m-%Y') if article.created_at else None,
        'user_id': article.user_id
    })

def delete_article(article_id):
    if 'user_id' not in session:
        return jsonify({'message': 'No autorizado'}), 401
    
    article = Article.query.get_or_404(article_id)

    if article.user_id != session['user_id']:
        return jsonify({'message': 'No autorizado para eliminar este articulo'}), 403
    
    try:
        db.session.delete(article)
        db.session.commit()
        return jsonify({'message':f'Articulo eliminado con exito. Selimino {article.title}'})
    except (ValueError, KeyError) as e:
        db.session.rollback()
        return jsonify({'message':'Error al eliminar el articulo', 'error': str(e)}), 500

def get_article(article_id):
    article = Article.query.get_or_404(article_id)
    current_user = session.get('user_id')
    is_fav = False
    if current_user:
        fav = Favorite.query.filter_by(user_id=current_user, article_id=article.id).first()
        is_fav = True if fav else False
    # Fetch author username safely
    try:
        author_name = db.session.query(User.username).filter_by(id=article.user_id).scalar()
    except SQLAlchemyError:
        author_name = None
    return jsonify({
        'id': article.id,
        'title': article.title,
        'content': article.content,
        'image_url': article.image_url,
        'pdf_url': article.pdf_url,
        'video_url': article.video_url if hasattr(article, 'video_url') else None,
        'author_photo_url': article.author.photo_url if article.author else None,
        'tag': article.tag,
        'author': author_name,
        'created_at': article.created_at.strftime('%d-%m-%Y') if article.created_at else None,
        'user_id': article.user_id,
        'is_favorite': is_fav
    })

def create_article(data, user_id):
    if not user_id:
        return jsonify({'error': 'El usuario no está autenticado o el ID de usuario no está en la sesión'}), 401
    content_with_newlines = data['content'].replace('\r\n', '\n').replace('\r', '\n')
    new_article = Article(
        title=data['title'], 
        content=content_with_newlines,
        image_url=data['image_url'],
        pdf_url=data.get('pdf_url'),
        video_url=data.get('video_url'),
        tag=data.get('tag'),
        user_id = user_id
    )
    db.session.add(new_article)
    db.session.commit()
    # If a PDF URL was provided and no image was set, try to generate a thumbnail server-side
    try:
        if new_article.pdf_url and not new_article.image_url:
            thumb = _generate_pdf_thumbnail_dataurl(new_article.pdf_url, target_width=800)
            if thumb:
                new_article.image_url = thumb
                db.session.commit()
    except (SQLAlchemyError, OSError, ValueError) as exc:
        logger.exception('create_article: failed to generate thumbnail or commit: %s', exc)
        db.session.rollback()
   
    return jsonify({
    'id': new_article.id, 
    'title': new_article.title,
    'content': new_article.content,
    'image_url': new_article.image_url,
    'pdf_url': new_article.pdf_url,
    'video_url': getattr(new_article, 'video_url', None),
    'author_photo_url': new_article.author.photo_url if new_article.author else None,
    'tag': new_article.tag,
    'author': new_article.author.username

   }), 201

def _normalize_text(s: str) -> str:
    if not s:
        return ''
    # decompose unicode characters and remove diacritics
    nfkd = unicodedata.normalize('NFD', s)
    without_accents = ''.join([c for c in nfkd if not unicodedata.combining(c)])
    return without_accents.lower()


def _slugify(s: str) -> str:
    """Convert a string into a URL-friendly slug:
    - remove diacritics
    - lowercase
    - replace non-alphanumeric groups with a single hyphen
    - trim leading/trailing hyphens
    """
    if not s:
        return ''
    # remove accents
    nfkd = unicodedata.normalize('NFD', s)
    without_accents = ''.join([c for c in nfkd if not unicodedata.combining(c)])
    lowered = without_accents.lower()
    # replace any sequence of non-alphanumeric characters with a hyphen
    slug = re.sub(r'[^a-z0-9]+', '-', lowered)
    slug = slug.strip('-')
    return slug


def get_all_articles(search_term=None, tag=None, tag_slug=None):
    articles = Article.query.all()
    # normalize search term once
    norm_search = _normalize_text(search_term) if search_term else None
    norm_tag = _normalize_text(tag) if tag else None
    norm_tag_slug = tag_slug if tag_slug else None
    current_user = session.get('user_id')
    result = []
    for article in articles:
        # If tag_slug provided, compare slugified article.tag
        if norm_tag_slug:
            article_tag_slug = _slugify(article.tag or '')
            if norm_tag_slug != article_tag_slug:
                continue
        # If tag provided, filter by article.tag (accent-insensitive, exact match)
        if norm_tag:
            article_tag_norm = _normalize_text(article.tag)
            if norm_tag != article_tag_norm:
                continue
        # If search term provided, filter articles by title/content (accent-insensitive)
        if norm_search:
            title_norm = _normalize_text(article.title)
            content_norm = _normalize_text(article.content)
            if norm_search not in title_norm and norm_search not in content_norm:
                continue
        is_fav = False
        if current_user:
            fav = Favorite.query.filter_by(user_id=current_user, article_id=article.id).first()
            is_fav = True if fav else False
        # Obtain author username via lightweight query to avoid loading full User row (prevents errors if columns missing)
        try:
            author_name = db.session.query(User.username).filter_by(id=article.user_id).scalar()
            author_photo = db.session.query(User.photo_url).filter_by(id=article.user_id).scalar()
        except SQLAlchemyError:
            logger.exception('get_all_articles: failed to fetch author info for article id %s', article.id)
            author_name = None
            author_photo = None
        result.append({
            'id': article.id,
            'title': article.title,
            'content': article.content,
            'image_url': article.image_url,
            'pdf_url': article.pdf_url,
            'video_url': article.video_url if hasattr(article, 'video_url') else None,
            'tag': article.tag,
            'author': author_name,
            'author_photo_url': author_photo,
            'created_at': article.created_at.strftime('%d-%m-%Y'),
            'user_id': article.user_id,
            'is_favorite': is_fav
        })
    return jsonify(result)

def toggle_favorite(article_id):
    # Toggle favorite for the current user and the given article
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuario no autenticado'}), 401

    article = Article.query.get_or_404(article_id)
    # Check if favorite exists
    fav = Favorite.query.filter_by(user_id=user_id, article_id=article.id).first()
    if fav:
        # remove favorite
        try:
            db.session.delete(fav)
            db.session.commit()
            # Also remove any notification previously created for this favorite
            try:
                Notification.query.filter_by(user_id=article.user_id, actor_id=user_id, type='favorite', article_id=article.id).delete()
                db.session.commit()
            except SQLAlchemyError:
                db.session.rollback()
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
        return jsonify({'message': 'Favorito eliminado'}), 200
    else:
        # create favorite
        try:
            new_fav = Favorite(user_id=user_id, article_id=article.id)
            db.session.add(new_fav)
            db.session.commit()
            # Create a notification for the article author (if not favoriting own article)
            try:
                if article.user_id and article.user_id != user_id:
                    notif = Notification(
                        user_id=article.user_id,
                        actor_id=user_id,
                        type='favorite',
                        article_id=article.id
                    )
                    db.session.add(notif)
                    db.session.commit()
            except SQLAlchemyError:
                db.session.rollback()
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
        return jsonify({'message': 'Favorito agregado'}), 201


def get_favorites(user_id):
    if not user_id:
        return jsonify({'error': 'El usuario no está autenticado o el ID de usuario no está en la sesión'}), 401

    # Join Favorite -> Article for the given user
    favorites = Favorite.query.filter_by(user_id=user_id).all()
    articles_list = []
    for fav in favorites:
        article = Article.query.get(fav.article_id)
        if not article:
            continue
        articles_list.append({
            'id': article.id,
            'title': article.title,
            'content': article.content,
            'image_url': article.image_url,
            'pdf_url': article.pdf_url,
            'tag': article.tag,
            'created_at': article.created_at.strftime('%d-%m-%Y') if article.created_at else None,
            'is_favorite': True
        })

    return jsonify(articles_list), 200