from flask_sqlalchemy import SQLAlchemy



db = SQLAlchemy()

from .user import User
from .article import Article
from .favorite import Favorite
from .comment import Comment
from .reaction import Reaction
from .comment_reaction import CommentReaction
from .notification import Notification

__all__ = ['User', 'Article', 'Favorite', 'Comment', 'Reaction', 'CommentReaction', 'Notification']