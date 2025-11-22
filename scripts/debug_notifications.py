import sys
import os
import logging
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
from models import db, Notification, User

app = create_app()
with app.app_context():
    try:
        total = db.session.query(Notification).count()
        print('Total notifications:', total)
        qs = Notification.query.order_by(Notification.created_at.desc()).limit(10).all()
        for n in qs:
            actor = None
            if n.actor_id:
                u = User.query.get(n.actor_id)
                actor = u.username if u else str(n.actor_id)
            print(f"id={n.id} user_id={n.user_id} actor={actor} type={n.type} article={n.article_id} comment={n.comment_id} reaction={n.reaction_type} is_read={n.is_read} created={n.created_at}")
    except Exception:
        logging.exception('Error querying notifications')
