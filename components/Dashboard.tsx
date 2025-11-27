import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { dataService } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { Search, Sparkles, ArrowUpRight, ArrowDownLeft, Wallet, Pencil, Trash2 } from 'lucide-react';

interface Props {
    onEditTransaction: (id: string) => void;
}

export const Dashboard: React.FC<Props> = ({ onEditTransaction }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const txs = dataService.getTransactions();
    // Sort by date desc
    setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
        loadData();
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
          loadData();
      }
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onEditTransaction(id);
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
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Net Balance</h1>
                <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-emerald-400">
                    ₹{totalBalance.toLocaleString()}
                </div>
            </div>
            <div className="p-3 bg-neutral-900 rounded-full border border-neutral-800">
                <Wallet className="text-emerald-500" size={24} />
            </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                    <ArrowDownLeft size={16} />
                    <span className="text-xs font-semibold uppercase">You Receive</span>
                </div>
                <div className="text-xl font-bold text-slate-100">₹{pendingIn}</div>
            </div>
            <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-amber-400 mb-1">
                    <ArrowUpRight size={16} />
                    <span className="text-xs font-semibold uppercase">You Owe</span>
                </div>
                <div className="text-xl font-bold text-slate-100">₹{pendingOut}</div>
            </div>
        </div>

        {/* AI Summary Card */}
        <div className="relative overflow-hidden p-[1px] rounded-2xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20">
            <div className="bg-neutral-900/90 rounded-2xl p-5 relative">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="flex items-center text-sm font-semibold text-slate-200">
                        <Sparkles size={16} className="text-amber-300 mr-2" />
                        AI Weekly Insight
                    </h3>
                    {!summary && !loadingSummary && (
                        <button onClick={generateSummary} className="text-xs bg-neutral-800 hover:bg-neutral-700 px-3 py-1 rounded-full text-neutral-300 transition">
                            Generate
                        </button>
                    )}
                </div>
                {loadingSummary ? (
                    <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-neutral-800 rounded w-3/4"></div>
                        <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
                    </div>
                ) : (
                    <p className="text-sm text-neutral-400 leading-relaxed">
                        {summary || "Tap generate to get a smart breakdown of your recent financial habits."}
                    </p>
                )}
            </div>
        </div>

        {/* Smart Search */}
        <form onSubmit={handleSmartSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-5 w-5 ${isSearching ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-neutral-800 rounded-xl leading-5 bg-neutral-900/50 text-slate-200 placeholder-neutral-500 focus:outline-none focus:bg-neutral-900 focus:ring-1 focus:ring-emerald-500/50 transition-all sm:text-sm"
                placeholder="Ask FlowFin: 'Spent on food last week?'"
            />
        </form>

        {/* Recent Transactions List */}
        <div>
            <h3 className="text-sm font-semibold text-neutral-400 mb-3">Recent Activity</h3>
            <div className="space-y-3">
                {transactions.length === 0 ? (
                   <p className="text-center text-neutral-600 py-4">No transactions found.</p> 
                ) : (
                    transactions.slice(0, 5).map((t) => (
                        <div key={t.id} className="group flex justify-between items-center p-3 hover:bg-neutral-900 rounded-xl transition-colors border border-transparent hover:border-neutral-800 relative">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                    t.type === TransactionType.SPENT ? 'bg-neutral-800 text-neutral-400' :
                                    t.type === TransactionType.RECEIVED ? 'bg-emerald-500/10 text-emerald-500' :
                                    'bg-amber-500/10 text-amber-500'
                                }`}>
                                    {t.category[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-200">{t.description}</p>
                                    <p className="text-xs text-neutral-500">{new Date(t.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`font-semibold text-sm ${
                                    t.type === TransactionType.SPENT ? 'text-neutral-300' : 
                                    t.type === TransactionType.RECEIVED ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                    {t.type === TransactionType.SPENT ? '-' : '+'}₹{t.amount}
                                </span>
                                
                                {/* Edit/Delete Actions */}
                                <div className="flex items-center gap-1 bg-neutral-950/50 rounded-lg p-1 border border-neutral-800/50">
                                    <button onClick={(e) => handleEdit(e, t.id)} className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-500 hover:text-white transition-colors">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={(e) => handleDelete(e, t.id)} className="p-1.5 hover:bg-red-900/20 rounded-md text-neutral-500 hover:text-red-400 transition-colors">
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