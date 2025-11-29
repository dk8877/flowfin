import { Analytics } from "@vercel/analytics/react";
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
import { dataService } from './services/dataService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  useEffect(() => {
      setIsAuthenticated(dataService.isAuthenticated());
  }, []);

  const handleLogin = () => {
      setIsAuthenticated(true);
      setActiveTab('dashboard');
  };

  const handleLogout = () => {
      dataService.logout();
      setIsAuthenticated(false);
      setActiveTab('dashboard'); // Reset tab state
  };

  const handleEditTransaction = (id: string) => {
    setEditingTransactionId(id);
    setActiveTab('add'); // Switch to Transaction Manager view
  };

  const renderContent = () => {
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
        return <Settings onLogout={handleLogout} />;
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

  return (
    <Layout activeTab={activeTab === 'add' && editingTransactionId ? 'dashboard' : activeTab} onTabChange={(tab) => {
      if (tab !== 'add') setEditingTransactionId(null);
      setActiveTab(tab);
    }}>
      {renderContent()}
       <Analytics />
    </Layout>
  );
}

export default App;
