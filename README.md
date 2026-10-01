# ActiveBreak Portal | Sistema de Gestión de Pausas Activas Digitales

Plataforma web orientada a la digitalización, seguimiento y registro de pausas activas laborales (físicas y cognitivas) en entornos corporativos, reemplazando formularios manuales y promoviendo la ergonomía en el trabajo.


##  Características Principales

- **Consulta Multi-Criterio de Colaboradores:** Identificación por número de carnet o documento de identidad, con soporte para APIs externas y Modo Mock local para pruebas sin conexión.
- **Módulos de Activación Cognitiva:**
  - **Sopa de Letras:** Rejilla interactiva con términos ergonómicos y validación en tiempo real.
  - **Rompecabezas en Canvas:** Desafío visual de reorganización de piezas por coordenadas sobre HTML5 Canvas.
  - **Memorama:** Juego de agilidad visual y memoria con control dinámico de tarjetas emparejadas.
- **Rutinas Físicas y Guías Técnicas:** Catálogo modular de ejercicios ergonómicos con modales informativos detallados para evitar lesiones por movimientos repetitivos.
- **Persistencia Automatizada:** Almacenamiento directo de tiempos de sesión, marcas de tiempo (inicio/fin) y confirmación de actividad en formato estructurado de Excel (`.xlsx`).
- **Optimización de Activos Multimedia:** Procesamiento, compresión y redimensionamiento dinámico de imágenes en backend mediante Pillow.


##  Stack Tecnológico

- **Backend:** Python, Flask, openpyxl, Pillow, python-dotenv, requests.
- **Frontend:** JavaScript (ES6+), HTML5 (Canvas API), CSS3, Bootstrap 4.
- **Arquitectura:** Modular, desacoplada mediante variables de entorno (`.env`) y arquitectura REST.


##  Estructura del Directorio

```text
pactivasdigitales/
├── static/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── pausas.js
│   └── images/
│       ├── banner-default.jpg
│       └── puzzle-sample.png
├── templates/
│   ├── index.html
│   ├── pausa-corporales.html
│   ├── pausa-mentales.html
│   ├── pausa-mental-sopa-letras.html
│   ├── pausa-mental-rompecabezas.html
│   └── memorama.html
├── app.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```


##  Guía de Ejecución Local

1. Clonar el repositorio:
   git clone https://github.com/Edrianescobar580/pactivasdigitales.git
   
   -> cd pactivasdigitales

2. Crear y activar un entorno virtual (recomendado):
   python -m venv venv
   # En Windows:
   venv\Scripts\activate
   # En Linux/Mac:
   source venv/bin/activate

3. Instalar dependencias:
   pip install -r requirements.txt

4. Configurar el entorno:
   Copiar el archivo de ejemplo para generar el archivo local:
   cp .env.example .env
   (Por defecto USE_MOCK_DATA=True, lo que permite probar la aplicación de inmediato con datos de prueba sin necesidad de conexión externa).

5. Iniciar la aplicación:
   python app.py
   Abrir en el navegador: http://127.0.0.1:5000