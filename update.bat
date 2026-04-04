@echo off
REM AI小说生成系统 - 快速更新脚本
REM 使用方法: update.bat "你的修改描述"

setlocal enabledelayedexpansion

REM 检查是否提供了提交消息
if "%1"=="" (
    echo.
    echo ╔════════════════════════════════════════════════════════════════╗
    echo ║          AI小说生成系统 - 快速更新脚本                          ║
    echo ╚════════════════════════════════════════════════════════════════╝
    echo.
    echo 使用方法:
    echo   update.bat "你的修改描述"
    echo.
    echo 例子:
    echo   update.bat "fix: 修复登录页面样式"
    echo   update.bat "feat: 添加新功能"
    echo   update.bat "docs: 更新文档"
    echo.
    echo 提交类型:
    echo   feat     - 新功能
    echo   fix      - 修复bug
    echo   docs     - 文档更新
    echo   style    - 代码格式
    echo   refactor - 代码重构
    echo   perf     - 性能优化
    echo   test     - 测试相关
    echo   chore    - 构建/依赖
    echo.
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    开始更新代码到GitHub                         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM 步骤1: 查看状态
echo [1/4] 检查修改状态...
git status
echo.

REM 步骤2: 添加修改
echo [2/4] 添加修改到暂存区...
git add .
if errorlevel 1 (
    echo ❌ 添加失败
    exit /b 1
)
echo ✅ 添加成功
echo.

REM 步骤3: 提交
echo [3/4] 提交修改...
git commit -m "%1"
if errorlevel 1 (
    echo ❌ 提交失败
    exit /b 1
)
echo ✅ 提交成功
echo.

REM 步骤4: 推送
echo [4/4] 推送到GitHub...
git push
if errorlevel 1 (
    echo ❌ 推送失败
    exit /b 1
)
echo ✅ 推送成功
echo.

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    ✅ 更新完成！                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 提交信息: %1
echo.
echo 查看最新提交:
git log --oneline -1
echo.
