@echo off
echo ================================
echo Running All Tests
echo ================================

echo.
echo [1/3] Running Backend Tests...
cd backend
call npm test
if %errorlevel% neq 0 (
    echo Backend tests failed!
    cd ..
    exit /b 1
)
cd ..

echo.
echo [2/3] Running Frontend Unit Tests...
cd frontend
call npm test
if %errorlevel% neq 0 (
    echo Frontend tests failed!
    cd ..
    exit /b 1
)

echo.
echo [3/3] Running E2E Tests...
call npm run test:e2e
if %errorlevel% neq 0 (
    echo E2E tests failed!
    cd ..
    exit /b 1
)
cd ..

echo.
echo ================================
echo All Tests Passed!
echo ================================
