#!/usr/bin/env python3
"""
Script para arreglar el archivo .env
"""

# API Key correcta (sin saltos de línea)
correct_content = "GOOGLE_API_KEY=AIzaSyBk3UHq-7bRtkuE2xb-Nhw9Gg5U4nAzoeo"

# Escribir el archivo .env correctamente
with open('.env', 'w', encoding='utf-8') as f:
    f.write(correct_content)

print("✅ Archivo .env arreglado correctamente")

# Verificar
with open('.env', 'r', encoding='utf-8') as f:
    content = f.read()
    print(f"Contenido verificado: {repr(content)}")
    
    if 'GOOGLE_API_KEY=' in content and len(content) > 40:
        print("✅ API key parece completa")
    else:
        print("❌ API key incompleta")
