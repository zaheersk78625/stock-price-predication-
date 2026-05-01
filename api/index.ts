import express from "express";

const app = express();

// Proxy for Stock Data 
app.get("/api/stock/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const { range = "1mo", interval = "1d" } = req.query;
  
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`
    );
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API responded with ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Stock fetch error:", error);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

export default app;
