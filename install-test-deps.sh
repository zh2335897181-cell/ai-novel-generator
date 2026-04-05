#!/bin/bash

echo "================================"
echo "Installing Test Dependencies"
echo "================================"

echo ""
echo "[1/2] Installing Backend Test Dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies!"
    exit 1
fi
cd ..

echo ""
echo "[2/2] Installing Frontend Test Dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install frontend dependencies!"
    exit 1
fi

echo ""
echo "Installing Playwright Browsers..."
npx playwright install
if [ $? -ne 0 ]; then
    echo "Failed to install Playwright browsers!"
    exit 1
fi
cd ..

echo ""
echo "================================"
echo "Test Dependencies Installed!"
echo "================================"
echo ""
echo "You can now run tests with:"
echo "  - ./test-all.sh (run all tests)"
echo "  - cd backend && npm test (backend tests)"
echo "  - cd frontend && npm test (frontend tests)"
echo "  - cd frontend && npm run test:e2e (E2E tests)"
