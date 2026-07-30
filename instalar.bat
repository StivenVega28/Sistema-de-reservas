@echo off
echo ====================================
echo Sistema de Reservas - Instalacion
echo ====================================
echo.

echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js instalado
echo.

echo [2/3] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: No se pudieron instalar las dependencias
    pause
    exit /b 1
)
echo ✓ Dependencias instaladas
echo.

echo [3/3] Verificando configuracion...
if not exist .env (
    echo ERROR: No se encontro el archivo .env
    pause
    exit /b 1
)
echo ✓ Configuracion encontrada
echo.

echo ====================================
echo ¡Instalacion completada!
echo ====================================
echo.
echo Para ejecutar el proyecto:
echo   - Desarrollo: npm run dev
echo   - Produccion: npm start
echo.
echo Credenciales de acceso:
echo   - Admin: admin / admin123
echo   - Mesero: mesero / mesero123
echo   - Cocina: cocina / cocina123
echo   - Despacho: despacho / despacho123
echo.
pause
