@echo off
title MoneyMate Vault - Automated Test Suite Runner
cls
echo ========================================================================
echo            MoneyMate Vault - Automated Test Suite Runner
echo ========================================================================
echo.
echo Running automated execution test cases across all modules...
echo.

node Test/runner.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================================
    echo  [SUCCESS] All test cases executed successfully!
    echo ========================================================================
) else (
    echo.
    echo ========================================================================
    echo  [FAILURE] One or more test cases failed. See logs above.
    echo ========================================================================
)

echo.
echo Launching Interactive Test Runner Dashboard in default browser...
start "" "%~dp0runner.html"

echo.
pause
