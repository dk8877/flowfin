
import React, { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  ScriptableContext
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { dataService } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { Transaction, TransactionType } from '../types';
import { BrainCircuit, Lightbulb, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export const Analytics: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [tips, setTips] = useState<Array<{title: string, description: string, type: string}>>([]);
    const [loadingTips, setLoadingTips] = useState(false);
    const [isDark, setIsDark] = useState(true);

    const chartRef = useRef<any>(null);

    useEffect(() => {
        setTransactions(dataService.getTransactions());
        
        // Check for dark mode to style charts accordingly
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const getAIAnalysis = async () => {
        setLoadingTips(true);
        const results = await geminiService.getCoachTips(transactions);
        setTips(results);
        setLoadingTips(false);
    };

    // --- Data Processing ---

    // 1. Line Chart Data (Last 7 Days)
    const getLast7DaysData = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const resultLabels = [];
        const resultData = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            resultLabels.push(days[d.getDay()]);
            
            const sum = transactions
                .filter(t => t.type === TransactionType.SPENT && t.date.startsWith(dateStr))
                .reduce((acc, t) => acc + t.amount, 0);
            resultData.push(sum);
        }

        return { labels: resultLabels, data: resultData };
    };

    // 2. Doughnut Data (Categories)
    const categoryDataMap = transactions.reduce((acc: any, t) => {
        if(t.type === TransactionType.SPENT) {
            const cat = t.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + t.amount;
        }
        return acc;
    }, {});

    const totalSpent = Object.values(categoryDataMap).reduce((a: any, b: any) => a + b, 0) as number;
    const sortedCategories = Object.keys(categoryDataMap).sort((a, b) => categoryDataMap[b] - categoryDataMap[a]);

    const trendData = getLast7DaysData();

    // --- Chart Configurations ---

    const chartColors = [
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#ef4444', // Red
    ];

    const lineData = {
        labels: trendData.labels,
        datasets: [
            {
                label: 'Spending',
                data: trendData.data,
                borderColor: '#10b981',
                backgroundColor: (context: ScriptableContext<'line'>) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
                    return gradient;
                },
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ]
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? 'rgba(23, 23, 23, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                titleColor: isDark ? '#e5e5e5' : '#171717',
                bodyColor: isDark ? '#a3a3a3' : '#525252',
                borderColor: isDark ? '#333' : '#e5e5e5',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: function(context: any) {
                        return `₹${context.parsed.y}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: isDark ? '#737373' : '#a3a3a3' }
            },
            y: {
                grid: { color: isDark ? '#262626' : '#e5e5e5', borderDash: [5, 5] },
                ticks: { color: isDark ? '#737373' : '#a3a3a3', callback: (val: any) => `₹${val}` }
            }
        }
    };

    const doughnutData = {
        labels: sortedCategories,
        datasets: [
            {
                data: sortedCategories.map(cat => categoryDataMap[cat]),
                backgroundColor: chartColors,
                borderWidth: 0,
                hoverOffset: 4
            }
        ]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? 'rgba(23, 23, 23, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                bodyColor: isDark ? '#e5e5e5' : '#171717',
                callbacks: {
                    label: function(context: any) {
                        return ` ₹${context.parsed}`;
                    }
                }
            }
        }
    };

    return (
        <div className="p-6 pt-6 lg:pt-10 space-y-6 pb-24">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h2>
            </div>

            {/* AI Coach Section */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <BrainCircuit size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">Financial Coach</h3>
                            <p className="text-xs text-neutral-500">AI-powered spending analysis</p>
                        </div>
                    </div>
                    {!tips.length && !loadingTips && (
                        <button 
                            onClick={getAIAnalysis}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2"
                        >
                            <Lightbulb size={14} /> Analyze
                        </button>
                    )}
                </div>

                {loadingTips && (
                    <div className="flex items-center gap-2 text-indigo-500 text-sm animate-pulse">
                        <Loader2 size={16} className="animate-spin" /> Analyzing transaction patterns...
                    </div>
                )}

                {tips.length > 0 && (
                    <div className="grid gap-3">
                        {tips.map((tip, idx) => (
                            <div key={idx} className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-indigo-500/10 flex gap-3 items-start">
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${tip.type === 'good' ? 'bg-emerald-500' : tip.type === 'warning' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{tip.title}</h4>
                                    <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">{tip.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart */}
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 h-80 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-500"/> 7-Day Trend
                        </h3>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <Line ref={chartRef} options={lineOptions} data={lineData} />
                    </div>
                </div>

                {/* Doughnut Chart with Custom Legend */}
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 h-80 flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                            <PieChart size={16} className="text-amber-500"/> Breakdown
                        </h3>
                        <span className="text-xs font-mono text-neutral-500">Total: ₹{totalSpent.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex flex-1 min-h-0 gap-4">
                        {/* Chart */}
                        <div className="w-1/2 relative flex items-center justify-center">
                            {sortedCategories.length > 0 ? (
                                <>
                                    <Doughnut options={doughnutOptions} data={doughnutData} />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="text-xs font-bold text-neutral-400">₹</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-neutral-500">No data</p>
                            )}
                        </div>

                        {/* Custom Legend */}
                        <div className="w-1/2 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-3">
                                {sortedCategories.map((cat, idx) => {
                                    const amount = categoryDataMap[cat];
                                    const percent = Math.round((amount / totalSpent) * 100);
                                    return (
                                        <div key={cat} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{cat}</p>
                                                    <p className="text-[10px] text-neutral-500">{percent}%</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono text-slate-600 dark:text-neutral-400">₹{amount}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
