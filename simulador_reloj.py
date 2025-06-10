import paho.mqtt.client as mqtt
import time
import json
import random
import sys
import requests  # <-- Agregado para enviar datos HTTP

broker = "localhost"
port = 1883

if len(sys.argv) < 2:
    print("Debe proporcionar el nombre como argumento. Uso: python simulador_reloj.py <nombre_dispositivo>")
    sys.exit(1)

nombre_dispositivo = sys.argv[1]
topic = f"dispositivos/{nombre_dispositivo}/ritmo_cardiaco"
api_url = "http://api_php:5000/api/ritmo"


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Conectado exitosamente al broker MQTT")
    else:
        print(f"Error de conexión. Código de retorno: {rc}")

def generar_ritmo_cardiaco():
    return random.randint(30, 130)

def construir_mensaje(dispositivo, ritmo):
    return {
        "dispositivo": dispositivo,
        "ritmo_cardiaco": ritmo,
        "unidad": "bpm",
        "timestamp": int(time.time())
    }

def enviar_a_api(mensaje):
    try:
        response = requests.post(api_url, json=mensaje)
        if response.status_code == 200 or response.status_code == 201:
            print(f"Datos enviados a la API: {mensaje}")
        else:
            print(f"Error al enviar a API: {response.status_code} - {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Error al conectar con la API: {e}")