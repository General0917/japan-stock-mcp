#!/usr/bin/env python3
"""
日本株の財務データを取得するPythonスクリプト
yfinanceライブラリを使用して、より信頼性の高いデータ取得を実現
"""

import sys
import json
import yfinance as yf

def get_financial_data(symbol):
    """
    指定した銘柄の財務データを取得
    """
    try:
        # 日本株のシンボル形式に変換
        yahoo_symbol = symbol if '.T' in symbol else f"{symbol}.T"
        
        # yfinanceでティッカー情報を取得
        ticker = yf.Ticker(yahoo_symbol)
        info = ticker.info
        
        # データを構造化
        financial_data = {
            'symbol': symbol,
            'companyName': info.get('longName') or info.get('shortName') or symbol,
            'marketCap': info.get('marketCap'),
            'per': info.get('trailingPE') or info.get('forwardPE'),
            'pbr': info.get('priceToBook'),
            'eps': info.get('trailingEps'),
            'dividendYield': info.get('dividendYield') * 100 if info.get('dividendYield') else None,
            'roe': info.get('returnOnEquity') * 100 if info.get('returnOnEquity') else None,
            'debtToEquity': info.get('debtToEquity'),
            'currentRatio': info.get('currentRatio'),
            'operatingMargin': info.get('operatingMargins') * 100 if info.get('operatingMargins') else None,
            'profitMargin': info.get('profitMargins') * 100 if info.get('profitMargins') else None,
            'revenue': info.get('totalRevenue'),
            'netIncome': info.get('netIncomeToCommon'),
            'totalAssets': info.get('totalAssets'),
            'totalDebt': info.get('totalDebt'),
            'shareholdersEquity': info.get('totalStockholdersEquity'),
        }
        
        # JSON形式で出力
        print(json.dumps(financial_data, ensure_ascii=False))
        return 0
        
    except Exception as e:
        # エラーメッセージをJSONで返す
        error_data = {
            'error': True,
            'message': str(e),
            'symbol': symbol
        }
        print(json.dumps(error_data, ensure_ascii=False), file=sys.stderr)
        return 1

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(json.dumps({'error': True, 'message': '銘柄コードを指定してください'}), file=sys.stderr)
        sys.exit(1)
    
    symbol = sys.argv[1]
    sys.exit(get_financial_data(symbol))
