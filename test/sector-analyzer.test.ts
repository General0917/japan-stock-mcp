import { SectorAnalyzer } from '../src/sector-analyzer.js';

describe('SectorAnalyzer', () => {
  let analyzer: SectorAnalyzer;

  beforeEach(() => {
    analyzer = new SectorAnalyzer();
  });

  describe('basic functionality', () => {
    it('should be instantiable', () => {
      expect(analyzer).toBeInstanceOf(SectorAnalyzer);
    });
  });

  describe('compareSector', () => {
    it('should handle empty symbol array', async () => {
      const results = await analyzer.compareSector([]);
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });
  });

  describe('screenStocks', () => {
    it('should handle empty symbol array', async () => {
      const criteria = { per: { max: 15 } };
      const results = await analyzer.screenStocks([], criteria);
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });
  });
});
