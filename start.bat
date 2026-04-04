@echo off
chcp 65001 >nul
echo ================================
echo AI小说生成系统 - 启动脚本
echo ================================
echo.

echo [1/4] 检查数据库连接...
mysql -u root -pzh2335897 -e "USE ai_novel_db; SELECT 'Database OK' as status;" 2>nul
if errorlevel 1 (
    echo 数据库未初始化，正在导入...
    mysql -u root -pzh2335897 < database\schema.sql
    if errorlevel 1 (
        echo [错误] 数据库初始化失败，请检查MySQL是否安装并运行
        pause
        exit /b 1
    )
    echo 数据库初始化完成！
) else (
    echo 数据库连接正常
)
echo.

echo [2/4] 安装后端依赖...
cd backend
if not exist node_modules (
    echo 正在安装后端依赖，请稍候...
    call npm install
    if errorlevel 1 (
        echo [错误] 后端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo 后端依赖安装完成
) else (
    echo 后端依赖已存在
)
cd ..
echo.

echo [3/4] 安装前端依赖...
cd frontend
if not exist node_modules (
    echo 正在安装前端依赖，请稍候...
    call npm install
    if errorlevel 1 (
        echo [错误] 前端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo 前端依赖安装完成
) else (
    echo 前端依赖已存在
)
cd ..
echo.

echo [4/4] 启动服务...
echo 启动后端服务...
start "AI小说后端" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 2 /nobreak >nul

echo 启动前端服务...
start "AI小说前端" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.

echo ================================
echo 启动完成！
echo 后端: http://localhost:8080
echo 前端: http://localhost:3000
echo.
echo 请在新打开的窗口中查看服务状态
echo ================================
echo.
echo 按任意键关闭此窗口...
pause >nul
