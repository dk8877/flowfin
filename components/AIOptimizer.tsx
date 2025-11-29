import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { Transaction } from '../types';
import { Sparkles, TrendingDown, ArrowRight } from 'lucide-react';

export const AIOptimizer: React.FC = () => {
    const [optimization, setOptimization] = useState<Array<{category: string, change: string, advice: string}>>([]);
    const [loading, setLoading] = useState(false);

    const handleOptimize = async () => {
        setLoading(true);
        const txs = dataService.getTransactions();
        const res = await geminiService.optimizeSpending(txs);
        setOptimization(res);
        setLoading(false);
    };

    return (
        <div className="p-6 pt-6 lg:pt-10 space-y-8">
            <div className="bg-gradient-to-r from-amber-400 to-emerald-500 dark:from-amber-500 dark:to-emerald-600 rounded-3xl p-6 text-neutral-950 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Spending Optimizer</h2>
                    <p className="text-sm font-medium opacity-80 mb-6 max-w-xs">
                        Use Gemini AI to compare your monthly habits and find areas where you're overspending.
                    </p>
                    <button 
                        onClick={handleOptimize}
                        disabled={loading}
                        className="bg-neutral-950 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                        {loading ? <Sparkles className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {loading ? 'Analyzing...' : 'Run Analysis'}
                    </button>
                </div>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
            </div>

            {optimization.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Recommendations</h3>
                    {optimization.map((opt, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-5 rounded-2xl flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                                    <TrendingDown className="text-red-500 dark:text-red-400" size={20} />
                                    {opt.category}
                                </div>
                                <span className="px-2 py-1 bg-slate-100 dark:bg-neutral-800 rounded-md text-xs text-neutral-500 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700">{opt.change}</span>
                            </div>
                            <div className="flex gap-3 bg-slate-50 dark:bg-neutral-950/50 p-3 rounded-xl border border-slate-100 dark:border-neutral-800/50">
                                <ArrowRight className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{opt.advice}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};