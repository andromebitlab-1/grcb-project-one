@echo off
title GRCB-WEB Runner
echo [1/2] Verificando dependencias...
call npm install
echo.
echo [2/2] Iniciando servidor de desarrollo...
echo Presiona Ctrl+C para detener el servidor.
echo.
start http://localhost:5173
call npm run dev
pause
