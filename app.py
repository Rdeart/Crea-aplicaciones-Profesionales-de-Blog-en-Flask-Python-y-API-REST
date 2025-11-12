from flask import Flask, request, jsonify, session
from sqlalchemy import text
from models import article
from models.article import  Article
from models.user import User
from models import db
from flask_cors import CORS


app = Flask(__name__)


CORS(app, 
     supports_credentials=True,
     origins=["http://localhost:3000"],
     allow_headers=["Content-Type"],
     expose_headers=["Set-Cookie"],
     methods=["GET", "POST", "OPTIONS", "DELETE"])

app.secret_key = 'rdeart123'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///blog.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

#engine = create_engine('sqlite:///blog.db', echo=True)

#Base.metadata.create_all(engine)

db.init_app(app)


    
with app.app_context():
    db.create_all()
    # Corregir valores NULL en is_favorite
    db.session.execute(text("UPDATE article SET is_favorite = 0 WHERE is_favorite IS NULL;"))
    db.session.commit()
    
    
# Ruta inicial
@app.route('/')
def home():
    return 'Hola, Flask!'



@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first() is not None:
        return jsonify({
            'error': 'El email ya esta registrado'
        }), 400
        
    if User.query.filter_by(username=data['username']).first() is not None:
        return jsonify({
            'error': 'El nombre de usuario ya esta registrado'
        }), 400


    new_user = User(username=data['username'], email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({
        'message': f'Usuario {new_user.username} registrado con exito'
    }), 201



@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and user.check_password(data['password']):
        session['user_id'] = user.id
        print(session)

        return jsonify({'message': 'Inicio de sesion exitoso'}), 200
    else:
        return jsonify({'error': 'Credenciales invalidas'}), 401
    



@app.route('/check-auth', methods=['GET'])
def check_auth():
    user_id = session.get('user_id')

    if user_id:
        user = User.query.get(user_id)
        if user:
            return jsonify({
                'authenticated': True,
                'username': user.username}), 200
        else:
            return jsonify({
                'authenticated': False}), 401  
    else:
        return jsonify({
            'authenticated': False}), 401      




@app.route('/logout', methods=['POST'])
def logout_user():
    session.pop('user_id', None)    
    return jsonify({'message': 'Sesion cerrada con exito'})


@app.route('/favorites/<int:article_id>', methods=['POST'])
def toggle_favorite(article_id):
    data = request.get_json()
    is_favorite = data.get('is_favorite')
    if is_favorite is None:
        is_favorite = False  # Valor por defecto si no se envía

    article = Article.query.get_or_404(article_id)
    article.is_favorite = is_favorite

    db.session.commit()

    return jsonify({'message': 'Estado de favorito actualizado'}), 201

@app.route ('/favorites', methods=['GET'])
def get_favorites():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'El usuario no está autenticado o el ID de usuario no está en la sesión'}), 401
    

    favorite_articles = Article.query.filter_by(user_id=user_id, is_favorite=True).all()
    articles_list =[{
        'id': article.id,
        'title': article.title,
        'content': article.content,
        'image_url': article.image_url,
    'created_at': article.created_at.isoformat(),
        'is_favorite': article.is_favorite
        
    } for article in favorite_articles]

    return jsonify(articles_list), 200



# Obtenemos todos los articulos
@app.route('/articles', methods=['GET']) # GET es para obtener
def get_articles():
    articles = Article.query.all()
    return jsonify([{
        'id': article.id,
        'title': article.title,
        'content': article.content,
        'image_url': article.image_url,
        'author': article.author.username,
        'created_at': article.created_at.strftime('%d-%m-%Y')
    } for article in articles])


#Creamos un articulo
@app.route('/articles', methods=['POST'])  # POST es para enviar
def create_article():
    data = request.get_json()
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'error': 'El usuario no está autenticado o el ID de usuario no está en la sesión'}), 401
    new_article = Article(
        title=data['title'], 
        content=data['content'],
        image_url=data['image_url'],
        user_id = user_id
        )
    db.session.add(new_article)
    db.session.commit()       
    
    return  jsonify({
        'id': new_article.id,
        'title': new_article.title,
        'content': new_article.content,
        'image_url': new_article.image_url,
        'author': new_article.author.username
    }), 201


# Actualizamos un articulo
@app.route('/articles/<int:article_id>', methods=['PUT'])  # PUT es para actualizar
def update_article(article_id):
    article = Article.query.get_or_404(article_id)
    data = request.get_json()
    article.title = data['title']
    article.content = data['content']
    db.session.commit()

    return  jsonify({
        'id': article.id,
        'title': article.title,
        'content': article.content
    })



# Eliminamos  un articulo
@app.route('/articles/<int:article_id>', methods=['DELETE']) # DELETE es para eliminar
def delete_article(article_id):
    article = Article.query.get_or_404(article_id)
    db.session.delete(article)
    db.session.commit()
    return jsonify({
        'message': f'Articulo eliminado con exito. Se elimino {article.title}'
    }), 200





# Obtenemos un articulo
@app.route('/article/<int:article_id>', methods=['GET'])
def view_article(article_id):
    article = Article.query.get_or_404(article_id)
    return jsonify({
        'id': article.id,
        'title': article.title,
        'content': article.content,
        'image_url': article.image_url,
        'author': article.author.username,
        'created_at': article.created_at.strftime('%d-%m-%Y'),
        'is_favorite': article.is_favorite
    })



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)



