@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python no esta instalado. Instale Python desde https://www.python.org o publique la carpeta en un hosting HTTPS.
  echo Tambien puede abrir index.html con doble clic para usarla sin instalar.
  pause
  exit /b
)
start "" http://localhost:8765/index.html
echo Servidor local de Plan Norte en http://localhost:8765  (cierre esta ventana al terminar)
python -m http.server 8765
