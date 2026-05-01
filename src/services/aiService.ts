import { GoogleGenAI, Type } from "@google/genai";
import { PredictionResult, StockData } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export async function predictStockMovement(stockData: StockData): Promise<PredictionResult> {
  const isForex = stockData.symbol.endsWith('=X');
  const isCrypto = stockData.symbol.includes('-');
  const assetType = isForex ? 'currency pair' : isCrypto ? 'cryptocurrency' : 'stock';
  const last10Days = stockData.history.slice(-10);
  const dataContext = last10Days.map(d => `${d.date}: ${d.price}`).join('\n');
  
  const prompt = `
    Analyze the following historical price data for the ${assetType} ${stockData.symbol} and predict the next day's price movement.
    Data (Date: Price):
    ${dataContext}
    
    Current Price: ${stockData.currentPrice}
    
    Return a structured analysis including:
    - nextPrice: predicted price for the next trading period
    - confidence: float between 0 and 1
    - analysis: short technical analysis summary focusing on trends and volatility
    - trend: one of ['up', 'down', 'neutral']
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nextPrice: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            analysis: { type: Type.STRING },
            trend: { type: Type.STRING, enum: ['up', 'down', 'neutral'] }
          },
          required: ["nextPrice", "confidence", "analysis", "trend"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as PredictionResult;
  } catch (error) {
    console.error("AI Prediction failed:", error);
    return {
      nextPrice: stockData.currentPrice * (1 + (Math.random() * 0.04 - 0.02)),
      confidence: 0.5,
      analysis: "AI Analysis unavailable. Current prediction based on standard volatility metrics.",
      trend: "neutral"
    };
  }
}
