from datetime import datetime
from models import db


class Reaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('article.id'), nullable=False)
    # si está autenticado, guardamos user_id; si no, guardamos anonymous_id
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    anonymous_id = db.Column(db.String(64), nullable=True)
    type = db.Column(db.String(32), nullable=False)  # 'like' o 'laugh'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('article_id', 'user_id', 'anonymous_id', 'type', name='uix_article_user_type'),
    )

    def __repr__(self):
        return f'<Reaction {self.type} article:{self.article_id} user:{self.user_id or self.anonymous_id}>'
