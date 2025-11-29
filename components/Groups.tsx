
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Group, Person, GroupExpense } from '../types';
import { Users, Plus, Trash2, Pencil, ArrowLeft, Receipt, ChevronRight, User } from 'lucide-react';

export const Groups: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [view, setView] = useState<'list' | 'create' | 'edit' | 'details' | 'expense'>('list');
    
    // Create/Edit Group State
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([]);

    // Add Expense State
    const [expDesc, setExpDesc] = useState('');
    const [expAmount, setExpAmount] = useState('');
    const [payer, setPayer] = useState('user');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setGroups(dataService.getGroups());
        setPeople(dataService.getPeople());
    };

    const handleCreateGroup = () => {
        if(groupName && selectedMembers.length > 0) {
            dataService.addGroup(groupName, selectedMembers);
            loadData();
            setView('list');
            resetForm();
        }
    };

    const handleUpdateGroup = () => {
        if (activeGroupId && groupName && selectedMembers.length > 0) {
            dataService.updateGroup({
                id: activeGroupId,
                name: groupName,
                members: selectedMembers
            });
            loadData();
            setView('list');
            resetForm();
        }
    };

    const resetForm = () => {
        setGroupName('');
        setSelectedMembers([]);
        setActiveGroupId(null);
        setExpDesc('');
        setExpAmount('');
        setPayer('user');
    };

    const handleDeleteGroup = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Delete this group? Expenses recorded will remain as individual transactions.")) {
            dataService.deleteGroup(id);
            loadData();
        }
    };

    const startEditGroup = (e: React.MouseEvent, group: Group) => {
        e.stopPropagation();
        setActiveGroupId(group.id);
        setGroupName(group.name);
        setSelectedMembers(group.members);
        setView('edit');
    };

    const toggleMember = (id: string) => {
        if(selectedMembers.includes(id)) {
            setSelectedMembers(selectedMembers.filter(m => m !== id));
        } else {
            setSelectedMembers([...selectedMembers, id]);
        }
    };

    const openGroupDetails = (group: Group) => {
        setActiveGroupId(group.id);
        setGroupExpenses(dataService.getGroupExpenses(group.id));
        setView('details');
    };

    const handleAddExpenseClick = () => {
        setView('expense');
    };

    const submitExpense = () => {
        if(activeGroupId && expDesc && expAmount) {
            dataService.addGroupExpense(activeGroupId, expDesc, parseFloat(expAmount), payer);
            // Refresh expenses for details view
            setGroupExpenses(dataService.getGroupExpenses(activeGroupId));
            setView('details');
            setExpDesc('');
            setExpAmount('');
        }
    };

    const getSplitBreakdown = () => {
        if (!activeGroupId || !expAmount) return null;
        const group = groups.find(g => g.id === activeGroupId);
        if (!group) return null;

        const totalPeople = group.members.length + 1;
        const amount = parseFloat(expAmount);
        if (isNaN(amount) || amount <= 0) return null;
        
        const splitAmount = amount / totalPeople;
        const payerName = payer === 'user' ? 'You' : people.find(p => p.id === payer)?.name || 'Someone';

        return { splitAmount, payerName, members: group.members };
    };

    const splitInfo = getSplitBreakdown();

    return (
        <div className="p-6 pt-6 lg:pt-10 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 hidden lg:block">Groups</h2>

            {view === 'list' && (
                <>
                    <div className="flex flex-wrap gap-4">
                        <button 
                            onClick={() => { resetForm(); setView('create'); }}
                            className="flex-shrink-0 w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-neutral-800 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-emerald-500 hover:border-emerald-500/50 transition"
                        >
                            <Plus size={24} className="mb-2"/>
                            <span className="text-xs font-medium">New Group</span>
                        </button>
                        {groups.map(g => (
                            <div key={g.id} className="group relative flex-shrink-0 w-40 h-32 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition cursor-pointer" onClick={() => openGroupDetails(g)}>
                                {/* Edit Actions - Always Visible */}
                                <div className="absolute top-2 right-2 flex gap-1 z-10">
                                    <button onClick={(e) => startEditGroup(e, g)} className="p-1.5 bg-slate-100 dark:bg-neutral-950 rounded-md text-neutral-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-neutral-800"><Pencil size={12} /></button>
                                    <button onClick={(e) => handleDeleteGroup(e, g.id)} className="p-1.5 bg-slate-100 dark:bg-neutral-950 rounded-md text-neutral-400 hover:text-red-400 border border-slate-200 dark:border-neutral-800"><Trash2 size={12} /></button>
                                </div>

                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 dark:text-indigo-400">
                                        <Users size={18} />
                                    </div>
                                    <span className="text-[10px] text-neutral-500">{g.members.length + 1} mb</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-200 truncate">{g.name}</h3>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-1 group-hover:underline">
                                        Details <ChevronRight size={10} />
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {view === 'details' && activeGroupId && (
                 <div className="animate-in fade-in slide-in-from-right-4">
                     <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setView('list')} className="p-2 bg-slate-100 dark:bg-neutral-800 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                             <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{groups.find(g => g.id === activeGroupId)?.name}</h2>
                             <p className="text-xs text-neutral-500">{groups.find(g => g.id === activeGroupId)?.members.length} friends + You</p>
                        </div>
                     </div>

                     <button 
                        onClick={handleAddExpenseClick}
                        className="w-full py-3 mb-6 bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition"
                     >
                        <Plus size={18} /> Add Group Expense
                     </button>

                     <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">Expense History</h3>
                     <div className="space-y-3">
                        {groupExpenses.length === 0 ? (
                            <p className="text-center text-neutral-500 dark:text-neutral-600 py-8 italic">No expenses added to this group yet.</p>
                        ) : (
                            groupExpenses.map(e => {
                                const payerName = e.paidBy === 'user' ? 'You' : people.find(p => p.id === e.paidBy)?.name || 'Unknown';
                                return (
                                    <div key={e.id} className="bg-white dark:bg-neutral-900/50 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400">
                                                <Receipt size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{e.description}</p>
                                                <p className="text-xs text-neutral-500">{payerName} paid ₹{e.amount}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-neutral-300">₹{e.amount}</span>
                                    </div>
                                );
                            })
                        )}
                     </div>
                 </div>
            )}

            {(view === 'create' || view === 'edit') && (
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 animate-in fade-in">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{view === 'create' ? 'Create New Group' : 'Edit Group'}</h3>
                    <input 
                        className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl p-3 text-slate-900 dark:text-white mb-4" 
                        placeholder="Group Name (e.g. Goa Trip)"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                    />
                    <p className="text-xs text-neutral-500 mb-2 uppercase">Members</p>
                    <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                        {people.length === 0 ? (
                            <p className="text-sm text-neutral-500 italic">No people found. Add friends in the People tab first.</p>
                        ) : (
                            people.map(p => (
                                <div key={p.id} onClick={() => toggleMember(p.id)} className={`flex items-center p-3 rounded-xl border cursor-pointer ${selectedMembers.includes(p.id) ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950'}`}>
                                    <div className={`w-4 h-4 rounded-full border mr-3 ${selectedMembers.includes(p.id) ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-400 dark:border-neutral-600'}`} />
                                    <span className="text-sm text-slate-900 dark:text-slate-200">{p.name}</span>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => { setView('list'); resetForm(); }} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-sm font-semibold">Cancel</button>
                        <button onClick={view === 'create' ? handleCreateGroup : handleUpdateGroup} className="flex-1 py-3 rounded-xl bg-emerald-500 text-black text-sm font-semibold">
                            {view === 'create' ? 'Create' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}

            {view === 'expense' && activeGroupId && (
                 <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 animate-in slide-in-from-right-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Group Expense</h3>
                    <input 
                        className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl p-3 text-slate-900 dark:text-white mb-3" 
                        placeholder="Description"
                        value={expDesc}
                        onChange={e => setExpDesc(e.target.value)}
                    />
                    <div className="relative mb-3">
                        <span className="absolute left-3 top-3 text-neutral-500">₹</span>
                        <input 
                            type="number"
                            className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl p-3 pl-8 text-slate-900 dark:text-white" 
                            placeholder="Amount"
                            value={expAmount}
                            onChange={e => setExpAmount(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-neutral-500 mb-2 uppercase">Who Paid?</p>
                    <select value={payer} onChange={e => setPayer(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl p-3 text-slate-900 dark:text-white mb-6 appearance-none">
                        <option value="user">You</option>
                        {people.filter(p => groups.find(g => g.id === activeGroupId)?.members.includes(p.id)).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    {/* Split Breakdown Visualization */}
                    {splitInfo && (
                        <div className="mb-6 bg-slate-50 dark:bg-neutral-950 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 animate-in fade-in">
                             <div className="flex justify-between items-center mb-3">
                                 <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-2">
                                    <Receipt size={12} /> Split Details
                                 </h4>
                                 <span className="text-xs font-medium text-slate-900 dark:text-slate-200 bg-slate-200 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                     Total: ₹{parseFloat(expAmount).toFixed(2)}
                                 </span>
                             </div>
                             
                             <div className="space-y-3 text-sm">
                                 <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium pb-2 border-b border-slate-200 dark:border-neutral-800">
                                     <span>Per person share</span>
                                     <span>₹{splitInfo.splitAmount.toFixed(2)}</span>
                                 </div>
                                 
                                 <div className="pt-1 space-y-2">
                                     <p className="text-[10px] text-neutral-400 uppercase font-semibold">Who owes {splitInfo.payerName}?</p>
                                     
                                     {payer === 'user' ? (
                                         // User Paid
                                         splitInfo.members.map(mid => {
                                             const mName = people.find(p => p.id === mid)?.name;
                                             return (
                                                 <div key={mid} className="flex justify-between items-center text-xs">
                                                     <div className="flex items-center gap-2">
                                                         <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                                                             {mName?.[0]}
                                                         </div>
                                                         <span className="text-neutral-600 dark:text-neutral-400">{mName} owes You</span>
                                                     </div>
                                                     <span className="text-emerald-600 dark:text-emerald-500 font-medium">+ ₹{splitInfo.splitAmount.toFixed(2)}</span>
                                                 </div>
                                             );
                                         })
                                     ) : (
                                         // Someone else Paid
                                         <>
                                            <div className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2">
                                                     <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                                                         Y
                                                     </div>
                                                    <span className="text-neutral-600 dark:text-neutral-400">You owe {splitInfo.payerName}</span>
                                                </div>
                                                <span className="text-red-500 dark:text-red-400 font-medium">- ₹{splitInfo.splitAmount.toFixed(2)}</span>
                                            </div>
                                            
                                            {splitInfo.members.filter(mId => mId !== payer).map(mid => {
                                                 const mName = people.find(p => p.id === mid)?.name || 'Unknown';
                                                 return (
                                                     <div key={mid} className="flex justify-between items-center text-xs">
                                                         <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                                                                 {mName[0]}
                                                             </div>
                                                             <span className="text-neutral-500 dark:text-neutral-500">{mName} owes {splitInfo.payerName}</span>
                                                         </div>
                                                         <span className="text-neutral-400">₹{splitInfo.splitAmount.toFixed(2)}</span>
                                                     </div>
                                                 );
                                            })}
                                         </>
                                     )}
                                 </div>
                             </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button onClick={() => setView('details')} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-sm font-semibold">Cancel</button>
                        <button onClick={submitExpense} className="flex-1 py-3 rounded-xl bg-emerald-500 text-black text-sm font-semibold">Confirm Split</button>
                    </div>
                 </div>
            )}
        </div>
    );
};
