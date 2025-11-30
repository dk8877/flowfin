
import { Transaction, Person, TransactionType, Group, GroupExpense, Budget, UserProfile } from '../types';

const BASE_KEYS = {
  USERS: 'flowfin_users',
  SESSION: 'flowfin_current_user_id',
  PUBLIC_PROFILES: 'flowfin_public_profiles',
  SYSTEM_ANNOUNCEMENT: 'flowfin_system_announcement',
  ADMIN_LOCK: 'flowfin_admin_lock',
};

// Safe UUID generator
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper to get current user ID
const getCurrentUserId = (): string | null => {
    return localStorage.getItem(BASE_KEYS.SESSION);
};

// Helper to get key for current user
const getUserKey = (keySuffix: string, userId?: string): string => {
    const uid = userId || getCurrentUserId();
    if (!uid) return `flowfin_anon_${keySuffix}`;
    return `flowfin_${uid}_${keySuffix}`;
};

// --- PRIVATE HELPERS ---

const updatePersonBalance = (personId: string, amount: number, type: TransactionType, isReversal: boolean = false) => {
    const key = getUserKey('people');
    const people = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = people.findIndex((p: Person) => p.id === personId);
    if (idx >= 0) {
        let change = type === TransactionType.LENT ? amount : -amount;
        if (isReversal) change = -change;
        
        people[idx].netBalance += change;
        people[idx].lastInteraction = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(people));
    }
};

// THE ADMIN AWARENESS HOOK
const syncUserProfileToPublic = (user: UserProfile) => {
    const profilesStr = localStorage.getItem(BASE_KEYS.PUBLIC_PROFILES) || '[]';
    const profiles = JSON.parse(profilesStr);
    const existingIdx = profiles.findIndex((p: any) => p.id === user.id);
    
    // Fields visible to Admin
    const adminViewProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        lastLogin: new Date().toISOString(),
        deviceType: 'Web',
        photoURL: user.photoURL
    };

    if (existingIdx >= 0) {
        profiles[existingIdx] = { ...profiles[existingIdx], ...adminViewProfile };
    } else {
        profiles.push(adminViewProfile);
    }
    localStorage.setItem(BASE_KEYS.PUBLIC_PROFILES, JSON.stringify(profiles));
};

export const dataService = {
  // --- AUTHENTICATION ---
  
  checkUserExists: (email: string): boolean => {
      const usersStr = localStorage.getItem(BASE_KEYS.USERS) || '[]';
      const users: UserProfile[] = JSON.parse(usersStr);
      return users.some(u => u.email.toLowerCase() === email.toLowerCase());
  },

  registerUser: (email: string, name: string, password?: string): boolean => {
      const usersStr = localStorage.getItem(BASE_KEYS.USERS) || '[]';
      const users: UserProfile[] = JSON.parse(usersStr);
      
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          return false; // Already exists
      }

      const newUser: UserProfile = {
          id: `user_${generateId()}`,
          email,
          name,
          password, // Storing plain text for demo (Hash in real app)
          photoURL: `https://ui-avatars.com/api/?name=${name}&background=10b981&color=fff`,
          lastLogin: new Date().toISOString(),
          deviceType: 'Web'
      };

      users.push(newUser);
      localStorage.setItem(BASE_KEYS.USERS, JSON.stringify(users));

      // Auto-login
      localStorage.setItem(BASE_KEYS.SESSION, newUser.id);
      syncUserProfileToPublic(newUser);
      return true;
  },

  verifyCredentials: (email: string, password?: string): boolean => {
      const usersStr = localStorage.getItem(BASE_KEYS.USERS) || '[]';
      const users: UserProfile[] = JSON.parse(usersStr);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) return false;

      // Check password match (if password was set during registration)
      if (user.password && user.password !== password) {
          return false;
      }

      // Login Successful
      user.lastLogin = new Date().toISOString();
      const idx = users.findIndex(u => u.id === user.id);
      users[idx] = user;
      localStorage.setItem(BASE_KEYS.USERS, JSON.stringify(users));
      
      localStorage.setItem(BASE_KEYS.SESSION, user.id);
      syncUserProfileToPublic(user);
      return true;
  },

  resetPassword: (email: string, newPassword: string): boolean => {
      const usersStr = localStorage.getItem(BASE_KEYS.USERS) || '[]';
      const users: UserProfile[] = JSON.parse(usersStr);
      const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

      if (idx === -1) return false;

      users[idx].password = newPassword;
      localStorage.setItem(BASE_KEYS.USERS, JSON.stringify(users));
      return true;
  },

  logout: () => {
      localStorage.removeItem(BASE_KEYS.SESSION);
  },

  isAuthenticated: (): boolean => {
      return !!localStorage.getItem(BASE_KEYS.SESSION);
  },

  getCurrentUser: (): UserProfile | undefined => {
      const uid = getCurrentUserId();
      if (!uid) return undefined;
      const users: UserProfile[] = JSON.parse(localStorage.getItem(BASE_KEYS.USERS) || '[]');
      return users.find(u => u.id === uid);
  },

  changePassword: (oldPwd: string, newPwd: string): boolean => {
     const uid = getCurrentUserId();
     const users: UserProfile[] = JSON.parse(localStorage.getItem(BASE_KEYS.USERS) || '[]');
     const idx = users.findIndex(u => u.id === uid);
     
     if (idx === -1) return false;

     if (users[idx].password === oldPwd) {
         users[idx].password = newPwd;
         localStorage.setItem(BASE_KEYS.USERS, JSON.stringify(users));
         return true;
     }
     return false; 
  },

  // --- ADMIN GOD MODE METHODS ---

  acquireAdminLock: (): boolean => {
      const lock = localStorage.getItem(BASE_KEYS.ADMIN_LOCK);
      if (lock) {
          const expiry = parseInt(lock, 10);
          if (Date.now() < expiry) {
              return false; 
          }
      }
      localStorage.setItem(BASE_KEYS.ADMIN_LOCK, (Date.now() + 5 * 60 * 1000).toString());
      return true;
  },

  refreshAdminLock: () => {
      localStorage.setItem(BASE_KEYS.ADMIN_LOCK, (Date.now() + 5 * 60 * 1000).toString());
  },

  releaseAdminLock: () => {
      localStorage.removeItem(BASE_KEYS.ADMIN_LOCK);
  },

  getAllProfiles: () => {
      return JSON.parse(localStorage.getItem(BASE_KEYS.PUBLIC_PROFILES) || '[]');
  },

  getGlobalStats: () => {
      const profiles = JSON.parse(localStorage.getItem(BASE_KEYS.PUBLIC_PROFILES) || '[]');
      return {
          totalUsers: profiles.length,
          systemStatus: 'Operational',
      };
  },

  impersonateUser: (userId: string) => {
      localStorage.setItem(BASE_KEYS.SESSION, userId);
  },

  nukeUser: (userId: string) => {
      const users: UserProfile[] = JSON.parse(localStorage.getItem(BASE_KEYS.USERS) || '[]');
      const updatedUsers = users.filter(u => u.id !== userId);
      localStorage.setItem(BASE_KEYS.USERS, JSON.stringify(updatedUsers));

      const profiles = JSON.parse(localStorage.getItem(BASE_KEYS.PUBLIC_PROFILES) || '[]');
      const updatedProfiles = profiles.filter((p: any) => p.id !== userId);
      localStorage.setItem(BASE_KEYS.PUBLIC_PROFILES, JSON.stringify(updatedProfiles));

      const keysToDelete = [
          `flowfin_${userId}_transactions`,
          `flowfin_${userId}_people`,
          `flowfin_${userId}_budgets`,
          `flowfin_${userId}_groups`,
          `flowfin_${userId}_group_expenses`,
          `flowfin_${userId}_gemini_key`
      ];
      keysToDelete.forEach(k => localStorage.removeItem(k));
  },

  setSystemAnnouncement: (msg: string) => {
      if (!msg) {
          localStorage.removeItem(BASE_KEYS.SYSTEM_ANNOUNCEMENT);
      } else {
          localStorage.setItem(BASE_KEYS.SYSTEM_ANNOUNCEMENT, msg);
      }
  },

  getSystemAnnouncement: (): string | null => {
      return localStorage.getItem(BASE_KEYS.SYSTEM_ANNOUNCEMENT);
  },

  // --- DATA METHODS (User Scoped) ---

  getApiKey: (): string | null => {
    return localStorage.getItem(getUserKey('gemini_key'));
  },

  setApiKey: (key: string) => {
    localStorage.setItem(getUserKey('gemini_key'), key);
  },

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(getUserKey('transactions'));
    return data ? JSON.parse(data) : [];
  },

  getTransaction: (id: string): Transaction | undefined => {
      return dataService.getTransactions().find(t => t.id === id);
  },

  addTransaction: (tx: Transaction) => {
    const current = dataService.getTransactions();
    const updated = [tx, ...current];
    localStorage.setItem(getUserKey('transactions'), JSON.stringify(updated));

    if (tx.personId && (tx.type === TransactionType.LENT || tx.type === TransactionType.BORROWED)) {
        updatePersonBalance(tx.personId, tx.amount, tx.type);
    }
  },

  updateTransaction: (updatedTx: Transaction) => {
      const current = dataService.getTransactions();
      const idx = current.findIndex(t => t.id === updatedTx.id);
      if (idx === -1) return;

      const oldTx = current[idx];

      if (oldTx.personId && (oldTx.type === TransactionType.LENT || oldTx.type === TransactionType.BORROWED)) {
          updatePersonBalance(oldTx.personId, oldTx.amount, oldTx.type, true);
      }

      if (updatedTx.personId && (updatedTx.type === TransactionType.LENT || updatedTx.type === TransactionType.BORROWED)) {
          updatePersonBalance(updatedTx.personId, updatedTx.amount, updatedTx.type, false);
      }

      current[idx] = updatedTx;
      localStorage.setItem(getUserKey('transactions'), JSON.stringify(current));
  },

  deleteTransaction: (id: string) => {
      const current = dataService.getTransactions();
      const tx = current.find(t => t.id === id);
      if (!tx) return;

      if (tx.personId && (tx.type === TransactionType.LENT || tx.type === TransactionType.BORROWED)) {
          updatePersonBalance(tx.personId, tx.amount, tx.type, true);
      }

      const updated = current.filter(t => t.id !== id);
      localStorage.setItem(getUserKey('transactions'), JSON.stringify(updated));
  },

  getPeople: (): Person[] => {
    const data = localStorage.getItem(getUserKey('people'));
    return data ? JSON.parse(data) : [];
  },

  addPerson: (name: string) => {
    const people = dataService.getPeople();
    const newPerson: Person = {
      id: generateId(),
      name,
      netBalance: 0,
      lastInteraction: new Date().toISOString()
    };
    localStorage.setItem(getUserKey('people'), JSON.stringify([...people, newPerson]));
  },

  updatePerson: (person: Person) => {
      const people = dataService.getPeople();
      const idx = people.findIndex(p => p.id === person.id);
      if (idx >= 0) {
          people[idx] = person;
          localStorage.setItem(getUserKey('people'), JSON.stringify(people));
      }
  },

  deletePerson: (id: string) => {
      const people = dataService.getPeople();
      const updated = people.filter(p => p.id !== id);
      localStorage.setItem(getUserKey('people'), JSON.stringify(updated));
      
      const txs = dataService.getTransactions();
      const updatedTxs = txs.map(t => {
          if (t.personId === id) return { ...t, personId: undefined };
          return t;
      });
      localStorage.setItem(getUserKey('transactions'), JSON.stringify(updatedTxs));
  },

  settleDebt: (personId: string) => {
    const people = dataService.getPeople();
    const idx = people.findIndex(p => p.id === personId);
    if (idx >= 0) {
      people[idx].netBalance = 0;
      localStorage.setItem(getUserKey('people'), JSON.stringify(people));
    }
  },

  getGroups: (): Group[] => {
    const data = localStorage.getItem(getUserKey('groups'));
    return data ? JSON.parse(data) : [];
  },

  addGroup: (name: string, members: string[]) => {
      const groups = dataService.getGroups();
      const newGroup: Group = { id: generateId(), name, members };
      localStorage.setItem(getUserKey('groups'), JSON.stringify([...groups, newGroup]));
  },

  updateGroup: (group: Group) => {
      const groups = dataService.getGroups();
      const idx = groups.findIndex(g => g.id === group.id);
      if (idx >= 0) {
          groups[idx] = group;
          localStorage.setItem(getUserKey('groups'), JSON.stringify(groups));
      }
  },

  deleteGroup: (id: string) => {
      const groups = dataService.getGroups();
      const updated = groups.filter(g => g.id !== id);
      localStorage.setItem(getUserKey('groups'), JSON.stringify(updated));
  },

  getGroupExpenses: (groupId: string): GroupExpense[] => {
      const allExpenses = JSON.parse(localStorage.getItem(getUserKey('group_expenses')) || '[]');
      return allExpenses.filter((e: GroupExpense) => e.groupId === groupId).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addGroupExpense: (groupId: string, description: string, amount: number, paidBy: 'user' | string) => {
    const groups = dataService.getGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const totalPeople = group.members.length + 1;
    const splitAmount = amount / totalPeople;

    const expenses = JSON.parse(localStorage.getItem(getUserKey('group_expenses')) || '[]');
    const newExpense: GroupExpense = {
        id: generateId(),
        groupId,
        description,
        amount,
        paidBy,
        date: new Date().toISOString()
    };
    localStorage.setItem(getUserKey('group_expenses'), JSON.stringify([...expenses, newExpense]));

    if (paidBy === 'user') {
        group.members.forEach(memberId => {
            dataService.addTransaction({
                id: generateId(),
                amount: splitAmount,
                description: `Group: ${description}`,
                category: 'Group',
                date: new Date().toISOString(),
                type: TransactionType.LENT,
                personId: memberId,
                tags: ['group', group.name]
            });
        });
        dataService.addTransaction({
            id: generateId(),
            amount: splitAmount,
            description: `Group Share: ${description}`,
            category: 'Group',
            date: new Date().toISOString(),
            type: TransactionType.SPENT,
            tags: ['group', group.name]
        });
    } else {
        dataService.addTransaction({
            id: generateId(),
            amount: splitAmount,
            description: `Group: ${description}`,
            category: 'Group',
            date: new Date().toISOString(),
            type: TransactionType.BORROWED,
            personId: paidBy,
            tags: ['group', group.name]
        });
    }
  },

  getBudgets: (): Budget[] => {
      const data = localStorage.getItem(getUserKey('budgets'));
      return data ? JSON.parse(data) : [];
  },

  saveBudget: (budget: Budget) => {
      const budgets = dataService.getBudgets();
      const idx = budgets.findIndex(b => b.category === budget.category);
      if (idx >= 0) {
          budgets[idx] = budget;
      } else {
          budgets.push(budget);
      }
      localStorage.setItem(getUserKey('budgets'), JSON.stringify(budgets));
  },

  deleteBudget: (category: string) => {
      let budgets = dataService.getBudgets();
      budgets = budgets.filter(b => b.category !== category);
      localStorage.setItem(getUserKey('budgets'), JSON.stringify(budgets));
  }
};
