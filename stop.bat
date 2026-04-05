@echo off
chcp 65001 >nul
title AI小说生成系统 - 停止服务

echo ================================
echo AI小说生成系统 - 停止服务
echo ================================
echo.

echo 正在停止所有Node.js进程...
echo.

REM 方法1: 通过端口停止
echo [1/3] 停止占用端口的进程...

REM 停止后端服务（端口8080）
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo 停止后端服务 PID: %%a
    taskkill /F /PID %%a 2>nul
)

REM 停止前端服务（端口5173）
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo 停止前端服务 PID: %%a
    taskkill /F /PID %%a 2>nul
)

REM 停止其他可能的端口
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo 停止开发服务器 PID: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo [2/3] 停止所有node.exe进程...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo 没有找到node.exe进程
) else (
    echo 已停止所有node.exe进程
)

echo.
echo [3/3] 停止所有nodemon进程...
taskkill /F /IM nodemon.exe 2>nul
if errorlevel 1 (
    echo 没有找到nodemon进程
) else (
    echo 已停止所有nodemon进程
)

echo.
echo ================================
echo 清理完成！
echo ================================
echo.
echo 所有Node.js服务已停止
echo 如果还有残留进程，请手动关闭命令行窗口
echo.
pause
