import sqlite3
import hashlib
import secrets

# Conectar a la base de datos
conn = sqlite3.connect('instance/blog.db')
cursor = conn.cursor()

# Datos del usuario
email = 'rdeartperez@gmail.com'
username = 'rdeartperez'
password = '12345'

# Generar hash de la contraseña
password_hash = hashlib.sha256(password.encode()).hexdigest()

# Generar token de verificación
verification_token = secrets.token_urlsafe(32)

# Verificar si el usuario ya existe
cursor.execute('SELECT id FROM user WHERE email = ?', (email,))
existing_user = cursor.fetchone()

if existing_user:
    print(f'Usuario con email {email} ya existe. Actualizando contraseña...')
    cursor.execute('UPDATE user SET password = ?, verification_token = ?, is_verified = 0 WHERE email = ?', 
                  (password_hash, verification_token, email))
else:
    print(f'Creando nuevo usuario para {email}...')
    cursor.execute('INSERT INTO user (username, email, password, is_verified, verification_token) VALUES (?, ?, ?, ?, ?)',
                  (username, email, password_hash, 0, verification_token))

conn.commit()
conn.close()

print(f'Usuario {username} creado/actualizado con contraseña: {password}')
print(f'Token de verificación: {verification_token}')
print('Ahora puedes iniciar sesión con:')
print(f'Email: {email}')
print(f'Contraseña: {password}')
