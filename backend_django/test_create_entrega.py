import requests
import json
from datetime import date

# Test creating an entrega via API
url = "http://192.168.193.177:8000/api/entregas/"

data = {
    "id_apadrinamiento": "AP947973",
    "descripcion_regalo": "Regalo de prueba DEBUG",
    "fecha_programada": str(date.today()),
    "fecha_entrega_real": str(date.today()),
    "estado_entrega": "Entregado",
    "observaciones": "Test desde script Python",
    "id_punto_entrega": "PE002"
}

print(f"POSTing to {url}")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, json=data)
    print(f"\nStatus: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        result = response.json()
        print(f"\n✅ Created: {result.get('id_entrega')}")
        
        # Now check if it was saved
        print("\nChecking if it persisted...")
        get_response = requests.get(url)
        entregas = get_response.json()
        print(f"Total entregas: {len(entregas)}")
        for e in entregas:
            print(f"  - {e['id_entrega']}: {e['descripcion_regalo']}")
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.json())
        
except Exception as e:
    print(f"❌ Exception: {e}")
