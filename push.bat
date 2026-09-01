@echo off
chcp 65001 >nul
set /p commit=Commit message:
git add .
git commit -m "%commit%"
git push
pause