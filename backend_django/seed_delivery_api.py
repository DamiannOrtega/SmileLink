import urllib.request
import urllib.parse
import json
import sys
import datetime
import socket

# Try specific IP first as per config, then localhost
URLS_TO_TRY = [
    "http://192.168.193.177:8000/api",
    "http://127.0.0.1:8000/api",
    "http://localhost:8000/api"
]

def get_working_url():
    for url in URLS_TO_TRY:
        try:
            print(f"Testing connectivity to {url}...")
            # Try a simple GET to check availability
            req = urllib.request.Request(f"{url}/ninos/", headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=2) as response:
                if response.status == 200:
                    print(f"Connected to {url}")
                    return url
        except Exception as e:
            print(f"Failed to connect to {url}: {e}")
    return None

BASE_URL = None

def make_request(method, endpoint, data=None):
    if not BASE_URL:
        return None
        
    url = f"{BASE_URL}/{endpoint}"
    headers = {'Content-Type': 'application/json'}
    
    if data:
        json_data = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=json_data, headers=headers, method=method)
    else:
        req = urllib.request.Request(url, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status >= 200 and response.status < 300:
                return json.loads(response.read().decode('utf-8'))
            return None
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code} for {method} {url}: {e.read().decode('utf-8')}")
        return None
    except urllib.error.URLError as e:
        print(f"Connection Error for {url}: {e.reason}")
        return None

def seed_api():
    global BASE_URL
    BASE_URL = get_working_url()
    
    if not BASE_URL:
        print("Could not connect to any API endpoint. Please ensure Django server is running.")
        return

    nino_id = "N009"
    print(f"Checking Child {nino_id} via API...")
    
    # 1. Get Child
    nino = make_request("GET", f"ninos/{nino_id}/")
    
    if not nino:
        print(f"Child {nino_id} not found via API. Cannot proceed.")
        return

    print(f"Child found: {nino.get('nombre')}")
    
    # 2. Ensure Sponsored
    if nino.get('estado_apadrinamiento') != 'Apadrinado':
        print("Child not sponsored. Updating...")
        
        # Get a padrino
        padrinos = make_request("GET", "padrinos/")
        if not padrinos:
             # Create dummy padrino
             print("Creating dummy padrino...")
             padrino_data = {
                 "nombre": "Padrino Auto",
                 "email": "auto@test.com",
                 "password_hash": "dummy", 
                 "direccion": "Test Addr",
                 "telefono": "123456"
             }
             padrino = make_request("POST", "padrinos/", padrino_data)
        else:
             padrino = padrinos[0]
        
        padrino_id = padrino['id_padrino']
        
        # Update child
        update_data = {
            "estado_apadrinamiento": "Apadrinado",
            "id_padrino_actual": padrino_id,
            "necesidades": nino.get('necesidades', []) 
        }
        make_request("PATCH", f"ninos/{nino_id}/", update_data)
        print("Child updated to Apadrinado.")
    else:
        padrino_id = nino['id_padrino_actual']

    # 3. Find Active Apadrinamiento
    print("Checking Apadrinamientos...")
    apadrinamientos = make_request("GET", "apadrinamientos/")
    active_apad = None
    
    if apadrinamientos:
        for ap in apadrinamientos:
            if ap.get('id_nino') == nino_id and ap.get('estado_apadrinamiento_registro') == 'Activo':
                active_apad = ap
                break
    
    if not active_apad:
        print("Creating Apadrinamiento...")
        apad_data = {
            "id_padrino": padrino_id,
            "id_nino": nino_id,
            "fecha_inicio": datetime.date.today().isoformat(),
            "tipo_apadrinamiento": "Asignación Automática",
            "estado_apadrinamiento_registro": "Activo"
        }
        active_apad = make_request("POST", "apadrinamientos/", apad_data)
        print(f"Apadrinamiento created: {active_apad['id_apadrinamiento']}")
    else:
        print(f"Found active Apadrinamiento: {active_apad['id_apadrinamiento']}")

    # 4. Create Pending Delivery
    print("Creating Pending Delivery...")
    
    # Get Point
    puntos = make_request("GET", "puntos-entrega/")
    if not puntos:
        punto_data = {
            "nombre_punto": "Punto Test",
            "direccion_fisica": "Test St 123",
            "latitud": 10.0, "longitud": 10.0,
            "estado_punto": "Activo"
        }
        punto = make_request("POST", "puntos-entrega/", punto_data)
        punto_id = punto['id_punto_entrega']
    else:
        punto_id = puntos[0]['id_punto_entrega']
        
    entrega_data = {
        "id_apadrinamiento": active_apad['id_apadrinamiento'],
        "descripcion_regalo": "Patines Nuevos (API Generated)",
        "fecha_programada": (datetime.date.today() + datetime.timedelta(days=7)).isoformat(),
        "estado_entrega": "Pendiente",
        "id_punto_entrega": punto_id,
        "observaciones": "Auto-generated by seed_delivery_api.py"
    }
    
    entrega = make_request("POST", "entregas/", entrega_data)
    
    if entrega:
        print("SUCCESS! Delivery created via API.")
        print(f"ID: {entrega.get('id_entrega')}")
    else:
        print("Failed to create delivery.")

if __name__ == '__main__':
    seed_api()
