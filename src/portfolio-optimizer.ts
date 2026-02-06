import { StockAPIClient, StockPrice } from './stock-api.js';

/**
 * ポートフォリオ最適化結果
 */
export interface PortfolioOptimization {
  symbols: string[];
  weights: number[];           // 最適配分比率（%）
  expectedReturn: number;      // 期待リターン（年率%）
  risk: number;               // リスク（標準偏差、年率%）
  sharpeRatio: number;        // シャープレシオ
  method: 'MIN_VARIANCE' | 'MAX_SHARPE' | 'EQUAL_WEIGHT';
  analysis: string[];
}

/**
 * 相関分析結果
 */
export interface CorrelationAnalysis {
  symbols: string[];
  correlationMatrix: number[][];
  diversificationScore: number;  // 分散効果スコア（0-100）
  recommendations: string[];
}

/**
 * リスク分析
 */
export interface RiskAnalysis {
  symbol: string;
  beta?: number;              // ベータ値
  maxDrawdown: number;        // 最大ドローダウン（%）
  volatility: number;         // ボラティリティ（年率%）
  var95: number;             // VaR（95%信頼区間）
  sharpeRatio: number;       // シャープレシオ
  analysis: string[];
}

export class PortfolioOptimizer {
  private apiClient: StockAPIClient;

  constructor() {
    this.apiClient = new StockAPIClient();
  }

  /**
   * ポートフォリオ最適化
   */
  async optimizePortfolio(
    symbols: string[],
    method: 'MIN_VARIANCE' | 'MAX_SHARPE' | 'EQUAL_WEIGHT' = 'MAX_SHARPE'
  ): Promise<PortfolioOptimization> {
    // 各銘柄の過去1年のデータを取得
    const priceData: StockPrice[][] = [];
    for (const symbol of symbols) {
      const data = await this.apiClient.getStockData(symbol, '1y');
      priceData.push(data);
    }

    // リターンを計算
    const returns = this.calculateReturns(priceData);
    
    // 期待リターンと共分散行列を計算
    const expectedReturns = this.calculateExpectedReturns(returns);
    const covarianceMatrix = this.calculateCovarianceMatrix(returns);

    let weights: number[];
    
    switch (method) {
      case 'MIN_VARIANCE':
        weights = this.minimumVarianceWeights(covarianceMatrix);
        break;
      case 'MAX_SHARPE':
        weights = this.maxSharpeWeights(expectedReturns, covarianceMatrix);
        break;
      case 'EQUAL_WEIGHT':
      default:
        weights = new Array(symbols.length).fill(100 / symbols.length);
    }

    // ポートフォリオのリターンとリスクを計算
    const portfolioReturn = this.calculatePortfolioReturn(weights, expectedReturns);
    const portfolioRisk = this.calculatePortfolioRisk(weights, covarianceMatrix);
    const sharpeRatio = portfolioReturn / portfolioRisk;

    const analysis: string[] = [];
    analysis.push(`最適化手法: ${method === 'MIN_VARIANCE' ? '最小分散' : method === 'MAX_SHARPE' ? 'シャープレシオ最大化' : '均等配分'}`);
    analysis.push(`期待リターン: ${portfolioReturn.toFixed(2)}% (年率)`);
    analysis.push(`リスク: ${portfolioRisk.toFixed(2)}% (年率)`);
    analysis.push(`シャープレシオ: ${sharpeRatio.toFixed(2)}`);
    
    // 配分の分析
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    if (maxWeight > 50) {
      analysis.push(`⚠️ 特定銘柄への集中が高い（最大${maxWeight.toFixed(1)}%）`);
    }
    if (minWeight < 5 && method !== 'EQUAL_WEIGHT') {
      analysis.push(`一部銘柄の配分が少ない（最小${minWeight.toFixed(1)}%）`);
    }

    return {
      symbols,
      weights,
      expectedReturn: portfolioReturn,
      risk: portfolioRisk,
      sharpeRatio,
      method,
      analysis,
    };
  }

  /**
   * 相関分析
   */
  async analyzeCorrelation(symbols: string[]): Promise<CorrelationAnalysis> {
    // 各銘柄の過去1年のデータを取得
    const priceData: StockPrice[][] = [];
    for (const symbol of symbols) {
      const data = await this.apiClient.getStockData(symbol, '1y');
      priceData.push(data);
    }

    const returns = this.calculateReturns(priceData);
    const correlationMatrix = this.calculateCorrelationMatrix(returns);

    // 分散効果スコアを計算（相関が低いほど高スコア）
    let sumCorrelation = 0;
    let count = 0;
    for (let i = 0; i < correlationMatrix.length; i++) {
      for (let j = i + 1; j < correlationMatrix[i].length; j++) {
        sumCorrelation += Math.abs(correlationMatrix[i][j]);
        count++;
      }
    }
    const avgCorrelation = count > 0 ? sumCorrelation / count : 0;
    const diversificationScore = Math.max(0, (1 - avgCorrelation) * 100);

    const recommendations: string[] = [];
    
    if (diversificationScore > 70) {
      recommendations.push('✓ 優れた分散効果 - 銘柄間の相関が低い');
    } else if (diversificationScore > 50) {
      recommendations.push('適度な分散効果');
    } else if (diversificationScore > 30) {
      recommendations.push('⚠️ 分散効果が限定的 - 相関が高い銘柄が多い');
    } else {
      recommendations.push('⚠️ 分散効果が低い - 銘柄の見直しを推奨');
    }

    // 高相関ペアを検出
    for (let i = 0; i < correlationMatrix.length; i++) {
      for (let j = i + 1; j < correlationMatrix[i].length; j++) {
        if (correlationMatrix[i][j] > 0.7) {
          recommendations.push(
            `${symbols[i]}と${symbols[j]}の相関が高い (${(correlationMatrix[i][j] * 100).toFixed(0)}%)`
          );
        }
      }
    }

    // 負の相関（ヘッジ効果）を検出
    for (let i = 0; i < correlationMatrix.length; i++) {
      for (let j = i + 1; j < correlationMatrix[i].length; j++) {
        if (correlationMatrix[i][j] < -0.3) {
          recommendations.push(
            `${symbols[i]}と${symbols[j]}は逆相関 - ヘッジ効果あり`
          );
        }
      }
    }

    return {
      symbols,
      correlationMatrix,
      diversificationScore,
      recommendations,
    };
  }

  /**
   * リスク分析
   */
  async analyzeRisk(symbol: string, marketSymbol: string = '1321'): Promise<RiskAnalysis> {
    const data = await this.apiClient.getStockData(symbol, '1y');
    const marketData = await this.apiClient.getStockData(marketSymbol, '1y');

    const returns = this.calculateDailyReturns(data);
    const marketReturns = this.calculateDailyReturns(marketData);

    // ベータ値の計算
    const beta = this.calculateBeta(returns, marketReturns);

    // 最大ドローダウン
    const maxDrawdown = this.calculateMaxDrawdown(data);

    // ボラティリティ（年率）
    const volatility = this.calculateVolatility(returns);

    // VaR（95%信頼区間）
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var95 = Math.abs(sortedReturns[var95Index]) * 100;

    // シャープレシオ（リスクフリーレート0.5%と仮定）
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const annualizedReturn = (Math.pow(1 + avgReturn, 252) - 1) * 100;
    const riskFreeRate = 0.5;
    const sharpeRatio = (annualizedReturn - riskFreeRate) / volatility;

    const analysis: string[] = [];
    
    if (beta !== undefined) {
      if (beta > 1.2) {
        analysis.push(`ベータ値 ${beta.toFixed(2)} - 市場より高リスク・高リターン`);
      } else if (beta > 0.8) {
        analysis.push(`ベータ値 ${beta.toFixed(2)} - 市場並みのリスク`);
      } else {
        analysis.push(`ベータ値 ${beta.toFixed(2)} - 市場より低リスク・安定的`);
      }
    }

    analysis.push(`最大ドローダウン ${maxDrawdown.toFixed(2)}% - ${maxDrawdown > 30 ? '大きな下落リスク' : maxDrawdown > 20 ? '中程度の下落リスク' : '比較的安定'}`);
    analysis.push(`ボラティリティ ${volatility.toFixed(2)}% - ${volatility > 30 ? '高リスク' : volatility > 20 ? '中リスク' : '低リスク'}`);
    analysis.push(`VaR(95%) ${var95.toFixed(2)}% - 5%の確率でこれ以上の損失`);
    analysis.push(`シャープレシオ ${sharpeRatio.toFixed(2)} - ${sharpeRatio > 1 ? '良好なリスク調整後リターン' : sharpeRatio > 0.5 ? '普通' : '低い'}`);

    return {
      symbol,
      beta,
      maxDrawdown,
      volatility,
      var95,
      sharpeRatio,
      analysis,
    };
  }

  // ヘルパーメソッド
  private calculateReturns(priceData: StockPrice[][]): number[][] {
    return priceData.map(prices => this.calculateDailyReturns(prices));
  }

  private calculateDailyReturns(prices: StockPrice[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i].close - prices[i - 1].close) / prices[i - 1].close);
    }
    return returns;
  }

  private calculateExpectedReturns(returns: number[][]): number[] {
    return returns.map(r => {
      const avg = r.reduce((sum, val) => sum + val, 0) / r.length;
      return (Math.pow(1 + avg, 252) - 1) * 100; // 年率換算
    });
  }

  private calculateCovarianceMatrix(returns: number[][]): number[][] {
    const n = returns.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        matrix[i][j] = this.calculateCovariance(returns[i], returns[j]) * 252; // 年率換算
      }
    }

    return matrix;
  }

  private calculateCorrelationMatrix(returns: number[][]): number[][] {
    const n = returns.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        matrix[i][j] = this.calculateCorrelation(returns[i], returns[j]);
      }
    }

    return matrix;
  }

  private calculateCovariance(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += (x[i] - meanX) * (y[i] - meanY);
    }

    return sum / (n - 1);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const cov = this.calculateCovariance(x, y);
    const stdX = this.calculateStdDev(x);
    const stdY = this.calculateStdDev(y);

    return cov / (stdX * stdY);
  }

  private calculateStdDev(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (data.length - 1);
    return Math.sqrt(variance);
  }

  private minimumVarianceWeights(covMatrix: number[][]): number[] {
    // 簡略化: 等分散ポートフォリオ（実際にはQP最適化が必要）
    const n = covMatrix.length;
    return new Array(n).fill(100 / n);
  }

  private maxSharpeWeights(expectedReturns: number[], covMatrix: number[][]): number[] {
    // 簡略化: リターン加重（実際には最適化アルゴリズムが必要）
    const totalReturn = expectedReturns.reduce((sum, r) => sum + Math.max(0, r), 0);
    if (totalReturn === 0) {
      return new Array(expectedReturns.length).fill(100 / expectedReturns.length);
    }
    
    return expectedReturns.map(r => (Math.max(0, r) / totalReturn) * 100);
  }

  private calculatePortfolioReturn(weights: number[], expectedReturns: number[]): number {
    let portfolioReturn = 0;
    for (let i = 0; i < weights.length; i++) {
      portfolioReturn += (weights[i] / 100) * expectedReturns[i];
    }
    return portfolioReturn;
  }

  private calculatePortfolioRisk(weights: number[], covMatrix: number[][]): number {
    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += (weights[i] / 100) * (weights[j] / 100) * covMatrix[i][j];
      }
    }
    return Math.sqrt(Math.max(0, variance));
  }

  private calculateBeta(returns: number[], marketReturns: number[]): number {
    const n = Math.min(returns.length, marketReturns.length);
    if (n === 0) return 1;

    const cov = this.calculateCovariance(returns.slice(0, n), marketReturns.slice(0, n));
    const marketVar = Math.pow(this.calculateStdDev(marketReturns.slice(0, n)), 2);

    return marketVar > 0 ? cov / marketVar : 1;
  }

  private calculateMaxDrawdown(prices: StockPrice[]): number {
    let maxDrawdown = 0;
    let peak = prices[0].close;

    for (const price of prices) {
      if (price.close > peak) {
        peak = price.close;
      }
      const drawdown = ((peak - price.close) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateVolatility(returns: number[]): number {
    const stdDev = this.calculateStdDev(returns);
    return stdDev * Math.sqrt(252) * 100; // 年率換算
  }
}
