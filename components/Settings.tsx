
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { Key, ShieldCheck, AlertCircle, Sparkles, LogOut, Lock, User, Moon, Sun, Shield } from 'lucide-react';

interface Props {
    onLogout: () => void;
    isDarkMode?: boolean;
    toggleTheme?: () => void;
    onEnterAdmin?: () => void;
}

export const Settings: React.FC<Props> = ({ onLogout, isDarkMode = true, toggleTheme, onEnterAdmin }) => {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [usingSystemKey, setUsingSystemKey] = useState(false);
    
    // Auth State
    const [currentUser, setCurrentUser] = useState(dataService.getCurrentUser());
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [pwdMsg, setPwdMsg] = useState('');

    // Admin Gate
    const [showAdminPin, setShowAdminPin] = useState(false);
    const [pin, setPin] = useState('');

    useEffect(() => {
        const stored = dataService.getApiKey();
        if (stored) {
            setApiKey(stored);
        } else if (geminiService.hasValidKey()) {
            setUsingSystemKey(true);
            setStatus('valid');
        }
    }, []);

    const handleSaveKey = async () => {
        setStatus('checking');
        dataService.setApiKey(apiKey);
        setUsingSystemKey(false);
        const valid = await geminiService.checkKey();
        setStatus(valid ? 'valid' : 'invalid');
    };

    const handleClearKey = () => {
        dataService.setApiKey('');
        setApiKey('');
        if (geminiService.hasValidKey()) {
            setUsingSystemKey(true);
            setStatus('valid');
        } else {
            setStatus('idle');
        }
    };

    const handleChangePassword = () => {
        if(!oldPwd || !newPwd) return;
        const success = dataService.changePassword(oldPwd, newPwd);
        if(success) {
            setPwdMsg('Password updated successfully.');
            setOldPwd('');
            setNewPwd('');
        } else {
            setPwdMsg('Incorrect old password.');
        }
    };

    const handleAdminAccess = () => {
        if (pin === '0000') {
            onEnterAdmin && onEnterAdmin();
            setShowAdminPin(false);
            setPin('');
        } else {
            alert('Access Denied');
        }
    };

    return (
        <div className="p-6 pt-10 h-full pb-24">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h2>
                <button onClick={onLogout} className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition text-sm font-medium">
                    <LogOut size={16} /> Logout
                </button>
             </div>

             <div className="space-y-6">

                {/* Theme Toggle */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'}`}>
                             {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                         </div>
                         <div>
                             <h3 className="font-bold text-sm uppercase text-slate-900 dark:text-slate-100">Appearance</h3>
                             <p className="text-xs text-neutral-500">{isDarkMode ? 'Dark Mode' : 'Light Mode'} Active</p>
                         </div>
                     </div>
                     
                     <button 
                        onClick={toggleTheme}
                        className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-neutral-700' : 'bg-slate-300'}`}
                     >
                         <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                     </button>
                </div>
                
                {/* Account Section */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4 text-emerald-500 dark:text-emerald-400">
                        <User size={20} />
                        <h3 className="font-bold text-sm uppercase">Account</h3>
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-xs text-neutral-500 uppercase">Logged in as</p>
                        <p className="text-slate-900 dark:text-slate-200 font-medium">{currentUser?.name}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{currentUser?.email}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500 uppercase mb-3">Change Password</p>
                        <div className="space-y-3">
                            <input 
                                type="password"
                                placeholder="Current Password"
                                value={oldPwd}
                                onChange={e => setOldPwd(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                            />
                            <input 
                                type="password"
                                placeholder="New Password"
                                value={newPwd}
                                onChange={e => setNewPwd(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                            />
                            <button 
                                onClick={handleChangePassword}
                                className="w-full bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-300 py-2 rounded-xl text-sm font-semibold transition-colors"
                            >
                                Update Password
                            </button>
                            {pwdMsg && <p className={`text-xs text-center ${pwdMsg.includes('success') ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{pwdMsg}</p>}
                        </div>
                    </div>
                </div>

                {/* API Key Section */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4 text-amber-500 dark:text-amber-400">
                        <Key size={20} />
                        <h3 className="font-bold text-sm uppercase">Gemini API Key</h3>
                    </div>
                    
                    <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                        FlowFin uses Google Gemini for smart features. 
                    </p>

                    {usingSystemKey ? (
                        <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                            <Sparkles className="text-emerald-600 dark:text-emerald-400 shrink-0" size={18} />
                            <div>
                                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">System Key Active</p>
                                <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70">You are using the shared app key. AI features are enabled.</p>
                            </div>
                        </div>
                    ) : (
                         <p className="text-xs text-neutral-500 mb-4">
                            Enter your own key below to override the system default.
                        </p>
                    )}

                    <div className="relative">
                        <input 
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={usingSystemKey ? "Using System Key (Enter to override)" : "Paste your API Key here"}
                            className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 mb-4 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        {apiKey && (
                             <button 
                                onClick={handleClearKey}
                                className="absolute right-3 top-3 text-xs text-neutral-500 hover:text-slate-900 dark:hover:text-white bg-slate-200 dark:bg-neutral-800 px-2 py-1 rounded"
                             >
                                Clear
                             </button>
                        )}
                    </div>

                    <button 
                        onClick={handleSaveKey}
                        disabled={!apiKey}
                        className={`w-full py-3 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-200 transition ${!apiKey ? 'bg-slate-100 dark:bg-neutral-800 cursor-not-allowed opacity-50' : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'}`}
                    >
                        {status === 'checking' ? 'Validating...' : 'Save & Validate Personal Key'}
                    </button>

                    {status === 'valid' && !usingSystemKey && (
                        <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-medium animate-in fade-in">
                            <ShieldCheck size={14} />
                            Personal key valid and saved.
                        </div>
                    )}
                    {status === 'invalid' && (
                        <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-medium animate-in fade-in">
                            <AlertCircle size={14} />
                            Invalid API Key. Please check and try again.
                        </div>
                    )}
                </div>

                {/* Administrative Access */}
                <div className="bg-gradient-to-r from-neutral-900 to-black border border-amber-900/30 rounded-2xl p-5 mt-10">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-amber-500">
                             <Shield size={20} />
                             <h3 className="font-bold text-sm uppercase">Administrative Access</h3>
                         </div>
                         <button 
                            onClick={() => setShowAdminPin(true)}
                            className="px-4 py-2 border border-amber-500/50 text-amber-500 rounded-lg text-xs font-bold uppercase hover:bg-amber-500/10 transition"
                         >
                             Enter Admin Console
                         </button>
                    </div>
                </div>
             </div>

             {/* Admin Pin Modal */}
             {showAdminPin && (
                 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <div className="bg-neutral-900 border border-amber-500/30 p-8 rounded-2xl w-full max-w-sm text-center">
                         <h3 className="text-amber-500 font-bold text-lg mb-2 uppercase tracking-widest">Restricted Area</h3>
                         <p className="text-neutral-500 text-xs mb-6">Enter Administrator PIN to proceed.</p>
                         <input 
                            type="password" 
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            maxLength={4}
                            className="bg-black border border-neutral-800 rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] text-white w-full mb-6 focus:border-amber-500 focus:outline-none"
                            autoFocus
                         />
                         <div className="flex gap-3">
                             <button onClick={() => setShowAdminPin(false)} className="flex-1 py-3 text-neutral-400 hover:text-white transition">Cancel</button>
                             <button onClick={handleAdminAccess} className="flex-1 py-3 bg-amber-600 text-black font-bold rounded-xl hover:bg-amber-500 transition">Unlock</button>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};
