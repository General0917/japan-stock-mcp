import { StockAPIClient, StockPrice, TechnicalIndicators } from './stock-api.js';
import { FundamentalsAPIClient, FinancialData, FundamentalAnalysis } from './fundamentals-api.js';

export interface AnalysisResult {
  symbol: string;
  shortTerm: {
    signal: 'BUY' | 'SELL' | 'HOLD';
    score: number;
    reasons: string[];
  };
  mediumTerm: {
    signal: 'BUY' | 'SELL' | 'HOLD';
    score: number;
    reasons: string[];
  };
  longTerm: {
    signal: 'BUY' | 'SELL' | 'HOLD';
    score: number;
    reasons: string[];
  };
  technicalIndicators: TechnicalIndicators;
  currentPrice: number;
  fundamentals?: FundamentalAnalysis;
}

export interface ComprehensiveAnalysis {
  symbol: string;
  companyName: string;
  currentPrice: number;
  technical: {
    shortTerm: AnalysisResult['shortTerm'];
    mediumTerm: AnalysisResult['mediumTerm'];
    longTerm: AnalysisResult['longTerm'];
    indicators: TechnicalIndicators;
  };
  fundamentals: FundamentalAnalysis;
  financialData: FinancialData;
  overallScore: number;
  overallRecommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  investmentSummary: string[];
}

export class StockAnalyzer {
  private apiClient: StockAPIClient;
  private fundamentalsClient: FundamentalsAPIClient;

  constructor() {
    this.apiClient = new StockAPIClient();
    this.fundamentalsClient = new FundamentalsAPIClient();
  }

  /**
   * 短期・中期・長期の投資判断を行う
   */
  async analyzeStock(symbol: string): Promise<AnalysisResult> {
    // 1年分のデータを取得
    const longTermData = await this.apiClient.getStockData(symbol, '1y');
    const mediumTermData = longTermData.slice(-90); // 約3ヶ月
    const shortTermData = longTermData.slice(-30); // 約1ヶ月

    // テクニカル指標を計算
    const indicators = this.apiClient.calculateTechnicalIndicators(longTermData);
    const currentPrice = longTermData[longTermData.length - 1].close;

    // 短期分析（1ヶ月以内）
    const shortTerm = this.analyzeShortTerm(shortTermData, indicators, currentPrice);

    // 中期分析（3〜6ヶ月）
    const mediumTerm = this.analyzeMediumTerm(mediumTermData, indicators, currentPrice);

    // 長期分析（6ヶ月以上）
    const longTerm = this.analyzeLongTerm(longTermData, indicators, currentPrice);

    return {
      symbol,
      shortTerm,
      mediumTerm,
      longTerm,
      technicalIndicators: indicators,
      currentPrice,
    };
  }

  /**
   * テクニカル分析とファンダメンタルズ分析を統合した総合分析
   */
  async analyzeComprehensive(symbol: string): Promise<ComprehensiveAnalysis> {
    // テクニカル分析を実行
    const technicalAnalysis = await this.analyzeStock(symbol);

    // ファンダメンタルズデータを取得
    const financialData = await this.fundamentalsClient.getFinancialData(symbol);

    // ファンダメンタルズ分析を実行
    const fundamentals = this.fundamentalsClient.analyzeFundamentals(financialData);

    // 総合スコア計算（テクニカル50%、ファンダメンタルズ50%）
    const technicalAvgScore = (
      technicalAnalysis.shortTerm.score * 0.3 +
      technicalAnalysis.mediumTerm.score * 0.3 +
      technicalAnalysis.longTerm.score * 0.4
    );
    const overallScore = Math.round((technicalAvgScore + fundamentals.overallScore) / 2);

    // 総合推奨レベル決定
    let overallRecommendation: ComprehensiveAnalysis['overallRecommendation'];
    if (overallScore >= 75) overallRecommendation = 'STRONG_BUY';
    else if (overallScore >= 60) overallRecommendation = 'BUY';
    else if (overallScore >= 40) overallRecommendation = 'HOLD';
    else if (overallScore >= 25) overallRecommendation = 'SELL';
    else overallRecommendation = 'STRONG_SELL';

    // 投資サマリー作成
    const investmentSummary = this.generateInvestmentSummary(
      technicalAnalysis,
      fundamentals,
      financialData,
      overallRecommendation
    );

    return {
      symbol,
      companyName: financialData.companyName,
      currentPrice: technicalAnalysis.currentPrice,
      technical: {
        shortTerm: technicalAnalysis.shortTerm,
        mediumTerm: technicalAnalysis.mediumTerm,
        longTerm: technicalAnalysis.longTerm,
        indicators: technicalAnalysis.technicalIndicators,
      },
      fundamentals,
      financialData,
      overallScore,
      overallRecommendation,
      investmentSummary,
    };
  }

  /**
   * 投資サマリーを生成
   */
  private generateInvestmentSummary(
    technical: AnalysisResult,
    fundamentals: FundamentalAnalysis,
    financial: FinancialData,
    recommendation: string
  ): string[] {
    const summary: string[] = [];

    // 推奨レベルの説明
    const recommendationTexts: { [key: string]: string } = {
      STRONG_BUY: '強い買い推奨 - テクニカル・ファンダメンタルズともに良好',
      BUY: '買い推奨 - 総合的に魅力的な投資対象',
      HOLD: '保留 - 様子見が適切',
      SELL: '売り推奨 - リスクが利益を上回る可能性',
      STRONG_SELL: '強い売り推奨 - 投資を避けるべき',
    };
    summary.push(recommendationTexts[recommendation] || '');

    // テクニカル面の要点
    if (technical.longTerm.signal === 'BUY') {
      summary.push('テクニカル面: 長期的な上昇トレンド継続中');
    } else if (technical.longTerm.signal === 'SELL') {
      summary.push('テクニカル面: 下降トレンドに注意が必要');
    }

    // ファンダメンタルズ面の要点
    if (fundamentals.valuation.rating === 'UNDERVALUED') {
      summary.push('バリュエーション: 割安水準 - 投資妙味あり');
    } else if (fundamentals.valuation.rating === 'OVERVALUED') {
      summary.push('バリュエーション: 割高水準 - 慎重な判断が必要');
    }

    // 財務健全性
    if (fundamentals.financialHealth.rating === 'EXCELLENT') {
      summary.push('財務健全性: 非常に良好 - 安定した企業基盤');
    } else if (fundamentals.financialHealth.rating === 'POOR') {
      summary.push('財務健全性: 懸念あり - リスク管理が重要');
    }

    // 収益性
    if (fundamentals.profitability.rating === 'HIGH') {
      summary.push('収益性: 高水準 - 強い収益力');
    } else if (fundamentals.profitability.rating === 'LOW') {
      summary.push('収益性: 低水準 - 改善が必要');
    }

    // 配当
    if (financial.dividendYield && financial.dividendYield > 3) {
      summary.push(`配当: ${financial.dividendYield.toFixed(2)}% - 高配当株として魅力的`);
    }

    return summary;
  }

  /**
   * 複数銘柄を分析してランキング
   */
  async analyzeMultipleStocks(symbols: string[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const symbol of symbols) {
      try {
        const analysis = await this.analyzeStock(symbol);
        results.push(analysis);
      } catch (error) {
        console.error(`${symbol}の分析に失敗:`, error);
      }
    }

    return results;
  }

  /**
   * 短期分析（テクニカル重視）
   */
  private analyzeShortTerm(
    data: StockPrice[],
    indicators: TechnicalIndicators,
    currentPrice: number
  ): { signal: 'BUY' | 'SELL' | 'HOLD'; score: number; reasons: string[] } {
    let score = 50;
    const reasons: string[] = [];

    // RSI分析（買われすぎ・売られすぎ）
    if (indicators.rsi < 30) {
      score += 20;
      reasons.push(`RSI ${indicators.rsi.toFixed(1)} - 売られすぎ（買いチャンス）`);
    } else if (indicators.rsi > 70) {
      score -= 20;
      reasons.push(`RSI ${indicators.rsi.toFixed(1)} - 買われすぎ（売りシグナル）`);
    }

    // MACD分析
    if (indicators.macd > indicators.signal && indicators.macd > 0) {
      score += 15;
      reasons.push('MACDがシグナル線を上抜け（強気）');
    } else if (indicators.macd < indicators.signal && indicators.macd < 0) {
      score -= 15;
      reasons.push('MACDがシグナル線を下抜け（弱気）');
    }

    // 短期移動平均線（20日）
    if (currentPrice > indicators.sma20) {
      score += 10;
      reasons.push('20日移動平均線の上（上昇トレンド）');
    } else {
      score -= 10;
      reasons.push('20日移動平均線の下（下降トレンド）');
    }

    // 直近のモメンタム
    const recentPrices = data.slice(-5).map(d => d.close);
    const momentum = (recentPrices[4] - recentPrices[0]) / recentPrices[0] * 100;
    if (momentum > 3) {
      score += 10;
      reasons.push(`直近5日で${momentum.toFixed(1)}%上昇（強い上昇モメンタム）`);
    } else if (momentum < -3) {
      score -= 10;
      reasons.push(`直近5日で${momentum.toFixed(1)}%下落（弱い下降モメンタム）`);
    }

    const signal: 'BUY' | 'SELL' | 'HOLD' = score >= 60 ? 'BUY' : score <= 40 ? 'SELL' : 'HOLD';
    return { signal, score, reasons };
  }

  /**
   * 中期分析（トレンド重視）
   */
  private analyzeMediumTerm(
    data: StockPrice[],
    indicators: TechnicalIndicators,
    currentPrice: number
  ): { signal: 'BUY' | 'SELL' | 'HOLD'; score: number; reasons: string[] } {
    let score = 50;
    const reasons: string[] = [];

    // 50日移動平均線
    if (currentPrice > indicators.sma50) {
      score += 15;
      reasons.push('50日移動平均線の上（中期上昇トレンド）');
    } else {
      score -= 15;
      reasons.push('50日移動平均線の下（中期下降トレンド）');
    }

    // ゴールデンクロス・デッドクロス
    if (indicators.sma20 > indicators.sma50) {
      score += 15;
      reasons.push('ゴールデンクロス形成（買いシグナル）');
    } else {
      score -= 15;
      reasons.push('デッドクロス形成（売りシグナル）');
    }

    // 3ヶ月のトレンド
    const threeMonthReturn = ((data[data.length - 1].close - data[0].close) / data[0].close) * 100;
    if (threeMonthReturn > 10) {
      score += 15;
      reasons.push(`3ヶ月で${threeMonthReturn.toFixed(1)}%上昇（強い上昇トレンド）`);
    } else if (threeMonthReturn < -10) {
      score -= 15;
      reasons.push(`3ヶ月で${threeMonthReturn.toFixed(1)}%下落（弱い下降トレンド）`);
    }

    // ボラティリティ分析
    const volatility = this.calculateVolatility(data);
    if (volatility < 15) {
      score += 5;
      reasons.push('低ボラティリティ（安定性あり）');
    } else if (volatility > 30) {
      score -= 5;
      reasons.push('高ボラティリティ（リスク高）');
    }

    const signal: 'BUY' | 'SELL' | 'HOLD' = score >= 60 ? 'BUY' : score <= 40 ? 'SELL' : 'HOLD';
    return { signal, score, reasons };
  }

  /**
   * 長期分析（ファンダメンタル + 長期トレンド）
   */
  private analyzeLongTerm(
    data: StockPrice[],
    indicators: TechnicalIndicators,
    currentPrice: number
  ): { signal: 'BUY' | 'SELL' | 'HOLD'; score: number; reasons: string[] } {
    let score = 50;
    const reasons: string[] = [];

    // 200日移動平均線
    if (indicators.sma200 > 0) {
      if (currentPrice > indicators.sma200) {
        score += 20;
        reasons.push('200日移動平均線の上（長期上昇トレンド）');
      } else {
        score -= 20;
        reasons.push('200日移動平均線の下（長期下降トレンド）');
      }
    }

    // 1年のトレンド
    const yearlyReturn = ((data[data.length - 1].close - data[0].close) / data[0].close) * 100;
    if (yearlyReturn > 20) {
      score += 20;
      reasons.push(`1年で${yearlyReturn.toFixed(1)}%上昇（強い長期上昇）`);
    } else if (yearlyReturn < -20) {
      score -= 20;
      reasons.push(`1年で${yearlyReturn.toFixed(1)}%下落（弱い長期下降）`);
    } else {
      reasons.push(`1年で${yearlyReturn.toFixed(1)}%の変動（横ばい傾向）`);
    }

    // 長期的な価格の位置（52週高値・安値）
    const prices = data.map(d => d.close);
    const high52w = Math.max(...prices);
    const low52w = Math.min(...prices);
    const pricePosition = ((currentPrice - low52w) / (high52w - low52w)) * 100;

    if (pricePosition < 30) {
      score += 10;
      reasons.push('52週安値付近（割安感あり）');
    } else if (pricePosition > 70) {
      score -= 10;
      reasons.push('52週高値付近（割高感あり）');
    }

    // トレンドの一貫性
    const consistentUptrend = this.checkTrendConsistency(data, 'up');
    const consistentDowntrend = this.checkTrendConsistency(data, 'down');

    if (consistentUptrend) {
      score += 10;
      reasons.push('一貫した上昇トレンド（安定性あり）');
    } else if (consistentDowntrend) {
      score -= 10;
      reasons.push('一貫した下降トレンド（回復待ち）');
    }

    const signal: 'BUY' | 'SELL' | 'HOLD' = score >= 60 ? 'BUY' : score <= 40 ? 'SELL' : 'HOLD';
    return { signal, score, reasons };
  }

  private calculateVolatility(data: StockPrice[]): number {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252) * 100; // 年率換算
  }

  private checkTrendConsistency(data: StockPrice[], direction: 'up' | 'down'): boolean {
    const quarters = Math.floor(data.length / 90);
    let consistentCount = 0;

    for (let i = 0; i < quarters; i++) {
      const start = i * 90;
      const end = Math.min(start + 90, data.length);
      const quarterData = data.slice(start, end);
      const quarterReturn = (quarterData[quarterData.length - 1].close - quarterData[0].close) / quarterData[0].close;

      if (direction === 'up' && quarterReturn > 0) consistentCount++;
      if (direction === 'down' && quarterReturn < 0) consistentCount++;
    }

    return consistentCount >= quarters * 0.7; // 70%以上の期間でトレンド継続
  }

  /**
   * 複数銘柄の比較
   */
  async compareStocks(symbols: string[]): Promise<Array<{
    symbol: string;
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
  }>> {
    const results = [];

    for (const symbol of symbols) {
      try {
        const analysis = await this.analyzeStock(symbol);
        results.push({
          symbol,
          shortTerm: analysis.shortTerm.score,
          mediumTerm: analysis.mediumTerm.score,
          longTerm: analysis.longTerm.score,
        });
      } catch (error) {
        console.error(`${symbol}の分析に失敗:`, error);
      }
    }

    return results;
  }

  /**
   * 投資期間別の最適銘柄を検索
   */
  async findBestStocks(
    symbols: string[],
    timeframe: 'short' | 'medium' | 'long',
    topN: number = 5
  ): Promise<Array<{ symbol: string; score: number; reason: string }>> {
    const analyses = [];

    for (const symbol of symbols) {
      try {
        const analysis = await this.analyzeStock(symbol);
        let score: number;
        let reason: string;

        switch (timeframe) {
          case 'short':
            score = analysis.shortTerm.score;
            reason = analysis.shortTerm.reasons[0] || '短期分析結果';
            break;
          case 'medium':
            score = analysis.mediumTerm.score;
            reason = analysis.mediumTerm.reasons[0] || '中期分析結果';
            break;
          case 'long':
            score = analysis.longTerm.score;
            reason = analysis.longTerm.reasons[0] || '長期分析結果';
            break;
        }

        analyses.push({ symbol, score, reason });
      } catch (error) {
        console.error(`${symbol}の分析に失敗:`, error);
      }
    }

    // スコア順にソート
    analyses.sort((a, b) => b.score - a.score);

    // 上位N件を返す
    return analyses.slice(0, topN);
  }
}
