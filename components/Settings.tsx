import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { geminiService } from '../services/geminiService';
import { Key, ShieldCheck, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

    useEffect(() => {
        const stored = dataService.getApiKey();
        if (stored) setApiKey(stored);
    }, []);

    const handleSave = async () => {
        setStatus('checking');
        dataService.setApiKey(apiKey);
        const valid = await geminiService.checkKey();
        setStatus(valid ? 'valid' : 'invalid');
    };

    return (
        <div className="p-6 pt-10 h-full">
             <h2 className="text-2xl font-bold text-slate-100 mb-8">Settings</h2>

             <div className="space-y-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4 text-emerald-400">
                        <Key size={20} />
                        <h3 className="font-bold text-sm uppercase">Gemini API Key</h3>
                    </div>
                    
                    <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                        To enable AI features like auto-categorization, coaching, and smart summaries, you need a Google Gemini API key. It is stored locally on your device.
                    </p>

                    <input 
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste your API Key here"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-slate-200 mb-4 focus:outline-none focus:border-emerald-500 transition-colors"
                    />

                    <button 
                        onClick={handleSave}
                        className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-semibold text-slate-200 transition"
                    >
                        {status === 'checking' ? 'Validating...' : 'Save & Validate'}
                    </button>

                    {status === 'valid' && (
                        <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-medium animate-in fade-in">
                            <ShieldCheck size={14} />
                            Key valid and saved securely.
                        </div>
                    )}
                    {status === 'invalid' && (
                        <div className="mt-4 flex items-center gap-2 text-red-500 text-xs font-medium animate-in fade-in">
                            <AlertCircle size={14} />
                            Invalid API Key. Please check and try again.
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-amber-500 hover:underline">
                        Get a free API Key from Google AI Studio
                    </a>
                </div>
             </div>
        </div>
    );
};
