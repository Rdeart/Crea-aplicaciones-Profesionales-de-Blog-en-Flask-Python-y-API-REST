from datetime import datetime
from models import db


class CommentReaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(32), nullable=False)  # 'like' o 'laugh'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('comment_id', 'user_id', 'type', name='uix_comment_user_type'),
    )

    def __repr__(self):
        return f'<CommentReaction {self.type} comment:{self.comment_id} user:{self.user_id}>'
