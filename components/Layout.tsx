
import React, { useState, useTransition } from 'react';
import { 
  LayoutDashboard, 
  List, 
  Target, 
  Users, 
  PlusCircle, 
  PieChart, 
  Lightbulb, 
  Settings as SettingsIcon,
  Menu,
  X,
  Plus,
  Loader2
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timeline', label: 'Timeline', icon: List },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'groups', label: 'Groups', icon: Users }, 
    { id: 'people', label: 'People', icon: Users },
    { id: 'add', label: 'New Transaction', icon: PlusCircle },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'optimizer', label: 'AI Optimizer', icon: Lightbulb },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleNavClick = (id: string) => {
    // Wrap the state update in startTransition to prevent UI blocking (Fixes INP issue)
    startTransition(() => {
      onTabChange(id);
    });
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-slate-200 font-sans selection:bg-emerald-500/20 overflow-hidden transition-colors duration-300">
      
      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:block
      `}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-neutral-800">
           <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-emerald-600 dark:from-amber-200 dark:to-emerald-400">
             FlowFin
           </h1>
           <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-neutral-400">
             <X size={24} />
           </button>
        </div>

        <nav className="p-4 space-y-2">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group ${
                        activeTab === item.id 
                        ? 'bg-slate-100 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 font-medium shadow-sm dark:shadow-black/40' 
                        : 'text-neutral-500 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:text-slate-900 dark:hover:text-neutral-200'
                    }`}
                >
                    <item.icon size={20} className={`mr-3 ${activeTab === item.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400 group-hover:text-emerald-500/70 transition-colors'}`} />
                    {item.label}
                    {/* Show a mini spinner if this specific tab is loading */}
                    {isPending && activeTab !== item.id && (item.id === 'analytics' || item.id === 'optimizer') && (
                       <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Only hinting loading for heavy tabs */}
                       </div>
                    )}
                </button>
            ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 flex items-center px-4 border-b border-slate-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
            <button onClick={() => setIsSidebarOpen(true)} className="text-neutral-500 dark:text-neutral-400 p-2 -ml-2 hover:text-slate-900 dark:hover:text-white">
                <Menu size={24} />
            </button>
            <span className="ml-4 font-semibold text-lg text-slate-900 dark:text-slate-200 flex items-center gap-2">
                {navItems.find(i => i.id === activeTab)?.label}
                {isPending && <Loader2 size={16} className="animate-spin text-emerald-500" />}
            </span>
        </header>

        {/* Content Scroll Area */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden p-0 relative transition-opacity duration-200 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
             <div className="max-w-2xl mx-auto min-h-full pb-24 lg:pb-10">
                {children}
             </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Floating Action Button - Quick Add */}
      {activeTab !== 'add' && (
          <button 
              onClick={() => onTabChange('add')}
              className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 p-4 bg-gradient-to-r from-amber-400 to-emerald-500 text-neutral-950 rounded-full shadow-xl shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all duration-300 group"
              aria-label="Add Transaction"
          >
              <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
          </button>
      )}
    </div>
  );
};
