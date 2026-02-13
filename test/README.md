# テストドキュメント

## 概要

このディレクトリには、日本株式分析MCPサーバーの包括的なテストスイートが含まれています。

## テストカバレッジ

### ユニットテスト

#### 1. StockAPIClient (`stock-api.test.ts`)
- ✅ テクニカル指標計算（SMA、RSI、MACD）
- ✅ 上昇/下降トレンドの検出
- ✅ エッジケース（フラット価格、ギャップ）
- ✅ 最小データポイント処理
- ✅ 高ボラティリティ対応

#### 2. StockAnalyzer (`stock-analyzer.test.ts`)
- ✅ 複数銘柄比較
- ✅ 最適銘柄検索（短期/中期/長期）
- ✅ シグナル生成（BUY/SELL/HOLD）
- ✅ スコア計算とバリデーション
- ✅ エラーハンドリング

#### 3. FundamentalsAPIClient (`fundamentals-api.test.ts`)
- ✅ 財務健全性分析
- ✅ バリュエーション分析
- ✅ 収益性分析
- ✅ null/undefinedデータ処理
- ✅ 優良企業、成長企業、割安企業、赤字企業の分析
- ✅ 推奨レベル生成（STRONG_BUY～STRONG_SELL）

#### 4. AdvancedTechnicalIndicators (`advanced-indicators.test.ts`)
- ✅ ボリンジャーバンド計算
- ✅ 一目均衡表計算
- ✅ ATR（ボラティリティ）計算
- ✅ ストキャスティクス計算
- ✅ シグナル検出（スクイーズ、拡大、買われすぎ/売られすぎ）

#### 5. PortfolioOptimizer (`portfolio-optimizer.test.ts`)
- ✅ ポートフォリオ最適化（3つの手法）
- ✅ 相関分析
- ✅ リスク分析（ベータ、VaR、ドローダウン）
- ✅ シャープレシオ計算
- ✅ ウェイト配分の妥当性検証

#### 6. SectorAnalyzer (`sector-analyzer.test.ts`)
- ✅ セクター比較
- ✅ セクター内ランキング
- ✅ カスタムスクリーニング
- ✅ 複数条件フィルタリング
- ✅ マッチスコア計算

### 統合テスト (`integration.test.ts`)

- ✅ 完全な株式分析ワークフロー
- ✅ ポートフォリオ分析ワークフロー
- ✅ エラーハンドリングと堅牢性
- ✅ データ整合性
- ✅ パフォーマンステスト
- ✅ 推奨ロジックの検証

## テストの実行

### すべてのテストを実行

```bash
npm test
```

### ウォッチモードで実行

```bash
npm run test:watch
```

### カバレッジレポート生成

```bash
npm run test:coverage
```

カバレッジレポートは `coverage/` ディレクトリに生成されます。

### 特定のテストファイルを実行

```bash
npm test -- stock-api.test.ts
```

### 特定のテストケースを実行

```bash
npm test -- -t "should calculate SMA correctly"
```

## テストの構造

```
test/
├── test-utils.ts              # テストユーティリティとモックデータ
├── stock-api.test.ts          # StockAPIClientのテスト
├── stock-analyzer.test.ts     # StockAnalyzerのテスト
├── fundamentals-api.test.ts   # FundamentalsAPIClientのテスト
├── advanced-indicators.test.ts # AdvancedTechnicalIndicatorsのテスト
├── portfolio-optimizer.test.ts # PortfolioOptimizerのテスト
├── sector-analyzer.test.ts    # SectorAnalyzerのテスト
└── integration.test.ts        # 統合テスト
```

## モックデータ

`test-utils.ts`には以下のモックデータが含まれています：

- **mockHealthyCompany**: 健全な財務状態の企業
- **mockGrowthCompany**: 高成長企業
- **mockValueCompany**: 割安企業
- **mockIncompleteCompany**: データ欠損企業
- **mockDeficitCompany**: 赤字企業

## テストカバレッジ目標

- **ライン: 80%以上**
- **関数: 85%以上**
- **ブランチ: 75%以上**

## 継続的インテグレーション

テストは以下のタイミングで自動実行されます：

1. コミット前（pre-commit hook）
2. プルリクエスト作成時
3. マージ前

## トラブルシューティング

### テストが失敗する場合

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **ビルドの実行**
   ```bash
   npm run build
   ```

3. **キャッシュのクリア**
   ```bash
   npm test -- --clearCache
   ```

### タイムアウトエラー

一部のテストでタイムアウトが発生する場合、jest.config.tsの`testTimeout`を増やしてください。

```typescript
export default {
  // ...
  testTimeout: 10000, // 10秒
};
```

## ベストプラクティス

1. **テストは独立させる**: 各テストは他のテストに依存しない
2. **モックを使用**: 外部APIへの実際の呼び出しは避ける
3. **エッジケースをテスト**: null、undefined、空配列などをテスト
4. **明確なテスト名**: テストケースの内容が名前からわかるように
5. **AAA パターン**: Arrange（準備）、Act（実行）、Assert（検証）

## 新しいテストの追加

新しい機能を追加した場合：

1. 対応するテストファイルを作成
2. ユニットテストを追加
3. 必要に応じて統合テストを追加
4. カバレッジを確認

## レポート

カバレッジレポートはHTMLで生成されます：

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## 参考資料

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript with Jest](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
