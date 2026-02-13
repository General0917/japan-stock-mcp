# テストエラーのトラブルシューティング

## エラー: `module is not defined in ES module scope`

このエラーは、古い設定ファイル（`jest.config.js`または`jest.config.ts`）が残っている場合に発生します。

### 解決方法（Windows）

1. **クリーンアップスクリプトを実行**
   ```cmd
   cleanup.bat
   ```

2. **手動でクリーンアップする場合**
   ```cmd
   # 古い設定ファイルを削除
   del jest.config.js
   del jest.config.ts
   
   # node_modulesを削除
   rmdir /s /q node_modules
   
   # 再インストール
   npm install
   npm run build
   npm test
   ```

### 解決方法（macOS/Linux）

1. **クリーンアップスクリプトを実行**
   ```bash
   chmod +x cleanup.sh
   ./cleanup.sh
   ```

2. **手動でクリーンアップする場合**
   ```bash
   # 古い設定ファイルを削除
   rm -f jest.config.js jest.config.ts
   
   # node_modulesを削除
   rm -rf node_modules
   
   # 再インストール
   npm install
   npm run build
   npm test
   ```

## 正しい設定ファイル

✅ **使用すべきファイル**: `jest.config.cjs`
❌ **削除すべきファイル**: `jest.config.js`, `jest.config.ts`

## テスト実行手順

```bash
# 1. クリーンアップ（初回のみ）
cleanup.bat        # Windows
./cleanup.sh       # macOS/Linux

# 2. 依存関係のインストール
npm install

# 3. ビルド
npm run build

# 4. テスト実行
npm test

# 5. カバレッジレポート生成
npm run test:coverage
```

## その他のエラー

### `Cannot find module`

```bash
# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install
```

### `TypeScript compilation errors`

```bash
# ビルドを再実行
npm run build
```

### `Test timeout`

テストがタイムアウトする場合、`jest.config.cjs`の`testTimeout`を増やしてください：

```javascript
module.exports = {
  // ...
  testTimeout: 30000, // 30秒
};
```

## 確認コマンド

```bash
# 現在の設定ファイルを確認
dir jest.config.*     # Windows
ls -la jest.config.*  # macOS/Linux

# 期待される出力: jest.config.cjs のみ
```
