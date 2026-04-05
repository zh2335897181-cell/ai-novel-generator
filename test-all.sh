#!/bin/bash

echo "================================"
echo "Running All Tests"
echo "================================"

# Backend tests
echo ""
echo "[1/3] Running Backend Tests..."
cd backend
npm test
if [ $? -ne 0 ]; then
    echo "Backend tests failed!"
    exit 1
fi
cd ..

# Frontend unit tests
echo ""
echo "[2/3] Running Frontend Unit Tests..."
cd frontend
npm test
if [ $? -ne 0 ]; then
    echo "Frontend tests failed!"
    exit 1
fi

# E2E tests
echo ""
echo "[3/3] Running E2E Tests..."
npm run test:e2e
if [ $? -ne 0 ]; then
    echo "E2E tests failed!"
    exit 1
fi
cd ..

echo ""
echo "================================"
echo "All Tests Passed!"
echo "================================"
