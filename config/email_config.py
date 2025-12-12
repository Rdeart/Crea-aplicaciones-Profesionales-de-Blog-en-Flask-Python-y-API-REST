# Configuración de correo electrónico
class EmailConfig:
    # Configuración para desarrollo (usa Gmail SMTP)
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    
    # CONFIGURA AQUÍ TUS CREDENCIALES REALES
    MAIL_USERNAME = 'a.audiovisual@curelatam.com'  # Tu email
    MAIL_PASSWORD = 'tu-contraseña-de-aplicación'  # Cambiar por tu contraseña de aplicación de Google
    MAIL_DEFAULT_SENDER = 'a.audiovisual@curelatam.com'  # Tu email
    
    # URL base para los enlaces de recuperación
    BASE_URL = 'http://localhost:3000'  # Cambiar en producción
