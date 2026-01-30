#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { StockAnalyzer } from './stock-analyzer.js';
import { StockAPIClient } from './stock-api.js';

// Zodスキーマ定義
const GetStockPriceSchema = z.object({
  symbol: z.string().describe('銘柄コード（例: 7203 トヨタ自動車）'),
  period: z.enum(['1mo', '3mo', '6mo', '1y']).optional().describe('取得期間（デフォルト: 1mo）'),
});

const AnalyzeStockSchema = z.object({
  symbol: z.string().describe('銘柄コード（例: 7203 トヨタ自動車）'),
});

const CompareStocksSchema = z.object({
  symbols: z.array(z.string()).describe('比較する銘柄コードのリスト（例: ["7203", "6758", "9984"]）'),
});

const FindBestStocksSchema = z.object({
  symbols: z.array(z.string()).describe('分析する銘柄コードのリスト'),
  timeframe: z.enum(['short', 'medium', 'long']).describe('投資期間（short: 短期, medium: 中期, long: 長期）'),
  topN: z.number().optional().describe('上位N銘柄を返す（デフォルト: 5）'),
});

class JapanStockMCPServer {
  private server: Server;
  private analyzer: StockAnalyzer;
  private apiClient: StockAPIClient;

  constructor() {
    this.server = new Server(
      {
        name: 'japan-stock-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.analyzer = new StockAnalyzer();
    this.apiClient = new StockAPIClient();

    this.setupToolHandlers();
    
    // エラーハンドリング
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // ツールリスト
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'get_stock_price',
          description: '指定した銘柄の株価データを取得します。日足データとして日付、始値、高値、安値、終値、出来高を返します。',
          inputSchema: {
            type: 'object',
            properties: {
              symbol: {
                type: 'string',
                description: '銘柄コード（例: 7203 トヨタ自動車）',
              },
              period: {
                type: 'string',
                enum: ['1mo', '3mo', '6mo', '1y'],
                description: '取得期間（デフォルト: 1mo）',
              },
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
              symbol: {
                type: 'string',
                description: '銘柄コード（例: 7203 トヨタ自動車）',
              },
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
              symbols: {
                type: 'array',
                items: { type: 'string' },
                description: '比較する銘柄コードのリスト（例: ["7203", "6758", "9984"]）',
              },
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
              symbols: {
                type: 'array',
                items: { type: 'string' },
                description: '分析する銘柄コードのリスト',
              },
              timeframe: {
                type: 'string',
                enum: ['short', 'medium', 'long'],
                description: '投資期間（short: 短期（1ヶ月以内）, medium: 中期（3-6ヶ月）, long: 長期（6ヶ月以上））',
              },
              topN: {
                type: 'number',
                description: '上位N銘柄を返す（デフォルト: 5）',
              },
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
              symbol: {
                type: 'string',
                description: '銘柄コード（例: 7203 トヨタ自動車）',
              },
            },
            required: ['symbol'],
          },
        },
      ];

      return { tools };
    });

    // ツール実行
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'get_stock_price':
            return await this.handleGetStockPrice(request.params.arguments);

          case 'analyze_stock':
            return await this.handleAnalyzeStock(request.params.arguments);

          case 'compare_stocks':
            return await this.handleCompareStocks(request.params.arguments);

          case 'find_best_stocks':
            return await this.handleFindBestStocks(request.params.arguments);

          case 'get_current_price':
            return await this.handleGetCurrentPrice(request.params.arguments);

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `エラーが発生しました: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  private async handleGetStockPrice(args: unknown) {
    const { symbol, period = '1mo' } = GetStockPriceSchema.parse(args);
    const data = await this.apiClient.getStockData(symbol, period);

    const text = `# ${symbol} 株価データ (${period})\n\n` +
      `取得件数: ${data.length}件\n\n` +
      `最新価格: ${data[data.length - 1].close.toFixed(2)}円\n` +
      `期間高値: ${Math.max(...data.map(d => d.high)).toFixed(2)}円\n` +
      `期間安値: ${Math.min(...data.map(d => d.low)).toFixed(2)}円\n\n` +
      `直近10日の終値:\n` +
      data.slice(-10).map(d => `${d.date}: ${d.close.toFixed(2)}円`).join('\n');

    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  }

  private async handleAnalyzeStock(args: unknown) {
    const { symbol } = AnalyzeStockSchema.parse(args);
    const analysis = await this.analyzer.analyzeStock(symbol);

    const text = `# ${symbol} 株価分析レポート\n\n` +
      `現在価格: ${analysis.currentPrice.toFixed(2)}円\n\n` +
      `## テクニカル指標\n` +
      `- RSI(14): ${analysis.technicalIndicators.rsi.toFixed(2)}\n` +
      `- MACD: ${analysis.technicalIndicators.macd.toFixed(2)}\n` +
      `- シグナル: ${analysis.technicalIndicators.signal.toFixed(2)}\n` +
      `- 20日移動平均: ${analysis.technicalIndicators.sma20.toFixed(2)}円\n` +
      `- 50日移動平均: ${analysis.technicalIndicators.sma50.toFixed(2)}円\n` +
      `- 200日移動平均: ${analysis.technicalIndicators.sma200.toFixed(2)}円\n\n` +
      `## 短期投資判断（1ヶ月以内）\n` +
      `シグナル: **${analysis.shortTerm.signal}**\n` +
      `スコア: ${analysis.shortTerm.score}/100\n` +
      `理由:\n${analysis.shortTerm.reasons.map(r => `- ${r}`).join('\n')}\n\n` +
      `## 中期投資判断（3-6ヶ月）\n` +
      `シグナル: **${analysis.mediumTerm.signal}**\n` +
      `スコア: ${analysis.mediumTerm.score}/100\n` +
      `理由:\n${analysis.mediumTerm.reasons.map(r => `- ${r}`).join('\n')}\n\n` +
      `## 長期投資判断（6ヶ月以上）\n` +
      `シグナル: **${analysis.longTerm.signal}**\n` +
      `スコア: ${analysis.longTerm.score}/100\n` +
      `理由:\n${analysis.longTerm.reasons.map(r => `- ${r}`).join('\n')}`;

    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  }

  private async handleCompareStocks(args: unknown) {
    const { symbols } = CompareStocksSchema.parse(args);
    const results = await this.analyzer.analyzeMultipleStocks(symbols);

    let text = `# 銘柄比較分析\n\n`;
    text += `## 短期（1ヶ月以内）ランキング\n`;
    const shortRanking = [...results].sort((a, b) => b.shortTerm.score - a.shortTerm.score);
    shortRanking.forEach((r, i) => {
      text += `${i + 1}. ${r.symbol} - ${r.shortTerm.signal} (スコア: ${r.shortTerm.score})\n`;
    });

    text += `\n## 中期（3-6ヶ月）ランキング\n`;
    const mediumRanking = [...results].sort((a, b) => b.mediumTerm.score - a.mediumTerm.score);
    mediumRanking.forEach((r, i) => {
      text += `${i + 1}. ${r.symbol} - ${r.mediumTerm.signal} (スコア: ${r.mediumTerm.score})\n`;
    });

    text += `\n## 長期（6ヶ月以上）ランキング\n`;
    const longRanking = [...results].sort((a, b) => b.longTerm.score - a.longTerm.score);
    longRanking.forEach((r, i) => {
      text += `${i + 1}. ${r.symbol} - ${r.longTerm.signal} (スコア: ${r.longTerm.score})\n`;
    });

    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  }

  private async handleFindBestStocks(args: unknown) {
    const { symbols, timeframe, topN = 5 } = FindBestStocksSchema.parse(args);
    const results = await this.analyzer.analyzeMultipleStocks(symbols);

    const timeframeMap = {
      short: 'shortTerm',
      medium: 'mediumTerm',
      long: 'longTerm',
    } as const;

    const timeframeKey = timeframeMap[timeframe];
    const sorted = [...results].sort((a, b) => 
      b[timeframeKey].score - a[timeframeKey].score
    );

    const top = sorted.slice(0, topN);

    const timeframeNames = {
      short: '短期（1ヶ月以内）',
      medium: '中期（3-6ヶ月）',
      long: '長期（6ヶ月以上）',
    };

    let text = `# ${timeframeNames[timeframe]}で有望な銘柄TOP${topN}\n\n`;
    top.forEach((stock, i) => {
      const analysis = stock[timeframeKey];
      text += `## ${i + 1}位: ${stock.symbol}\n`;
      text += `- シグナル: **${analysis.signal}**\n`;
      text += `- スコア: ${analysis.score}/100\n`;
      text += `- 現在価格: ${stock.currentPrice.toFixed(2)}円\n`;
      text += `- 判断理由:\n${analysis.reasons.map(r => `  - ${r}`).join('\n')}\n\n`;
    });

    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  }

  private async handleGetCurrentPrice(args: unknown) {
    const { symbol } = z.object({ symbol: z.string() }).parse(args);
    const info = await this.apiClient.getCurrentPrice(symbol);

    const text = `# ${info.symbol} 現在価格\n\n` +
      `現在価格: ${info.currentPrice.toFixed(2)}円\n` +
      `前日比: ${info.change >= 0 ? '+' : ''}${info.change.toFixed(2)}円\n` +
      `変動率: ${info.changePercent >= 0 ? '+' : ''}${info.changePercent.toFixed(2)}%\n` +
      `出来高: ${info.volume.toLocaleString()}株`;

    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Japan Stock MCP Server running on stdio');
  }
}

const server = new JapanStockMCPServer();
server.run().catch(console.error);
