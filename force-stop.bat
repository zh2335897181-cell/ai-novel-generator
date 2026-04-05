@echo off
chcp 65001 >nul
title 强制停止所有服务

echo ================================
echo 强制停止所有Node.js服务
echo ================================
echo.
echo 警告：这将强制关闭所有Node.js进程！
echo.
pause

echo.
echo 正在强制停止...
echo.

REM 强制停止所有node进程
taskkill /F /IM node.exe /T 2>nul
if errorlevel 1 (
    echo [信息] 没有找到node.exe进程
) else (
    echo [成功] 已停止所有node.exe进程
)

REM 强制停止所有nodemon进程
taskkill /F /IM nodemon.exe /T 2>nul
if errorlevel 1 (
    echo [信息] 没有找到nodemon.exe进程
) else (
    echo [成功] 已停止所有nodemon.exe进程
)

REM 强制停止所有cmd窗口中的node进程
wmic process where "name='node.exe'" delete 2>nul

echo.
echo ================================
echo 清理完成！
echo ================================
echo.
echo 所有Node.js进程已被强制终止
echo 建议重启电脑以确保完全清理
echo.
pause
