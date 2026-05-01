import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  BrainCircuit,
  RefreshCw,
  Info,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  User,
  LogOut,
  Star,
  Plus,
  X,
  CreditCard,
  Globe,
  Zap,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchStockData } from './services/stockService';
import { predictStockMovement } from './services/aiService';
import { StockData, PredictionResult } from './types';
import { cn } from './lib/utils';
import { format } from 'date-fns';
import { 
  auth, 
  signInWithGoogle, 
  logout, 
  createUserProfile, 
  getUserProfile, 
  toggleWatchlist 
} from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [symbol, setSymbol] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'prediction' | 'watchlist'>('chart');

  const INDIAN_MARKETS = [
    { symbol: '^NSEI', label: 'NIFTY 50' },
    { symbol: '^BSESN', label: 'SENSEX' },
    { symbol: 'USDINR=X', label: 'USD/INR' },
    { symbol: 'GBPINR=X', label: 'GBP/INR' },
    { symbol: 'EURINR=X', label: 'EUR/INR' },
    { symbol: 'RELIANCE.NS', label: 'RELIANCE' },
    { symbol: 'TCS.NS', label: 'TCS' },
  ];

  const FOREX_PAIRS = [
    { symbol: 'EURUSD=X', label: 'EUR/USD' },
    { symbol: 'GBPUSD=X', label: 'GBP/USD' },
    { symbol: 'BTC-USD', label: 'BITCOIN' },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await createUserProfile(u);
        const profile = await getUserProfile(u.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const [lastSync, setLastSync] = useState<Date>(new Date());

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Auth error details:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError("Login window was closed. Please keep it open until sign-in is complete.");
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError("Popup blocked by browser. Please allow popups for this site to sign in.");
      } else if (err.code === 'auth/cancelled-by-user') {
        setAuthError("Sign-in was cancelled.");
      } else if (err.code === 'auth/network-request-failed') {
        setAuthError("Network error. Please check your connection and try again.");
      } else {
        setAuthError("System authentication failed. Ensure popups are allowed and try once more.");
      }
    }
  };

  const loadData = async (targetSymbol: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    let finalSymbol = targetSymbol.toUpperCase();
    
    // Auto-formatting
    if (/^[A-Z]{6}$/.test(finalSymbol)) finalSymbol = `${finalSymbol}=X`;

    try {
      const data = await fetchStockData(finalSymbol);
      setStockData(data);
      setSymbol(finalSymbol);
      setLastSync(new Date());
    } catch (err: any) {
      if (!isSilent) setError(err.message || "Failed to load market data.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Real-time Auto Update Polling
  useEffect(() => {
    if (!symbol || loading) return;

    const interval = setInterval(() => {
      loadData(symbol, true); // Silent update
    }, 10000); // 10 seconds interval

    return () => clearInterval(interval);
  }, [symbol]);

  const runPrediction = async () => {
    if (!stockData) return;
    setPredicting(true);
    try {
      const result = await predictStockMovement(stockData);
      setPrediction(result);
      setActiveTab('prediction');
    } catch (err) {
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!user || !stockData) return;
    const isAdding = !userProfile?.watchlist?.includes(stockData.symbol);
    try {
      await toggleWatchlist(user.uid, stockData.symbol, isAdding);
      const updatedProfile = await getUserProfile(user.uid);
      setUserProfile(updatedProfile);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData('AAPL');
  }, []);

  const chartData = useMemo(() => {
    if (!stockData) return [];
    return stockData.history.map(point => ({
      ...point,
      displayDate: format(new Date(point.date), 'MMM dd')
    }));
  }, [stockData]);

  const isUp = (stockData?.change || 0) >= 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
        
        <div className="max-w-md w-full px-8 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <div className="w-20 h-20 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/30 rotate-6 transition-transform hover:rotate-0 mb-6">
              <Activity className="w-12 h-12 text-black stroke-[2.5px]" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Quant<span className="text-emerald-400">Predict</span></h1>
            <p className="text-zinc-500 leading-relaxed text-lg">
              Next-generation market intelligence. Analyze, predict, and master your assets with AI.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[11px] font-bold flex items-start gap-3 text-left"
              >
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{authError}</p>
              </motion.div>
            )}
            <button 
              onClick={handleLogin}
              className="group w-full bg-white text-black py-4 rounded-2xl font-black tracking-tight flex items-center justify-center gap-3 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 shadow-2xl shadow-emerald-500/20"
            >
              <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Initialize Terminal Access
            </button>
            <div className="flex items-center gap-4 py-4">
              <div className="h-[1px] flex-1 bg-zinc-800" />
              <span className="text-zinc-600 font-mono text-[10px] uppercase">Institutional Access Only</span>
              <div className="h-[1px] flex-1 bg-zinc-800" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-left">
                <BrainCircuit className="w-6 h-6 text-emerald-400 mb-2" />
                <h3 className="text-white text-sm font-bold">Predictive AI</h3>
                <p className="text-zinc-500 text-[10px]">Real-time forecasting</p>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-left">
                <LayoutDashboard className="w-6 h-6 text-blue-400 mb-2" />
                <h3 className="text-white text-sm font-bold">Global Data</h3>
                <p className="text-zinc-500 text-[10px]">Stocks, Forex, Crypto</p>
              </div>
            </div>
          </motion.div>
        </div>

        <footer className="absolute bottom-8 text-[10px] text-zinc-700 font-mono tracking-widest uppercase">
          Terminal Access Protocol v1.0.4 // Ais-Compute-Core
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-emerald-500/30 flex">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 border-r border-zinc-800/50 bg-[#080808] flex flex-col transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 overflow-hidden">
            <Activity className="w-8 h-8 text-emerald-500 shrink-0" />
            <span className="text-xl font-black text-white hidden md:block">Quant<span className="text-emerald-400">P.</span></span>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-zinc-600 tracking-[0.2em] mb-4 pl-3 hidden md:block uppercase">Overview</p>
              {[
                { icon: LayoutDashboard, label: 'Dashboard', id: 'chart' as const },
                { icon: BrainCircuit, label: 'Predictions', id: 'prediction' as const },
                { icon: Star, label: 'Watchlist', id: 'watchlist' as const },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group",
                    activeTab === item.id ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="font-bold text-sm hidden md:block">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-zinc-600 tracking-[0.2em] mb-4 pl-3 hidden md:block uppercase">Indian Markets</p>
              {INDIAN_MARKETS.map((m) => (
                <button
                  key={m.symbol}
                  onClick={() => loadData(m.symbol)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all",
                    symbol === m.symbol ? "text-emerald-400 bg-emerald-500/5" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <span className="text-xs font-bold hidden md:block">{m.label}</span>
                  <Globe className="w-4 h-4 md:w-3 md:h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 mb-6 overflow-hidden">
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-zinc-700 shrink-0" />
            <div className="hidden md:block">
              <p className="text-xs font-bold text-white truncate w-32">{user.displayName}</p>
              <p className="text-[10px] text-zinc-600 truncate w-32">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all group"
          >
            <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" />
            <span className="font-bold text-sm hidden md:block">Logout System</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#020202]">
        <header className="h-20 border-b border-zinc-800/50 px-8 flex items-center justify-between sticky top-0 bg-black/50 backdrop-blur-xl z-20">
          <form onSubmit={(e) => { e.preventDefault(); if (searchInput) loadData(searchInput); }} className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search NASDAQ, NSE, Crypto..." 
              className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all focus:ring-4 focus:ring-emerald-500/5"
            />
          </form>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest leading-none">Live Sync: {format(lastSync, 'HH:mm:ss')}</span>
            </div>
            <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
              <Zap className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-black" />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-[60vh] flex flex-col items-center justify-center gap-4"
              >
                <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-zinc-600 font-mono text-xs tracking-[0.3em] uppercase">Syncing Price Streams...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center bg-rose-500/5 border border-rose-500/20 rounded-3xl"
              >
                <X className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Protocol Interface Error</h3>
                <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6">{error}</p>
                <button onClick={() => loadData('AAPL')} className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold">Resync Terminal</button>
              </motion.div>
            ) : stockData && (
              <motion.div
                key={stockData.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {/* Header Stats Bento */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2 bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-[2rem] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h1 className="text-3xl font-black text-white">{stockData.symbol}</h1>
                          <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            {stockData.symbol.endsWith('=X') ? 'FOREX' : stockData.symbol.includes('.') ? 'NSE' : 'NASDAQ'}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-xs font-medium">Global Market Segment Analysis</p>
                      </div>
                      <button 
                        onClick={handleToggleWatchlist}
                        className={cn(
                          "p-4 rounded-2xl border transition-all",
                          userProfile?.watchlist?.includes(stockData.symbol) 
                            ? "bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20" 
                            : "bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:text-white"
                        )}
                      >
                        <Star className={cn("w-5 h-5", userProfile?.watchlist?.includes(stockData.symbol) && "fill-current")} />
                      </button>
                    </div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-6xl font-mono tracking-tighter text-white">${stockData.currentPrice.toLocaleString()}</span>
                      <div className={cn("flex items-center gap-1 font-black", isUp ? "text-emerald-400" : "text-rose-400")}>
                        {isUp ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        {stockData.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-500 p-8 rounded-[2rem] flex flex-col justify-between group cursor-pointer hover:scale-[1.02] transition-transform shadow-2xl shadow-emerald-500/10" onClick={runPrediction}>
                    <BrainCircuit className="w-10 h-10 text-black mb-6" />
                    <div>
                      <p className="text-black/60 text-[10px] font-black uppercase tracking-widest mb-1">AI Forecaster</p>
                      <h3 className="text-black text-2xl font-black leading-tight">Generate Signal</h3>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-black/40 group-hover:text-black transition-colors">
                      <span className="text-xs font-bold uppercase">Ready</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest">Sentiment</span>
                        <span className="text-emerald-400 font-mono">BULLISH</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[72%]" />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 font-bold uppercase tracking-widest">Volatility</span>
                        <span className="text-rose-400 font-mono">HIGH</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 w-[45%]" />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-mono mt-4 leading-relaxed">Composite score based on volatility and moving averages.</p>
                  </div>
                </div>

                {/* Sub-Tabs for details */}
                <div className="flex gap-1 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/50 w-fit">
                  {(['chart', 'prediction', 'watchlist'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === tab ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[500px]">
                  {activeTab === 'chart' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] p-10 backdrop-blur-sm shadow-2xl">
                      <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <TrendingUp className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-white">Price History</h3>
                            <p className="text-zinc-500 text-xs">Last 30 trading sessions performance</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          {['7D', '30D', '90D', '1Y'].map(t => (
                            <button key={t} className={cn("text-[10px] font-black tracking-widest hover:text-white transition-colors", t === '30D' ? "text-emerald-400" : "text-zinc-600")}>{t}</button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isUp ? "#10b981" : "#fb7185"} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={isUp ? "#10b981" : "#fb7185"} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#18181b" />
                            <XAxis 
                              dataKey="displayDate" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: '#52525b', fontWeight: 'bold' }} 
                            />
                            <YAxis 
                              orientation="right"
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: '#52525b', fontWeight: 'bold' }}
                              domain={['dataMin - 1', 'dataMax + 1']}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold' }}
                              itemStyle={{ color: isUp ? '#10b981' : '#fb7185' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="price" 
                              stroke={isUp ? "#10b981" : "#fb7185"} 
                              strokeWidth={3} 
                              fill="url(#priceGradient)"
                              animationDuration={2000}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'prediction' && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-emerald-500 text-black p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <BrainCircuit className="absolute -right-10 -bottom-10 w-64 h-64 opacity-5 group-hover:scale-110 transition-transform" />
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-12 flex items-center gap-2">
                          <Zap className="w-4 h-4 fill-current" />
                          AI Intelligence Report
                        </h3>
                        
                        {!prediction ? (
                          <div className="space-y-6">
                            <p className="text-2xl font-black leading-tight max-w-sm">Run neural simulation for {stockData.symbol} to extract signals.</p>
                            <button 
                              onClick={runPrediction}
                              disabled={predicting}
                              className="bg-black text-white px-10 py-5 rounded-2xl font-black text-sm tracking-tight flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                            >
                              {predicting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                              ACTIVATE NEURAL ENGINE
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-8 relative z-10">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Next Close Prediction</p>
                              <div className="flex items-baseline gap-4">
                                <h4 className="text-7xl font-black tracking-tighter">${prediction.nextPrice.toFixed(2)}</h4>
                                <span className={cn(
                                  "px-3 py-1 rounded-lg text-xs font-black",
                                  prediction.trend === 'up' ? "bg-black text-emerald-400" : "bg-black text-rose-400"
                                )}>{prediction.trend.toUpperCase()}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-black/10">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Confidence</p>
                                <p className="text-3xl font-black">{(prediction.confidence * 100).toFixed(0)}%</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Market Sentiment</p>
                                <p className="text-3xl font-black">STABLE</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem]">
                        <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-8">Technical Narrative</h3>
                        {prediction ? (
                          <div className="space-y-6">
                            <p className="text-xl font-bold text-white leading-relaxed italic">"{prediction.analysis}"</p>
                            <div className="pt-8 border-t border-zinc-800 grid grid-cols-2 gap-4">
                              <div className="p-4 bg-zinc-800/50 rounded-2xl">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Support</p>
                                <p className="text-lg font-mono text-white">${(prediction.nextPrice * 0.98).toFixed(2)}</p>
                              </div>
                              <div className="p-4 bg-zinc-800/50 rounded-2xl">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Resistance</p>
                                <p className="text-lg font-mono text-white">${(prediction.nextPrice * 1.02).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center pb-12">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                              <Info className="w-8 h-8 text-zinc-600" />
                            </div>
                            <p className="text-zinc-600 text-sm max-w-xs uppercase font-black tracking-widest">No Active Inference</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'watchlist' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-white">Your Portfolios</h3>
                        <button className="flex items-center gap-2 px-4 py-2 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                          <Plus className="w-4 h-4" /> New Group
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userProfile?.watchlist?.map((s: string) => (
                          <button 
                            key={s} 
                            onClick={() => loadData(s)}
                            className={cn(
                              "p-6 rounded-3xl border text-left transition-all group relative overflow-hidden",
                              symbol === s ? "bg-emerald-500 border-emerald-400" : "bg-zinc-900 border-zinc-800/50 hover:border-zinc-600"
                            )}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="p-2 bg-black/10 rounded-xl">
                                <Globe className={cn("w-5 h-5", symbol === s ? "text-black" : "text-zinc-600")} />
                              </div>
                              <div className={cn("flex flex-col items-end")}>
                                <div className={cn("text-xs font-black uppercase tracking-widest", symbol === s ? "text-black/60" : "text-zinc-500")}>{s}</div>
                              </div>
                            </div>
                            <div className={cn("text-2xl font-black", symbol === s ? "text-black" : "text-white")}>{s}</div>
                            <div className="mt-4 flex items-center gap-2">
                              <span className={cn("text-[10px] font-black uppercase tracking-widest p-1 px-2 rounded", symbol === s ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-400")}>MARKET</span>
                              <ChevronRight className={cn("w-4 h-4 ml-auto transition-transform group-hover:translate-x-1", symbol === s ? "text-black" : "text-zinc-700")} />
                            </div>
                          </button>
                        )) || (
                          <div className="col-span-full py-20 text-center">
                            <Star className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                            <p className="text-zinc-600 font-black uppercase tracking-widest">Watchlist Empty</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
