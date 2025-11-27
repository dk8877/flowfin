import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Group, Person } from '../types';
import { Users, Plus, DollarSign, Trash2, Pencil, Save, X } from 'lucide-react';

export const Groups: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [view, setView] = useState<'list' | 'create' | 'edit' | 'expense'>('list');
    
    // Create/Edit Group State
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

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

    const handleAddExpenseClick = (groupId: string) => {
        setActiveGroupId(groupId);
        setView('expense');
    };

    const submitExpense = () => {
        if(activeGroupId && expDesc && expAmount) {
            dataService.addGroupExpense(activeGroupId, expDesc, parseFloat(expAmount), payer);
            setView('list');
            setExpDesc('');
            setExpAmount('');
            alert('Expense split and recorded in transactions!');
        }
    };

    return (
        <div className="p-6 pt-6 lg:pt-10 space-y-6">
            <h2 className="text-2xl font-bold text-slate-100 hidden lg:block">Groups</h2>

            {view === 'list' && (
                <>
                    <div className="flex flex-wrap gap-4">
                        <button 
                            onClick={() => { resetForm(); setView('create'); }}
                            className="flex-shrink-0 w-32 h-32 rounded-2xl border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center text-neutral-500 hover:text-emerald-400 hover:border-emerald-500/50 transition"
                        >
                            <Plus size={24} className="mb-2"/>
                            <span className="text-xs font-medium">New Group</span>
                        </button>
                        {groups.map(g => (
                            <div key={g.id} className="group relative flex-shrink-0 w-40 h-32 bg-neutral-900 rounded-2xl border border-neutral-800 p-4 flex flex-col justify-between hover:bg-neutral-800/50 transition cursor-pointer" onClick={() => handleAddExpenseClick(g.id)}>
                                {/* Edit Actions - Always Visible */}
                                <div className="absolute top-2 right-2 flex gap-1 z-10">
                                    <button onClick={(e) => startEditGroup(e, g)} className="p-1.5 bg-neutral-950 rounded-md text-neutral-400 hover:text-white border border-neutral-800"><Pencil size={12} /></button>
                                    <button onClick={(e) => handleDeleteGroup(e, g.id)} className="p-1.5 bg-neutral-950 rounded-md text-neutral-400 hover:text-red-400 border border-neutral-800"><Trash2 size={12} /></button>
                                </div>

                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                        <Users size={18} />
                                    </div>
                                    <span className="text-[10px] text-neutral-500">{g.members.length + 1} mb</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-200 truncate">{g.name}</h3>
                                    <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
                                        <Plus size={10} /> Add Expense
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {(view === 'create' || view === 'edit') && (
                <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 animate-in fade-in">
                    <h3 className="text-lg font-bold text-white mb-4">{view === 'create' ? 'Create New Group' : 'Edit Group'}</h3>
                    <input 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white mb-4" 
                        placeholder="Group Name (e.g. Goa Trip)"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                    />
                    <p className="text-xs text-neutral-500 mb-2 uppercase">Members</p>
                    <div className="space-y-2 mb-6">
                        {people.length === 0 ? (
                            <p className="text-sm text-neutral-500 italic">No people found. Add friends in the People tab first.</p>
                        ) : (
                            people.map(p => (
                                <div key={p.id} onClick={() => toggleMember(p.id)} className={`flex items-center p-3 rounded-xl border cursor-pointer ${selectedMembers.includes(p.id) ? 'border-emerald-500 bg-emerald-500/10' : 'border-neutral-800 bg-neutral-950'}`}>
                                    <div className={`w-4 h-4 rounded-full border mr-3 ${selectedMembers.includes(p.id) ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-600'}`} />
                                    <span className="text-sm text-slate-200">{p.name}</span>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setView('list')} className="flex-1 py-3 rounded-xl bg-neutral-800 text-neutral-400 text-sm font-semibold">Cancel</button>
                        <button onClick={view === 'create' ? handleCreateGroup : handleUpdateGroup} className="flex-1 py-3 rounded-xl bg-emerald-500 text-black text-sm font-semibold">
                            {view === 'create' ? 'Create' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}

            {view === 'expense' && activeGroupId && (
                 <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 animate-in slide-in-from-right-4">
                    <h3 className="text-lg font-bold text-white mb-4">Add Group Expense</h3>
                    <input 
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white mb-3" 
                        placeholder="Description"
                        value={expDesc}
                        onChange={e => setExpDesc(e.target.value)}
                    />
                    <div className="relative mb-3">
                        <span className="absolute left-3 top-3 text-neutral-500">₹</span>
                        <input 
                            type="number"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 pl-8 text-white" 
                            placeholder="Amount"
                            value={expAmount}
                            onChange={e => setExpAmount(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-neutral-500 mb-2 uppercase">Who Paid?</p>
                    <select value={payer} onChange={e => setPayer(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white mb-6 appearance-none">
                        <option value="user">You</option>
                        {people.filter(p => groups.find(g => g.id === activeGroupId)?.members.includes(p.id)).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <div className="flex gap-3">
                        <button onClick={() => setView('list')} className="flex-1 py-3 rounded-xl bg-neutral-800 text-neutral-400 text-sm font-semibold">Cancel</button>
                        <button onClick={submitExpense} className="flex-1 py-3 rounded-xl bg-emerald-500 text-black text-sm font-semibold">Split & Save</button>
                    </div>
                 </div>
            )}
        </div>
    );
};