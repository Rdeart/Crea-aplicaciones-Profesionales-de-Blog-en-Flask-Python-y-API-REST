from werkzeug.security import generate_password_hash, check_password_hash
from models import db
import datetime





class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(120), nullable=True)
    last_name = db.Column(db.String(120), nullable=True)
    area = db.Column(db.String(150), nullable=True)
    photo_url = db.Column(db.Text, nullable=True)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    # Nuevos campos para verificación de email
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_token = db.Column(db.String(255), nullable=True)
    verification_token_expires = db.Column(db.DateTime, nullable=True)
    email_verified_at = db.Column(db.DateTime, nullable=True)
    
    articles = db.relationship('Article', backref='author', lazy=True)


    def set_password(self, password):
        # Use an explicit method compatible with this Python/OpenSSL build
        # Default in newer Werkzeug is "scrypt", which may not be available.
        self.password = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password, password)    
    
    def __repr__(self):
        return f'<User {self.username}>'