@echo off
title AI Novel Generator - Docker Deploy
echo ================================================
echo     AI Novel Generator - Docker Deploy
echo ================================================
echo.

:: Check Docker
echo [Step 1/5] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed!
    echo Please install Docker Desktop first:
    echo https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo [OK] Docker is installed
echo.

:: Check Docker Compose
echo [Step 2/5] Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker Compose not found!
        pause
        exit /b 1
    )
    set COMPOSE_CMD=docker compose
) else (
    set COMPOSE_CMD=docker-compose
)
echo [OK] Docker Compose is available
echo.

:: Enter docker directory
cd /d "%~dp0docker" 2>nul || cd /d "%~dp0"
if not exist "docker-compose.yml" (
    echo [ERROR] docker-compose.yml not found!
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

:: Check environment file
echo [Step 3/5] Checking environment configuration...
if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env file...
        copy .env.example .env >nul
    ) else (
        echo [ERROR] .env.example not found!
        pause
        exit /b 1
    )
)

:: Check AI API Key
findstr /B "AI_API_KEY=sk-" .env >nul 2>&1
if errorlevel 1 (
    echo.
    echo ================================================
    echo     AI API Key Required
    echo ================================================
    echo.
    echo Please configure your AI API Key in .env file
    echo.
    echo Open with Notepad:
    echo     notepad .env
    echo.
    echo Or edit with VS Code:
    echo     code .env
    echo.
    pause
    exit /b 1
)
echo [OK] Environment configured
echo.

:: Build and start
echo [Step 4/5] Building and starting services...
echo This may take a few minutes, please wait...
echo.

%COMPOSE_CMD% down 2>nul
%COMPOSE_CMD% up -d --build

if errorlevel 1 (
    echo.
    echo [ERROR] Deployment failed!
    pause
    exit /b 1
)

echo.
echo [OK] Services started successfully!
echo.

:: Wait for initialization
echo [Step 5/5] Waiting for services to initialize...
timeout /t 10 /nobreak >nul

:: Check status
echo.
echo ================================================
echo     Deployment Status
    echo ================================================
echo.
%COMPOSE_CMD% ps

echo.
echo ================================================
echo     Deployment Complete!
echo ================================================
echo.
echo Access URLs:
echo   - Frontend: http://localhost
echo   - Backend API: http://localhost:8080
echo.
echo Useful commands:
echo   - View logs: %COMPOSE_CMD% logs -f
echo   - Stop services: %COMPOSE_CMD% stop
echo   - Restart: %COMPOSE_CMD% restart
echo   - Update: %COMPOSE_CMD% up -d --build
echo.
echo ================================================
echo.
pause
