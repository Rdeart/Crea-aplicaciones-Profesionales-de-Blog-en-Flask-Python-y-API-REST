from models import db


class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    article_id = db.Column(db.Integer, db.ForeignKey('article.id'), nullable=False)

    __table_args__ = (db.UniqueConstraint('user_id', 'article_id', name='uix_user_article'),)

    def __repr__(self):
        return f'<Favorite user:{self.user_id} article:{self.article_id}>'
