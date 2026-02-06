/**
 * ニュース分析
 * 注: この機能はMCPのweb_search機能を使用して実装されます
 */

export interface NewsItem {
  title: string;
  source: string;
  date: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  relevance: number;  // 0-100
  summary: string;
}

export interface NewsAnalysis {
  symbol: string;
  companyName: string;
  news: NewsItem[];
  overallSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  sentimentScore: number;  // -100 to +100
  keyTopics: string[];
  analysis: string[];
}

export class NewsAnalyzer {
  /**
   * ニュースのセンチメント分析
   */
  analyzeSentiment(newsText: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' {
    const positiveKeywords = [
      '増収', '増益', '好調', '成長', '拡大', '上方修正', '最高益',
      '黒字', '回復', '上昇', '改善', '好決算', '躍進', '大幅増',
      '過去最高', '記録的', '快進撃', '急伸', '急騰'
    ];

    const negativeKeywords = [
      '減収', '減益', '不調', '低迷', '縮小', '下方修正', '赤字',
      '悪化', '下落', '減少', '損失', '不振', '苦戦', '大幅減',
      '最低', '急落', '暴落', '懸念', 'リスク', '問題'
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const keyword of positiveKeywords) {
      if (newsText.includes(keyword)) positiveCount++;
    }

    for (const keyword of negativeKeywords) {
      if (newsText.includes(keyword)) negativeCount++;
    }

    if (positiveCount > negativeCount + 2) return 'POSITIVE';
    if (negativeCount > positiveCount + 2) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  /**
   * センチメントスコアを計算
   */
  calculateSentimentScore(news: NewsItem[]): number {
    if (news.length === 0) return 0;

    let score = 0;
    for (const item of news) {
      const itemScore = item.sentiment === 'POSITIVE' ? 1 :
                       item.sentiment === 'NEGATIVE' ? -1 : 0;
      score += itemScore * (item.relevance / 100);
    }

    return (score / news.length) * 100;
  }

  /**
   * ニュースから株価への影響を評価
   */
  evaluateImpact(news: NewsItem[]): string[] {
    const analysis: string[] = [];
    
    const positiveNews = news.filter(n => n.sentiment === 'POSITIVE').length;
    const negativeNews = news.filter(n => n.sentiment === 'NEGATIVE').length;
    const neutralNews = news.filter(n => n.sentiment === 'NEUTRAL').length;

    analysis.push(`ポジティブニュース: ${positiveNews}件`);
    analysis.push(`ネガティブニュース: ${negativeNews}件`);
    analysis.push(`中立ニュース: ${neutralNews}件`);

    const totalNews = news.length;
    const positiveRatio = (positiveNews / totalNews) * 100;
    const negativeRatio = (negativeNews / totalNews) * 100;

    if (positiveRatio > 60) {
      analysis.push('📈 市場センチメントは非常にポジティブ');
      analysis.push('短期的な株価上昇が期待できる');
    } else if (positiveRatio > 40) {
      analysis.push('↗️ 市場センチメントはややポジティブ');
    } else if (negativeRatio > 60) {
      analysis.push('📉 市場センチメントは非常にネガティブ');
      analysis.push('短期的な株価下落リスクに注意');
    } else if (negativeRatio > 40) {
      analysis.push('↘️ 市場センチメントはややネガティブ');
    } else {
      analysis.push('→ 市場センチメントは中立的');
    }

    return analysis;
  }

  /**
   * キートピックを抽出
   */
  extractKeyTopics(news: NewsItem[]): string[] {
    const topics: { [key: string]: number } = {};
    const keywords = [
      '決算', '業績', '新製品', 'M&A', '提携', '増配', '株式分割',
      'EV', 'AI', 'DX', '半導体', '円安', '円高', '金利', '原材料',
      '人件費', '設備投資', '海外展開', 'コスト削減', '構造改革'
    ];

    for (const item of news) {
      const text = item.title + ' ' + item.summary;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          topics[keyword] = (topics[keyword] || 0) + 1;
        }
      }
    }

    return Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * ニュースの重要度を評価
   */
  assessRelevance(newsTitle: string, companyName: string): number {
    let score = 50;

    // 企業名が含まれている
    if (newsTitle.includes(companyName)) score += 30;

    // 重要なキーワード
    const highPriorityKeywords = ['決算', '業績予想', '配当', '株式分割'];
    const mediumPriorityKeywords = ['新製品', '提携', 'M&A', '人事'];

    for (const keyword of highPriorityKeywords) {
      if (newsTitle.includes(keyword)) score += 20;
    }

    for (const keyword of mediumPriorityKeywords) {
      if (newsTitle.includes(keyword)) score += 10;
    }

    return Math.min(100, score);
  }
}
