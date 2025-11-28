
import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { ArrowRight, Lock, Mail, User, ShieldCheck } from 'lucide-react';

interface AuthProps {
    onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (view === 'login') {
            const success = dataService.login(email, password);
            if (success) {
                onLogin();
            } else {
                setError('Invalid email or password');
            }
        } else if (view === 'register') {
            if (!name || !email || !password) {
                setError('All fields required');
                return;
            }
            const success = dataService.register(email, password, name);
            if (success) {
                onLogin();
            } else {
                setError('Email already exists');
            }
        } else if (view === 'forgot') {
            const msg = dataService.forgotPassword(email);
            setMessage(msg);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-emerald-400 mb-2">
                        FlowFin
                    </h1>
                    <p className="text-neutral-400">Your AI-Powered Wealth Companion</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl shadow-black/50">
                    <h2 className="text-2xl font-bold text-slate-100 mb-6">
                        {view === 'login' && 'Welcome Back'}
                        {view === 'register' && 'Create Account'}
                        {view === 'forgot' && 'Reset Password'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {view === 'register' && (
                             <div className="relative">
                                <User className="absolute left-4 top-3.5 text-neutral-500" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:border-emerald-500 outline-none transition-all"
                                />
                             </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-neutral-500" size={20} />
                            <input 
                                type="email" 
                                placeholder="Email Address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>

                        {view !== 'forgot' && (
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-neutral-500" size={20} />
                                <input 
                                    type="password" 
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                        )}

                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        {message && <p className="text-emerald-400 text-sm text-center">{message}</p>}

                        <button 
                            type="submit"
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-500 text-neutral-950 font-bold text-lg hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
                        >
                            {view === 'login' && <>Login <ArrowRight size={20}/></>}
                            {view === 'register' && <>Get Started <ArrowRight size={20}/></>}
                            {view === 'forgot' && <>Send Recovery Email</>}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm space-y-2">
                        {view === 'login' && (
                            <>
                                <p className="text-neutral-500">
                                    New to FlowFin? <button onClick={() => setView('register')} className="text-emerald-400 font-semibold hover:underline">Create Account</button>
                                </p>
                                <button onClick={() => setView('forgot')} className="text-neutral-500 hover:text-white transition">Forgot Password?</button>
                            </>
                        )}
                        {view === 'register' && (
                            <p className="text-neutral-500">
                                Already have an account? <button onClick={() => setView('login')} className="text-emerald-400 font-semibold hover:underline">Login</button>
                            </p>
                        )}
                        {view === 'forgot' && (
                            <button onClick={() => setView('login')} className="text-neutral-500 hover:text-white transition">Back to Login</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
