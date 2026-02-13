import { PortfolioOptimizer } from '../src/portfolio-optimizer.js';

describe('PortfolioOptimizer', () => {
  let optimizer: PortfolioOptimizer;

  beforeEach(() => {
    optimizer = new PortfolioOptimizer();
  });

  describe('basic functionality', () => {
    it('should be instantiable', () => {
      expect(optimizer).toBeInstanceOf(PortfolioOptimizer);
    });
  });
});
