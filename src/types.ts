export interface StockPrice {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface StockData {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  history: StockPrice[];
}

export interface PredictionResult {
  nextPrice: number;
  confidence: number;
  analysis: string;
  trend: 'up' | 'down' | 'neutral';
}
