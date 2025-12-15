# Configuración de Email para Verificación de Usuarios

## Problema Actual
Los usuarios se registran correctamente pero no reciben el email de verificación porque las credenciales de Gmail SMTP no están configuradas.

## Solución - Pasos a Seguir:

### 1. Crear Contraseña de Aplicación en Google
1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Ve a "Seguridad" → "Verificación en dos pasos" (debe estar activada)
3. Ve a "Contraseñas de aplicaciones"
4. Crea una nueva contraseña de aplicación:
   - Nombre: "Blog CURELATAM"
   - Copia la contraseña generada (ejemplo: `abcd efgh ijkl mnop`)

### 2. Configurar en el Proyecto
Edita el archivo `config/email_config.py`:

```python
MAIL_PASSWORD = 'contraseña-de-aplicación-generada'  # Reemplazar con la contraseña real
```

### 3. Reiniciar Servidor
```bash
python run.py
```

## Verificación
- El usuario recibe email de verificación
- Puede hacer clic en el enlace para verificar su cuenta
- Después de verificar, puede iniciar sesión normalmente

## Notas Importantes
- La contraseña de aplicación es diferente a tu contraseña normal de Gmail
- Solo necesitas configurarla una vez
- Guarda la contraseña en un lugar seguro
- No compartas esta contraseña en repositorios públicos
