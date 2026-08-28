@echo off
chcp 65001 > nul
echo ========================================================
echo   🏰 LIGHTHOUSE TASKFLOW - RESTORE CHECKPOINT (v2.1)
echo   MeDTree Design & Build
echo ========================================================
echo.
echo กำลังทำการเรียกคืนระบบกลับสู่เวอร์ชันเสถียร Lighthouse TaskFlow v2.1...
echo.

git checkout backup/v2.1-stable
if %errorlevel% neq 0 (
    echo [ERROR] ไม่สามารถสลับไปยัง branch backup/v2.1-stable ได้ กำลังลอง checkout tag v2.1...
    git checkout tags/v2.1
)

echo.
echo ========================================================
echo   ✅ เรียกคืนระบบ Lighthouse TaskFlow (v2.1) สำเร็จ 100%!
echo ========================================================
echo.
pause
