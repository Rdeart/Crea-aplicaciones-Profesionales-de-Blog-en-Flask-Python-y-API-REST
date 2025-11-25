#!/usr/bin/env python3
"""
Script para probar el chatbot con la configuración actual
"""
import os
import sys
import json

# Cargar variables de entorno
try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
    print("✅ Variables de entorno cargadas con dotenv")
except ImportError:
    print("⚠️ dotenv no disponible, usando variables existentes")

# Verificar API key
api_key = os.environ.get('GOOGLE_API_KEY')
if api_key:
    print(f"✅ API Key encontrada (longitud: {len(api_key)})")
else:
    print("❌ API Key no encontrada")
    sys.exit(1)

# Probar la función del chatbot
sys.path.append('.')
from routes.chat_routes import _call_google_and_respond

# Mensaje de prueba
test_messages = [
    {'role': 'system', 'content': 'Eres un asistente de prueba'},
    {'role': 'user', 'content': 'Hola, esto es una prueba'}
]

print("\n🧪 Probando el chatbot...")
print("=" * 40)

try:
    # Simular llamada a la función
    result = _call_google_and_respond(test_messages)
    
    if hasattr(result, 'status_code'):
        if result.status_code == 200:
            print("✅ Chatbot funcionando correctamente")
            data = result.get_json()
            if 'reply' in data:
                print(f"✅ Respuesta recibida: {data['reply'][:100]}...")
        else:
            print(f"❌ Error en chatbot: {result.status_code}")
            data = result.get_json()
            print(f"   Detalle: {data}")
    else:
        print("✅ Chatbot respondió (formato no estándar)")
        
except Exception as e:
    print(f"❌ Error probando el chatbot: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 Prueba completada")
