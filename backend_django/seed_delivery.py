import os
import django
import sys
import datetime

# Add project root to path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smilelink.settings')
django.setup()

from storage import get_storage_manager

def seed():
    storage = get_storage_manager()
    nino_id = "N009"
    
    print(f"Checking data for {nino_id}...")
    nino = storage.load('ninos', nino_id)
    
    if not nino:
        print(f"Error: Child {nino_id} not found.")
        all_ninos = storage.list_all('ninos')
        if all_ninos:
            print(f"Available IDs: {[n['id_nino'] for n in all_ninos[:5]]}...")
        else:
            print("No children found in database.")
        return

    print(f"Child found: {nino.get('nombre')}")
    
    padrino_id = nino.get('id_padrino_actual')
    
    # 1. Ensure Child is Sponsored
    if nino.get('estado_apadrinamiento') != 'Apadrinado':
         print(f"Child is {nino.get('estado_apadrinamiento')}, forcing 'Apadrinado' status...")
         nino['estado_apadrinamiento'] = 'Apadrinado'
         
         # Find a padrino
         padrinos = storage.list_all('padrinos')
         if not padrinos:
             # Create dummy padrino
             padrino_data = {
                 "id_padrino": "P999",
                 "nombre": "Padrino Test",
                 "email": "test@test.com",
                 "historial_apadrinamiento_ids": []
             }
             storage.save('padrinos', "P999", padrino_data)
             padrino_id = "P999"
         else:
             padrino_id = padrinos[0]['id_padrino']
             
         nino['id_padrino_actual'] = padrino_id
         storage.update('ninos', nino_id, nino)
         print(f"Assigned Padrino {padrino_id}")
    
    # 2. Find or Create Active Apadrinamiento
    apadrinamientos = storage.list_all('apadrinamientos')
    active_apad = None
    
    for ap in apadrinamientos:
         if ap.get('id_nino') == nino_id and ap.get('estado_apadrinamiento_registro') == 'Activo':
             active_apad = ap
             break
    
    if not active_apad:
        print("Creating new Apadrinamiento...")
        new_apad_id = storage.get_next_id('apadrinamientos', 'AP')
        active_apad = {
            "id_apadrinamiento": new_apad_id,
            "id_padrino": padrino_id,
            "id_nino": nino_id,
            "fecha_inicio": datetime.date.today().isoformat(),
            "tipo_apadrinamiento": "Asignación Automática",
            "estado_apadrinamiento_registro": "Activo",
            "entregas_ids": []
        }
        storage.save('apadrinamientos', new_apad_id, active_apad)
        
        # Link to padrino
        padrino = storage.load('padrinos', padrino_id)
        if padrino:
            if 'historial_apadrinamiento_ids' not in padrino:
                padrino['historial_apadrinamiento_ids'] = []
            if new_apad_id not in padrino['historial_apadrinamiento_ids']:
                padrino['historial_apadrinamiento_ids'].append(new_apad_id)
            storage.update('padrinos', padrino_id, padrino)
            
    else:
        print(f"Found active Apadrinamiento: {active_apad['id_apadrinamiento']}")

    # 3. Create Pending Delivery
    print("Creating Pending Delivery...")
    
    # Get point of delivery
    puntos = storage.list_all('puntos_entrega')
    if not puntos:
         punto_id = "PE001"
         storage.save('puntos_entrega', punto_id, {
             "id_punto_entrega": punto_id,
             "nombre_punto": "Oficina Central",
             "direccion_fisica": "Calle Falsa 123",
             "latitud": 0.0, "longitud": 0.0,
             "estado_punto": "Activo"
         })
    else:
         punto_id = puntos[0]['id_punto_entrega']

    new_entrega_id = storage.get_next_id('entregas', 'E')
    new_entrega = {
        "id_entrega": new_entrega_id,
        "id_apadrinamiento": active_apad['id_apadrinamiento'],
        "descripcion_regalo": "Kit de Arte y Pintura (Generado por Script)",
        "fecha_programada": (datetime.date.today() + datetime.timedelta(days=5)).isoformat(),
        "estado_entrega": "Pendiente",
        "id_punto_entrega": punto_id,
        "observaciones": "Creado automáticamente"
    }
    
    storage.save('entregas', new_entrega_id, new_entrega)
    
    # Link to apadrinamiento
    if 'entregas_ids' not in active_apad:
        active_apad['entregas_ids'] = []
    active_apad['entregas_ids'].append(new_entrega_id)
    storage.update('apadrinamientos', active_apad['id_apadrinamiento'], active_apad)
    
    print("SUCCESS! Data created.")
    print(f"Entregas updated: {active_apad['entregas_ids']}")

if __name__ == '__main__':
    seed()
