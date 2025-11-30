
import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { Activity, Users, ShieldAlert, Search, Eye, Trash2, Send, BrainCircuit, Terminal, ArrowLeft, Radio } from 'lucide-react';

interface Props {
    onExit: () => void;
    onMasquerade: (userId: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({ onExit, onMasquerade }) => {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
        
        // HEARTBEAT: Keep the Admin Lock alive every minute
        const lockInterval = setInterval(() => {
            dataService.refreshAdminLock();
        }, 60 * 1000);

        return () => clearInterval(lockInterval);
    }, []);

    const handleExit = () => {
        dataService.releaseAdminLock();
        onExit();
    };

    const loadData = () => {
        setProfiles(dataService.getAllProfiles());
        setStats(dataService.getGlobalStats());
        const currentMsg = dataService.getSystemAnnouncement();
        if (currentMsg) setBroadcastMsg(currentMsg);
    };

    const handleBroadcast = () => {
        dataService.setSystemAnnouncement(broadcastMsg);
        alert('Announcement updated globally.');
    };

    const handleNuke = (id: string, name: string) => {
        if(confirm(`WARNING: NUKE PROTOCOL INITIATED.\n\nAre you sure you want to permanently delete user "${name}" and all their financial data? This cannot be undone.`)) {
            dataService.nukeUser(id);
            loadData();
        }
    };

    const runAiTest = async () => {
        if(!aiPrompt) return;
        setLoadingAi(true);
        const res = await geminiService.runRawPrompt(aiPrompt);
        setAiResponse(res);
        setLoadingAi(false);
    };

    const filteredProfiles = useMemo(() => {
        return profiles.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [profiles, searchTerm]);

    return (
        <div className="min-h-screen bg-neutral-950 text-amber-500 font-mono p-4 lg:p-10 selection:bg-amber-500/30">
            {/* Header */}
            <div className="flex justify-between items-center mb-10 border-b border-amber-900/30 pb-4">
                <div className="flex items-center gap-3">
                    <ShieldAlert size={32} className="text-amber-500 animate-pulse" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-widest uppercase text-amber-500">God Mode</h1>
                        <p className="text-xs text-amber-700">Super Admin Console • Level 5 Access</p>
                    </div>
                </div>
                <button 
                    onClick={handleExit}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-900/50 hover:bg-amber-900/20 text-amber-600 transition"
                >
                    <ArrowLeft size={16} /> Exit
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Global Stats */}
                <div className="bg-neutral-900/50 border border-amber-900/30 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2 text-amber-400">
                        <Users size={18} />
                        <h3 className="text-sm font-bold uppercase">Total Users</h3>
                    </div>
                    <div className="text-4xl font-bold text-white">{stats.totalUsers || 0}</div>
                </div>
                
                <div className="bg-neutral-900/50 border border-amber-900/30 rounded-xl p-5 backdrop-blur-sm">
                     <div className="flex items-center gap-2 mb-2 text-emerald-500">
                        <Activity size={18} />
                        <h3 className="text-sm font-bold uppercase">System Status</h3>
                    </div>
                    <div className="text-4xl font-bold text-white flex items-center gap-3">
                        Operational <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                </div>

                <div className="bg-neutral-900/50 border border-amber-900/30 rounded-xl p-5 backdrop-blur-sm flex flex-col justify-center">
                    <div className="text-xs text-amber-700 uppercase mb-1">Environment</div>
                    <div className="text-lg text-white">Production (v1.0.4)</div>
                    <div className="text-xs text-neutral-500 mt-1">Region: ap-south-1</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Management */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                         <h2 className="text-lg font-bold uppercase text-amber-500 flex items-center gap-2">
                             <Users size={20} /> User Management Protocol
                         </h2>
                         <div className="relative">
                             <Search className="absolute left-3 top-2.5 text-amber-800" size={16} />
                             <input 
                                type="text"
                                placeholder="Search DB..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-neutral-900 border border-amber-900/30 rounded-lg pl-9 pr-4 py-2 text-sm text-amber-100 placeholder-amber-900 focus:outline-none focus:border-amber-600 w-64"
                             />
                         </div>
                    </div>

                    <div className="bg-neutral-900/50 border border-amber-900/30 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-900 text-amber-700 uppercase tracking-wider font-semibold border-b border-amber-900/30">
                                <tr>
                                    <th className="p-4">User Identity</th>
                                    <th className="p-4">Last Active</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-900/10">
                                {filteredProfiles.length === 0 ? (
                                    <tr><td colSpan={3} className="p-8 text-center text-neutral-500">No records found in public registry.</td></tr>
                                ) : (
                                    filteredProfiles.map(p => (
                                        <tr key={p.id} className="hover:bg-amber-500/5 transition">
                                            <td className="p-4">
                                                <div className="font-bold text-white">{p.name}</div>
                                                <div className="text-xs text-neutral-500 font-mono">{p.email}</div>
                                                <div className="text-[10px] text-neutral-600 font-mono mt-1">ID: {p.id}</div>
                                            </td>
                                            <td className="p-4 text-neutral-400 font-mono text-xs">
                                                {new Date(p.lastActive).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => onMasquerade(p.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-900/20 text-emerald-500 border border-emerald-900/30 rounded hover:bg-emerald-900/40 transition text-xs font-bold uppercase"
                                                    >
                                                        <Eye size={12} /> Inspect
                                                    </button>
                                                    <button 
                                                        onClick={() => handleNuke(p.id, p.name)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-900/20 text-red-500 border border-red-900/30 rounded hover:bg-red-900/40 transition text-xs font-bold uppercase"
                                                    >
                                                        <Trash2 size={12} /> Nuke
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Broadcast System */}
                <div className="bg-neutral-900/50 border border-amber-900/30 rounded-xl p-6">
                    <h2 className="text-lg font-bold uppercase text-amber-500 flex items-center gap-2 mb-4">
                        <Radio size={20} /> Global Broadcast
                    </h2>
                    <div className="space-y-4">
                        <textarea 
                            value={broadcastMsg}
                            onChange={e => setBroadcastMsg(e.target.value)}
                            placeholder="Type system announcement here..."
                            className="w-full h-32 bg-neutral-950 border border-amber-900/30 rounded-lg p-3 text-amber-100 placeholder-amber-900/50 focus:outline-none focus:border-amber-600 text-sm font-mono"
                        />
                        <button 
                            onClick={handleBroadcast}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                        >
                            <Send size={16} /> {broadcastMsg ? 'Broadcast Message' : 'Clear Message'}
                        </button>
                    </div>
                </div>

                {/* AI Lab */}
                <div className="bg-neutral-900/50 border border-amber-900/30 rounded-xl p-6 flex flex-col h-full">
                    <h2 className="text-lg font-bold uppercase text-amber-500 flex items-center gap-2 mb-4">
                        <BrainCircuit size={20} /> AI Lab (Debug)
                    </h2>
                    <div className="flex-1 flex flex-col gap-4">
                         <div className="flex-1 relative">
                            <textarea 
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                placeholder="Enter raw prompt..."
                                className="w-full h-full min-h-[100px] bg-neutral-950 border border-amber-900/30 rounded-lg p-3 text-emerald-400 placeholder-emerald-900/50 focus:outline-none focus:border-emerald-600 text-sm font-mono"
                            />
                            <Terminal className="absolute bottom-3 right-3 text-emerald-800" size={16} />
                         </div>
                         <button 
                            onClick={runAiTest}
                            disabled={loadingAi}
                            className="bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-900/50 text-emerald-400 font-bold py-2 rounded-lg transition disabled:opacity-50"
                        >
                            {loadingAi ? 'Processing...' : 'Run Test'}
                        </button>
                        {aiResponse && (
                            <div className="max-h-40 overflow-y-auto bg-black p-3 rounded-lg border border-neutral-800">
                                <pre className="text-[10px] text-neutral-400 whitespace-pre-wrap">{aiResponse}</pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
