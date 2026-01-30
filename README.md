# 日本株式分析MCPサーバー

日本株の株価データを取得・分析し、短期・中期・長期の投資判断を提供するMCP（Model Context Protocol）サーバーです。

## 機能

### 提供ツール

1. **get_stock_price** - 株価データ取得
   - 指定期間の日足データ（始値、高値、安値、終値、出来高）を取得

2. **analyze_stock** - 銘柄分析
   - テクニカル指標（RSI、MACD、移動平均線）を計算
   - 短期・中期・長期の投資判断を提供
   - 各判断にスコアと詳細な理由を付与

3. **compare_stocks** - 複数銘柄比較
   - 複数銘柄を一括分析
   - 短期・中期・長期それぞれでランキング表示

4. **find_best_stocks** - 最適銘柄検索
   - 指定した投資期間で最も有望な銘柄をランキング
   - TOP N形式で推奨銘柄を表示

5. **get_current_price** - 現在価格取得
   - リアルタイムの株価情報
   - 前日比と変動率を表示

### 分析手法

#### 短期分析（1ヶ月以内）
- RSI（買われすぎ・売られすぎ判定）
- MACD（トレンド転換検出）
- 20日移動平均線
- 直近のモメンタム

#### 中期分析（3-6ヶ月）
- 50日移動平均線
- ゴールデンクロス・デッドクロス
- 3ヶ月トレンド
- ボラティリティ分析

#### 長期分析（6ヶ月以上）
- 200日移動平均線
- 年間トレンド
- 52週高値・安値との位置関係
- トレンドの一貫性

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd japan-stock-mcp
npm install
```

### 2. ビルド

```bash
npm run build
```

### 3. Claude DesktopまたはCline用の設定

#### Claude Desktop の場合

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) または
`%APPDATA%\Claude\claude_desktop_config.json` (Windows) に以下を追加:

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

#### Cline (VS Code拡張) の場合

VS Codeの設定 (settings.json) に以下を追加:

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

### 4. サーバーの起動確認

MCPインスペクターでテスト:

```bash
npm run inspector
```

## 使用例

### Claude Desktop / Cline での使用

```
トヨタ自動車（7203）を分析してください
```

```
短期で有望な銘柄を教えてください。候補は7203、6758、9984です。
```

```
以下の銘柄を比較分析してください:
- 7203（トヨタ自動車）
- 6758（ソニーグループ）
- 9984（ソフトバンクグループ）
```

### 主要銘柄コード例

- 7203: トヨタ自動車
- 6758: ソニーグループ
- 9984: ソフトバンクグループ
- 8306: 三菱UFJフィナンシャル・グループ
- 9432: 日本電信電話（NTT）
- 6861: キーエンス
- 4063: 信越化学工業
- 6098: リクルートホールディングス
- 7974: 任天堂
- 4502: 武田薬品工業

## データソース

Yahoo Finance APIを使用して株価データを取得しています。

## 技術スタック

- TypeScript
- @modelcontextprotocol/sdk
- axios (HTTPクライアント)
- zod (スキーマバリデーション)

## 開発

### ウォッチモード

```bash
npm run watch
```

### ビルド

```bash
npm run build
```

### インスペクター起動

```bash
npm run inspector
```

## 注意事項

- 本ツールは投資助言を目的としたものではありません
- 投資判断は自己責任で行ってください
- 株価データには遅延が含まれる場合があります
- テクニカル分析のみに基づく判断であり、ファンダメンタル分析は含まれていません

## ライセンス

MIT
