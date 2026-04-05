@echo off
chcp 65001 >nul
title AI小说生成系统

echo ================================
echo AI小说生成系统 - 启动
echo ================================
echo.

REM 检查.env文件
if not exist backend\.env (
    echo 创建配置文件 backend\.env ...
    (
        echo PORT=8080
        echo DB_HOST=localhost
        echo DB_PORT=3306
        echo DB_USER=root
        echo DB_PASSWORD=zh2335897
        echo DB_NAME=ai_novel_db
        echo.
        echo AI_API_KEY=
        echo AI_BASE_URL=https://api.deepseek.com/v1
        echo AI_MODEL=deepseek-chat
    ) > backend\.env
    echo 配置文件已创建
    echo.
)

echo [1/2] 启动后端服务...
start "AI小说后端 - http://localhost:8080" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 2 /nobreak >nul

echo [2/2] 启动前端服务...
start "AI小说前端 - http://localhost:5173" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ================================
echo 启动完成！
echo ================================
echo.
echo 服务地址：
echo   后端: http://localhost:8080
echo   前端: http://localhost:5173
echo.
echo 提示：
echo   - 确保MySQL数据库已启动
echo   - 记得在前端配置AI API密钥
echo   - 运行 stop.bat 可停止服务
echo.
pause
