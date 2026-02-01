#!/bin/bash

echo "========================================"
echo "日本株式分析MCPサーバー セットアップ"
echo "========================================"
echo ""

# 現在のディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "1. Node.js依存パッケージをインストール中..."
npm install

if [ $? -ne 0 ]; then
    echo "エラー: npm installに失敗しました"
    exit 1
fi

echo ""
echo "2. Python依存パッケージをインストール中..."
echo "   (ファンダメンタルズ分析に必要)"

# Pythonがインストールされているか確認
if command -v python3 &> /dev/null; then
    echo "   Python3が見つかりました"
    
    # yfinanceをインストール
    pip3 install -r requirements.txt --break-system-packages 2>/dev/null || pip3 install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        echo "   ✓ yfinanceのインストールに成功しました"
    else
        echo "   ⚠ yfinanceのインストールに失敗しました"
        echo "   手動でインストールしてください: pip3 install yfinance"
        echo "   （ファンダメンタルズ分析は利用できますが、精度が低下する可能性があります）"
    fi
else
    echo "   ⚠ Python3が見つかりません"
    echo "   ファンダメンタルズ分析を使用するには、Python3とyfinanceが必要です"
    echo "   インストール方法:"
    echo "   - macOS: brew install python3"
    echo "   - Ubuntu: sudo apt install python3 python3-pip"
    echo "   その後: pip3 install yfinance"
fi

echo ""
echo "3. TypeScriptをビルド中..."
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
echo "  「トヨタ自動車（7203）を総合分析してください」"
echo "  「ソニーグループ（6758）のファンダメンタルズを分析してください」"
echo "========================================"
