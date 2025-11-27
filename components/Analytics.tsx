import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { dataService } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { Transaction, TransactionType } from '../types';
import { BrainCircuit, Lightbulb, TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const Analytics: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [tips, setTips] = useState<Array<{title: string, description: string, type: string}>>([]);
    const [loadingTips, setLoadingTips] = useState(false);

    useEffect(() => {
        setTransactions(dataService.getTransactions());
    }, []);

    const getAIAnalysis = async () => {
        setLoadingTips(true);
        const results = await geminiService.getCoachTips(transactions);
        setTips(results);
        setLoadingTips(false);
    };

    // Chart Config
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                grid: { color: '#262626' },
                ticks: { color: '#737373' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#737373' }
            }
        }
    };

    const lineData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Spending',
                data: [120, 190, 30, 50, 20, 300, 100], // Mock for demo visualization
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                tension: 0.4,
            },
        ],
    };

    const categoryData = transactions.reduce((acc: any, t) => {
        if(t.type === TransactionType.SPENT) {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
        }
        return acc;
    }, {});

    const doughnutData = {
        labels: Object.keys(categoryData),
        datasets: [
            {
                data: Object.values(categoryData),
                backgroundColor: [
                    '#f59e0b', // amber
                    '#10b981', // emerald
                    '#3b82f6', // blue
                    '#ef4444', // red
                    '#8b5cf6', // violet
                ],
                borderWidth: 0,
            }
        ]
    };

    return (
        <div className="p-6 pt-10 pb-20 space-y-8">
            <h2 className="text-2xl font-bold text-slate-100">Financial Health</h2>

            {/* Coach Card */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-amber-500/20 rounded-2xl p-5 shadow-lg shadow-amber-900/5">
                <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wide">
                        <BrainCircuit size={18} />
                        AI Financial Coach
                     </div>
                     <button 
                        onClick={getAIAnalysis}
                        disabled={loadingTips}
                        className="text-xs bg-neutral-800 hover:bg-neutral-700 px-3 py-1 rounded-full text-neutral-300"
                     >
                        {loadingTips ? 'Thinking...' : 'Analyze Now'}
                     </button>
                </div>
                
                <div className="space-y-3">
                    {tips.length > 0 ? tips.map((tip, i) => (
                        <div key={i} className="flex gap-3 items-start bg-neutral-900/50 p-3 rounded-xl border border-neutral-800">
                             <Lightbulb className="text-emerald-400 shrink-0 mt-1" size={16} />
                             <div>
                                 <h4 className="text-sm font-semibold text-slate-200">{tip.title}</h4>
                                 <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{tip.description}</p>
                             </div>
                        </div>
                    )) : (
                        <p className="text-sm text-neutral-500 italic">Tap analyze to get personalized advice based on your spending history.</p>
                    )}
                </div>
            </div>

            {/* Spending Trend */}
            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl">
                <h3 className="text-sm font-semibold text-neutral-400 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Weekly Trend
                </h3>
                <div className="h-40">
                    <Line options={chartOptions} data={lineData} />
                </div>
            </div>

             {/* Category Breakdown */}
             <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="w-1/2">
                    <h3 className="text-sm font-semibold text-neutral-400 mb-2">Breakdown</h3>
                    <p className="text-xs text-neutral-500">Spending by category.</p>
                </div>
                <div className="w-32 h-32 relative">
                    <Doughnut data={doughnutData} options={{cutout: '70%', plugins: {legend: {display: false}}}} />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-neutral-600">
                        ₹
                    </div>
                </div>
            </div>
        </div>
    );
};