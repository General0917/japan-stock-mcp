#!/bin/bash

echo "========================================"
echo "日本株式分析MCPサーバー セットアップ"
echo "========================================"
echo ""

# 現在のディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "1. 依存パッケージをインストール中..."
npm install

if [ $? -ne 0 ]; then
    echo "エラー: npm installに失敗しました"
    exit 1
fi

echo ""
echo "2. TypeScriptをビルド中..."
npm run build

if [ $? -ne 0 ]; then
    echo "エラー: ビルドに失敗しました"
    exit 1
fi

echo ""
echo "✅ セットアップが完了しました！"
echo ""
echo "次のステップ:"
echo "----------------------------------------"
echo "1. Claude Desktop または Cline の設定ファイルに以下を追加してください:"
echo ""
echo "【Claude Desktop の場合】"
echo "ファイル: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)"
echo "または: %APPDATA%\\Claude\\claude_desktop_config.json (Windows)"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "japan-stock": {'
echo '      "command": "node",'
echo "      \"args\": [\"${SCRIPT_DIR}/dist/index.js\"]"
echo '    }'
echo '  }'
echo '}'
echo ""
echo "【Cline (VS Code) の場合】"
echo "VS Code settings.json に追加:"
echo ""
echo '{'
echo '  "mcp.servers": {'
echo '    "japan-stock": {'
echo '      "command": "node",'
echo "      \"args\": [\"${SCRIPT_DIR}/dist/index.js\"]"
echo '    }'
echo '  }'
echo '}'
echo ""
echo "2. Claude Desktop または VS Code を再起動してください"
echo ""
echo "3. 動作確認（オプション）:"
echo "   npm run inspector"
echo ""
echo "使用例:"
echo "  「トヨタ自動車（7203）を分析してください」"
echo "  「短期で有望な銘柄TOP5を教えてください: 7203, 6758, 9984, 8306, 9432」"
echo "========================================"
