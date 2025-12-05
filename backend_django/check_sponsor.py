import urllib.request
import json

URL = "http://192.168.193.177:8000/api"

def check_sponsor():
    try:
        # Get Child
        req = urllib.request.Request(f"{URL}/ninos/N009/", headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            nino = json.loads(response.read().decode('utf-8'))
            
        padrino_id = nino.get('id_padrino_actual')
        print(f"Child N009 is sponsored by ID: {padrino_id}")
        
        if padrino_id:
            # Get Padrino details
            req = urllib.request.Request(f"{URL}/padrinos/{padrino_id}/", headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req) as response:
                padrino = json.loads(response.read().decode('utf-8'))
                print(f"Padrino Name: {padrino.get('nombre')}")
                print(f"Padrino Email: {padrino.get('email')}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_sponsor()
