import sqlite3
from werkzeug.security import generate_password_hash

# Conectar a la base de datos
conn = sqlite3.connect('instance/blog.db')
cursor = conn.cursor()

# Generar hash correcto con werkzeug
correct_password = "12345"
correct_hash = generate_password_hash(correct_password, method='pbkdf2:sha256')

print(f'Contraseña: {correct_password}')
print(f'Hash correcto: {correct_hash}')

# Actualizar el hash en la base de datos
cursor.execute('UPDATE user SET password = ? WHERE email = "rdeartperez@gmail.com"', (correct_hash,))
conn.commit()

# Verificar el cambio
cursor.execute('SELECT password FROM user WHERE email = "rdeartperez@gmail.com"')
stored_hash = cursor.fetchone()[0]
print(f'Hash almacenado: {stored_hash}')
print(f'Coincide: {correct_hash == stored_hash}')

conn.close()
print('¡Contraseña actualizada con el método correcto!')
