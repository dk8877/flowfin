
import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { ShieldCheck, UserPlus, LogIn, ArrowRight, Mail, Lock, User, KeyRound, ArrowLeft } from 'lucide-react';

interface AuthProps {
    onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [view, setView] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');
    
    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setErrorMsg('');
        setSuccessMsg('');
    };

    const switchView = (v: 'LOGIN' | 'SIGNUP' | 'FORGOT') => {
        resetForm();
        setView(v);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        
        if (!email || !password) {
            setErrorMsg("Please enter both email and password.");
            return;
        }

        const success = dataService.verifyCredentials(email, password);
        if (success) {
            onLogin();
        } else {
            setErrorMsg("Invalid email or password.");
        }
    };

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!name || !email || !password) {
            setErrorMsg("All fields are required.");
            return;
        }

        const success = dataService.registerUser(email, name, password);
        if (success) {
            onLogin();
        } else {
            setErrorMsg("Account with this email already exists.");
        }
    };

    const handleForgotPwd = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!email || !password) {
            setErrorMsg("Please enter email and your new password.");
            return;
        }

        const success = dataService.resetPassword(email, password);
        if (success) {
            setSuccessMsg("Password updated successfully. Please login.");
            setTimeout(() => switchView('LOGIN'), 1500);
        } else {
            setErrorMsg("Account not found.");
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Gradients (Wealth Theme) */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-400 mb-2 tracking-tight">
                        FlowFin
                    </h1>
                    <p className="text-neutral-500 text-sm tracking-widest uppercase">Intelligent Wealth Management</p>
                </div>

                <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-500">
                    
                    {view === 'LOGIN' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>
                            
                            <div className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-neutral-500" size={20} />
                                    <input 
                                        type="email" 
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-black/50 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500 outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-neutral-500" size={20} />
                                    <input 
                                        type="password" 
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {errorMsg && <p className="text-red-500 text-xs text-center font-medium bg-red-900/10 py-2 rounded-lg">{errorMsg}</p>}

                            <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                                Log In <ArrowRight size={20} />
                            </button>

                            <div className="flex justify-between items-center text-xs mt-4">
                                <button type="button" onClick={() => switchView('FORGOT')} className="text-neutral-400 hover:text-white transition">Forgot Password?</button>
                                <button type="button" onClick={() => switchView('SIGNUP')} className="text-emerald-500 hover:text-emerald-400 font-bold transition">Create Account</button>
                            </div>
                        </form>
                    )}

                    {view === 'SIGNUP' && (
                        <form onSubmit={handleSignup} className="space-y-5">
                            <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>
                            
                            <div className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 text-neutral-500" size={20} />
                                    <input 
                                        type="text" 
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-black/50 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-amber-500 outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-neutral-500" size={20} />
                                    <input 
                                        type="email" 
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-black/50 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-amber-500 outline-none transition-colors"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-neutral-500" size={20} />
                                    <input 
                                        type="password" 
                                        placeholder="Create App Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-amber-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {errorMsg && <p className="text-red-500 text-xs text-center font-medium bg-red-900/10 py-2 rounded-lg">{errorMsg}</p>}

                            <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-lg transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2">
                                Sign Up <UserPlus size={20} />
                            </button>

                            <div className="text-center text-xs mt-4">
                                <span className="text-neutral-500">Already have an account? </span>
                                <button type="button" onClick={() => switchView('LOGIN')} className="text-amber-500 hover:text-amber-400 font-bold transition">Log In</button>
                            </div>
                        </form>
                    )}

                    {view === 'FORGOT' && (
                         <form onSubmit={handleForgotPwd} className="space-y-5">
                            <div className="flex items-center gap-3 mb-6">
                                <button type="button" onClick={() => switchView('LOGIN')} className="p-2 bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition">
                                    <ArrowLeft size={16} />
                                </button>
                                <h2 className="text-xl font-bold text-white">Reset Password</h2>
                            </div>
                            
                            <p className="text-xs text-neutral-400 mb-4">Enter your registered email and a new password to recover access.</p>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-neutral-500" size={20} />
                                    <input 
                                        type="email" 
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-black/50 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-3.5 text-neutral-500" size={20} />
                                    <input 
                                        type="password" 
                                        placeholder="New Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {errorMsg && <p className="text-red-500 text-xs text-center font-medium bg-red-900/10 py-2 rounded-lg">{errorMsg}</p>}
                            {successMsg && <p className="text-emerald-500 text-xs text-center font-medium bg-emerald-900/10 py-2 rounded-lg">{successMsg}</p>}

                            <button type="submit" className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all shadow-lg shadow-indigo-900/20">
                                Reset Password
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
