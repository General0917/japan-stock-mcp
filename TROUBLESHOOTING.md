# トラブルシューティングガイド

## エラー: "財務データの取得に失敗しました: Request failed with status code 401"

### 原因

Yahoo Finance APIへのアクセスが401エラー（認証エラー）で拒否されています。これは以下の理由で発生します:

1. Yahoo Finance APIのアクセス制限が強化された
2. IPアドレスからのリクエストが多すぎる
3. User-Agentヘッダーが認識されない

### 解決方法

#### 方法1: Pythonのyfinanceライブラリを使用（推奨）

yfinanceライブラリは、Yahoo Finance APIへのより信頼性の高いアクセス方法を提供します。

**ステップ1: Pythonのインストール確認**

```bash
python3 --version
```

Pythonがインストールされていない場合:
- **macOS**: `brew install python3`
- **Ubuntu**: `sudo apt install python3 python3-pip`
- **Windows**: [python.org](https://www.python.org/downloads/)からダウンロード

**ステップ2: yfinanceのインストール**

```bash
pip3 install yfinance
```

または

```bash
pip3 install yfinance --break-system-packages
```

**ステップ3: 動作確認**

```bash
python3 scripts/fetch_financials.py 7203
```

正常に動作すれば、JSON形式でデータが表示されます。

**ステップ4: MCPサーバーを再ビルド**

```bash
npm run build
```

これで、ファンダメンタルズ分析が動作するようになります。

---

#### 方法2: 環境変数でプロキシを設定

会社のネットワークなどでプロキシが必要な場合:

```bash
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
```

---

#### 方法3: しばらく待ってから再試行

Yahoo Finance APIにはレート制限があります。連続して多くのリクエストを送ると一時的にブロックされます。

**推奨:**
- 5-10分待ってから再試行
- 一度に多くの銘柄を分析しない（5銘柄以下を推奨）
- リクエスト間に間隔を空ける

---

#### 方法4: テクニカル分析のみを使用

ファンダメンタルズ分析が不要な場合は、テクニカル分析のみを使用できます:

```
トヨタ自動車（7203）をテクニカル分析してください
```

`analyze_stock`ツールは株価データのみを使用するため、401エラーの影響を受けません。

---

## その他のエラー

### エラー: "python3: command not found"

**原因**: Pythonがインストールされていません。

**解決方法**:
- macOS: `brew install python3`
- Ubuntu: `sudo apt install python3`
- Windows: [python.org](https://www.python.org/downloads/)

### エラー: "ModuleNotFoundError: No module named 'yfinance'"

**原因**: yfinanceがインストールされていません。

**解決方法**:
```bash
pip3 install yfinance
```

### エラー: "株価データの取得に失敗しました"

**原因**: 
- 銘柄コードが間違っている
- Yahoo Finance APIがダウンしている
- ネットワーク接続の問題

**解決方法**:
1. 銘柄コードを確認（4桁の数字）
2. インターネット接続を確認
3. [Yahoo Finance](https://finance.yahoo.com/)が正常に動作しているか確認

---

## テスト方法

### 1. Pythonスクリプトのテスト

```bash
python3 scripts/fetch_financials.py 7203
```

成功すると、JSON形式でデータが表示されます。

### 2. MCPサーバーのテスト

```bash
npm run inspector
```

MCPインスペクターが起動し、利用可能なツールが表示されます。

### 3. 個別ツールのテスト

**株価データ（問題なく動作するはず）:**
```
トヨタ自動車（7203）の株価データを取得してください
```

**テクニカル分析（問題なく動作するはず）:**
```
トヨタ自動車（7203）をテクニカル分析してください
```

**ファンダメンタルズ分析（yfinance必要）:**
```
トヨタ自動車（7203）のファンダメンタルズを分析してください
```

**総合分析（yfinance必要）:**
```
トヨタ自動車（7203）を総合的に分析してください
```

---

## よくある質問

### Q: yfinanceなしでも使えますか？

A: はい、テクニカル分析機能は問題なく使えます。以下のツールが利用可能です:
- `get_stock_price`: 株価データ取得
- `analyze_stock`: テクニカル分析
- `compare_stocks`: 複数銘柄のテクニカル比較
- `find_best_stocks`: 最適銘柄検索
- `get_current_price`: 現在価格取得

ファンダメンタルズ分析（`get_fundamentals`、`analyze_comprehensive`）にはyfinanceが必要です。

### Q: Windowsで動作しますか？

A: はい、以下が必要です:
1. Node.js 18以上
2. Python 3.8以上（ファンダメンタルズ分析を使う場合）
3. yfinanceライブラリ

### Q: データの精度は？

A: 
- **株価データ**: Yahoo Finance APIから直接取得（高精度）
- **財務データ**: yfinanceライブラリ経由で取得（高精度）
- どちらも若干の遅延がある場合があります

### Q: 商用利用は可能ですか？

A: 
- 本MCPサーバー自体: MITライセンス（商用利用可）
- Yahoo Finance API: 個人利用のみ推奨
- 投資判断: 情報提供のみ、投資助言ではありません

---

## サポート

問題が解決しない場合は、以下の情報を添えてGitHub Issuesで報告してください:

1. エラーメッセージの全文
2. 実行したコマンド
3. 環境情報（OS、Node.jsバージョン、Pythonバージョン）
4. `python3 scripts/fetch_financials.py 7203`の実行結果
