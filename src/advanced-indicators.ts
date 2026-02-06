import { StockPrice } from './stock-api.js';

/**
 * ボリンジャーバンド
 */
export interface BollingerBands {
  upper: number[];
  middle: number[];
  lower: number[];
  currentUpper: number;
  currentMiddle: number;
  currentLower: number;
  currentPrice: number;
  bandwidth: number;
  percentB: number;
  signal: 'SQUEEZE' | 'EXPANSION' | 'BREAKOUT_UP' | 'BREAKOUT_DOWN' | 'NORMAL';
  analysis: string[];
}

/**
 * 一目均衡表
 */
export interface IchimokuCloud {
  tenkan: number;        // 転換線 (9日)
  kijun: number;         // 基準線 (26日)
  senkouA: number;       // 先行スパンA
  senkouB: number;       // 先行スパンB
  chikou: number;        // 遅行スパン
  cloudTop: number;      // 雲の上限
  cloudBottom: number;   // 雲の下限
  cloudThickness: number; // 雲の厚さ
  signal: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  analysis: string[];
}

/**
 * ATR（Average True Range）
 */
export interface ATR {
  value: number;
  volatility: 'VERY_HIGH' | 'HIGH' | 'NORMAL' | 'LOW' | 'VERY_LOW';
  stopLoss: {
    long: number;   // ロングポジションのストップロス
    short: number;  // ショートポジションのストップロス
  };
  analysis: string[];
}

/**
 * ストキャスティクス
 */
export interface Stochastic {
  k: number;      // %K
  d: number;      // %D
  signal: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  crossover: 'GOLDEN_CROSS' | 'DEAD_CROSS' | 'NONE';
  analysis: string[];
}

export class AdvancedTechnicalIndicators {
  /**
   * ボリンジャーバンドを計算
   */
  calculateBollingerBands(prices: StockPrice[], period: number = 20, stdDev: number = 2): BollingerBands {
    const closes = prices.map(p => p.close);
    const sma = this.calculateSMA(closes, period);
    const std = this.calculateStdDev(closes, period);
    
    const upper: number[] = [];
    const middle: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        upper.push(0);
        middle.push(0);
        lower.push(0);
      } else {
        const smaVal = sma[i];
        const stdVal = std[i];
        middle.push(smaVal);
        upper.push(smaVal + stdDev * stdVal);
        lower.push(smaVal - stdDev * stdVal);
      }
    }
    
    const currentPrice = closes[closes.length - 1];
    const currentUpper = upper[upper.length - 1];
    const currentMiddle = middle[middle.length - 1];
    const currentLower = lower[lower.length - 1];
    
    // バンド幅（ボラティリティ指標）
    const bandwidth = ((currentUpper - currentLower) / currentMiddle) * 100;
    
    // %B（バンド内の位置）
    const percentB = ((currentPrice - currentLower) / (currentUpper - currentLower)) * 100;
    
    // シグナル判定
    let signal: BollingerBands['signal'];
    const analysis: string[] = [];
    
    if (bandwidth < 5) {
      signal = 'SQUEEZE';
      analysis.push('スクイーズ状態 - 大きな値動きの前兆');
    } else if (bandwidth > 20) {
      signal = 'EXPANSION';
      analysis.push('バンド拡大中 - 高ボラティリティ');
    } else if (currentPrice > currentUpper) {
      signal = 'BREAKOUT_UP';
      analysis.push('上限バンド突破 - 強い上昇トレンド');
    } else if (currentPrice < currentLower) {
      signal = 'BREAKOUT_DOWN';
      analysis.push('下限バンド突破 - 強い下降トレンド');
    } else {
      signal = 'NORMAL';
    }
    
    // %B分析
    if (percentB > 80) {
      analysis.push(`%B: ${percentB.toFixed(1)} - 買われすぎ圏内`);
    } else if (percentB < 20) {
      analysis.push(`%B: ${percentB.toFixed(1)} - 売られすぎ圏内`);
    } else {
      analysis.push(`%B: ${percentB.toFixed(1)} - 正常範囲`);
    }
    
    analysis.push(`バンド幅: ${bandwidth.toFixed(2)}% - ${bandwidth < 10 ? '低ボラティリティ' : bandwidth > 20 ? '高ボラティリティ' : '通常'}`);
    
    return {
      upper,
      middle,
      lower,
      currentUpper,
      currentMiddle,
      currentLower,
      currentPrice,
      bandwidth,
      percentB,
      signal,
      analysis,
    };
  }

  /**
   * 一目均衡表を計算
   */
  calculateIchimoku(prices: StockPrice[]): IchimokuCloud {
    const highs = prices.map(p => p.high);
    const lows = prices.map(p => p.low);
    const closes = prices.map(p => p.close);
    
    // 転換線（過去9日間の最高値と最安値の平均）
    const tenkan = this.calculateDonchian(highs, lows, 9);
    
    // 基準線（過去26日間の最高値と最安値の平均）
    const kijun = this.calculateDonchian(highs, lows, 26);
    
    // 先行スパンA（転換線と基準線の平均を26日先行）
    const senkouA = (tenkan + kijun) / 2;
    
    // 先行スパンB（過去52日間の最高値と最安値の平均を26日先行）
    const senkouB = this.calculateDonchian(highs, lows, 52);
    
    // 遅行スパン（当日の終値を26日遅行）
    const currentPrice = closes[closes.length - 1];
    const chikou = closes.length >= 26 ? closes[closes.length - 26] : currentPrice;
    
    const cloudTop = Math.max(senkouA, senkouB);
    const cloudBottom = Math.min(senkouA, senkouB);
    const cloudThickness = ((cloudTop - cloudBottom) / currentPrice) * 100;
    
    // シグナル判定
    let signal: IchimokuCloud['signal'];
    const analysis: string[] = [];
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    // 1. 価格と雲の位置関係
    if (currentPrice > cloudTop) {
      bullishSignals += 2;
      analysis.push('価格が雲の上 - 強気トレンド');
    } else if (currentPrice < cloudBottom) {
      bearishSignals += 2;
      analysis.push('価格が雲の下 - 弱気トレンド');
    } else {
      analysis.push('価格が雲の中 - トレンドレス（様子見）');
    }
    
    // 2. 転換線と基準線の関係
    if (tenkan > kijun) {
      bullishSignals += 1;
      analysis.push('転換線が基準線の上 - 短期的に強気');
    } else if (tenkan < kijun) {
      bearishSignals += 1;
      analysis.push('転換線が基準線の下 - 短期的に弱気');
    }
    
    // 3. 遅行スパンの位置
    if (currentPrice > chikou) {
      bullishSignals += 1;
      analysis.push('遅行スパンが価格の下 - トレンド確認');
    } else if (currentPrice < chikou) {
      bearishSignals += 1;
      analysis.push('遅行スパンが価格の上 - 下降トレンド確認');
    }
    
    // 4. 雲の色（先行スパンAとBの関係）
    if (senkouA > senkouB) {
      bullishSignals += 1;
      analysis.push('雲の色が陽転 - 上昇基調');
    } else if (senkouA < senkouB) {
      bearishSignals += 1;
      analysis.push('雲の色が陰転 - 下降基調');
    }
    
    // 総合判定
    if (bullishSignals >= 4) {
      signal = 'STRONG_BULLISH';
    } else if (bullishSignals >= 2) {
      signal = 'BULLISH';
    } else if (bearishSignals >= 4) {
      signal = 'STRONG_BEARISH';
    } else if (bearishSignals >= 2) {
      signal = 'BEARISH';
    } else {
      signal = 'NEUTRAL';
    }
    
    analysis.push(`雲の厚さ: ${cloudThickness.toFixed(2)}% - ${cloudThickness > 5 ? '強いサポート/レジスタンス' : '弱いサポート/レジスタンス'}`);
    
    return {
      tenkan,
      kijun,
      senkouA,
      senkouB,
      chikou,
      cloudTop,
      cloudBottom,
      cloudThickness,
      signal,
      analysis,
    };
  }

  /**
   * ATR（Average True Range）を計算
   */
  calculateATR(prices: StockPrice[], period: number = 14): ATR {
    const trueRanges: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const high = prices[i].high;
      const low = prices[i].low;
      const prevClose = prices[i - 1].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trueRanges.push(tr);
    }
    
    // ATRの計算（指数移動平均）
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < trueRanges.length; i++) {
      atr = ((atr * (period - 1)) + trueRanges[i]) / period;
    }
    
    const currentPrice = prices[prices.length - 1].close;
    const atrPercent = (atr / currentPrice) * 100;
    
    // ボラティリティ判定
    let volatility: ATR['volatility'];
    if (atrPercent > 5) {
      volatility = 'VERY_HIGH';
    } else if (atrPercent > 3) {
      volatility = 'HIGH';
    } else if (atrPercent > 1.5) {
      volatility = 'NORMAL';
    } else if (atrPercent > 0.8) {
      volatility = 'LOW';
    } else {
      volatility = 'VERY_LOW';
    }
    
    // ストップロス推奨値（ATRの2倍）
    const stopLoss = {
      long: currentPrice - (atr * 2),
      short: currentPrice + (atr * 2),
    };
    
    const analysis: string[] = [];
    analysis.push(`ATR: ${atr.toFixed(2)}円 (${atrPercent.toFixed(2)}%)`);
    analysis.push(`ボラティリティ: ${volatility}`);
    analysis.push(`推奨ストップロス（買い）: ${stopLoss.long.toFixed(2)}円`);
    analysis.push(`推奨ストップロス（売り）: ${stopLoss.short.toFixed(2)}円`);
    
    if (volatility === 'VERY_HIGH' || volatility === 'HIGH') {
      analysis.push('⚠️ 高ボラティリティ - リスク管理を厳格に');
    } else if (volatility === 'VERY_LOW') {
      analysis.push('静穏な相場 - 大きな動きの前兆の可能性');
    }
    
    return {
      value: atr,
      volatility,
      stopLoss,
      analysis,
    };
  }

  /**
   * ストキャスティクスを計算
   */
  calculateStochastic(prices: StockPrice[], kPeriod: number = 14, dPeriod: number = 3): Stochastic {
    const highs = prices.map(p => p.high);
    const lows = prices.map(p => p.low);
    const closes = prices.map(p => p.close);
    
    // %Kの計算
    const kValues: number[] = [];
    for (let i = kPeriod - 1; i < prices.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
      const currentClose = closes[i];
      
      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }
    
    // %Dの計算（%Kの移動平均）
    const dValues: number[] = [];
    for (let i = dPeriod - 1; i < kValues.length; i++) {
      const d = kValues.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / dPeriod;
      dValues.push(d);
    }
    
    const k = kValues[kValues.length - 1] || 50;
    const d = dValues[dValues.length - 1] || 50;
    const prevK = kValues[kValues.length - 2] || k;
    const prevD = dValues[dValues.length - 2] || d;
    
    // シグナル判定
    let signal: Stochastic['signal'];
    let crossover: Stochastic['crossover'] = 'NONE';
    const analysis: string[] = [];
    
    if (k > 80) {
      signal = 'OVERBOUGHT';
      analysis.push(`%K: ${k.toFixed(1)} - 買われすぎ（売りシグナル）`);
    } else if (k < 20) {
      signal = 'OVERSOLD';
      analysis.push(`%K: ${k.toFixed(1)} - 売られすぎ（買いシグナル）`);
    } else {
      signal = 'NEUTRAL';
      analysis.push(`%K: ${k.toFixed(1)} - 中立圏`);
    }
    
    // ゴールデンクロス・デッドクロス
    if (prevK <= prevD && k > d) {
      crossover = 'GOLDEN_CROSS';
      analysis.push('ゴールデンクロス発生 - 買いシグナル');
    } else if (prevK >= prevD && k < d) {
      crossover = 'DEAD_CROSS';
      analysis.push('デッドクロス発生 - 売りシグナル');
    }
    
    analysis.push(`%D: ${d.toFixed(1)}`);
    
    return {
      k,
      d,
      signal,
      crossover,
      analysis,
    };
  }

  // ヘルパーメソッド
  private calculateSMA(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(0);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  }

  private calculateStdDev(data: number[], period: number): number[] {
    const result: number[] = [];
    const sma = this.calculateSMA(data, period);
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(0);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const squaredDiffs = slice.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
        result.push(Math.sqrt(variance));
      }
    }
    return result;
  }

  private calculateDonchian(highs: number[], lows: number[], period: number): number {
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const highest = Math.max(...recentHighs);
    const lowest = Math.min(...recentLows);
    return (highest + lowest) / 2;
  }
}
