import { StockData, StockPrice } from '../types';

export async function fetchStockData(symbol: string): Promise<StockData> {
  const response = await fetch(`/api/stock/${symbol}`);
  if (!response.ok) throw new Error('Stock fetch failed');
  
  const raw = await response.json();
  
  if (!raw.chart || !raw.chart.result) {
    throw new Error('Invalid symbol or no data available');
  }

  const result = raw.chart.result[0];
  const meta = result.meta;
  const timestamps = result.timestamp || [];
  const indicators = result.indicators.quote[0];

  if (timestamps.length === 0) {
    throw new Error('No historical data available');
  }

  const history: StockPrice[] = timestamps.map((ts: number, i: number) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    price: indicators.close[i] || indicators.open[i] || indicators.low[i] || indicators.high[i],
    open: indicators.open[i],
    high: indicators.high[i],
    low: indicators.low[i],
    volume: indicators.volume[i],
  })).filter((d: any) => d.price !== null && d.price !== undefined);

  const currentPrice = meta.regularMarketPrice || history[history.length - 1].price;
  const prevClose = meta.previousClose || history[0].price;
  const change = currentPrice - prevClose;
  const changePercent = (change / prevClose) * 100;

  return {
    symbol: symbol.toUpperCase(),
    currentPrice,
    change,
    changePercent,
    history,
  };
}
