import os
import io
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, session, send_file
import requests
import openpyxl
from PIL import Image
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")


API_URL = os.getenv("API_URL", "")
API_URL_EMPLOYEE_ID = os.getenv("API_URL_EMPLOYEE_ID", "")
API_TOKEN = os.getenv("API_TOKEN", "")
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "True").lower() == "true"
EXCEL_DB_PATH = os.getenv("EXCEL_DB_PATH", "pausas_activas.xlsx")


MOCK_EMPLOYEES = {
    "carnet": {
        "1001": {"id": "EMP-001", "nombre": "Juan Pérez", "departamento": "Producción"},
        "1002": {"id": "EMP-002", "nombre": "María Gómez", "departamento": "Logística"},
        "1003": {"id": "EMP-003", "nombre": "Carlos Rodríguez", "departamento": "Calidad"}
    },
    "id": {
        "EMP-001": {"id": "EMP-001", "nombre": "Juan Pérez", "departamento": "Producción"},
        "EMP-002": {"id": "EMP-002", "nombre": "María Gómez", "departamento": "Logística"},
        "EMP-003": {"id": "EMP-003", "nombre": "Carlos Rodríguez", "departamento": "Calidad"}
    }
}


def get_headers():
    """Genera cabeceras de autorización seguras."""
    return {
        'Authorization': f'Basic {API_TOKEN}',
        'Content-Type': 'application/json'
    }


def fetch_employee_data(search_param: str, search_type: str = "carnet"):
    """
    Consulta datos del empleado vía API REST o mediante simulación Mock.
    search_type: 'carnet' o 'id'
    """
    if USE_MOCK_DATA or not API_URL:
        return MOCK_EMPLOYEES.get(search_type, {}).get(str(search_param))

    endpoint = f"{API_URL}?Carnet={search_param}" if search_type == "carnet" else f"{API_URL_EMPLOYEE_ID}?ID={search_param}"
    
    try:
        response = requests.get(endpoint, headers=get_headers(), timeout=5)
        if response.status_code == 200:
            data = response.json()
            if 'value' in data and len(data['value']) > 0:
                raw_emp = data['value'][0]
                return {
                    'id': raw_emp.get('EmpBasic_EmpID', 'N/A'),
                    'nombre': raw_emp.get('EmpBasic_Name', 'N/A'),
                    'departamento': raw_emp.get('EmpBasic_JCDept', 'General')
                }
        return None
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error de conexión con el servicio externo: {e}")
        return None


def guardar_registro_actividad(empleado_data: dict, tipo_pausa: str, form_data: dict):
    """
    Almacena de forma persistente el registro de pausa activa en el archivo Excel.
    """
    try:
        fecha_pausa = session.get('fecha_pausa') or datetime.now().strftime("%Y-%m-%d")
        pausas_realizadas = form_data.get('pausas_realizadas', 'Sí')
        tiempo_sesion = int(form_data.get('tiempo_sesion_segundos', 0) or 0)
        hora_inicio = form_data.get('hora_inicio', '')
        hora_fin = form_data.get('hora_fin', '')

        if not os.path.exists(EXCEL_DB_PATH):
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Historial Pausas"
            ws.append([
                "Empleado ID", "Nombre", "Departamento", "Tipo Pausa",
                "Fecha", "Hora Inicio", "Hora Fin", "Duración (Seg)", "Completada"
            ])
            wb.save(EXCEL_DB_PATH)

        wb = openpyxl.load_workbook(EXCEL_DB_PATH)
        ws = wb.active
        ws.append([
            empleado_data.get('id'),
            empleado_data.get('nombre'),
            empleado_data.get('departamento'),
            tipo_pausa,
            fecha_pausa,
            hora_inicio,
            hora_fin,
            tiempo_sesion,
            pausas_realizadas
        ])
        wb.save(EXCEL_DB_PATH)
        wb.close()
        return True
    except Exception as e:
        app.logger.error(f"Fallo en la persistencia del archivo Excel: {e}")
        return False


def procesar_actividad(template_name: str, tipo_pausa: str):
    empleado = session.get('empleado')
    if not empleado:
        flash("Por favor inicia sesión con tu identificación.", "warning")
        return redirect(url_for('index'))

    if request.method == 'POST':
        if guardar_registro_actividad(empleado, tipo_pausa, request.form):
            flash(f"¡Excelente trabajo, {empleado.get('nombre')}! Tu sesión de {tipo_pausa} fue registrada con éxito.", "success")
            # Limpiamos la sesión si es una terminal compartida, o la dejamos para otra pausa
            return redirect(url_for('index'))
        else:
            flash("Ocurrió un error al guardar tu actividad.", "danger")

    return render_template(template_name, empleado=empleado)


# RUTAS 

@app.route('/', methods=['GET', 'POST'])
def index():
    empleado = None
    fecha_pausa = None
    consulta_realizada = False

    if request.method == 'POST':
        id_carnet = request.form.get('id_carnet')
        id_empleado = request.form.get('id_empleado')
        fecha_pausa = request.form.get('fecha_pausa')

        if id_carnet:
            empleado = fetch_employee_data(id_carnet, search_type="carnet")
        elif id_empleado:
            empleado = fetch_employee_data(id_empleado, search_type="id")

        if empleado:
            session['empleado'] = empleado
            session['fecha_pausa'] = fecha_pausa
            consulta_realizada = True
            flash("Identificación exitosa. Selecciona una pausa activa.", "info")
        else:
            flash("No se encontraron registros. Verifica tu número de identificación.", "warning")

    return render_template(
        'index.html',
        empleado=empleado,
        consulta_realizada=consulta_realizada,
        fecha_pausa=fecha_pausa
    )

@app.route('/static/images/optimized-image.jpg')
def get_optimized_image():
    """Optimización y compresión dinámica con Pillow."""
    image_path = os.path.join(app.root_path, "static", "images", "banner-default.jpg")
    
    if not os.path.exists(image_path):
        return ("Imagen no encontrada", 404)

    with Image.open(image_path) as img:
        img = img.convert("RGB")
        img.thumbnail((1200, 400)) 
        img_io = io.BytesIO()
        img.save(img_io, "JPEG", quality=85)
        img_io.seek(0)
        return send_file(img_io, mimetype="image/jpeg")


# RUTAS DE OPCIONES DE PAUSAS

@app.route('/pausa-mentales', methods=['GET', 'POST'])
def pausa_mentales():
    return procesar_actividad('pausa-mentales.html', 'Pausa Mental General')


@app.route('/pausa-mental-sopa-letras', methods=['GET', 'POST'])
def pausa_mental_sopaletras():
    return procesar_actividad('pausa-mental-sopa-letras.html', 'Sopa de Letras')


@app.route('/pausa-mental-rompecabezas', methods=['GET', 'POST'])
def rompecabezas():
    return procesar_actividad('pausa-mental-rompecabezas.html', 'Rompecabezas')


@app.route('/memorama', methods=['GET', 'POST'])
def pausa_mental_memorama():
    return procesar_actividad('memorama.html', 'Memorama')


@app.route('/pausa-corporales', methods=['GET', 'POST'])
def pausa_corporales():
    return procesar_actividad('pausa-corporales.html', 'Pausa Corporal')



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)