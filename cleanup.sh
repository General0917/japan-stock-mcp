#!/bin/bash

echo "========================================"
echo "クリーンアップスクリプト"
echo "========================================"
echo ""

echo "古い設定ファイルを削除中..."
if [ -f jest.config.js ]; then
    rm jest.config.js
    echo "✓ jest.config.js を削除しました"
fi

if [ -f jest.config.ts ]; then
    rm jest.config.ts
    echo "✓ jest.config.ts を削除しました"
fi

echo ""
echo "node_modulesを削除中..."
if [ -d node_modules ]; then
    rm -rf node_modules
    echo "✓ node_modules を削除しました"
fi

echo ""
echo "package-lock.jsonを削除中..."
if [ -f package-lock.json ]; then
    rm package-lock.json
    echo "✓ package-lock.json を削除しました"
fi

echo ""
echo "distフォルダを削除中..."
if [ -d dist ]; then
    rm -rf dist
    echo "✓ dist を削除しました"
fi

echo ""
echo "coverageフォルダを削除中..."
if [ -d coverage ]; then
    rm -rf coverage
    echo "✓ coverage を削除しました"
fi

echo ""
echo "========================================"
echo "✅ クリーンアップが完了しました！"
echo "========================================"
echo ""
echo "次のコマンドを実行してください:"
echo "  npm install"
echo "  npm run build"
echo "  npm test"
echo ""
