
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Budget, Transaction, TransactionType } from '../types';
import { Plus, Pencil, Trash2, X, AlertTriangle, ShieldAlert } from 'lucide-react';

export const Budgets: React.FC = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newCat, setNewCat] = useState('');
    const [newLimit, setNewLimit] = useState('');
    const [shouldAnimate, setShouldAnimate] = useState(false);
    
    // Edit Mode State
    const [editingCategory, setEditingCategory] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        // Trigger animation after a brief delay to ensure CSS transition catches the width change from 0
        const timer = setTimeout(() => setShouldAnimate(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const loadData = () => {
        setBudgets(dataService.getBudgets());
        setTransactions(dataService.getTransactions());
    };

    const calculateSpent = (category: string) => {
        return transactions
            .filter(t => t.type === TransactionType.SPENT && t.category.toLowerCase() === category.toLowerCase())
            .reduce((acc, t) => acc + t.amount, 0);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if(newCat && newLimit) {
            const b: Budget = { category: newCat, limit: parseFloat(newLimit) };
            
            if (editingCategory && editingCategory !== newCat) {
                dataService.deleteBudget(editingCategory);
            }

            dataService.saveBudget(b);
            loadData();
            resetForm();
        }
    };

    const handleDelete = (e: React.MouseEvent, category: string) => {
        e.stopPropagation();
        if(confirm(`Delete budget for ${category}?`)) {
            dataService.deleteBudget(category);
            loadData();
        }
    };

    const startEdit = (e: React.MouseEvent, b: Budget) => {
        e.stopPropagation();
        setNewCat(b.category);
        setNewLimit(b.limit.toString());
        setEditingCategory(b.category);
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setNewCat('');
        setNewLimit('');
        setEditingCategory(null);
    };

    return (
        <div className="p-6 pt-6 lg:pt-10 space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Monthly Budgets</h2>
                 {!isAdding && (
                     <button onClick={() => setIsAdding(true)} className="p-2 bg-slate-100 dark:bg-neutral-800 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700 transition">
                         <Plus size={20} className="text-emerald-500 dark:text-emerald-400"/>
                     </button>
                 )}
            </div>

            {isAdding && (
                <form onSubmit={handleSave} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 animate-in fade-in slide-in-from-top-2 relative">
                    <button type="button" onClick={resetForm} className="absolute top-2 right-2 text-neutral-500 hover:text-slate-900 dark:hover:text-white"><X size={16}/></button>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-3">{editingCategory ? 'Edit Budget' : 'New Budget'}</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input 
                            className="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none" 
                            placeholder="Category (e.g. Food)" 
                            value={newCat} 
                            onChange={e => setNewCat(e.target.value)} 
                            disabled={!!editingCategory} 
                        />
                        <input 
                            className="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none" 
                            type="number" 
                            placeholder="Limit (₹)" 
                            value={newLimit} 
                            onChange={e => setNewLimit(e.target.value)} 
                        />
                    </div>
                    <button className="w-full bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 py-2 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-600/30 transition-colors">
                        {editingCategory ? 'Update Limit' : 'Set Budget'}
                    </button>
                </form>
            )}

            <div className="space-y-4">
                {budgets.length === 0 && !isAdding && (
                    <p className="text-neutral-500 text-center py-8">No budgets set. Click + to add one.</p>
                )}
                {budgets.map((b, idx) => {
                    const spent = calculateSpent(b.category);
                    const percent = Math.min((spent / b.limit) * 100, 100);
                    const rawPercent = (spent / b.limit) * 100;
                    
                    const isCritical = rawPercent >= 100;
                    const isWarning = rawPercent >= 90 && rawPercent < 100;

                    return (
                        <div key={idx} className={`group bg-white dark:bg-neutral-900/50 p-4 rounded-2xl border transition-colors duration-300 relative overflow-hidden ${isCritical ? 'border-red-500/30 shadow-lg shadow-red-500/10' : 'border-slate-200 dark:border-neutral-800'}`}>
                            {/* Action Buttons */}
                            <div className="absolute top-3 right-3 flex gap-2 z-10">
                                <button onClick={(e) => startEdit(e, b)} className="text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 bg-white/50 dark:bg-black/50 rounded">
                                    <Pencil size={14} />
                                </button>
                                <button onClick={(e) => handleDelete(e, b.category)} className="text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 bg-white/50 dark:bg-black/50 rounded">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="flex justify-between items-end mb-2 relative z-10">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                                        {b.category}
                                        {isCritical && <ShieldAlert size={14} className="text-red-500 animate-bounce" />}
                                        {isWarning && <AlertTriangle size={14} className="text-amber-500 animate-pulse" />}
                                    </h3>
                                    <p className="text-xs text-neutral-500">₹{spent.toLocaleString()} / ₹{b.limit.toLocaleString()}</p>
                                </div>
                                <span className={`text-sm font-bold transition-colors duration-300 ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {Math.round(rawPercent)}%
                                </span>
                            </div>
                            
                            {/* Progress Bar Container */}
                            <div className="h-3 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden relative z-10">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out relative
                                        ${isCritical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                                          isWarning ? 'bg-amber-500' : 
                                          'bg-gradient-to-r from-emerald-500 to-amber-300'}
                                    `}
                                    style={{ width: shouldAnimate ? `${percent}%` : '0%' }}
                                >
                                    {/* Pulse Overlay for Warning/Critical */}
                                    {(isWarning || isCritical) && (
                                        <div className="absolute inset-0 bg-white/30 animate-pulse w-full h-full"></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
