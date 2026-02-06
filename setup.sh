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

# OSを検出
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    # Windows
    PYTHON_CMD="py"
    PIP_CMD="py -m pip"
else
    # macOS/Linux
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
fi

# Pythonがインストールされているか確認
if command -v $PYTHON_CMD &> /dev/null; then
    echo "   Python が見つかりました"
    
    # yfinanceをインストール
    $PIP_CMD install -r requirements.txt --break-system-packages 2>/dev/null || $PIP_CMD install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        echo "   ✓ yfinanceのインストールに成功しました"
    else
        echo "   ⚠ yfinanceのインストールに失敗しました"
        echo "   手動でインストールしてください:"
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
            echo "   py -m pip install yfinance"
        else
            echo "   pip3 install yfinance"
        fi
    fi
else
    echo "   ⚠ Python が見つかりません"
    echo "   ファンダメンタルズ分析を使用するには、Pythonが必要です"
    echo "   インストール方法:"
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        echo "   - Windows: https://www.python.org/downloads/"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   - macOS: brew install python3"
    else
        echo "   - Linux: sudo apt install python3 python3-pip"
    fi
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
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    echo "ファイル: %APPDATA%\\Claude\\claude_desktop_config.json"
else
    echo "ファイル: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)"
fi
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
echo "========================================"
