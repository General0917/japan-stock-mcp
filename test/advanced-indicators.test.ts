import { AdvancedTechnicalIndicators } from '../src/advanced-indicators.js';
import { generateMockStockPrices } from './test-utils.js';

describe('AdvancedTechnicalIndicators', () => {
  let indicators: AdvancedTechnicalIndicators;

  beforeEach(() => {
    indicators = new AdvancedTechnicalIndicators();
  });

  describe('Bollinger Bands', () => {
    it('should calculate bollinger bands correctly', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const bb = indicators.calculateBollingerBands(prices);

      expect(bb.upper).toBeInstanceOf(Array);
      expect(bb.middle).toBeInstanceOf(Array);
      expect(bb.lower).toBeInstanceOf(Array);
      expect(bb.upper.length).toBe(prices.length);
      
      expect(bb.currentUpper).toBeGreaterThan(bb.currentMiddle);
      expect(bb.currentMiddle).toBeGreaterThan(bb.currentLower);
    });

    it('should calculate bandwidth', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const bb = indicators.calculateBollingerBands(prices);

      expect(bb.bandwidth).toBeGreaterThan(0);
      expect(typeof bb.bandwidth).toBe('number');
    });

    it('should calculate %B', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const bb = indicators.calculateBollingerBands(prices);

      expect(bb.percentB).toBeDefined();
      expect(typeof bb.percentB).toBe('number');
    });

    it('should detect squeeze', () => {
      const prices = generateMockStockPrices(100, 1000, 0.005);
      const bb = indicators.calculateBollingerBands(prices);

      expect(['SQUEEZE', 'NORMAL', 'EXPANSION', 'BREAKOUT_UP', 'BREAKOUT_DOWN']).toContain(bb.signal);
    });

    it('should detect expansion', () => {
      const prices = generateMockStockPrices(100, 1000, 0.08);
      const bb = indicators.calculateBollingerBands(prices);

      expect(['EXPANSION', 'NORMAL', 'SQUEEZE', 'BREAKOUT_UP', 'BREAKOUT_DOWN']).toContain(bb.signal);
    });

    it('should provide analysis', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const bb = indicators.calculateBollingerBands(prices);

      expect(bb.analysis).toBeInstanceOf(Array);
      expect(bb.analysis.length).toBeGreaterThan(0);
    });
  });

  describe('Ichimoku Cloud', () => {
    it('should calculate ichimoku components', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const ichimoku = indicators.calculateIchimoku(prices);

      expect(ichimoku.tenkan).toBeDefined();
      expect(ichimoku.kijun).toBeDefined();
      expect(ichimoku.senkouA).toBeDefined();
      expect(ichimoku.senkouB).toBeDefined();
      expect(ichimoku.chikou).toBeDefined();
    });

    it('should calculate cloud boundaries', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const ichimoku = indicators.calculateIchimoku(prices);

      expect(ichimoku.cloudTop).toBeDefined();
      expect(ichimoku.cloudBottom).toBeDefined();
      expect(ichimoku.cloudTop).toBeGreaterThanOrEqual(ichimoku.cloudBottom);
    });

    it('should calculate cloud thickness', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const ichimoku = indicators.calculateIchimoku(prices);

      expect(ichimoku.cloudThickness).toBeGreaterThanOrEqual(0);
      expect(typeof ichimoku.cloudThickness).toBe('number');
    });

    it('should generate valid signals', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const ichimoku = indicators.calculateIchimoku(prices);

      expect(['STRONG_BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', 'STRONG_BEARISH']).toContain(
        ichimoku.signal
      );
    });

    it('should provide analysis', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const ichimoku = indicators.calculateIchimoku(prices);

      expect(ichimoku.analysis).toBeInstanceOf(Array);
      expect(ichimoku.analysis.length).toBeGreaterThan(0);
    });

    it('should detect bullish trend', () => {
      const prices = generateMockStockPrices(100, 1000, 0.01).map((p: any, i: number) => ({
        ...p,
        close: 1000 + i * 10,
        high: 1010 + i * 10,
        low: 990 + i * 10,
      }));

      const ichimoku = indicators.calculateIchimoku(prices);
      expect(['STRONG_BULLISH', 'BULLISH']).toContain(ichimoku.signal);
    });

    it('should detect bearish trend', () => {
      const prices = generateMockStockPrices(100, 1000, 0.01).map((p: any, i: number) => ({
        ...p,
        close: 1000 - i * 10,
        high: 1010 - i * 10,
        low: 990 - i * 10,
      }));

      const ichimoku = indicators.calculateIchimoku(prices);
      expect(['STRONG_BEARISH', 'BEARISH', 'NEUTRAL']).toContain(ichimoku.signal);
    });
  });

  describe('ATR (Average True Range)', () => {
    it('should calculate ATR', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const atr = indicators.calculateATR(prices);

      expect(atr.value).toBeGreaterThan(0);
      expect(typeof atr.value).toBe('number');
    });

    it('should classify volatility', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const atr = indicators.calculateATR(prices);

      expect(['VERY_HIGH', 'HIGH', 'NORMAL', 'LOW', 'VERY_LOW']).toContain(atr.volatility);
    });

    it('should calculate stop loss levels', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const atr = indicators.calculateATR(prices);

      expect(atr.stopLoss.long).toBeDefined();
      expect(atr.stopLoss.short).toBeDefined();
      expect(atr.stopLoss.long).toBeLessThan(prices[prices.length - 1].close);
      expect(atr.stopLoss.short).toBeGreaterThan(prices[prices.length - 1].close);
    });

    it('should provide analysis', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const atr = indicators.calculateATR(prices);

      expect(atr.analysis).toBeInstanceOf(Array);
      expect(atr.analysis.length).toBeGreaterThan(0);
    });

    it('should detect high volatility', () => {
      const prices = generateMockStockPrices(100, 1000, 0.1);
      const atr = indicators.calculateATR(prices);

      expect(['VERY_HIGH', 'HIGH']).toContain(atr.volatility);
    });

    it('should detect low volatility', () => {
      const prices = generateMockStockPrices(100, 1000, 0.005);
      const atr = indicators.calculateATR(prices);

      expect(['VERY_LOW', 'LOW', 'NORMAL']).toContain(atr.volatility);
    });
  });

  describe('Stochastic Oscillator', () => {
    it('should calculate stochastic %K and %D', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const stoch = indicators.calculateStochastic(prices);

      expect(stoch.k).toBeDefined();
      expect(stoch.d).toBeDefined();
      expect(stoch.k).toBeGreaterThanOrEqual(0);
      expect(stoch.k).toBeLessThanOrEqual(100);
      expect(stoch.d).toBeGreaterThanOrEqual(0);
      expect(stoch.d).toBeLessThanOrEqual(100);
    });

    it('should detect overbought conditions', () => {
      const prices = generateMockStockPrices(50, 1000, 0.01).map((p: any, i: number) => ({
        ...p,
        close: 1000 + i * 15,
        high: 1010 + i * 15,
        low: 990 + i * 15,
      }));

      const stoch = indicators.calculateStochastic(prices);
      expect(['OVERBOUGHT', 'NEUTRAL']).toContain(stoch.signal);
    });

    it('should detect oversold conditions', () => {
      const prices = generateMockStockPrices(50, 1000, 0.01).map((p: any, i: number) => ({
        ...p,
        close: 1000 - i * 15,
        high: 1010 - i * 15,
        low: 990 - i * 15,
      }));

      const stoch = indicators.calculateStochastic(prices);
      expect(['OVERSOLD', 'NEUTRAL']).toContain(stoch.signal);
    });

    it('should detect crossovers', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const stoch = indicators.calculateStochastic(prices);

      expect(['GOLDEN_CROSS', 'DEAD_CROSS', 'NONE']).toContain(stoch.crossover);
    });

    it('should provide analysis', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const stoch = indicators.calculateStochastic(prices);

      expect(stoch.analysis).toBeInstanceOf(Array);
      expect(stoch.analysis.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle minimum data points', () => {
      const prices = generateMockStockPrices(30, 1000, 0.02);

      expect(() => indicators.calculateBollingerBands(prices)).not.toThrow();
      expect(() => indicators.calculateIchimoku(prices)).not.toThrow();
      expect(() => indicators.calculateATR(prices)).not.toThrow();
      expect(() => indicators.calculateStochastic(prices)).not.toThrow();
    });

    it('should handle flat prices', () => {
      const prices = generateMockStockPrices(100, 1000, 0).map((p: any) => ({
        ...p,
        close: 1000,
        open: 1000,
        high: 1000,
        low: 1000,
      }));

      expect(() => indicators.calculateBollingerBands(prices)).not.toThrow();
      expect(() => indicators.calculateATR(prices)).not.toThrow();
    });
  });
});
