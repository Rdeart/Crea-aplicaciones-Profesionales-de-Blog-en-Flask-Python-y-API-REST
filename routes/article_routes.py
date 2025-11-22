from flask import Blueprint, request, session, jsonify, Response, stream_with_context
from services.article_service import get_article, delete_article, update_article, create_article, get_all_articles, get_favorites, toggle_favorite
import urllib.request
import urllib.error
import urllib.parse
import base64
import uuid
from models import db, Comment, Reaction, CommentReaction, Notification
from models.article import Article
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from services.article_service import _generate_pdf_thumbnail_dataurl
import logging
from sqlalchemy.exc import SQLAlchemyError

bp = Blueprint('articles', __name__)



# Actualizamos un articulo
@bp.route('/articles/<int:article_id>', methods=['PUT'])
def update_article_route(article_id):
    data = request.get_json()
    return update_article(article_id, data)


# Eliminamos un articulo
@bp.route('/articles/<int:article_id>', methods=['DELETE'])
def delete_article_route(article_id):
    return delete_article(article_id)



# Obtenemos un Articulo
@bp.route('/article/<int:article_id>', methods=['GET'])
def view_article_route(article_id):
    return get_article(article_id)


# Creamos un articulo
@bp.route('/articles', methods=['POST'])
def create_article_route():
    data = request.get_json()
    user_id = session.get('user_id')
    return create_article(data, user_id)



# Obtenemos todos los articulos
@bp.route('/articles', methods=['GET'])
def get_articles_route():
    # Support optional query parameter `q` for accent-insensitive search
    q = request.args.get('q')
    tag = request.args.get('tag')
    tag_slug = request.args.get('tag_slug')
    return get_all_articles(q, tag, tag_slug)





@bp.route('/favorites/<int:article_id>', methods=['POST'])
def toggle_favorite_route(article_id):
    # Toggle favorite for the logged-in user
    return toggle_favorite(article_id)


@bp.route('/favorites', methods=['GET'])
def get_favorites_route():
    user_id = session.get('user_id')
    
    return get_favorites(user_id)



@bp.route('/proxy')
def proxy_route():
    """Simple proxy to stream external resources (for video CORS/RANGE).
    Use with ?url=<encoded-url>. For production be careful: this can be abused.
    Consider restricting domains or adding auth.
    Implements streaming using urllib to avoid external dependencies.
    """
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'url query parameter required'}), 400

    # Build headers to forward where helpful
    headers = {}
    range_hdr = request.headers.get('Range')
    if range_hdr:
        headers['Range'] = range_hdr
    ua = request.headers.get('User-Agent')
    if ua:
        headers['User-Agent'] = ua
    ref = request.headers.get('Referer')
    if ref:
        headers['Referer'] = ref

    try:
        # If the URL is a Google Drive folder link, try to extract a /file/d/<id> link
        # and use the direct-download endpoint. This helps when users paste a folder URL.
        try:
            if 'drive.google.com/drive/folders/' in (url or ''):
                try:
                    folder_req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}, method='GET')
                    with urllib.request.urlopen(folder_req, timeout=10) as fr:
                        body = fr.read(32768).decode('utf-8', errors='replace')
                        import re
                        m = re.search(r'/file/d/([A-Za-z0-9_-]+)', body)
                        if m:
                            fid = m.group(1)
                            url = f'https://drive.google.com/uc?export=download&id={fid}'
                            print(f"[proxy] detected drive folder -> trying file id={fid}")
                        else:
                            # If folder HTML doesn't contain a file id, inform the client
                            return jsonify({'error': 'Google Drive folder URL detected but no file found in folder HTML. Provide a direct file link (use "Compartir -> Obtener enlace" on the file) or upload the PDF.'}), 422
                except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
                    # If we couldn't fetch the folder page, return informative error
                    logging.exception('proxy: failed to fetch Google Drive folder page: %s', exc)
                    return jsonify({'error': 'Unable to fetch Google Drive folder page. Ensure the folder is public or provide a direct file link.'}), 422
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
            logging.exception('proxy: ignored inner error while handling drive folder detection: %s', exc)

        req = urllib.request.Request(url, headers=headers, method='GET')
        # Open the remote URL (this returns an HTTPResponse-like object)
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.getcode()
            # Collect headers from remote
            remote_headers = dict(resp.getheaders())
            try:
                print(f"[proxy] requested url={url} status={status}")
                interesting = {k: v for k, v in remote_headers.items() if k.lower() in ['content-type', 'content-length', 'accept-ranges', 'content-range', 'access-control-allow-origin']}
                print(f"[proxy] remote headers={interesting}")
            except (AttributeError, TypeError, ValueError) as exc:
                logging.exception('proxy: failed to inspect remote headers: %s', exc)

            if status >= 400:
                # try to read a bit of body
                try:
                    detail = resp.read(1000).decode('utf-8', errors='replace')
                except (OSError, ValueError):
                    detail = '<no body>'
                # If upstream returned 404 and the url looks like Google Drive, try alternative direct-download formats
                try:
                    if status == 404 and 'drive.google.com' in url:
                        import re
                        m = re.search(r'/file/d/([A-Za-z0-9_-]+)', url)
                        if not m:
                            from urllib.parse import urlparse, parse_qs
                            q = urlparse(url).query
                            qs = parse_qs(q)
                            m_id = qs.get('id', [None])[0]
                        else:
                            m_id = m.group(1)
                        if m_id:
                            alt = f'https://drive.google.com/uc?export=download&id={m_id}'
                            try:
                                with urllib.request.urlopen(urllib.request.Request(alt, headers=headers), timeout=15) as resp2:
                                    status2 = resp2.getcode()
                                    if status2 < 400:
                                        remote_headers = dict(resp2.getheaders())
                                        excluded = ['content-encoding', 'transfer-encoding', 'connection', 'x-frame-options', 'content-disposition', 'set-cookie', 'x-content-type-options']
                                        response_headers = {}
                                        for k, v in remote_headers.items():
                                            if k.lower() in excluded:
                                                continue
                                            response_headers[k] = v
                                        response_headers['Access-Control-Allow-Origin'] = '*'
                                        if response_headers.get('Content-Type', '').lower().startswith('application/pdf'):
                                            response_headers['Content-Disposition'] = 'inline'
                                        def stream2():
                                            try:
                                                chunk_size = 8192
                                                while True:
                                                    chunk = resp2.read(chunk_size)
                                                    if not chunk:
                                                        break
                                                    yield chunk
                                            except GeneratorExit:
                                                return
                                        return Response(stream_with_context(stream2()), status=status2, headers=response_headers)
                            except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
                                logging.exception('proxy: drive fallback fetch failed: %s', exc)
                except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
                    logging.exception('proxy: error handling 404 drive fallback: %s', exc)

                return jsonify({'error': 'upstream error', 'status': status, 'detail': detail}), status

            # Excluir cabeceras que puedan interferir con embed/streaming en el cliente
            excluded = ['content-encoding', 'transfer-encoding', 'connection', 'x-frame-options', 'content-disposition', 'set-cookie', 'x-content-type-options']
            response_headers = {}
            for k, v in remote_headers.items():
                if k.lower() in excluded:
                    continue
                response_headers[k] = v
            # Si el recurso parece un PDF y no se devolvió content-type, forzarlo
            ct_keys = [k for k in remote_headers.keys() if k.lower() == 'content-type']
            if not ct_keys:
                if url.lower().endswith('.pdf'):
                    response_headers['Content-Type'] = 'application/pdf'

            # Forzar inline para PDFs para que el navegador los muestre incrustados
            try:
                if response_headers.get('Content-Type', '').lower().startswith('application/pdf'):
                    response_headers['Content-Disposition'] = 'inline'
            except (KeyError, ValueError, OSError) as exc:
                logging.exception('proxy: error while forcing PDF disposition: %s', exc)

            response_headers['Access-Control-Allow-Origin'] = '*'

            def stream():
                try:
                    chunk_size = 8192
                    while True:
                        chunk = resp.read(chunk_size)
                        if not chunk:
                            break
                        yield chunk
                except GeneratorExit:
                    return

            return Response(stream_with_context(stream()), status=status, headers=response_headers)

    except urllib.error.HTTPError as e:
        try:
            detail = e.read(1000).decode('utf-8', errors='replace')
        except (OSError, ValueError):
            detail = '<no body>'
        return jsonify({'error': 'upstream error', 'status': e.code, 'detail': detail}), e.code
    except (urllib.error.URLError, OSError, ValueError) as e:
        logging.exception('proxy: unexpected error: %s', e)
        return jsonify({'error': 'proxy error', 'detail': str(e)}), 500


# --- Comentarios y reacciones persistentes ---
def _ensure_anon():
    # Asegura que la sesión tenga un anonymous id para usuarios no autenticados
    anon = session.get('anon_id')
    if not anon:
        anon = uuid.uuid4().hex
        session['anon_id'] = anon
    return anon


@bp.route('/article/<int:article_id>/comments', methods=['GET'])
def get_comments(article_id):
    comments = Comment.query.filter_by(article_id=article_id).order_by(Comment.created_at.desc()).all()
    return jsonify([c.to_dict() for c in comments])


@bp.route('/article/<int:article_id>/comments', methods=['POST'])
def post_comment(article_id):
    data = request.get_json() or {}
    text = data.get('text')
    if not text or not text.strip():
        return jsonify({'error': 'El texto del comentario es requerido'}), 400
    # Requerir que el usuario haya iniciado sesión para comentar
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Debe iniciar sesión para comentar'}), 403

    username = None
    try:
        from models import User
        u = User.query.get(user_id)
        if u:
            username = u.username
    except (ImportError, SQLAlchemyError):
        pass
    username = username or data.get('username') or 'Usuario'

    c = Comment(article_id=article_id, user_id=user_id, anonymous_id=None, username=username, text=text)
    db.session.add(c)
    db.session.commit()
    return jsonify(c.to_dict()), 201


@bp.route('/article/<int:article_id>/comments/<int:comment_id>', methods=['PUT'])
def edit_comment(article_id, comment_id):
    c = Comment.query.get(comment_id)
    if not c or c.article_id != article_id:
        return jsonify({'error': 'Comentario no encontrado'}), 404

    # Solo el autor (usuario autenticado) puede editar
    user_id = session.get('user_id')
    if not user_id or not c.user_id or c.user_id != user_id:
        return jsonify({'error': 'No autorizado'}), 403

    data = request.get_json() or {}
    text = data.get('text')
    if not text or not text.strip():
        return jsonify({'error': 'El texto del comentario es requerido'}), 400

    c.text = text
    c.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(c.to_dict())


@bp.route('/article/<int:article_id>/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(article_id, comment_id):
    c = Comment.query.get(comment_id)
    if not c or c.article_id != article_id:
        return jsonify({'error': 'Comentario no encontrado'}), 404
    # Solo el autor (usuario autenticado) puede eliminar
    user_id = session.get('user_id')
    if not user_id or not c.user_id or c.user_id != user_id:
        return jsonify({'error': 'No autorizado'}), 403

    db.session.delete(c)
    db.session.commit()
    return jsonify({'success': True})


@bp.route('/article/<int:article_id>/reactions', methods=['GET'])
def get_reactions(article_id):
    # Retorna conteo de reacciones y la reacción del usuario actual (si existe)
    counts = db.session.query(Reaction.type, db.func.count(Reaction.id)).filter_by(article_id=article_id).group_by(Reaction.type).all()
    res = {'heart': 0, 'like': 0, 'laugh': 0}
    for t, cnt in counts:
        if t in res:
            res[t] = cnt

    user_id = session.get('user_id')
    user_reaction = None
    if user_id:
        q = Reaction.query.filter_by(article_id=article_id, user_id=user_id)
        r = q.first()
        if r:
            user_reaction = r.type

    return jsonify({'counts': res, 'user_reaction': user_reaction})


@bp.route('/article/<int:article_id>/reactions', methods=['POST'])
def post_reaction(article_id):
    data = request.get_json() or {}
    rtype = data.get('type')
    if rtype not in ('like', 'laugh', 'heart'):
        return jsonify({'error': 'Tipo de reacción inválido'}), 400
    # Requerir que el usuario haya iniciado sesión para reaccionar
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Debe iniciar sesión para reaccionar'}), 403

    # Buscar reacción existente del mismo usuario
    q = Reaction.query.filter_by(article_id=article_id, user_id=user_id)
    existing = q.first()
    article = Article.query.get(article_id)
    if existing:
        old_type = existing.type
        if old_type == rtype:
            # quitar reacción
            db.session.delete(existing)
            db.session.commit()
            # remove corresponding notification(s)
            try:
                if article and article.user_id:
                    Notification.query.filter_by(user_id=article.user_id, actor_id=user_id, type='reaction_article', article_id=article.id).delete()
                    db.session.commit()
            except SQLAlchemyError:
                db.session.rollback()
        else:
            # cambiar tipo
            existing.type = rtype
            db.session.commit()
            # remove old notification(s) and create an updated one
            try:
                if article and article.user_id:
                    Notification.query.filter_by(user_id=article.user_id, actor_id=user_id, type='reaction_article', article_id=article.id).delete()
                    db.session.commit()
                    notif = Notification(user_id=article.user_id, actor_id=user_id, type='reaction_article', article_id=article.id, reaction_type=rtype)
                    db.session.add(notif)
                    db.session.commit()
            except SQLAlchemyError:
                db.session.rollback()
    else:
        newr = Reaction(article_id=article_id, user_id=user_id, anonymous_id=None, type=rtype)
        db.session.add(newr)
        db.session.commit()
        # notify article author if actor != author
        try:
            if article and article.user_id and article.user_id != user_id:
                # ensure no duplicate notifications
                Notification.query.filter_by(user_id=article.user_id, actor_id=user_id, type='reaction_article', article_id=article.id).delete()
                db.session.commit()
                notif = Notification(user_id=article.user_id, actor_id=user_id, type='reaction_article', article_id=article.id, reaction_type=rtype)
                db.session.add(notif)
                db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()

    # devolver conteos actualizados
    counts = db.session.query(Reaction.type, db.func.count(Reaction.id)).filter_by(article_id=article_id).group_by(Reaction.type).all()
    res = {'heart': 0, 'like': 0, 'laugh': 0}
    for t, cnt in counts:
        if t in res:
            res[t] = cnt
    return jsonify({'counts': res})


@bp.route('/article/<int:article_id>/comments/<int:comment_id>/reactions', methods=['GET'])
def get_comment_reactions(article_id, comment_id):
    # conteos por tipo
    counts = db.session.query(CommentReaction.type, db.func.count(CommentReaction.id)).filter_by(comment_id=comment_id).group_by(CommentReaction.type).all()
    res = {'heart': 0, 'like': 0, 'laugh': 0}
    for t, cnt in counts:
        if t in res:
            res[t] = cnt

    user_reaction = None
    user_id = session.get('user_id')
    if user_id:
        r = CommentReaction.query.filter_by(comment_id=comment_id, user_id=user_id).first()
        if r:
            user_reaction = r.type

    # Ensure the comment belongs to the article (use article_id to avoid unused-arg warnings)
    try:
        c = Comment.query.get(comment_id)
        if not c or c.article_id != article_id:
            return jsonify({'error': 'Comentario no encontrado para este artículo'}), 404
    except SQLAlchemyError:
        logging.exception('get_comment_reactions: failed to validate comment ownership')

    return jsonify({'counts': res, 'user_reaction': user_reaction})


@bp.route('/article/<int:article_id>/comments/<int:comment_id>/reactions', methods=['POST'])
def post_comment_reaction(article_id, comment_id):
    data = request.get_json() or {}
    rtype = data.get('type')
    if rtype not in ('heart','like', 'laugh'):
        return jsonify({'error': 'Tipo de reacción inválido'}), 400

    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Debe iniciar sesión para reaccionar'}), 403

    # Asegurar que el comentario existe y pertenece al artículo
    c = Comment.query.get(comment_id)
    if not c or c.article_id != article_id:
        return jsonify({'error': 'Comentario no encontrado'}), 404

    q = CommentReaction.query.filter_by(comment_id=comment_id, user_id=user_id)
    existing = q.first()
    if existing:
        if existing.type == rtype:
            db.session.delete(existing)
            db.session.commit()
        else:
            existing.type = rtype
            db.session.commit()
            # notify comment author if actor != recipient
            try:
                c = Comment.query.get(comment_id)
                if c and c.user_id and c.user_id != user_id:
                    # remove previous comment reaction notifications from this actor
                    Notification.query.filter_by(user_id=c.user_id, actor_id=user_id, type='reaction_comment', comment_id=comment_id).delete()
                    db.session.commit()
                    # add updated notification
                    notif = Notification(user_id=c.user_id, actor_id=user_id, type='reaction_comment', comment_id=comment_id, reaction_type=rtype, article_id=article_id)
                    db.session.add(notif)
                    db.session.commit()
            except SQLAlchemyError:
                db.session.rollback()
    else:
        nr = CommentReaction(comment_id=comment_id, user_id=user_id, type=rtype)
        db.session.add(nr)
        db.session.commit()
        # notify comment author if actor != recipient
        try:
            c = Comment.query.get(comment_id)
            if c and c.user_id and c.user_id != user_id:
                # remove any previous notifications from this actor on this comment
                Notification.query.filter_by(user_id=c.user_id, actor_id=user_id, type='reaction_comment', comment_id=comment_id).delete()
                db.session.commit()
                notif = Notification(user_id=c.user_id, actor_id=user_id, type='reaction_comment', comment_id=comment_id, reaction_type=rtype, article_id=article_id)
                db.session.add(notif)
                db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()

    counts = db.session.query(CommentReaction.type, db.func.count(CommentReaction.id)).filter_by(comment_id=comment_id).group_by(CommentReaction.type).all()
    res = {'like': 0, 'laugh': 0, 'heart': 0}
    for t, cnt in counts:
        if t in res:
            res[t] = cnt
    return jsonify({'counts': res})


# --- Endpoints de notificaciones ---
@bp.route('/notifications', methods=['GET'])
def get_notifications():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuario no autenticado'}), 401
    # Fetch notifications and enrich with actor username and article title for better UI
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    enriched = []
    from models.user import User
    for n in notifs:
        actor_username = None
        article_title = None
        actor_photo = None
        article_thumb = None
        try:
            if n.actor_id:
                a = User.query.get(n.actor_id)
                if a:
                    actor_username = a.username
                    try:
                        actor_photo = a.photo_url
                    except AttributeError:
                        actor_photo = None
        except SQLAlchemyError:
            actor_username = None
        try:
            if n.article_id:
                art = Article.query.get(n.article_id)
                if art:
                    article_title = art.title
                    try:
                        article_thumb = art.image_url
                    except AttributeError:
                        article_thumb = None
        except SQLAlchemyError:
            article_title = None
        d = n.to_dict()
        d['actor_username'] = actor_username
        d['actor_photo_url'] = actor_photo
        d['article_title'] = article_title
        d['article_thumbnail_url'] = article_thumb
        enriched.append(d)
    return jsonify(enriched)


@bp.route('/notifications/unread_count', methods=['GET'])
def notifications_unread_count():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuario no autenticado'}), 401
    cnt = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({'unread': cnt})


@bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuario no autenticado'}), 401
    n = Notification.query.get(notification_id)
    if not n or n.user_id != user_id:
        return jsonify({'error': 'Notificación no encontrada'}), 404
    n.is_read = True
    db.session.commit()
    return jsonify(n.to_dict())


@bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuario no autenticado'}), 401
    n = Notification.query.get(notification_id)
    if not n or n.user_id != user_id:
        return jsonify({'error': 'Notificación no encontrada'}), 404
    db.session.delete(n)
    db.session.commit()
    return jsonify({'success': True})


@bp.route('/article/<int:article_id>/upload_pdf', methods=['POST'])
def upload_pdf_for_article(article_id):
    """Upload a PDF file for an article, save it under static/uploads/pdfs/,
    update article.pdf_url to the hosted static URL and generate a thumbnail.
    Only the article owner can upload.
    """
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Usuario no autenticado'}), 401

    article = Article.query.get_or_404(article_id)
    if article.user_id != user_id:
        return jsonify({'error': 'No autorizado'}), 403

    if 'file' not in request.files:
        return jsonify({'error': 'Campo file faltante'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'Nombre de archivo inválido'}), 400

    filename = secure_filename(f.filename)
    upload_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads', 'pdfs')
    os.makedirs(upload_dir, exist_ok=True)
    save_path = os.path.join(upload_dir, filename)
    f.save(save_path)

    # Build public URL for static file
    from flask import url_for
    public_url = url_for('static', filename=f'uploads/pdfs/{filename}', _external=False)

    # Update article and try to generate thumbnail
    try:
        article.pdf_url = public_url
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'No se pudo guardar en DB: ' + str(e)}), 500

    # Generate thumbnail from saved file by reading bytes and calling generator
    try:
        with open(save_path, 'rb') as fh:
            b = fh.read()
            data_url = 'data:application/pdf;base64,' + base64.b64encode(b).decode('ascii')
            thumb = _generate_pdf_thumbnail_dataurl(data_url, target_width=800)
            if thumb:
                article.image_url = thumb
                db.session.commit()
    except (OSError, ValueError, SQLAlchemyError) as exc:
        db.session.rollback()
        logging.exception('upload_pdf_for_article: thumbnail generation or DB save failed: %s', exc)

    return jsonify({'pdf_url': article.pdf_url, 'image_url': article.image_url}), 200