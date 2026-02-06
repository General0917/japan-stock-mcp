#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { StockAnalyzer } from './stock-analyzer.js';
import { StockAPIClient } from './stock-api.js';
import { FundamentalsAPIClient } from './fundamentals-api.js';
import { AdvancedTechnicalIndicators } from './advanced-indicators.js';
import { CashFlowAnalyzer } from './cashflow-analyzer.js';
import { SectorAnalyzer } from './sector-analyzer.js';
import { PortfolioOptimizer } from './portfolio-optimizer.js';

// Zodスキーマ定義
const GetStockPriceSchema = z.object({
  symbol: z.string(),
  period: z.enum(['1mo', '3mo', '6mo', '1y']).optional(),
});

const SymbolSchema = z.object({
  symbol: z.string(),
});

const SymbolsSchema = z.object({
  symbols: z.array(z.string()),
});

const FindBestStocksSchema = z.object({
  symbols: z.array(z.string()),
  timeframe: z.enum(['short', 'medium', 'long']),
  topN: z.number().optional(),
});

const ScreenStocksSchema = z.object({
  symbols: z.array(z.string()),
  criteria: z.record(z.any()),
});

const OptimizePortfolioSchema = z.object({
  symbols: z.array(z.string()),
  method: z.enum(['MIN_VARIANCE', 'MAX_SHARPE', 'EQUAL_WEIGHT']).optional(),
});

class JapanStockMCPServer {
  private server: Server;
  private analyzer: StockAnalyzer;
  private apiClient: StockAPIClient;
  private fundamentalsClient: FundamentalsAPIClient;
  private advancedIndicators: AdvancedTechnicalIndicators;
  private cashFlowAnalyzer: CashFlowAnalyzer;
  private sectorAnalyzer: SectorAnalyzer;
  private portfolioOptimizer: PortfolioOptimizer;

  constructor() {
    this.server = new Server(
      {
        name: 'japan-stock-mcp-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.analyzer = new StockAnalyzer();
    this.apiClient = new StockAPIClient();
    this.fundamentalsClient = new FundamentalsAPIClient();
    this.advancedIndicators = new AdvancedTechnicalIndicators();
    this.cashFlowAnalyzer = new CashFlowAnalyzer();
    this.sectorAnalyzer = new SectorAnalyzer();
    this.portfolioOptimizer = new PortfolioOptimizer();

    this.setupHandlers();
  }

  private setupHandlers() {
    // ツール一覧
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_stock_price',
            description: '指定した銘柄の株価データを取得します。日足データとして日付、始値、高値、安値、終値、出来高を返します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: '銘柄コード（例: 7203 トヨタ自動車）' },
                period: { type: 'string', enum: ['1mo', '3mo', '6mo', '1y'], description: '取得期間（デフォルト: 1mo）' },
              },
              required: ['symbol'],
            },
          },
          {
            name: 'analyze_stock',
            description: '銘柄を分析し、短期・中期・長期の投資判断を提供します。テクニカル指標（RSI、MACD、移動平均線）を用いて、各期間での買い/売り/保留のシグナルとその理由を返します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: '銘柄コード（例: 7203 トヨタ自動車）' },
              },
              required: ['symbol'],
            },
          },
          {
            name: 'compare_stocks',
            description: '複数の銘柄を比較分析します。各銘柄の短期・中期・長期の投資スコアを比較し、どの銘柄がどの期間で有望かを判断できます。',
            inputSchema: {
              type: 'object',
              properties: {
                symbols: { type: 'array', items: { type: 'string' }, description: '比較する銘柄コードのリスト（例: ["7203", "6758", "9984"]）' },
              },
              required: ['symbols'],
            },
          },
          {
            name: 'find_best_stocks',
            description: '指定した投資期間で最も有望な銘柄をランキング形式で返します。短期・中期・長期から選択でき、スコアの高い順に銘柄を推奨します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbols: { type: 'array', items: { type: 'string' }, description: '分析する銘柄コードのリスト' },
                timeframe: { type: 'string', enum: ['short', 'medium', 'long'], description: '投資期間' },
                topN: { type: 'number', description: '上位N銘柄を返す（デフォルト: 5）' },
              },
              required: ['symbols', 'timeframe'],
            },
          },
          {
            name: 'get_current_price',
            description: '銘柄の現在価格と変動情報を取得します。現在価格、前日比、変動率、出来高を返します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: '銘柄コード（例: 7203 トヨタ自動車）' },
              },
              required: ['symbol'],
            },
          },
          {
            name: 'get_fundamentals',
            description: '企業の財務データとファンダメンタルズ分析を取得します。PER、PBR、ROE、配当利回り、財務健全性、バリュエーション、収益性の評価を返します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: '銘柄コード（例: 7203 トヨタ自動車）' },
              },
              required: ['symbol'],
            },
          },
          {
            name: 'analyze_comprehensive',
            description: 'テクニカル分析とファンダメンタルズ分析を統合した総合分析を行います。株価のトレンドと企業業績の両面から投資判断を提供します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: '銘柄コード（例: 7203 トヨタ自動車）' },
              },
              required: ['symbol'],
            },
          },
          {
            name: 'get_advanced_technicals',
            description: '高度なテクニカル指標を取得します。ボリンジャーバンド、一目均衡表、ATR、ストキャスティクスを分析します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: '銘柄コード（例: 7203 トヨタ自動車）' },
              },
              required: ['symbol'],
            },
          },
          {
            name: 'screen_stocks',
            description: 'カスタム条件で銘柄をスクリーニングします。PER、PBR、ROE、配当利回りなどの条件を指定して、条件に合致する銘柄を抽出します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbols: { type: 'array', items: { type: 'string' }, description: 'スクリーニング対象の銘柄コードリスト' },
                criteria: { type: 'object', description: 'スクリーニング条件' },
              },
              required: ['symbols', 'criteria'],
            },
          },
          {
            name: 'compare_sector',
            description: 'セクター比較分析を行います。複数銘柄をセクター平均と比較し、業界内でのランキングを表示します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbols: { type: 'array', items: { type: 'string' }, description: '比較する銘柄コードのリスト' },
              },
              required: ['symbols'],
            },
          },
          {
            name: 'optimize_portfolio',
            description: 'ポートフォリオ最適化を行います。複数銘柄の最適な配分比率を計算し、期待リターンとリスクを提示します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbols: { type: 'array', items: { type: 'string' }, description: 'ポートフォリオを構成する銘柄コードリスト' },
                method: { type: 'string', enum: ['MIN_VARIANCE', 'MAX_SHARPE', 'EQUAL_WEIGHT'], description: '最適化手法' },
              },
              required: ['symbols'],
            },
          },
          {
            name: 'analyze_correlation',
            description: '銘柄間の相関分析を行います。相関行列を計算し、分散効果とヘッジ効果を評価します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbols: { type: 'array', items: { type: 'string' }, description: '分析する銘柄コードのリスト' },
              },
              required: ['symbols'],
            },
          },
          {
            name: 'analyze_risk',
            description: 'リスク分析を行います。ベータ値、最大ドローダウン、ボラティリティ、VaR、シャープレシオを計算します。',
            inputSchema: {
              type: 'object',
              properties: {
                symbol: { type: 'string', description: '銘柄コード（例: 7203 トヨタ自動車）' },
              },
              required: ['symbol'],
            },
          },
        ],
      };
    });

    // ツール実行
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'get_stock_price':
            return await this.handleGetStockPrice(args);
          case 'analyze_stock':
            return await this.handleAnalyzeStock(args);
          case 'compare_stocks':
            return await this.handleCompareStocks(args);
          case 'find_best_stocks':
            return await this.handleFindBestStocks(args);
          case 'get_current_price':
            return await this.handleGetCurrentPrice(args);
          case 'get_fundamentals':
            return await this.handleGetFundamentals(args);
          case 'analyze_comprehensive':
            return await this.handleAnalyzeComprehensive(args);
          case 'get_advanced_technicals':
            return await this.handleGetAdvancedTechnicals(args);
          case 'screen_stocks':
            return await this.handleScreenStocks(args);
          case 'compare_sector':
            return await this.handleCompareSector(args);
          case 'optimize_portfolio':
            return await this.handleOptimizePortfolio(args);
          case 'analyze_correlation':
            return await this.handleAnalyzeCorrelation(args);
          case 'analyze_risk':
            return await this.handleAnalyzeRisk(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `エラーが発生しました: ${errorMessage}` }],
          isError: true,
        };
      }
    });
  }

  private async handleGetStockPrice(args: unknown) {
    const { symbol, period = '1mo' } = GetStockPriceSchema.parse(args);
    const data = await this.apiClient.getStockData(symbol, period);

    const text = `# ${symbol} 株価データ（過去${period}）\n\n` +
      `取得件数: ${data.length}件\n\n` +
      `最新データ:\n` +
      `- 日付: ${data[data.length - 1].date}\n` +
      `- 終値: ${data[data.length - 1].close.toFixed(2)}円\n` +
      `- 高値: ${data[data.length - 1].high.toFixed(2)}円\n` +
      `- 安値: ${data[data.length - 1].low.toFixed(2)}円\n` +
      `- 出来高: ${data[data.length - 1].volume.toLocaleString()}`;

    return { content: [{ type: 'text', text }] };
  }

  private async handleAnalyzeStock(args: unknown) {
    const { symbol } = SymbolSchema.parse(args);
    const analysis = await this.analyzer.analyzeStock(symbol);

    const text = `# ${symbol} テクニカル分析\n\n` +
      `## 短期（1ヶ月以内）\n` +
      `- シグナル: **${analysis.shortTerm.signal}**\n` +
      `- スコア: ${analysis.shortTerm.score}/100\n` +
      `- 理由:\n${analysis.shortTerm.reasons.map((r: string) => `  - ${r}`).join('\n')}\n\n` +
      `## 中期（3-6ヶ月）\n` +
      `- シグナル: **${analysis.mediumTerm.signal}**\n` +
      `- スコア: ${analysis.mediumTerm.score}/100\n` +
      `- 理由:\n${analysis.mediumTerm.reasons.map((r: string) => `  - ${r}`).join('\n')}\n\n` +
      `## 長期（6ヶ月以上）\n` +
      `- シグナル: **${analysis.longTerm.signal}**\n` +
      `- スコア: ${analysis.longTerm.score}/100\n` +
      `- 理由:\n${analysis.longTerm.reasons.map((r: string) => `  - ${r}`).join('\n')}`;

    return { content: [{ type: 'text', text }] };
  }

  private async handleCompareStocks(args: unknown) {
    const { symbols } = SymbolsSchema.parse(args);
    const comparisons = await this.analyzer.compareStocks(symbols);

    let text = `# 銘柄比較分析\n\n`;
    comparisons.forEach((comp: { symbol: string; shortTerm: number; mediumTerm: number; longTerm: number }) => {
      text += `## ${comp.symbol}\n`;
      text += `- 短期: ${comp.shortTerm}/100\n`;
      text += `- 中期: ${comp.mediumTerm}/100\n`;
      text += `- 長期: ${comp.longTerm}/100\n\n`;
    });

    return { content: [{ type: 'text', text }] };
  }

  private async handleFindBestStocks(args: unknown) {
    const { symbols, timeframe, topN = 5 } = FindBestStocksSchema.parse(args);
    const ranking = await this.analyzer.findBestStocks(symbols, timeframe, topN);

    let text = `# 投資期間別推奨銘柄（${timeframe}）\n\n`;
    ranking.forEach((item: { symbol: string; score: number; reason: string }, i: number) => {
      text += `${i + 1}. ${item.symbol} - スコア: ${item.score}/100\n`;
      text += `   理由: ${item.reason}\n\n`;
    });

    return { content: [{ type: 'text', text }] };
  }

  private async handleGetCurrentPrice(args: unknown) {
    const { symbol } = SymbolSchema.parse(args);
    const price = await this.apiClient.getCurrentPrice(symbol);

    const text = `# ${symbol} 現在価格\n\n` +
      `- 現在価格: ${price.currentPrice.toFixed(2)}円\n` +
      `- 前日比: ${price.change >= 0 ? '+' : ''}${price.change.toFixed(2)}円\n` +
      `- 変動率: ${price.changePercent >= 0 ? '+' : ''}${price.changePercent.toFixed(2)}%\n` +
      `- 出来高: ${price.volume.toLocaleString()}`;

    return { content: [{ type: 'text', text }] };
  }

  private async handleGetFundamentals(args: unknown) {
    const { symbol } = SymbolSchema.parse(args);
    const data = await this.fundamentalsClient.getFinancialData(symbol);
    const analysis = await this.fundamentalsClient.analyzeFundamentals(data);

    const formatValue = (val: number | undefined | null, suffix: string = '') => 
      val !== undefined && val !== null ? `${val.toFixed(2)}${suffix}` : 'N/A';

    const text = `# ${data.companyName} (${symbol}) ファンダメンタルズ分析\n\n` +
      `## 総合評価: ${analysis.recommendation}\n` +
      `総合スコア: ${analysis.overallScore}/100\n\n` +
      `## 主要財務指標\n` +
      `- PER: ${formatValue(data.per)}\n` +
      `- PBR: ${formatValue(data.pbr)}\n` +
      `- ROE: ${formatValue(data.roe, '%')}\n` +
      `- 配当利回り: ${formatValue(data.dividendYield, '%')}\n` +
      `- 営業利益率: ${formatValue(data.operatingMargin, '%')}\n` +
      `- 純利益率: ${formatValue(data.profitMargin, '%')}\n\n` +
      `## 財務健全性（${analysis.financialHealth.rating}）\n` +
      `スコア: ${analysis.financialHealth.score}/100\n` +
      analysis.financialHealth.reasons.map((r: string) => `- ${r}`).join('\n') + '\n\n' +
      `## バリュエーション（${analysis.valuation.rating}）\n` +
      `スコア: ${analysis.valuation.score}/100\n` +
      analysis.valuation.reasons.map((r: string) => `- ${r}`).join('\n') + '\n\n' +
      `## 収益性（${analysis.profitability.rating}）\n` +
      `スコア: ${analysis.profitability.score}/100\n` +
      analysis.profitability.reasons.map((r: string) => `- ${r}`).join('\n');

    return { content: [{ type: 'text', text }] };
  }

  private async handleAnalyzeComprehensive(args: unknown) {
    const { symbol } = SymbolSchema.parse(args);
    const analysis = await this.analyzer.analyzeComprehensive(symbol);

    const text = `# ${analysis.companyName} (${symbol}) 総合分析レポート\n\n` +
      `## 📊 総合評価\n` +
      `- **推奨: ${analysis.overallRecommendation}**\n` +
      `- 総合スコア: ${analysis.overallScore}/100\n\n` +
      `## 💡 投資サマリー\n` +
      analysis.investmentSummary.map(s => `- ${s}`).join('\n') + '\n\n' +
      `## 💰 ファンダメンタルズ分析\n` +
      `総合評価: ${analysis.fundamentals.recommendation}\n` +
      `- バリュエーション: ${analysis.fundamentals.valuation.rating}\n` +
      `- 財務健全性: ${analysis.fundamentals.financialHealth.rating}\n` +
      `- 収益性: ${analysis.fundamentals.profitability.rating}\n\n` +
      `## 📈 テクニカル分析\n` +
      `現在価格: ${analysis.currentPrice.toFixed(2)}円\n\n` +
      `### 短期: ${analysis.technical.shortTerm.signal} (${analysis.technical.shortTerm.score}/100)\n` +
      `### 中期: ${analysis.technical.mediumTerm.signal} (${analysis.technical.mediumTerm.score}/100)\n` +
      `### 長期: ${analysis.technical.longTerm.signal} (${analysis.technical.longTerm.score}/100)`;

    return { content: [{ type: 'text', text }] };
  }

  private async handleGetAdvancedTechnicals(args: unknown) {
    const { symbol } = SymbolSchema.parse(args);
    const data = await this.apiClient.getStockData(symbol, '6mo');

    const bollinger = this.advancedIndicators.calculateBollingerBands(data);
    const ichimoku = this.advancedIndicators.calculateIchimoku(data);
    const atr = this.advancedIndicators.calculateATR(data);
    const stochastic = this.advancedIndicators.calculateStochastic(data);

    const text = `# ${symbol} 高度なテクニカル分析\n\n` +
      `## ボリンジャーバンド\n` +
      `シグナル: **${bollinger.signal}**\n` +
      `現在価格: ${bollinger.currentPrice.toFixed(2)}円\n` +
      `上限: ${bollinger.currentUpper.toFixed(2)}円\n` +
      `中心線: ${bollinger.currentMiddle.toFixed(2)}円\n` +
      `下限: ${bollinger.currentLower.toFixed(2)}円\n` +
      bollinger.analysis.map(a => `- ${a}`).join('\n') + '\n\n' +
      `## 一目均衡表\n` +
      `シグナル: **${ichimoku.signal}**\n` +
      ichimoku.analysis.map(a => `- ${a}`).join('\n') + '\n\n' +
      `## ATR（ボラティリティ）\n` +
      atr.analysis.map(a => `- ${a}`).join('\n') + '\n\n' +
      `## ストキャスティクス\n` +
      `シグナル: **${stochastic.signal}**\n` +
      stochastic.analysis.map(a => `- ${a}`).join('\n');

    return { content: [{ type: 'text', text }] };
  }

  private async handleScreenStocks(args: unknown) {
    const { symbols, criteria } = ScreenStocksSchema.parse(args);
    const results = await this.sectorAnalyzer.screenStocks(symbols, criteria);

    let text = `# スクリーニング結果\n\n合致銘柄: ${results.length}件\n\n`;
    results.forEach((r, i) => {
      text += `${i + 1}. ${r.companyName} (${r.symbol})\n`;
      text += `   マッチ度: ${r.matchScore.toFixed(0)}%\n`;
      text += r.highlights.map(h => `   - ${h}`).join('\n') + '\n\n';
    });

    return { content: [{ type: 'text', text }] };
  }

  private async handleCompareSector(args: unknown) {
    const { symbols } = SymbolsSchema.parse(args);
    const results = await this.sectorAnalyzer.compareSector(symbols);

    let text = `# セクター比較分析\n\n`;
    results.forEach(r => {
      text += `## ${r.companyName} (${r.symbol})\n`;
      text += `セクター: ${r.sector}\n`;
      text += `ランキング: ${r.sectorRank}位/${r.totalInSector}社\n`;
      text += r.analysis.map(a => `- ${a}`).join('\n') + '\n\n';
    });

    return { content: [{ type: 'text', text }] };
  }

  private async handleOptimizePortfolio(args: unknown) {
    const { symbols, method = 'MAX_SHARPE' } = OptimizePortfolioSchema.parse(args);
    const result = await this.portfolioOptimizer.optimizePortfolio(symbols, method);

    let text = `# ポートフォリオ最適化\n\n## 最適配分\n`;
    result.symbols.forEach((sym, i) => {
      text += `- ${sym}: ${result.weights[i].toFixed(1)}%\n`;
    });
    text += `\n## パフォーマンス\n`;
    text += `- 期待リターン: ${result.expectedReturn.toFixed(2)}%\n`;
    text += `- リスク: ${result.risk.toFixed(2)}%\n`;
    text += `- シャープレシオ: ${result.sharpeRatio.toFixed(2)}\n\n`;
    text += result.analysis.map(a => `- ${a}`).join('\n');

    return { content: [{ type: 'text', text }] };
  }

  private async handleAnalyzeCorrelation(args: unknown) {
    const { symbols } = SymbolsSchema.parse(args);
    const result = await this.portfolioOptimizer.analyzeCorrelation(symbols);

    let text = `# 相関分析\n\n分散効果スコア: ${result.diversificationScore.toFixed(0)}/100\n\n`;
    text += `## 推奨事項\n`;
    text += result.recommendations.map(r => `- ${r}`).join('\n');

    return { content: [{ type: 'text', text }] };
  }

  private async handleAnalyzeRisk(args: unknown) {
    const { symbol } = SymbolSchema.parse(args);
    const result = await this.portfolioOptimizer.analyzeRisk(symbol);

    const text = `# ${symbol} リスク分析\n\n` +
      result.analysis.map(a => `- ${a}`).join('\n');

    return { content: [{ type: 'text', text }] };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Japan Stock MCP Server running on stdio');
  }
}

const server = new JapanStockMCPServer();
server.run().catch(console.error);
