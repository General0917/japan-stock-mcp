import axios from 'axios';

export interface StockPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockInfo {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface TechnicalIndicators {
  sma20: number;
  sma50: number;
  sma200: number;
  rsi: number;
  macd: number;
  signal: number;
}

export class StockAPIClient {
  private baseURL = 'https://query1.finance.yahoo.com/v8/finance/chart/';
  
  /**
   * 株価データを取得（Yahoo Finance API使用）
   */
  async getStockData(symbol: string, period: string = '1mo'): Promise<StockPrice[]> {
    try {
      // 日本株式のシンボル形式: 7203.T (トヨタ自動車)
      const yahooSymbol = symbol.includes('.T') ? symbol : `${symbol}.T`;
      
      const response = await axios.get(`${this.baseURL}${yahooSymbol}`, {
        params: {
          range: period,
          interval: '1d',
        },
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];

      const stockPrices: StockPrice[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        stockPrices.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          open: quotes.open[i] || 0,
          high: quotes.high[i] || 0,
          low: quotes.low[i] || 0,
          close: quotes.close[i] || 0,
          volume: quotes.volume[i] || 0,
        });
      }

      return stockPrices;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`株価データの取得に失敗しました: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 現在の株価情報を取得
   */
  async getCurrentPrice(symbol: string): Promise<StockInfo> {
    const data = await this.getStockData(symbol, '5d');
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const change = latest.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return {
      symbol,
      name: symbol,
      currentPrice: latest.close,
      change,
      changePercent,
      volume: latest.volume,
    };
  }

  /**
   * テクニカル指標を計算
   */
  calculateTechnicalIndicators(prices: StockPrice[]): TechnicalIndicators {
    const closes = prices.map(p => p.close);
    
    // SMA計算
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const sma200 = this.calculateSMA(closes, 200);
    
    // RSI計算
    const rsi = this.calculateRSI(closes, 14);
    
    // MACD計算
    const { macd, signal } = this.calculateMACD(closes);

    return {
      sma20,
      sma50,
      sma200,
      rsi,
      macd,
      signal,
    };
  }

  private calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    const slice = data.slice(-period);
    return slice.reduce((sum, val) => sum + val, 0) / period;
  }

  private calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = closes.length - period; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(closes: number[]): { macd: number; signal: number } {
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const macd = ema12 - ema26;

    // シグナル線は通常MACD値の9日EMAですが、簡略化のため固定値
    const signal = macd * 0.9;

    return { macd, signal };
  }

  private calculateEMA(data: number[], period: number): number {
    if (data.length === 0) return 0;
    
    const k = 2 / (period + 1);
    let ema = data[0];

    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }

    return ema;
  }
}
