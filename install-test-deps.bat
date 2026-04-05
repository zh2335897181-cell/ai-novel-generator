@echo off
echo ================================
echo Installing Test Dependencies
echo ================================

echo.
echo [1/2] Installing Backend Test Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies!
    cd ..
    exit /b 1
)
cd ..

echo.
echo [2/2] Installing Frontend Test Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies!
    cd ..
    exit /b 1
)

echo.
echo Installing Playwright Browsers...
call npx playwright install
if %errorlevel% neq 0 (
    echo Failed to install Playwright browsers!
    cd ..
    exit /b 1
)
cd ..

echo.
echo ================================
echo Test Dependencies Installed!
echo ================================
echo.
echo You can now run tests with:
echo   - test-all.bat (run all tests)
echo   - cd backend ^&^& npm test (backend tests)
echo   - cd frontend ^&^& npm test (frontend tests)
echo   - cd frontend ^&^& npm run test:e2e (E2E tests)
