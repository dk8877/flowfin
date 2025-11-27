
import React, { useState, useEffect } from 'react';
import { TransactionType, Person } from '../types';
import { dataService } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { Loader2, Wand2, Trash2 } from 'lucide-react';

interface Props {
    editingId?: string | null;
    onComplete: () => void;
}

export const TransactionManager: React.FC<Props> = ({ editingId, onComplete }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.SPENT);
    const [personId, setPersonId] = useState('');
    const [people, setPeople] = useState<Person[]>([]);
    
    // AI States
    const [isPredicting, setIsPredicting] = useState(false);

    useEffect(() => {
        setPeople(dataService.getPeople());
        
        if (editingId) {
            const tx = dataService.getTransaction(editingId);
            if (tx) {
                setAmount(tx.amount.toString());
                setDescription(tx.description);
                setCategory(tx.category);
                setType(tx.type);
                setPersonId(tx.personId || '');
            }
        }
    }, [editingId]);

    // AI Auto-fill trigger - Only if not editing
    useEffect(() => {
        if (editingId) return; 

        const timeoutId = setTimeout(async () => {
            if (description.length > 3 && !category) {
                setIsPredicting(true);
                const prediction = await geminiService.predictTransaction(description);
                if (prediction) {
                    setCategory(prediction.category);
                    if (prediction.type) setType(prediction.type as TransactionType);
                }
                setIsPredicting(false);
            }
        }, 1000); // Debounce prediction

        return () => clearTimeout(timeoutId);
    }, [description, editingId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description) return;

        const txData = {
            id: editingId || crypto.randomUUID(),
            amount: parseFloat(amount),
            description,
            category: category || 'General',
            date: editingId ? (dataService.getTransaction(editingId)?.date || new Date().toISOString()) : new Date().toISOString(),
            type,
            tags: [],
            personId: (type === TransactionType.LENT || type === TransactionType.BORROWED) ? personId : undefined
        };

        if (editingId) {
            dataService.updateTransaction(txData);
        } else {
            dataService.addTransaction(txData);
        }
        
        onComplete();
    };

    const handleDelete = () => {
        if (editingId && confirm('Are you sure you want to delete this transaction?')) {
            dataService.deleteTransaction(editingId);
            onComplete();
        }
    };

    return (
        <div className="p-6 pt-10 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
                {editingId && (
                    <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition">
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase">Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold">₹</span>
                        <input 
                            type="number" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-10 pr-4 text-3xl font-bold text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder-neutral-700"
                            placeholder="0.00"
                            autoFocus={!editingId}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase flex justify-between">
                        Description
                        {isPredicting && <span className="text-emerald-400 flex items-center text-[10px]"><Wand2 size={12} className="mr-1 animate-pulse"/> AI Predicting...</span>}
                    </label>
                    <input 
                        type="text" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-slate-200 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g. Dinner at Mario's"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase">Category</label>
                        <input 
                            type="text" 
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-slate-200 focus:border-emerald-500 outline-none transition-all"
                            placeholder="Food"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase">Type</label>
                        <select 
                            value={type} 
                            onChange={e => setType(e.target.value as TransactionType)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-slate-200 focus:border-emerald-500 outline-none appearance-none"
                        >
                            {Object.values(TransactionType).map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {(type === TransactionType.LENT || type === TransactionType.BORROWED) && (
                     <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase">With Whom?</label>
                        <select 
                            value={personId} 
                            onChange={e => setPersonId(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-slate-200 focus:border-amber-500 outline-none appearance-none"
                            required
                        >
                            <option value="">Select Person</option>
                            {people.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-neutral-500 mt-2">
                             Don't see them? Go to People tab to add.
                        </p>
                    </div>
                )}

                <button 
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-500 text-neutral-950 font-bold text-lg hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all mt-8"
                >
                    {editingId ? 'Update Transaction' : 'Save Transaction'}
                </button>
            </form>
        </div>
    );
};
