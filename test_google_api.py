import requests
import os

payload = {
    'contents': [{'role': 'user', 'parts': [{'text': 'Hola'}]}],
    'generationConfig': {'temperature': 0.2, 'maxOutputTokens': 800}
}

try:
    resp = requests.post(
        f'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={os.environ.get("GOOGLE_API_KEY")}',
        headers={'Content-Type': 'application/json'},
        json=payload,
        timeout=30
    )
    print('Status:', resp.status_code)
    print('Response:', resp.text)
except Exception as e:
    print('Error:', str(e))
