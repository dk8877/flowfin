import React, { useState, useEffect } from 'react';
import { Person } from '../types';
import { dataService } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { MessageCircle, CheckCircle, Plus, User, Pencil, Trash2, X, Save } from 'lucide-react';

export const PeopleHub: React.FC = () => {
    const [people, setPeople] = useState<Person[]>([]);
    const [newPersonName, setNewPersonName] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [draftingFor, setDraftingFor] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        setPeople(dataService.getPeople());
    }, []);

    const loadData = () => {
        setPeople(dataService.getPeople());
    };

    const handleAddPerson = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPersonName) {
            dataService.addPerson(newPersonName);
            loadData();
            setNewPersonName('');
            setShowAdd(false);
        }
    };

    const handleSettle = (id: string) => {
        if(confirm("Mark all debts with this person as settled?")) {
            dataService.settleDebt(id);
            loadData();
        }
    };

    const handleDraftMessage = async (person: Person) => {
        setDraftingFor(person.id);
        const direction = person.netBalance > 0 ? 'OWES_YOU' : 'YOU_OWE';
        const msg = await geminiService.draftSettlementMessage(person.name, Math.abs(person.netBalance), direction);
        alert(`AI Drafted Message copied to clipboard:\n\n"${msg}"`);
        await navigator.clipboard.writeText(msg);
        setDraftingFor(null);
    };

    const startEdit = (e: React.MouseEvent, person: Person) => {
        e.stopPropagation();
        setEditingId(person.id);
        setEditName(person.name);
    };

    const saveEdit = (e: React.MouseEvent, person: Person) => {
        e.stopPropagation();
        if (editName.trim()) {
            dataService.updatePerson({ ...person, name: editName });
            setEditingId(null);
            loadData();
        }
    };

    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
    }

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Delete this person? This will not remove associated transactions but will unlink them.")) {
            dataService.deletePerson(id);
            loadData();
        }
    };

    return (
        <div className="p-6 pt-10 pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">People & Debts</h2>
                <button 
                    onClick={() => setShowAdd(!showAdd)}
                    className="p-2 bg-slate-100 dark:bg-neutral-800 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700 transition"
                >
                    <Plus size={20} className="text-slate-900 dark:text-slate-200" />
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAddPerson} className="mb-6 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 animate-in fade-in slide-in-from-top-4">
                    <input 
                        type="text" 
                        value={newPersonName}
                        onChange={e => setNewPersonName(e.target.value)}
                        placeholder="Friend's Name"
                        className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-2 text-slate-900 dark:text-slate-200 mb-3 focus:outline-none focus:border-amber-400"
                        autoFocus
                    />
                    <button type="submit" className="w-full bg-slate-100 dark:bg-neutral-800 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-700">Add Person</button>
                </form>
            )}

            <div className="space-y-4">
                {people.length === 0 && <p className="text-neutral-500 text-center">No friends added yet.</p>}
                
                {people.map(person => (
                    <div key={person.id} className="group bg-white/60 dark:bg-neutral-900/60 backdrop-blur border border-slate-200 dark:border-neutral-800 p-4 rounded-2xl flex flex-col gap-3 relative">
                        {/* Edit Actions - Top Right (Always Visible) */}
                        <div className="absolute top-4 right-4 flex gap-2">
                             {editingId === person.id ? (
                                <>
                                    <button onClick={(e) => saveEdit(e, person)} className="text-emerald-500 hover:bg-slate-100 dark:hover:bg-neutral-800 p-1 rounded"><Save size={16} /></button>
                                    <button onClick={(e) => cancelEdit(e)} className="text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800 p-1 rounded"><X size={16} /></button>
                                </>
                             ) : (
                                <>
                                    <button onClick={(e) => startEdit(e, person)} className="text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 p-1 rounded"><Pencil size={16} /></button>
                                    <button onClick={(e) => handleDelete(e, person.id)} className="text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-neutral-800 p-1 rounded"><Trash2 size={16} /></button>
                                </>
                             )}
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                                    <User size={18} className="text-neutral-400" />
                                </div>
                                <div>
                                    {editingId === person.id ? (
                                        <input 
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="bg-slate-50 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 rounded px-2 py-1 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                            autoFocus
                                            onClick={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <h3 className="font-semibold text-slate-900 dark:text-slate-200">{person.name}</h3>
                                    )}
                                    <p className="text-[10px] text-neutral-500">Last: {new Date(person.lastInteraction).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className={`text-lg font-bold pr-16 ${person.netBalance > 0 ? 'text-emerald-600 dark:text-emerald-400' : person.netBalance < 0 ? 'text-red-500 dark:text-red-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
                                {person.netBalance > 0 ? '+' : person.netBalance < 0 ? '-' : ''}₹{Math.abs(person.netBalance).toLocaleString()}
                            </div>
                        </div>

                        {person.netBalance !== 0 && (
                            <div className="flex gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-neutral-800/50">
                                <button 
                                    onClick={() => handleDraftMessage(person)}
                                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 flex items-center justify-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-200 transition"
                                    disabled={draftingFor === person.id}
                                >
                                    <MessageCircle size={14} />
                                    {draftingFor === person.id ? 'Drafting...' : 'Draft Text'}
                                </button>
                                <button 
                                    onClick={() => handleSettle(person.id)}
                                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-emerald-100 dark:bg-neutral-800 dark:hover:bg-emerald-900/30 flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 transition"
                                >
                                    <CheckCircle size={14} />
                                    Settle Up
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};