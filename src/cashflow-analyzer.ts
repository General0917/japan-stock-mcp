/**
 * キャッシュフロー分析
 */
export interface CashFlowData {
  operatingCashFlow?: number;  // 営業CF
  investingCashFlow?: number;  // 投資CF
  financingCashFlow?: number;  // 財務CF
  freeCashFlow?: number;       // フリーCF
  capitalExpenditure?: number; // 設備投資
}

export interface CashFlowAnalysis {
  cashFlowData: CashFlowData;
  metrics: {
    fcfMargin?: number;          // FCFマージン
    cashConversion?: number;      // 現金化率
    ocfToDebt?: number;          // 営業CF/負債比率
    fcfYield?: number;           // FCF利回り
  };
  rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  score: number;
  analysis: string[];
}

/**
 * 成長性分析
 */
export interface GrowthMetrics {
  revenueGrowth1Y?: number;    // 売上成長率（1年）
  revenueGrowth3Y?: number;    // 売上成長率（3年平均）
  profitGrowth1Y?: number;     // 利益成長率（1年）
  profitGrowth3Y?: number;     // 利益成長率（3年平均）
  epsGrowth?: number;          // EPS成長率
  bookValueGrowth?: number;    // 簿価成長率
}

export interface GrowthAnalysis {
  metrics: GrowthMetrics;
  rating: 'HIGH_GROWTH' | 'MODERATE_GROWTH' | 'LOW_GROWTH' | 'DECLINING';
  score: number;
  analysis: string[];
}

export class CashFlowAnalyzer {
  /**
   * キャッシュフロー分析を実行
   */
  analyzeCashFlow(
    cashFlowData: CashFlowData,
    revenue?: number,
    netIncome?: number,
    totalDebt?: number,
    marketCap?: number
  ): CashFlowAnalysis {
    const metrics: CashFlowAnalysis['metrics'] = {};
    const analysis: string[] = [];
    let score = 50;

    // フリーキャッシュフローの計算
    if (cashFlowData.operatingCashFlow !== undefined && cashFlowData.investingCashFlow !== undefined) {
      cashFlowData.freeCashFlow = cashFlowData.operatingCashFlow + cashFlowData.investingCashFlow;
    }

    // FCFマージンの計算
    if (cashFlowData.freeCashFlow !== undefined && revenue) {
      metrics.fcfMargin = (cashFlowData.freeCashFlow / revenue) * 100;
      
      if (metrics.fcfMargin > 15) {
        score += 20;
        analysis.push(`FCFマージン ${metrics.fcfMargin.toFixed(1)}% - 優秀な現金創出力`);
      } else if (metrics.fcfMargin > 8) {
        score += 15;
        analysis.push(`FCFマージン ${metrics.fcfMargin.toFixed(1)}% - 良好な現金創出力`);
      } else if (metrics.fcfMargin > 3) {
        score += 5;
        analysis.push(`FCFマージン ${metrics.fcfMargin.toFixed(1)}% - 適切な水準`);
      } else if (metrics.fcfMargin > 0) {
        analysis.push(`FCFマージン ${metrics.fcfMargin.toFixed(1)}% - やや低い`);
      } else {
        score -= 15;
        analysis.push(`FCFマージン ${metrics.fcfMargin.toFixed(1)}% - マイナス（懸念）`);
      }
    }

    // 現金化率（営業CF / 純利益）
    if (cashFlowData.operatingCashFlow !== undefined && netIncome && netIncome > 0) {
      metrics.cashConversion = (cashFlowData.operatingCashFlow / netIncome) * 100;
      
      if (metrics.cashConversion > 100) {
        score += 15;
        analysis.push(`現金化率 ${metrics.cashConversion.toFixed(0)}% - 利益が確実に現金化`);
      } else if (metrics.cashConversion > 70) {
        score += 10;
        analysis.push(`現金化率 ${metrics.cashConversion.toFixed(0)}% - 良好`);
      } else if (metrics.cashConversion > 40) {
        score += 5;
        analysis.push(`現金化率 ${metrics.cashConversion.toFixed(0)}% - 普通`);
      } else {
        score -= 10;
        analysis.push(`現金化率 ${metrics.cashConversion.toFixed(0)}% - 低い（要注意）`);
      }
    }

    // 営業CF/負債比率
    if (cashFlowData.operatingCashFlow !== undefined && totalDebt && totalDebt > 0) {
      metrics.ocfToDebt = (cashFlowData.operatingCashFlow / totalDebt) * 100;
      
      if (metrics.ocfToDebt > 25) {
        score += 15;
        analysis.push(`営業CF/負債 ${metrics.ocfToDebt.toFixed(1)}% - 返済能力が高い`);
      } else if (metrics.ocfToDebt > 15) {
        score += 10;
        analysis.push(`営業CF/負債 ${metrics.ocfToDebt.toFixed(1)}% - 適切な返済能力`);
      } else if (metrics.ocfToDebt > 8) {
        score += 5;
        analysis.push(`営業CF/負債 ${metrics.ocfToDebt.toFixed(1)}% - 返済能力は普通`);
      } else {
        score -= 10;
        analysis.push(`営業CF/負債 ${metrics.ocfToDebt.toFixed(1)}% - 返済能力に懸念`);
      }
    }

    // FCF利回り
    if (cashFlowData.freeCashFlow !== undefined && marketCap && marketCap > 0) {
      metrics.fcfYield = (cashFlowData.freeCashFlow / marketCap) * 100;
      
      if (metrics.fcfYield > 8) {
        score += 10;
        analysis.push(`FCF利回り ${metrics.fcfYield.toFixed(2)}% - 割安`);
      } else if (metrics.fcfYield > 5) {
        score += 5;
        analysis.push(`FCF利回り ${metrics.fcfYield.toFixed(2)}% - 適正`);
      } else if (metrics.fcfYield > 0) {
        analysis.push(`FCF利回り ${metrics.fcfYield.toFixed(2)}%`);
      } else {
        score -= 10;
        analysis.push(`FCF利回り ${metrics.fcfYield.toFixed(2)}% - マイナス`);
      }
    }

    // 営業CFの評価
    if (cashFlowData.operatingCashFlow !== undefined) {
      if (cashFlowData.operatingCashFlow > 0) {
        analysis.push(`営業CF: ${this.formatCurrency(cashFlowData.operatingCashFlow)} - プラス`);
      } else {
        score -= 20;
        analysis.push(`営業CF: ${this.formatCurrency(cashFlowData.operatingCashFlow)} - マイナス（重大な懸念）`);
      }
    }

    // フリーCFの評価
    if (cashFlowData.freeCashFlow !== undefined) {
      if (cashFlowData.freeCashFlow > 0) {
        score += 10;
        analysis.push(`フリーCF: ${this.formatCurrency(cashFlowData.freeCashFlow)} - 成長投資・配当余力あり`);
      } else {
        score -= 10;
        analysis.push(`フリーCF: ${this.formatCurrency(cashFlowData.freeCashFlow)} - マイナス（投資超過）`);
      }
    }

    // 総合評価
    let rating: CashFlowAnalysis['rating'];
    if (score >= 75) {
      rating = 'EXCELLENT';
    } else if (score >= 60) {
      rating = 'GOOD';
    } else if (score >= 40) {
      rating = 'FAIR';
    } else {
      rating = 'POOR';
    }

    return {
      cashFlowData,
      metrics,
      rating,
      score,
      analysis,
    };
  }

  /**
   * 成長性分析を実行
   */
  analyzeGrowth(metrics: GrowthMetrics): GrowthAnalysis {
    const analysis: string[] = [];
    let score = 50;

    // 売上成長率（1年）
    if (metrics.revenueGrowth1Y !== undefined) {
      if (metrics.revenueGrowth1Y > 20) {
        score += 20;
        analysis.push(`売上成長率（1年）: ${metrics.revenueGrowth1Y.toFixed(1)}% - 高成長`);
      } else if (metrics.revenueGrowth1Y > 10) {
        score += 15;
        analysis.push(`売上成長率（1年）: ${metrics.revenueGrowth1Y.toFixed(1)}% - 良好な成長`);
      } else if (metrics.revenueGrowth1Y > 3) {
        score += 10;
        analysis.push(`売上成長率（1年）: ${metrics.revenueGrowth1Y.toFixed(1)}% - 安定成長`);
      } else if (metrics.revenueGrowth1Y > 0) {
        score += 5;
        analysis.push(`売上成長率（1年）: ${metrics.revenueGrowth1Y.toFixed(1)}% - 微増`);
      } else {
        score -= 15;
        analysis.push(`売上成長率（1年）: ${metrics.revenueGrowth1Y.toFixed(1)}% - 減収`);
      }
    }

    // 売上成長率（3年平均）
    if (metrics.revenueGrowth3Y !== undefined) {
      if (metrics.revenueGrowth3Y > 15) {
        score += 15;
        analysis.push(`売上成長率（3年平均）: ${metrics.revenueGrowth3Y.toFixed(1)}% - 持続的な高成長`);
      } else if (metrics.revenueGrowth3Y > 8) {
        score += 10;
        analysis.push(`売上成長率（3年平均）: ${metrics.revenueGrowth3Y.toFixed(1)}% - 安定した成長`);
      } else if (metrics.revenueGrowth3Y > 0) {
        score += 5;
        analysis.push(`売上成長率（3年平均）: ${metrics.revenueGrowth3Y.toFixed(1)}%`);
      } else {
        score -= 10;
        analysis.push(`売上成長率（3年平均）: ${metrics.revenueGrowth3Y.toFixed(1)}% - 長期低迷`);
      }
    }

    // 利益成長率（1年）
    if (metrics.profitGrowth1Y !== undefined) {
      if (metrics.profitGrowth1Y > 25) {
        score += 20;
        analysis.push(`利益成長率（1年）: ${metrics.profitGrowth1Y.toFixed(1)}% - 高収益成長`);
      } else if (metrics.profitGrowth1Y > 15) {
        score += 15;
        analysis.push(`利益成長率（1年）: ${metrics.profitGrowth1Y.toFixed(1)}% - 良好な収益成長`);
      } else if (metrics.profitGrowth1Y > 5) {
        score += 10;
        analysis.push(`利益成長率（1年）: ${metrics.profitGrowth1Y.toFixed(1)}% - 安定成長`);
      } else if (metrics.profitGrowth1Y > 0) {
        score += 5;
        analysis.push(`利益成長率（1年）: ${metrics.profitGrowth1Y.toFixed(1)}%`);
      } else {
        score -= 15;
        analysis.push(`利益成長率（1年）: ${metrics.profitGrowth1Y.toFixed(1)}% - 減益`);
      }
    }

    // EPS成長率
    if (metrics.epsGrowth !== undefined && metrics.epsGrowth !== null) {
      if (metrics.epsGrowth > 20) {
        score += 15;
        analysis.push(`EPS成長率: ${metrics.epsGrowth.toFixed(1)}% - 株主価値の向上`);
      } else if (metrics.epsGrowth > 10) {
        score += 10;
        analysis.push(`EPS成長率: ${metrics.epsGrowth.toFixed(1)}% - 良好`);
      } else if (metrics.epsGrowth > 0) {
        score += 5;
        analysis.push(`EPS成長率: ${metrics.epsGrowth.toFixed(1)}%`);
      } else {
        score -= 10;
        analysis.push(`EPS成長率: ${metrics.epsGrowth.toFixed(1)}% - 低下`);
      }
    }

    // 総合評価
    let rating: GrowthAnalysis['rating'];
    if (score >= 75) {
      rating = 'HIGH_GROWTH';
    } else if (score >= 55) {
      rating = 'MODERATE_GROWTH';
    } else if (score >= 40) {
      rating = 'LOW_GROWTH';
    } else {
      rating = 'DECLINING';
    }

    return {
      metrics,
      rating,
      score,
      analysis,
    };
  }

  private formatCurrency(value: number): string {
    if (Math.abs(value) >= 1e12) {
      return `${(value / 1e12).toFixed(2)}兆円`;
    } else if (Math.abs(value) >= 1e8) {
      return `${(value / 1e8).toFixed(0)}億円`;
    } else if (Math.abs(value) >= 1e4) {
      return `${(value / 1e4).toFixed(0)}万円`;
    } else {
      return `${value.toFixed(0)}円`;
    }
  }
}
