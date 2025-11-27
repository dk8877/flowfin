import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import { Transaction, TransactionType } from '../types';
import { Calendar, AlertTriangle, Star, Pencil, Trash2 } from 'lucide-react';

interface Props {
    onEditTransaction?: (id: string) => void;
}

export const Timeline: React.FC<Props> = ({ onEditTransaction }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const txs = dataService.getTransactions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(txs);
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
        if (onEditTransaction) {
            onEditTransaction(id);
        }
    };

    const grouped = transactions.reduce((acc: any, t) => {
        const date = t.date.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(t);
        return acc;
    }, {});

    return (
        <div className="p-6 pt-6 lg:pt-10 space-y-6">
            <h2 className="text-2xl font-bold text-slate-100 mb-6 hidden lg:block">Timeline</h2>
            
            {/* Mock AI Timeline Insight */}
            <div className="bg-gradient-to-r from-amber-900/20 to-neutral-900 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                <Star className="text-amber-400 mt-1 shrink-0" size={18} />
                <div>
                    <h3 className="text-sm font-semibold text-amber-200">Spending Spike Detected</h3>
                    <p className="text-xs text-neutral-400 mt-1">You spent 40% more this weekend compared to last. Mostly on Dining.</p>
                </div>
            </div>

            <div className="relative border-l border-neutral-800 ml-3 space-y-8">
                {Object.keys(grouped).map(date => (
                    <div key={date} className="relative pl-6">
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-neutral-950" />
                        
                        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-3 flex items-center gap-2">
                            <Calendar size={12} />
                            {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                        </h3>

                        <div className="space-y-3">
                            {grouped[date].map((t: Transaction) => (
                                <div key={t.id} className="group bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 flex justify-between items-center relative overflow-hidden">
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">{t.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">{t.category}</span>
                                            {t.amount > 1000 && t.type === TransactionType.SPENT && (
                                                <span className="flex items-center gap-1 text-[10px] text-amber-500">
                                                    <AlertTriangle size={10} /> High Value
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-semibold text-sm ${
                                            t.type === TransactionType.SPENT ? 'text-neutral-300' : 
                                            t.type === TransactionType.RECEIVED ? 'text-emerald-400' : 'text-amber-400'
                                        }`}>
                                            {t.type === TransactionType.SPENT ? '-' : '+'}₹{t.amount}
                                        </span>
                                        
                                        {/* Actions */}
                                        <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-1 border border-neutral-700">
                                            {onEditTransaction && (
                                                <button onClick={(e) => handleEdit(e, t.id)} className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-500 hover:text-white transition-colors">
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                            <button onClick={(e) => handleDelete(e, t.id)} className="p-1.5 hover:bg-red-900/30 rounded-md text-neutral-500 hover:text-red-400 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};