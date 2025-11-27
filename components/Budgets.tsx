import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Budget, Transaction, TransactionType } from '../types';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export const Budgets: React.FC = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newCat, setNewCat] = useState('');
    const [newLimit, setNewLimit] = useState('');
    
    // Edit Mode State
    const [editingCategory, setEditingCategory] = useState<string | null>(null);

    useEffect(() => {
        loadData();
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
            
            // If editing and category name changed (not supported directly by this simple ID-less model, 
            // but we can assume category is unique ID here for simplicity or delete old one)
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
                 <h2 className="text-2xl font-bold text-slate-100">Monthly Budgets</h2>
                 {!isAdding && (
                     <button onClick={() => setIsAdding(true)} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700">
                         <Plus size={20} className="text-emerald-400"/>
                     </button>
                 )}
            </div>

            {isAdding && (
                <form onSubmit={handleSave} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 animate-in fade-in slide-in-from-top-2 relative">
                    <button type="button" onClick={resetForm} className="absolute top-2 right-2 text-neutral-500 hover:text-white"><X size={16}/></button>
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">{editingCategory ? 'Edit Budget' : 'New Budget'}</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input 
                            className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" 
                            placeholder="Category (e.g. Food)" 
                            value={newCat} 
                            onChange={e => setNewCat(e.target.value)} 
                            disabled={!!editingCategory} // Lock category name on edit for simplicity as it acts as ID
                        />
                        <input 
                            className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" 
                            type="number" 
                            placeholder="Limit (₹)" 
                            value={newLimit} 
                            onChange={e => setNewLimit(e.target.value)} 
                        />
                    </div>
                    <button className="w-full bg-emerald-600/20 text-emerald-400 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600/30">
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
                    const isOver = spent > b.limit;

                    return (
                        <div key={idx} className="group bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800 relative">
                            {/* Action Buttons */}
                            <div className="absolute top-3 right-3 flex gap-2">
                                <button onClick={(e) => startEdit(e, b)} className="text-neutral-600 hover:text-white transition-colors p-1">
                                    <Pencil size={14} />
                                </button>
                                <button onClick={(e) => handleDelete(e, b.category)} className="text-neutral-600 hover:text-red-400 transition-colors p-1">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h3 className="font-semibold text-slate-200">{b.category}</h3>
                                    <p className="text-xs text-neutral-500">₹{spent.toLocaleString()} spent of ₹{b.limit.toLocaleString()}</p>
                                </div>
                                <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-emerald-400'}`}>
                                    {Math.round(percent)}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-amber-300'}`} 
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};