import { FundamentalsAPIClient } from '../src/fundamentals-api.js';
import {
  mockHealthyCompany,
  mockIncompleteCompany,
  expectValidScore,
  expectValidRecommendation,
} from './test-utils.js';

describe('FundamentalsAPIClient', () => {
  let client: FundamentalsAPIClient;

  beforeEach(() => {
    client = new FundamentalsAPIClient();
  });

  describe('analyzeFundamentals', () => {
    it('should analyze healthy company correctly', async () => {
      const analysis = await client.analyzeFundamentals(mockHealthyCompany);

      expectValidScore(analysis.overallScore);
      expectValidRecommendation(analysis.recommendation);
      
      expect(analysis.financialHealth.score).toBeGreaterThan(50);
      expect(analysis.valuation.score).toBeGreaterThan(40);
      expect(analysis.profitability.score).toBeGreaterThan(40);
    });

    it('should handle null values gracefully', async () => {
      const analysis = await client.analyzeFundamentals(mockIncompleteCompany);

      expect(analysis).toBeDefined();
      expectValidScore(analysis.overallScore);
      expectValidRecommendation(analysis.recommendation);
    });

    it('should not throw errors on null.toFixed()', async () => {
      // エラーが発生しないことを確認
      let error: Error | undefined;
      
      try {
        const result = await client.analyzeFundamentals(mockIncompleteCompany);
        
        // 結果が正常に返されていることを確認
        expect(result).toBeDefined();
        expect(result.symbol).toBe('TEST4');
      } catch (e) {
        error = e as Error;
      }
      
      // エラーが発生していないことを確認
      expect(error).toBeUndefined();
    });
  });
});
