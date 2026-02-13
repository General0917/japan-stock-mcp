import { FundamentalsAPIClient, FinancialData } from './fundamentals-api.js';

/**
 * セクター情報
 */
export interface SectorInfo {
  sector: string;
  industry: string;
  sectorAverage: {
    per?: number;
    pbr?: number;
    roe?: number;
    dividendYield?: number;
    debtToEquity?: number;
  };
}

/**
 * セクター比較結果
 */
export interface SectorComparison {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  vsAverage: {
    per?: string;        // "Above Average" / "Below Average" / "Average"
    pbr?: string;
    roe?: string;
    dividendYield?: string;
  };
  sectorRank?: number;   // セクター内ランキング
  totalInSector?: number; // セクター内企業数
  analysis: string[];
}

/**
 * スクリーニング条件
 */
export interface ScreeningCriteria {
  per?: { min?: number; max?: number };
  pbr?: { min?: number; max?: number };
  roe?: { min?: number; max?: number };
  dividendYield?: { min?: number; max?: number };
  marketCap?: { min?: number; max?: number };
  debtToEquity?: { min?: number; max?: number };
  operatingMargin?: { min?: number; max?: number };
  sector?: string[];
}

/**
 * スクリーニング結果
 */
export interface ScreeningResult {
  symbol: string;
  companyName: string;
  matchScore: number;     // マッチ度（0-100）
  financialData: FinancialData;
  highlights: string[];   // 条件に合致したポイント
}

export class SectorAnalyzer {
  private fundamentalsClient: FundamentalsAPIClient;

  // セクター別の平均値（参考値）
  private sectorAverages: { [sector: string]: any } = {
    '自動車・輸送機器': { per: 12, pbr: 0.8, roe: 8, dividendYield: 3.5 },
    'テクノロジー': { per: 25, pbr: 3.5, roe: 15, dividendYield: 1.5 },
    '金融': { per: 10, pbr: 0.6, roe: 6, dividendYield: 4.0 },
    '通信': { per: 15, pbr: 1.2, roe: 9, dividendYield: 3.8 },
    '消費財': { per: 20, pbr: 2.0, roe: 12, dividendYield: 2.0 },
    '素材': { per: 12, pbr: 1.0, roe: 8, dividendYield: 3.0 },
    'ヘルスケア': { per: 30, pbr: 2.5, roe: 10, dividendYield: 1.8 },
  };

  constructor() {
    this.fundamentalsClient = new FundamentalsAPIClient();
  }

  /**
   * セクター比較分析
   */
  async compareSector(symbols: string[]): Promise<SectorComparison[]> {
    const results: SectorComparison[] = [];
    const financialDataList: FinancialData[] = [];

    // 各銘柄の財務データを取得
    for (const symbol of symbols) {
      try {
        const data = await this.fundamentalsClient.getFinancialData(symbol);
        financialDataList.push(data);
      } catch (error) {
        console.error(`${symbol}のデータ取得に失敗:`, error);
      }
    }

    // セクター別にグループ化
    const sectorGroups: { [sector: string]: FinancialData[] } = {};
    for (const data of financialDataList) {
      const sector = this.guessSector(data.symbol);
      if (!sectorGroups[sector]) {
        sectorGroups[sector] = [];
      }
      sectorGroups[sector].push(data);
    }

    // 各銘柄のセクター比較を実行
    for (const data of financialDataList) {
      const sector = this.guessSector(data.symbol);
      const sectorData = sectorGroups[sector];
      const analysis: string[] = [];

      // セクター平均との比較
      const vsAverage: SectorComparison['vsAverage'] = {};

      if (data.per !== undefined && data.per !== null) {
        const avg = this.calculateSectorAverage(sectorData, 'per');
        if (avg > 0) {
          vsAverage.per = this.compareToAverage(data.per, avg);
          analysis.push(`PER ${data.per.toFixed(1)} - セクター平均 ${avg.toFixed(1)} (${vsAverage.per})`);
        }
      }

      if (data.pbr !== undefined && data.pbr !== null) {
        const avg = this.calculateSectorAverage(sectorData, 'pbr');
        if (avg > 0) {
          vsAverage.pbr = this.compareToAverage(data.pbr, avg);
          analysis.push(`PBR ${data.pbr.toFixed(2)} - セクター平均 ${avg.toFixed(2)} (${vsAverage.pbr})`);
        }
      }

      if (data.roe !== undefined && data.roe !== null) {
        const avg = this.calculateSectorAverage(sectorData, 'roe');
        if (avg > 0) {
          vsAverage.roe = this.compareToAverage(data.roe, avg, true);
          analysis.push(`ROE ${data.roe.toFixed(1)}% - セクター平均 ${avg.toFixed(1)}% (${vsAverage.roe})`);
        }
      }

      if (data.dividendYield !== undefined && data.dividendYield !== null) {
        const avg = this.calculateSectorAverage(sectorData, 'dividendYield');
        if (avg > 0) {
          vsAverage.dividendYield = this.compareToAverage(data.dividendYield, avg, true);
          analysis.push(`配当利回り ${data.dividendYield.toFixed(2)}% - セクター平均 ${avg.toFixed(2)}% (${vsAverage.dividendYield})`);
        }
      }

      // セクター内ランキング（ROE基準）
      let sectorRank = 1;
      if (data.roe !== undefined && data.roe !== null) {
        for (const other of sectorData) {
          if (other.roe !== undefined && other.roe !== null && other.roe > data.roe) {
            sectorRank++;
          }
        }
      }

      results.push({
        symbol: data.symbol,
        companyName: data.companyName,
        sector,
        industry: sector,
        vsAverage,
        sectorRank,
        totalInSector: sectorData.length,
        analysis,
      });
    }

    return results;
  }

  /**
   * スクリーニング実行
   */
  async screenStocks(symbols: string[], criteria: ScreeningCriteria): Promise<ScreeningResult[]> {
    const results: ScreeningResult[] = [];

    for (const symbol of symbols) {
      try {
        const data = await this.fundamentalsClient.getFinancialData(symbol);
        const { matches, score, highlights } = this.evaluateCriteria(data, criteria);

        if (matches) {
          results.push({
            symbol: data.symbol,
            companyName: data.companyName,
            matchScore: score,
            financialData: data,
            highlights,
          });
        }
      } catch (error) {
        console.error(`${symbol}のスクリーニングに失敗:`, error);
      }
    }

    // マッチスコアでソート
    results.sort((a, b) => b.matchScore - a.matchScore);

    return results;
  }

  /**
   * 条件評価
   */
  private evaluateCriteria(
    data: FinancialData,
    criteria: ScreeningCriteria
  ): { matches: boolean; score: number; highlights: string[] } {
    let totalCriteria = 0;
    let matchedCriteria = 0;
    const highlights: string[] = [];

    // PER
    if (criteria.per) {
      totalCriteria++;
      if (data.per !== undefined && data.per !== null) {
        const min = criteria.per.min ?? -Infinity;
        const max = criteria.per.max ?? Infinity;
        if (data.per >= min && data.per <= max) {
          matchedCriteria++;
          highlights.push(`PER ${data.per.toFixed(1)} ✓`);
        }
      }
    }

    // PBR
    if (criteria.pbr) {
      totalCriteria++;
      if (data.pbr !== undefined && data.pbr !== null) {
        const min = criteria.pbr.min ?? -Infinity;
        const max = criteria.pbr.max ?? Infinity;
        if (data.pbr >= min && data.pbr <= max) {
          matchedCriteria++;
          highlights.push(`PBR ${data.pbr.toFixed(2)} ✓`);
        }
      }
    }

    // ROE
    if (criteria.roe) {
      totalCriteria++;
      if (data.roe !== undefined && data.roe !== null) {
        const min = criteria.roe.min ?? -Infinity;
        const max = criteria.roe.max ?? Infinity;
        if (data.roe >= min && data.roe <= max) {
          matchedCriteria++;
          highlights.push(`ROE ${data.roe.toFixed(1)}% ✓`);
        }
      }
    }

    // 配当利回り
    if (criteria.dividendYield) {
      totalCriteria++;
      if (data.dividendYield !== undefined && data.dividendYield !== null) {
        const min = criteria.dividendYield.min ?? -Infinity;
        const max = criteria.dividendYield.max ?? Infinity;
        if (data.dividendYield >= min && data.dividendYield <= max) {
          matchedCriteria++;
          highlights.push(`配当利回り ${data.dividendYield.toFixed(2)}% ✓`);
        }
      }
    }

    // 時価総額
    if (criteria.marketCap) {
      totalCriteria++;
      if (data.marketCap !== undefined && data.marketCap !== null) {
        const min = criteria.marketCap.min ?? -Infinity;
        const max = criteria.marketCap.max ?? Infinity;
        if (data.marketCap >= min && data.marketCap <= max) {
          matchedCriteria++;
          highlights.push(`時価総額 ${(data.marketCap / 1e12).toFixed(2)}兆円 ✓`);
        }
      }
    }

    // 負債比率
    if (criteria.debtToEquity) {
      totalCriteria++;
      if (data.debtToEquity !== undefined && data.debtToEquity !== null) {
        const min = criteria.debtToEquity.min ?? -Infinity;
        const max = criteria.debtToEquity.max ?? Infinity;
        if (data.debtToEquity >= min && data.debtToEquity <= max) {
          matchedCriteria++;
          highlights.push(`負債比率 ${data.debtToEquity.toFixed(1)} ✓`);
        }
      }
    }

    // 営業利益率
    if (criteria.operatingMargin) {
      totalCriteria++;
      if (data.operatingMargin !== undefined && data.operatingMargin !== null) {
        const min = criteria.operatingMargin.min ?? -Infinity;
        const max = criteria.operatingMargin.max ?? Infinity;
        if (data.operatingMargin >= min && data.operatingMargin <= max) {
          matchedCriteria++;
          highlights.push(`営業利益率 ${data.operatingMargin.toFixed(1)}% ✓`);
        }
      }
    }

    const score = totalCriteria > 0 ? (matchedCriteria / totalCriteria) * 100 : 0;
    const matches = matchedCriteria === totalCriteria;

    return { matches, score, highlights };
  }

  /**
   * セクター推測（銘柄コードから）
   */
  private guessSector(symbol: string): string {
    const code = parseInt(symbol.replace('.T', ''));
    
    if (code >= 7000 && code < 8000) return '自動車・輸送機器';
    if (code >= 6000 && code < 7000) return 'テクノロジー';
    if (code >= 8000 && code < 9000) return '金融';
    if (code >= 9000 && code < 10000) return '通信';
    if (code >= 2000 && code < 3000) return '消費財';
    if (code >= 4000 && code < 5000) return '素材';
    if (code >= 4500 && code < 4600) return 'ヘルスケア';
    
    return 'その他';
  }

  /**
   * セクター平均を計算
   */
  private calculateSectorAverage(sectorData: FinancialData[], field: keyof FinancialData): number {
    const values = sectorData
      .map(d => d[field] as number)
      .filter(v => v !== undefined && v !== null && !isNaN(v));
    
    if (values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * 平均との比較
   */
  private compareToAverage(value: number, average: number, higherIsBetter: boolean = false): string {
    const diff = ((value - average) / average) * 100;
    
    if (Math.abs(diff) < 10) return '平均的';
    
    if (higherIsBetter) {
      return diff > 0 ? '平均以上' : '平均以下';
    } else {
      return diff < 0 ? '平均以下（割安）' : '平均以上（割高）';
    }
  }
}
