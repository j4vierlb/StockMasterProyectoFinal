@echo off
cd /d C:\Users\jlara\Desktop\stockmaster\stockmaster
echo Iniciando servidor en puerto 8080...
echo Presiona Ctrl+C para detener
npx http-server -p 8080 -c 0
pause
