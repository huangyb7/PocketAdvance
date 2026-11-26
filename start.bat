@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 掌机口袋 POCKET ADVANCE

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   没有找到 Node.js。
  echo   请先安装 Node.js ^(https://nodejs.org^)，或者用 Python 起服务：
  echo       python -m http.server 8123
  echo   然后浏览器打开 http://127.0.0.1:8123/
  echo.
  pause
  exit /b 1
)

node server.mjs
pause
