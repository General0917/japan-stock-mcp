# 日本株式分析MCPサーバー - インストール手順

## 概要

このMCPサーバーは、日本株の株価データを取得・分析し、以下の機能を提供します:

✅ **短期投資判断**（1ヶ月以内）- RSI、MACD、移動平均線による分析
✅ **中期投資判断**（3-6ヶ月）- トレンド分析、ゴールデンクロス検出
✅ **長期投資判断**（6ヶ月以上）- 年間トレンド、52週高値・安値分析
✅ **複数銘柄比較** - 複数の株をまとめて分析・ランキング
✅ **リアルタイム株価取得** - 現在価格と変動率の確認

---

## 前提条件

- **Node.js 18以上** がインストールされていること
- **Claude Desktop** または **Cline (VS Code拡張)** がインストールされていること

Node.jsのインストール確認:
```bash
node --version
# v18.0.0 以上であればOK
```

---

## インストール手順

### 1. プロジェクトディレクトリに移動

```bash
cd japan-stock-mcp
```

### 2. セットアップスクリプトを実行

```bash
./setup.sh
```

このスクリプトが以下を自動実行します:
- npm install（依存パッケージのインストール）
- npm run build（TypeScriptのビルド）
- セットアップ完了メッセージと設定方法の表示

---

## 設定方法

### 方法A: Claude Desktop での使用

#### macOS の場合

1. 設定ファイルを開く:
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

2. 以下の内容を追加（または既存の設定にマージ）:
```json
{
  "mcpServers": {
    "japan-stock": {
      "command": "node",
      "args": ["/絶対パス/japan-stock-mcp/dist/index.js"]
    }
  }
}
```

**重要**: `/絶対パス/` の部分を実際のプロジェクトパスに置き換えてください

パスの確認方法:
```bash
pwd
# 表示されたパスをコピーして使用
```

#### Windows の場合

1. 設定ファイルを開く:
```cmd
notepad %APPDATA%\Claude\claude_desktop_config.json
```

2. 以下の内容を追加:
```json
{
  "mcpServers": {
    "japan-stock": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\japan-stock-mcp\\dist\\index.js"]
    }
  }
}
```

**重要**: パスを実際のプロジェクトパスに置き換えてください

3. Claude Desktop を再起動

---

### 方法B: Cline (VS Code拡張) での使用

1. VS Code の設定を開く
   - macOS: `Cmd + ,`
   - Windows: `Ctrl + ,`

2. 右上の「設定（JSON）を開く」アイコンをクリック

3. settings.json に以下を追加:
```json
{
  "mcp.servers": {
    "japan-stock": {
      "command": "node",
      "args": ["/絶対パス/japan-stock-mcp/dist/index.js"]
    }
  }
}
```

4. VS Code ウィンドウをリロード
   - macOS: `Cmd + R`
   - Windows: `Ctrl + R`

---

## 動作確認

### テスト1: インスペクターで動作確認

```bash
npm run inspector
```

MCPインスペクターが起動し、以下のツールが表示されるはずです:
- get_stock_price
- analyze_stock
- compare_stocks
- find_best_stocks
- get_current_price

### テスト2: Claude/Cline で実際に使用

Claude Desktop または Cline を開いて、以下のように質問してください:

```
トヨタ自動車（7203）を分析してください
```

正常に動作していれば、株価データと投資判断が表示されます。

---

## 使用例

### 例1: 単一銘柄の詳細分析
```
ソニーグループ（6758）の短期・中期・長期の投資判断を教えてください
```

### 例2: 複数銘柄の比較
```
以下の銘柄を比較分析してください:
- 7203（トヨタ自動車）
- 6758（ソニーグループ）  
- 9984（ソフトバンクグループ）
```

### 例3: 投資期間別の推奨銘柄
```
短期投資で有望な銘柄TOP5を教えてください。
候補: 7203, 6758, 9984, 8306, 9432, 6861, 4063
```

### 例4: セクター分析
```
自動車セクターの主要3社（7203, 7267, 7201）を分析して、
どの銘柄が最も有望か教えてください
```

---

## 主要な銘柄コード

よく使われる銘柄コード（詳細は stock-symbols.md を参照）:

- **7203**: トヨタ自動車
- **6758**: ソニーグループ
- **9984**: ソフトバンクグループ
- **8306**: 三菱UFJフィナンシャル・グループ
- **9432**: 日本電信電話（NTT）
- **6861**: キーエンス
- **7974**: 任天堂

---

## トラブルシューティング

### Q: MCPツールが表示されない

A: 以下を確認してください:
1. `dist/index.js` ファイルが存在するか（ビルドが成功しているか）
2. 設定ファイルのパスが正しいか（絶対パスを使用）
3. アプリケーションを完全に再起動したか

### Q: 株価データが取得できない

A: 
1. インターネット接続を確認
2. 銘柄コードが正しいか確認（4桁の数字）
3. Yahoo Finance APIがアクセス可能か確認

### Q: ビルドエラーが発生する

A:
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Q: Windowsでsetup.shが実行できない

A:
```cmd
# 手動でインストールとビルド
npm install
npm run build
```

---

## 開発者向け情報

### ファイル構成

```
japan-stock-mcp/
├── src/
│   ├── index.ts           # MCPサーバーメイン
│   ├── stock-api.ts       # 株価データ取得API
│   └── stock-analyzer.ts  # 株価分析ロジック
├── dist/                  # ビルド出力（自動生成）
├── package.json           # 依存関係定義
├── tsconfig.json         # TypeScript設定
├── README.md             # プロジェクト説明
├── QUICKSTART.md         # クイックスタート
└── setup.sh              # セットアップスクリプト
```

### カスタマイズ

分析ロジックをカスタマイズする場合:
- `src/stock-analyzer.ts` を編集
- `npm run build` で再ビルド
- アプリケーションを再起動

開発モード（自動再ビルド）:
```bash
npm run watch
```

---

## 注意事項

⚠️ **重要な免責事項**

- 本ツールは**情報提供のみ**を目的としており、**投資助言ではありません**
- 投資判断は**ご自身の責任**で行ってください
- テクニカル分析のみに基づいており、ファンダメンタル分析は含まれていません
- 株価データには遅延が含まれる場合があります
- 過去のパフォーマンスは将来の結果を保証するものではありません

---

## サポート・フィードバック

問題が発生した場合や改善要望がある場合は、GitHubのIssuesで報告してください。

---

## ライセンス

MIT License
