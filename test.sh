#!/bin/bash

echo "========================================"
echo "日本株式分析MCPサーバー 動作テスト"
echo "========================================"
echo ""

# ビルドされているか確認
if [ ! -f "dist/index.js" ]; then
    echo "エラー: dist/index.js が見つかりません"
    echo "先に 'npm run build' を実行してください"
    exit 1
fi

echo "MCPインスペクターを起動します..."
echo "使用可能なツール:"
echo "  - get_stock_price"
echo "  - analyze_stock"
echo "  - compare_stocks"
echo "  - find_best_stocks"
echo "  - get_current_price"
echo ""
echo "テスト例:"
echo "1. get_stock_price で 7203 の株価を取得"
echo "2. analyze_stock で 7203 を分析"
echo "3. compare_stocks で ['7203', '6758', '9984'] を比較"
echo ""
echo "インスペクターを起動中..."
echo "========================================"
echo ""

npx @modelcontextprotocol/inspector dist/index.js
