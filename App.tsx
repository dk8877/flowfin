
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionManager } from './components/TransactionManager';
import { PeopleHub } from './components/PeopleHub';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { Timeline } from './components/Timeline';
import { Budgets } from './components/Budgets';
import { Groups } from './components/Groups';
import { AIOptimizer } from './components/AIOptimizer';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { dataService } from './services/dataService';
import { EyeOff } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Admin State
  const [adminMode, setAdminMode] = useState(false);
  const [realAdminId, setRealAdminId] = useState<string | null>(null);

  useEffect(() => {
      setIsAuthenticated(dataService.isAuthenticated());
      
      // Theme initialization
      const storedTheme = localStorage.getItem('flowfin_theme');
      if (storedTheme === 'light') {
          setIsDarkMode(false);
          document.documentElement.classList.remove('dark');
      } else {
          setIsDarkMode(true);
          document.documentElement.classList.add('dark');
      }
  }, []);

  const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('flowfin_theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('flowfin_theme', 'light');
      }
  };

  const handleLogin = () => {
      setIsAuthenticated(true);
      setActiveTab('dashboard');
  };

  const handleLogout = () => {
      dataService.logout();
      setIsAuthenticated(false);
      setActiveTab('dashboard'); 
      setAdminMode(false);
      setRealAdminId(null);
  };

  const handleEditTransaction = (id: string) => {
    setEditingTransactionId(id);
    setActiveTab('add'); 
  };

  // Admin Actions
  const handleEnterAdmin = () => {
      setAdminMode(true);
      setActiveTab('admin');
  };

  const handleExitAdmin = () => {
      setAdminMode(false);
      setActiveTab('settings');
  };

  const handleMasquerade = (targetUserId: string) => {
      const currentAdminId = dataService.getCurrentUser()?.id;
      if (currentAdminId) {
          setRealAdminId(currentAdminId);
          dataService.impersonateUser(targetUserId);
          // Force re-render of components by resetting tab or state handled below
          setAdminMode(false); 
          setActiveTab('dashboard');
      }
  };

  const handleExitMasquerade = () => {
      if (realAdminId) {
          dataService.impersonateUser(realAdminId);
          setRealAdminId(null);
          setAdminMode(true);
          setActiveTab('admin');
      }
  };

  const renderContent = () => {
    if (adminMode && activeTab === 'admin') {
        return <AdminDashboard onExit={handleExitAdmin} onMasquerade={handleMasquerade} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onEditTransaction={handleEditTransaction} />;
      case 'add':
        return (
          <TransactionManager 
            editingId={editingTransactionId}
            onComplete={() => {
              setActiveTab('dashboard');
              setEditingTransactionId(null);
            }} 
          />
        );
      case 'people':
        return <PeopleHub />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return (
            <Settings 
                onLogout={handleLogout} 
                isDarkMode={isDarkMode} 
                toggleTheme={toggleTheme} 
                onEnterAdmin={handleEnterAdmin}
            />
        );
      case 'timeline':
        return <Timeline onEditTransaction={handleEditTransaction} />;
      case 'budgets':
        return <Budgets />;
      case 'groups':
        return <Groups />;
      case 'optimizer':
        return <AIOptimizer />;
      default:
        return <Dashboard onEditTransaction={handleEditTransaction} />;
    }
  };

  if (!isAuthenticated) {
      return <Auth onLogin={handleLogin} />;
  }

  // If in Admin Mode (Full Screen), don't show Layout
  if (adminMode && activeTab === 'admin') {
      return renderContent();
  }

  return (
    <>
        <Layout activeTab={activeTab === 'add' && editingTransactionId ? 'dashboard' : activeTab} onTabChange={(tab) => {
        if (tab !== 'add') setEditingTransactionId(null);
        setActiveTab(tab);
        }}>
            {renderContent()}
        </Layout>

        {/* Masquerade Floating Exit Button */}
        {realAdminId && (
            <button 
                onClick={handleExitMasquerade}
                className="fixed bottom-24 right-6 lg:bottom-10 lg:right-24 z-[60] bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-full shadow-xl shadow-amber-900/50 flex items-center gap-2 animate-bounce"
            >
                <EyeOff size={20} /> Exit God Mode
            </button>
        )}
    </>
  );
}

export default App;
