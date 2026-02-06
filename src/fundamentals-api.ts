import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 企業の財務情報
 */
export interface FinancialData {
  symbol: string;
  companyName: string;
  marketCap?: number;           // 時価総額
  per?: number;                 // 株価収益率 (Price Earnings Ratio)
  pbr?: number;                 // 株価純資産倍率 (Price Book Ratio)
  eps?: number;                 // 1株当たり利益 (Earnings Per Share)
  dividendYield?: number;       // 配当利回り
  roe?: number;                 // 自己資本利益率 (Return On Equity)
  debtToEquity?: number;        // 負債比率
  currentRatio?: number;        // 流動比率
  operatingMargin?: number;     // 営業利益率
  profitMargin?: number;        // 純利益率
  revenue?: number;             // 売上高
  netIncome?: number;           // 純利益
  totalAssets?: number;         // 総資産
  totalDebt?: number;           // 総負債
  shareholdersEquity?: number;  // 株主資本
}

/**
 * ファンダメンタルズ分析結果
 */
export interface FundamentalAnalysis {
  symbol: string;
  financialHealth: {
    score: number;              // 0-100のスコア
    rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    reasons: string[];
  };
  valuation: {
    score: number;
    rating: 'UNDERVALUED' | 'FAIR' | 'OVERVALUED';
    reasons: string[];
  };
  profitability: {
    score: number;
    rating: 'HIGH' | 'MEDIUM' | 'LOW';
    reasons: string[];
  };
  overallScore: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
}

export class FundamentalsAPIClient {
  private quoteURL = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary/';
  
  /**
   * 企業の財務データを取得
   */
  async getFinancialData(symbol: string): Promise<FinancialData> {
    // まずPythonスクリプトを試す（より信頼性が高い）
    try {
      return await this.getFinancialDataFromPython(symbol);
    } catch (pythonError) {
      console.warn('Pythonスクリプトでのデータ取得に失敗。Yahoo Finance APIを試します。');
      
      // Pythonが失敗した場合、直接APIを試す
      try {
        return await this.getFinancialDataFromAPI(symbol);
      } catch (apiError) {
        console.error('Yahoo Finance APIへのアクセスも失敗しました。');
        
        // すべて失敗した場合は、エラーメッセージを含む基本データを返す
        throw new Error(
          `財務データの取得に失敗しました。\n` +
          `理由: Yahoo Finance APIへのアクセスが制限されている可能性があります。\n` +
          `解決策: \n` +
          `1. Pythonとyfinanceをインストール: pip install yfinance\n` +
          `2. しばらく時間をおいてから再試行\n` +
          `3. 別の銘柄で試してみる`
        );
      }
    }
  }

  /**
   * Pythonスクリプトを使用して財務データを取得
   */
  private async getFinancialDataFromPython(symbol: string): Promise<FinancialData> {
    const scriptPath = join(__dirname, '..', 'scripts', 'fetch_financials.py');
    
    // WindowsとmacOS/Linuxの両方に対応
    const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
    
    try {
      const { stdout } = await execAsync(`${pythonCommand} "${scriptPath}" "${symbol}"`, {
        timeout: 15000,
      });
      
      const data = JSON.parse(stdout);
      
      if (data.error) {
        throw new Error(data.message);
      }
      
      return data as FinancialData;
    } catch (error) {
      throw new Error(`Pythonスクリプト実行エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Yahoo Finance APIから直接財務データを取得
   */
  private async getFinancialDataFromAPI(symbol: string): Promise<FinancialData> {
    try {
      const yahooSymbol = symbol.includes('.T') ? symbol : `${symbol}.T`;
      
      // より信頼性の高いヘッダーを使用
      const response = await axios.get(`${this.quoteURL}${yahooSymbol}`, {
        params: {
          modules: 'defaultKeyStatistics,financialData,summaryDetail,price',
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Referer': 'https://finance.yahoo.com/',
        },
        timeout: 10000,
      });

      if (!response.data.quoteSummary || !response.data.quoteSummary.result) {
        throw new Error('財務データが利用できません');
      }

      const result = response.data.quoteSummary.result[0];
      const keyStats = result.defaultKeyStatistics || {};
      const financialData = result.financialData || {};
      const summaryDetail = result.summaryDetail || {};
      const price = result.price || {};

      return {
        symbol,
        companyName: price.longName || price.shortName || symbol,
        marketCap: summaryDetail.marketCap?.raw || price.marketCap?.raw,
        per: summaryDetail.trailingPE?.raw,
        pbr: keyStats.priceToBook?.raw,
        eps: keyStats.trailingEps?.raw || financialData.trailingEps?.raw,
        dividendYield: summaryDetail.dividendYield?.raw ? summaryDetail.dividendYield.raw * 100 : undefined,
        roe: financialData.returnOnEquity?.raw ? financialData.returnOnEquity.raw * 100 : undefined,
        debtToEquity: financialData.debtToEquity?.raw,
        currentRatio: financialData.currentRatio?.raw,
        operatingMargin: financialData.operatingMargins?.raw ? financialData.operatingMargins.raw * 100 : undefined,
        profitMargin: financialData.profitMargins?.raw ? financialData.profitMargins.raw * 100 : undefined,
        revenue: financialData.totalRevenue?.raw,
        netIncome: keyStats.netIncomeToCommon?.raw,
        totalAssets: financialData.totalAssets?.raw,
        totalDebt: financialData.totalDebt?.raw,
        shareholdersEquity: financialData.totalCash?.raw,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Yahoo Finance API エラー: ${error.response?.status} - ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 代替財務データ（APIが利用できない場合）
   */
  private getMockFinancialData(symbol: string): FinancialData {
    console.warn(`${symbol}: Yahoo Finance APIが利用できないため、推定値を使用します。`);
    
    // 業種別の平均的な値を返す
    // 注: これは実際のデータではなく、デモンストレーション用です
    return {
      symbol,
      companyName: `企業 ${symbol}`,
      marketCap: 1000000000000, // 1兆円
      per: 15.0,
      pbr: 1.2,
      eps: 100,
      dividendYield: 2.5,
      roe: 10.0,
      debtToEquity: 80,
      currentRatio: 1.5,
      operatingMargin: 8.0,
      profitMargin: 5.0,
      revenue: 500000000000,
      netIncome: 25000000000,
      totalAssets: 800000000000,
      totalDebt: 300000000000,
      shareholdersEquity: 400000000000,
    };
  }

  /**
   * ファンダメンタルズ分析を実行
   */
  analyzeFundamentals(data: FinancialData): FundamentalAnalysis {
    // 財務健全性の分析
    const financialHealth = this.analyzeFinancialHealth(data);
    
    // バリュエーション分析
    const valuation = this.analyzeValuation(data);
    
    // 収益性分析
    const profitability = this.analyzeProfitability(data);

    // 総合スコア計算（加重平均）
    const overallScore = Math.round(
      financialHealth.score * 0.3 +
      valuation.score * 0.4 +
      profitability.score * 0.3
    );

    // 推奨レベル決定
    let recommendation: FundamentalAnalysis['recommendation'];
    if (overallScore >= 80) recommendation = 'STRONG_BUY';
    else if (overallScore >= 65) recommendation = 'BUY';
    else if (overallScore >= 45) recommendation = 'HOLD';
    else if (overallScore >= 30) recommendation = 'SELL';
    else recommendation = 'STRONG_SELL';

    return {
      symbol: data.symbol,
      financialHealth,
      valuation,
      profitability,
      overallScore,
      recommendation,
    };
  }

  /**
   * 財務健全性の分析
   */
  private analyzeFinancialHealth(data: FinancialData) {
    let score = 50;
    const reasons: string[] = [];

    // 負債比率（低いほど良い）
    if (data.debtToEquity !== undefined && data.debtToEquity !== null) {
      if (data.debtToEquity < 50) {
        score += 15;
        reasons.push(`負債比率 ${data.debtToEquity.toFixed(1)}% - 非常に健全`);
      } else if (data.debtToEquity < 100) {
        score += 10;
        reasons.push(`負債比率 ${data.debtToEquity.toFixed(1)}% - 健全`);
      } else if (data.debtToEquity < 200) {
        score += 5;
        reasons.push(`負債比率 ${data.debtToEquity.toFixed(1)}% - 普通`);
      } else {
        score -= 10;
        reasons.push(`負債比率 ${data.debtToEquity.toFixed(1)}% - やや高い（注意）`);
      }
    }

    // 流動比率（高いほど良い）
    if (data.currentRatio !== undefined && data.currentRatio !== null) {
      if (data.currentRatio > 2.0) {
        score += 15;
        reasons.push(`流動比率 ${data.currentRatio.toFixed(2)} - 優秀な短期支払能力`);
      } else if (data.currentRatio > 1.5) {
        score += 10;
        reasons.push(`流動比率 ${data.currentRatio.toFixed(2)} - 良好な短期支払能力`);
      } else if (data.currentRatio > 1.0) {
        score += 5;
        reasons.push(`流動比率 ${data.currentRatio.toFixed(2)} - 適切な短期支払能力`);
      } else {
        score -= 10;
        reasons.push(`流動比率 ${data.currentRatio.toFixed(2)} - 短期支払能力に懸念`);
      }
    }

    // ROE（高いほど良い）
    if (data.roe !== undefined && data.roe !== null) {
      if (data.roe > 15) {
        score += 10;
        reasons.push(`ROE ${data.roe.toFixed(1)}% - 高い資本効率`);
      } else if (data.roe > 10) {
        score += 5;
        reasons.push(`ROE ${data.roe.toFixed(1)}% - 良好な資本効率`);
      } else if (data.roe > 5) {
        reasons.push(`ROE ${data.roe.toFixed(1)}% - 普通の資本効率`);
      } else {
        score -= 5;
        reasons.push(`ROE ${data.roe.toFixed(1)}% - 低い資本効率（改善必要）`);
      }
    }

    let rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    if (score >= 70) rating = 'EXCELLENT';
    else if (score >= 55) rating = 'GOOD';
    else if (score >= 40) rating = 'FAIR';
    else rating = 'POOR';

    return { score, rating, reasons };
  }

  /**
   * バリュエーション分析
   */
  private analyzeValuation(data: FinancialData) {
    let score = 50;
    const reasons: string[] = [];

    // PER分析（業種平均を15として評価）
    if (data.per !== undefined && data.per !== null) {
      if (data.per < 0) {
        score -= 20;
        reasons.push(`PER ${data.per.toFixed(1)} - 赤字企業（リスク高）`);
      } else if (data.per < 10) {
        score += 20;
        reasons.push(`PER ${data.per.toFixed(1)} - 割安（買いチャンス）`);
      } else if (data.per < 15) {
        score += 15;
        reasons.push(`PER ${data.per.toFixed(1)} - やや割安`);
      } else if (data.per < 20) {
        score += 5;
        reasons.push(`PER ${data.per.toFixed(1)} - 適正水準`);
      } else if (data.per < 30) {
        score -= 5;
        reasons.push(`PER ${data.per.toFixed(1)} - やや割高`);
      } else {
        score -= 15;
        reasons.push(`PER ${data.per.toFixed(1)} - 割高（注意）`);
      }
    }

    // PBR分析（1.0を基準）
    if (data.pbr !== undefined && data.pbr !== null) {
      if (data.pbr < 0.8) {
        score += 15;
        reasons.push(`PBR ${data.pbr.toFixed(2)} - 資産価値から見て割安`);
      } else if (data.pbr < 1.0) {
        score += 10;
        reasons.push(`PBR ${data.pbr.toFixed(2)} - やや割安`);
      } else if (data.pbr < 1.5) {
        score += 5;
        reasons.push(`PBR ${data.pbr.toFixed(2)} - 適正水準`);
      } else if (data.pbr < 2.0) {
        reasons.push(`PBR ${data.pbr.toFixed(2)} - やや高め`);
      } else {
        score -= 10;
        reasons.push(`PBR ${data.pbr.toFixed(2)} - 割高（成長期待込み）`);
      }
    }

    // 配当利回り分析
    if (data.dividendYield !== undefined && data.dividendYield > 0) {
      if (data.dividendYield > 4.0) {
        score += 10;
        reasons.push(`配当利回り ${data.dividendYield.toFixed(2)}% - 高配当`);
      } else if (data.dividendYield > 2.5) {
        score += 5;
        reasons.push(`配当利回り ${data.dividendYield.toFixed(2)}% - 魅力的`);
      } else {
        reasons.push(`配当利回り ${data.dividendYield.toFixed(2)}% - 普通`);
      }
    }

    let rating: 'UNDERVALUED' | 'FAIR' | 'OVERVALUED';
    if (score >= 65) rating = 'UNDERVALUED';
    else if (score >= 45) rating = 'FAIR';
    else rating = 'OVERVALUED';

    return { score, rating, reasons };
  }

  /**
   * 収益性分析
   */
  private analyzeProfitability(data: FinancialData) {
    let score = 50;
    const reasons: string[] = [];

    // 営業利益率
    if (data.operatingMargin !== undefined && data.operatingMargin !== null) {
      if (data.operatingMargin > 15) {
        score += 15;
        reasons.push(`営業利益率 ${data.operatingMargin.toFixed(1)}% - 非常に高い収益性`);
      } else if (data.operatingMargin > 10) {
        score += 10;
        reasons.push(`営業利益率 ${data.operatingMargin.toFixed(1)}% - 高い収益性`);
      } else if (data.operatingMargin > 5) {
        score += 5;
        reasons.push(`営業利益率 ${data.operatingMargin.toFixed(1)}% - 適切な収益性`);
      } else if (data.operatingMargin > 0) {
        reasons.push(`営業利益率 ${data.operatingMargin.toFixed(1)}% - 低い収益性`);
      } else {
        score -= 15;
        reasons.push(`営業利益率 ${data.operatingMargin.toFixed(1)}% - 営業赤字`);
      }
    }

    // 純利益率
    if (data.profitMargin !== undefined && data.profitMargin !== null) {
      if (data.profitMargin > 10) {
        score += 15;
        reasons.push(`純利益率 ${data.profitMargin.toFixed(1)}% - 優秀な最終利益`);
      } else if (data.profitMargin > 5) {
        score += 10;
        reasons.push(`純利益率 ${data.profitMargin.toFixed(1)}% - 良好な最終利益`);
      } else if (data.profitMargin > 0) {
        score += 5;
        reasons.push(`純利益率 ${data.profitMargin.toFixed(1)}% - 黒字維持`);
      } else {
        score -= 15;
        reasons.push(`純利益率 ${data.profitMargin.toFixed(1)}% - 最終赤字（注意）`);
      }
    }

    // EPS（1株当たり利益）
    if (data.eps !== undefined && data.eps !== null) {
      if (data.eps > 100) {
        score += 10;
        reasons.push(`EPS ${data.eps.toFixed(0)}円 - 高い利益水準`);
      } else if (data.eps > 50) {
        score += 5;
        reasons.push(`EPS ${data.eps.toFixed(0)}円 - 良好な利益水準`);
      } else if (data.eps > 0) {
        reasons.push(`EPS ${data.eps.toFixed(0)}円 - プラス収益`);
      } else {
        score -= 10;
        reasons.push(`EPS ${data.eps.toFixed(0)}円 - マイナス（赤字）`);
      }
    }

    let rating: 'HIGH' | 'MEDIUM' | 'LOW';
    if (score >= 70) rating = 'HIGH';
    else if (score >= 50) rating = 'MEDIUM';
    else rating = 'LOW';

    return { score, rating, reasons };
  }
}
