@echo off
echo ========================================
echo クリーンアップスクリプト
echo ========================================
echo.

echo 古い設定ファイルを削除中...
if exist jest.config.js (
    del jest.config.js
    echo ✓ jest.config.js を削除しました
)

if exist jest.config.ts (
    del jest.config.ts
    echo ✓ jest.config.ts を削除しました
)

echo.
echo node_modulesを削除中...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✓ node_modules を削除しました
)

echo.
echo package-lock.jsonを削除中...
if exist package-lock.json (
    del package-lock.json
    echo ✓ package-lock.json を削除しました
)

echo.
echo distフォルダを削除中...
if exist dist (
    rmdir /s /q dist
    echo ✓ dist を削除しました
)

echo.
echo coverageフォルダを削除中...
if exist coverage (
    rmdir /s /q coverage
    echo ✓ coverage を削除しました
)

echo.
echo ========================================
echo ✅ クリーンアップが完了しました！
echo ========================================
echo.
echo 次のコマンドを実行してください:
echo   npm install
echo   npm run build
echo   npm test
echo.
pause
