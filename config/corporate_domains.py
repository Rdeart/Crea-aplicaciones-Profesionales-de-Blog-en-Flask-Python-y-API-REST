# Configuración de dominios corporativos permitidos
CORPORATE_DOMAINS = [
    'curelatam.com',
    # Agregar aquí más dominios corporativos según sea necesario
]

def is_corporate_email(email):
    """
    Verifica si el email pertenece a un dominio corporativo permitido
    """
    if not email or '@' not in email:
        return False
    
    domain = email.split('@')[1].lower()
    return domain in CORPORATE_DOMAINS
