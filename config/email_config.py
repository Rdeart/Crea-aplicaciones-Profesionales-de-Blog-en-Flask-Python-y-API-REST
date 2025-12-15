# Configuración de correo electrónico
class EmailConfig:
    # Configuración para desarrollo (usa Gmail SMTP)
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    
    # CONFIGURA AQUÍ TUS CREDENCIALES REALES
    MAIL_USERNAME = 'rdeartperez@gmail.com'  # REEMPLAZAR con tu Gmail personal
    MAIL_PASSWORD = 'wvwp siqb aknq jugt'  # REEMPLAZAR con tu contraseña de aplicación generada
    MAIL_DEFAULT_SENDER = 'rdeartperez@gmail.com'  # REEMPLAZAR con tu Gmail personal
    
    # URL base para los enlaces de recuperación
    BASE_URL = 'http://localhost:3000'  # Cambiar en producción

# Función para verificar si las credenciales están configuradas
def is_configured():
    """Verificar si las credenciales de email están configuradas"""
    return (EmailConfig.MAIL_USERNAME != 'tu-gmail-personal@gmail.com' and 
            EmailConfig.MAIL_PASSWORD != 'xxxx-xxxx-xxxx-xxxx')
