# インストールガイド

## 対応OS

- ✅ Windows 10/11
- ✅ macOS 12以降
- ✅ Linux (Ubuntu 20.04以降)

## 前提条件

### 必須

- **Node.js 18以上**
  - Windows: https://nodejs.org/ からダウンロード
  - macOS: `brew install node`
  - Linux: `sudo apt install nodejs npm`

### 推奨（ファンダメンタルズ分析用）

- **Python 3.8以上**
  - Windows: https://www.python.org/downloads/
  - macOS: `brew install python3`
  - Linux: `sudo apt install python3 python3-pip`

## インストール手順

### Windows

1. **ZIPファイルを解凍**
   ```
   japan-stock-mcp.zip を展開
   ```

2. **セットアップ実行**
   ```cmd
   cd japan-stock-mcp
   setup.bat
   ```

3. **Claude Desktop設定**
   
   ファイルを開く: `%APPDATA%\Claude\claude_desktop_config.json`
   
   以下を追加:
   ```json
   {
     "mcpServers": {
       "japan-stock": {
         "command": "node",
         "args": ["C:\\完全な\\パス\\japan-stock-mcp\\dist\\index.js"]
       }
     }
   }
   ```
   
   ⚠️ **重要**: パスは絶対パスで指定してください
   
   例:
   ```json
   "args": ["C:\\Users\\YourName\\Documents\\japan-stock-mcp\\dist\\index.js"]
   ```

4. **Claude Desktopを再起動**

### macOS

1. **ZIPファイルを解凍**
   ```bash
   unzip japan-stock-mcp.zip
   cd japan-stock-mcp
   ```

2. **セットアップ実行**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Claude Desktop設定**
   
   ファイルを開く: `~/Library/Application Support/Claude/claude_desktop_config.json`
   
   以下を追加:
   ```json
   {
     "mcpServers": {
       "japan-stock": {
         "command": "node",
         "args": ["/Users/YourName/japan-stock-mcp/dist/index.js"]
       }
     }
   }
   ```
   
   ⚠️ **重要**: パスは絶対パスで指定してください

4. **Claude Desktopを再起動**

### Linux

1. **ZIPファイルを解凍**
   ```bash
   unzip japan-stock-mcp.zip
   cd japan-stock-mcp
   ```

2. **セットアップ実行**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Claude Desktop設定**
   
   ファイルを開く: `~/.config/Claude/claude_desktop_config.json`
   
   以下を追加:
   ```json
   {
     "mcpServers": {
       "japan-stock": {
         "command": "node",
         "args": ["/home/username/japan-stock-mcp/dist/index.js"]
       }
     }
   }
   ```

4. **Claude Desktopを再起動**

## 手動インストール

自動セットアップがうまくいかない場合:

### 1. Node.js依存関係

```bash
# Windows (PowerShell/CMD)
npm install

# macOS/Linux
npm install
```

### 2. Python依存関係（オプション）

```bash
# Windows
py -m pip install yfinance

# macOS/Linux
pip3 install yfinance
```

### 3. ビルド

```bash
npm run build
```

## トラブルシューティング

### Python が見つからない（Windows）

1. Python をインストール: https://www.python.org/downloads/
2. インストール時に "Add Python to PATH" をチェック
3. コマンドプロンプトを再起動
4. 確認: `py --version`

### Python が見つからない（macOS）

```bash
# Homebrewでインストール
brew install python3

# 確認
python3 --version
```

### ビルドエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

### パスの問題（Windows）

- バックスラッシュ（\）を使用
- パスに空白がある場合は完全パスを使用
- 例: `C:\\Users\\Your Name\\Documents\\japan-stock-mcp\\dist\\index.js`

### 権限エラー（macOS/Linux）

```bash
# スクリプトに実行権限を付与
chmod +x setup.sh

# npm でグローバルインストール権限エラーの場合
sudo npm install -g npm
```

## 動作確認

### MCPインスペクターで確認

```bash
npm run inspector
```

ブラウザで開いて、利用可能なツールを確認できます。

### Claude Desktopで確認

Claude Desktopを開き、以下のように質問:

```
トヨタ自動車（7203）の株価データを取得してください
```

正常に動作すれば、株価データが表示されます。

## アンインストール

### 1. Claude Desktop設定から削除

`claude_desktop_config.json` から japan-stock の設定を削除

### 2. ファイル削除

```bash
# Windows
rd /s japan-stock-mcp

# macOS/Linux  
rm -rf japan-stock-mcp
```

## サポート

問題が解決しない場合:

1. `TROUBLESHOOTING.md` を確認
2. GitHub Issuesで報告
3. 以下の情報を含める:
   - OS バージョン
   - Node.js バージョン (`node --version`)
   - Python バージョン (`py --version` or `python3 --version`)
   - エラーメッセージ全文
