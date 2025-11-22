from datetime import datetime
from . import db


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    # recipient: the user who should receive the notification
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # actor: the user who caused the notification (can be null for system)
    actor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    # type: 'favorite', 'reaction_article', 'reaction_comment'
    type = db.Column(db.String(50), nullable=False)
    article_id = db.Column(db.Integer, db.ForeignKey('article.id'), nullable=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=True)
    reaction_type = db.Column(db.String(20), nullable=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'actor_id': self.actor_id,
            'type': self.type,
            'article_id': self.article_id,
            'comment_id': self.comment_id,
            'reaction_type': self.reaction_type,
            'is_read': self.is_read,
            'created_at': self.created_at.strftime('%d-%m-%Y %H:%M:%S') if self.created_at else None
        }
