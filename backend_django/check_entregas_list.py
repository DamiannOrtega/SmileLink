import urllib.request
import json

URL = "http://192.168.193.177:8000/api/entregas/"

def check_entregas():
    print(f"Fetching {URL}...")
    try:
        req = urllib.request.Request(URL, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
        print(f"Status: {response.status}")
        print(f"Count: {len(data)}")
        
        found = False
        for entrega in data:
            print(f"- {entrega['id_entrega']}: {entrega['descripcion_regalo']} ({entrega['estado_entrega']})")
            if entrega['id_entrega'] == 'E001' or 'Patines' in entrega.get('descripcion_regalo', ''):
                found = True
                
        if found:
            print("\nSUCCESS: The created delivery is present in the list.")
        else:
            print("\nFAILURE: Created delivery NOT found in the list.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_entregas()
