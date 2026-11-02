@echo off
cd /d "%~dp0"
echo Starting Coursera CBAP Learning Portal on http://localhost:3456 ...
start http://localhost:3456
node server.js
pause
