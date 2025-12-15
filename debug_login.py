import sqlite3
import hashlib

# Verificar datos del usuario
conn = sqlite3.connect('instance/blog.db')
cursor = conn.cursor()

cursor.execute('SELECT username, email, password, is_verified FROM user WHERE email = "rdeartperez@gmail.com"')
user = cursor.fetchone()

if user:
    print(f'Usuario encontrado:')
    print(f'Username: {user[0]}')
    print(f'Email: {user[1]}')
    print(f'Password (hash): {user[2]}')
    print(f'Verificado: {user[3]}')
    
    # Verificar hash de la contraseña "12345"
    test_password = "12345"
    test_hash = hashlib.sha256(test_password.encode()).hexdigest()
    print(f'\nContraseña de prueba: {test_password}')
    print(f'Hash generado: {test_hash}')
    print(f'Hash coincide: {test_hash == user[2]}')
    
    if test_hash != user[2]:
        print('\n¡ERROR! Los hashes no coinciden. Actualizando contraseña...')
        new_hash = hashlib.sha256("12345".encode()).hexdigest()
        cursor.execute('UPDATE user SET password = ? WHERE email = "rdeartperez@gmail.com"', (new_hash,))
        conn.commit()
        print('Contraseña actualizada en la base de datos')
        
        # Verificar nuevamente
        cursor.execute('SELECT password FROM user WHERE email = "rdeartperez@gmail.com"')
        updated_hash = cursor.fetchone()[0]
        print(f'Nuevo hash en BD: {updated_hash}')
        print(f'Coincide ahora: {new_hash == updated_hash}')
else:
    print('Usuario no encontrado')

conn.close()
