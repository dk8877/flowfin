
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, AIInsight } from '../types';
import { dataService } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { pdfService } from '../services/pdfService';
import { Search, Sparkles, ArrowUpRight, ArrowDownLeft, Wallet, Pencil, Trash2, Zap, AlertTriangle, TrendingUp, CheckCircle, Bell, Download, Loader2 } from 'lucide-react';

interface Props {
    onEditTransaction: (id: string) => void;
}

export const Dashboard: React.FC<Props> = ({ onEditTransaction }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [systemMsg, setSystemMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const txs = dataService.getTransactions();
    // Sort by date desc
    const sortedTxs = txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(sortedTxs);
    
    // System Announcement
    setSystemMsg(dataService.getSystemAnnouncement());

    // Load Insights occasionally or if empty
    if (sortedTxs.length > 0) {
        setLoadingInsights(true);
        // In a real app we might cache this to avoid too many calls
        geminiService.generateDashboardInsights(sortedTxs).then(res => {
            setInsights(res);
            setLoadingInsights(false);
        });
    }
  };

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
        const txs = dataService.getTransactions();
        setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        return;
    }
    setIsSearching(true);
    const { filters } = await geminiService.smartSearch(searchQuery);
    
    let filtered = dataService.getTransactions();
    
    if (filters.description_contains) {
        filtered = filtered.filter(t => t.description.toLowerCase().includes(filters.description_contains.toLowerCase()));
    }
    if (filters.category_is) {
        filtered = filtered.filter(t => t.category.toLowerCase() === filters.category_is.toLowerCase());
    }
    // Simple mock filter for demo
    setTransactions(filtered);
    setIsSearching(false);
  };

  const generateSummary = async () => {
    setLoadingSummary(true);
    const text = await geminiService.getWeeklySummary(transactions);
    setSummary(text);
    setLoadingSummary(false);
  };
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Delete this transaction?")) {
          dataService.deleteTransaction(id);
          const txs = dataService.getTransactions();
          setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onEditTransaction(id);
  };

  const handleExportPdf = async () => {
      setExporting(true);
      await pdfService.generateReport(transactions, 'Transaction History');
      setExporting(false);
  };

  // Calculations
  const totalBalance = transactions.reduce((acc, t) => {
    if (t.type === TransactionType.RECEIVED) return acc + t.amount;
    if (t.type === TransactionType.SPENT) return acc - t.amount;
    return acc;
  }, 0);

  const pendingIn = transactions.filter(t => t.type === TransactionType.LENT).reduce((acc, t) => acc + t.amount, 0);
  const pendingOut = transactions.filter(t => t.type === TransactionType.BORROWED).reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="p-6 space-y-6 pt-10">
        
        {/* System Announcement Banner */}
        {systemMsg && (
            <div className="bg-amber-500/10 border border-amber-500/50 p-3 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-4">
                <Bell className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={16} />
                <div>
                    <h3 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase mb-1">System Announcement</h3>
                    <p className="text-sm text-amber-900 dark:text-amber-100">{systemMsg}</p>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Net Balance</h1>
                <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-emerald-600 dark:from-amber-200 dark:to-emerald-400">
                    ₹{totalBalance.toLocaleString()}
                </div>
            </div>
            <div className="p-3 bg-white dark:bg-neutral-900 rounded-full border border-slate-200 dark:border-neutral-800 shadow-sm dark:shadow-none">
                <Wallet className="text-emerald-500" size={24} />
            </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 dark:bg-neutral-900/50 p-4 rounded-2xl border border-slate-200 dark:border-neutral-800 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
                    <ArrowDownLeft size={16} />
                    <span className="text-xs font-semibold uppercase">You Receive</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">₹{pendingIn}</div>
            </div>
            <div className="bg-white/60 dark:bg-neutral-900/50 p-4 rounded-2xl border border-slate-200 dark:border-neutral-800 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-amber-500 dark:text-amber-400 mb-1">
                    <ArrowUpRight size={16} />
                    <span className="text-xs font-semibold uppercase">You Owe</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">₹{pendingOut}</div>
            </div>
        </div>

        {/* AI Insights Feed */}
        {insights.length > 0 && (
            <div className="space-y-3">
                 <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    AI Insights
                </h3>
                <div className="flex overflow-x-auto gap-4 pb-2 snap-x hide-scrollbar">
                    {insights.map((insight, idx) => (
                        <div key={idx} className={`snap-center shrink-0 w-64 p-4 rounded-2xl border ${
                            insight.type === 'warning' 
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' 
                            : insight.type === 'good' 
                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30'
                            : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {insight.type === 'warning' && <AlertTriangle size={16} className="text-red-500" />}
                                {insight.type === 'good' && <CheckCircle size={16} className="text-emerald-500" />}
                                {insight.type === 'neutral' && <TrendingUp size={16} className="text-neutral-500" />}
                                <h4 className={`text-sm font-bold ${
                                    insight.type === 'warning' ? 'text-red-700 dark:text-red-300' : 
                                    insight.type === 'good' ? 'text-emerald-700 dark:text-emerald-300' : 
                                    'text-slate-700 dark:text-slate-300'
                                }`}>{insight.title}</h4>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                                {insight.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* AI Summary Card */}
        <div className="relative overflow-hidden p-[1px] rounded-2xl bg-gradient-to-r from-amber-500/30 to-emerald-500/30">
            <div className="bg-white/95 dark:bg-neutral-900/90 rounded-2xl p-5 relative">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="flex items-center text-sm font-semibold text-slate-800 dark:text-slate-200">
                        <Sparkles size={16} className="text-amber-500 dark:text-amber-300 mr-2" />
                        AI Weekly Summary
                    </h3>
                    {!summary && !loadingSummary && (
                        <button onClick={generateSummary} className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-3 py-1 rounded-full text-slate-600 dark:text-neutral-300 transition">
                            Generate
                        </button>
                    )}
                </div>
                {loadingSummary ? (
                    <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-1/2"></div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                        {summary || "Tap generate to get a smart breakdown of your recent financial habits."}
                    </p>
                )}
            </div>
        </div>

        {/* Smart Search */}
        <form onSubmit={handleSmartSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-5 w-5 ${isSearching ? 'text-emerald-500 animate-pulse' : 'text-neutral-400 dark:text-neutral-500'}`} />
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl leading-5 bg-white dark:bg-neutral-900/50 text-slate-900 dark:text-slate-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 focus:ring-1 focus:ring-emerald-500/50 transition-all sm:text-sm shadow-sm dark:shadow-none"
                placeholder="Ask FlowFin: 'Spent on food last week?'"
            />
        </form>

        {/* Recent Transactions List */}
        <div>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Recent Activity</h3>
                <button 
                    onClick={handleExportPdf}
                    disabled={exporting}
                    className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-2 py-1 rounded-lg transition"
                >
                    {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Download Report
                </button>
            </div>
            <div className="space-y-3">
                {transactions.length === 0 ? (
                   <p className="text-center text-neutral-500 dark:text-neutral-600 py-4">No transactions found.</p> 
                ) : (
                    transactions.slice(0, 5).map((t) => (
                        <div key={t.id} className="group flex justify-between items-center p-3 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-neutral-900 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-neutral-800 relative">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                    t.type === TransactionType.SPENT ? 'bg-slate-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400' :
                                    t.type === TransactionType.RECEIVED ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' :
                                    'bg-amber-500/10 text-amber-600 dark:text-amber-500'
                                }`}>
                                    {t.category[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{t.description}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-neutral-500">{new Date(t.date).toLocaleDateString()}</p>
                                        {t.tags && t.tags.length > 0 && (
                                            <span className="text-[10px] text-neutral-400">#{t.tags[0]}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`font-semibold text-sm ${
                                    t.type === TransactionType.SPENT ? 'text-slate-700 dark:text-neutral-300' : 
                                    t.type === TransactionType.RECEIVED ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                    {t.type === TransactionType.SPENT ? '-' : '+'}₹{t.amount}
                                </span>
                                
                                {/* Edit/Delete Actions */}
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-950/50 rounded-lg p-1 border border-slate-200 dark:border-neutral-800/50">
                                    <button onClick={(e) => handleEdit(e, t.id)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-md text-neutral-500 dark:hover:text-white transition-colors">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={(e) => handleDelete(e, t.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};
