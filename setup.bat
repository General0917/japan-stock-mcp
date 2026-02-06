@echo off
chcp 65001 >nul
echo ========================================
echo 日本株式分析MCPサーバー セットアップ
echo ========================================
echo.

echo 1. Node.js依存パッケージをインストール中...
call npm install
if errorlevel 1 (
    echo エラー: npm installに失敗しました
    pause
    exit /b 1
)

echo.
echo 2. Python依存パッケージをインストール中...
echo    ^(ファンダメンタルズ分析に必要^)

where py >nul 2>&1
if %errorlevel% equ 0 (
    echo    Python が見つかりました
    
    py -m pip install -r requirements.txt
    if errorlevel 1 (
        echo    ⚠ yfinanceのインストールに失敗しました
        echo    手動でインストールしてください: py -m pip install yfinance
    ) else (
        echo    ✓ yfinanceのインストールに成功しました
    )
) else (
    echo    ⚠ Python が見つかりません
    echo    ファンダメンタルズ分析を使用するには、Pythonが必要です
    echo    インストール方法:
    echo    - https://www.python.org/downloads/ からダウンロード
)

echo.
echo 3. TypeScriptをビルド中...
call npm run build
if errorlevel 1 (
    echo エラー: ビルドに失敗しました
    pause
    exit /b 1
)

echo.
echo ✅ セットアップが完了しました！
echo.
echo 次のステップ:
echo ----------------------------------------
echo 1. Claude Desktop の設定ファイルに以下を追加してください:
echo.
echo ファイル: %%APPDATA%%\Claude\claude_desktop_config.json
echo.
echo {
echo   "mcpServers": {
echo     "japan-stock": {
echo       "command": "node",
echo       "args": ["%CD%\dist\index.js"]
echo     }
echo   }
echo }
echo.
echo 2. Claude Desktop を再起動してください
echo.
echo 3. 動作確認（オプション）:
echo    npm run inspector
echo.
echo 使用例:
echo   「トヨタ自動車（7203）を総合分析してください」
echo ========================================
pause
