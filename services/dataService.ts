
import { Transaction, Person, TransactionType, Group, GroupExpense, Budget } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'flowfin_transactions',
  PEOPLE: 'flowfin_people',
  GROUPS: 'flowfin_groups',
  GROUP_EXPENSES: 'flowfin_group_expenses',
  BUDGETS: 'flowfin_budgets',
  API_KEY: 'flowfin_gemini_key'
};

// Seed data helper
const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    const initialTransactions: Transaction[] = [
      { id: '1', amount: 120, category: 'Food', description: 'Dinner at Mario\'s', date: new Date(Date.now() - 86400000).toISOString(), type: TransactionType.SPENT, tags: ['dining'] },
      { id: '2', amount: 4500, category: 'Salary', description: 'Freelance Project', date: new Date(Date.now() - 172800000).toISOString(), type: TransactionType.RECEIVED, tags: ['income'] },
      { id: '3', amount: 50, category: 'Transport', description: 'Uber to Airport', date: new Date().toISOString(), type: TransactionType.SPENT, tags: ['travel'] },
    ];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PEOPLE)) {
    const initialPeople: Person[] = [
      { id: 'p1', name: 'Alice', netBalance: 150, lastInteraction: new Date().toISOString() }, // She owes you
      { id: 'p2', name: 'Bob', netBalance: -50, lastInteraction: new Date().toISOString() }   // You owe him
    ];
    localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(initialPeople));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BUDGETS)) {
      const initialBudgets: Budget[] = [
          { category: 'Food', limit: 5000 },
          { category: 'Transport', limit: 2000 }
      ];
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(initialBudgets));
  }
};

seedData();

const updatePersonBalance = (personId: string, amount: number, type: TransactionType, isReversal: boolean = false) => {
    const people = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEOPLE) || '[]');
    const idx = people.findIndex((p: Person) => p.id === personId);
    if (idx >= 0) {
        // If LENT, balance increases (positive). If BORROWED, balance decreases (negative).
        // If reversal (deleting/editing), invert the sign.
        let change = type === TransactionType.LENT ? amount : -amount;
        if (isReversal) change = -change;
        
        people[idx].netBalance += change;
        people[idx].lastInteraction = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
    }
};

export const dataService = {
  getApiKey: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY);
  },

  setApiKey: (key: string) => {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  },

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  getTransaction: (id: string): Transaction | undefined => {
      return dataService.getTransactions().find(t => t.id === id);
  },

  addTransaction: (tx: Transaction) => {
    const current = dataService.getTransactions();
    const updated = [tx, ...current];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));

    if (tx.personId && (tx.type === TransactionType.LENT || tx.type === TransactionType.BORROWED)) {
        updatePersonBalance(tx.personId, tx.amount, tx.type);
    }
  },

  updateTransaction: (updatedTx: Transaction) => {
      const current = dataService.getTransactions();
      const idx = current.findIndex(t => t.id === updatedTx.id);
      if (idx === -1) return;

      const oldTx = current[idx];

      // Revert old balance effect
      if (oldTx.personId && (oldTx.type === TransactionType.LENT || oldTx.type === TransactionType.BORROWED)) {
          updatePersonBalance(oldTx.personId, oldTx.amount, oldTx.type, true);
      }

      // Apply new balance effect
      if (updatedTx.personId && (updatedTx.type === TransactionType.LENT || updatedTx.type === TransactionType.BORROWED)) {
          updatePersonBalance(updatedTx.personId, updatedTx.amount, updatedTx.type, false);
      }

      current[idx] = updatedTx;
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(current));
  },

  deleteTransaction: (id: string) => {
      const current = dataService.getTransactions();
      const tx = current.find(t => t.id === id);
      if (!tx) return;

      // Revert balance effect
      if (tx.personId && (tx.type === TransactionType.LENT || tx.type === TransactionType.BORROWED)) {
          updatePersonBalance(tx.personId, tx.amount, tx.type, true);
      }

      const updated = current.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
  },

  getPeople: (): Person[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PEOPLE);
    return data ? JSON.parse(data) : [];
  },

  addPerson: (name: string) => {
    const people = dataService.getPeople();
    const newPerson: Person = {
      id: crypto.randomUUID(),
      name,
      netBalance: 0,
      lastInteraction: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify([...people, newPerson]));
  },

  updatePerson: (person: Person) => {
      const people = dataService.getPeople();
      const idx = people.findIndex(p => p.id === person.id);
      if (idx >= 0) {
          people[idx] = person;
          localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
      }
  },

  deletePerson: (id: string) => {
      const people = dataService.getPeople();
      const updated = people.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(updated));
      
      // Optionally: Update transactions to remove the personId reference
      const txs = dataService.getTransactions();
      const updatedTxs = txs.map(t => {
          if (t.personId === id) return { ...t, personId: undefined };
          return t;
      });
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTxs));
  },

  settleDebt: (personId: string) => {
    const people = dataService.getPeople();
    const idx = people.findIndex(p => p.id === personId);
    if (idx >= 0) {
      people[idx].netBalance = 0;
      localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
    }
  },

  // --- Groups & Splitwise Logic ---
  getGroups: (): Group[] => {
    const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
    return data ? JSON.parse(data) : [];
  },

  addGroup: (name: string, members: string[]) => {
      const groups = dataService.getGroups();
      const newGroup: Group = { id: crypto.randomUUID(), name, members };
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify([...groups, newGroup]));
  },

  updateGroup: (group: Group) => {
      const groups = dataService.getGroups();
      const idx = groups.findIndex(g => g.id === group.id);
      if (idx >= 0) {
          groups[idx] = group;
          localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
      }
  },

  deleteGroup: (id: string) => {
      const groups = dataService.getGroups();
      const updated = groups.filter(g => g.id !== id);
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(updated));
  },

  addGroupExpense: (groupId: string, description: string, amount: number, paidBy: 'user' | string) => {
    const groups = dataService.getGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Simple Split Logic: Equal split among all members + user
    const totalPeople = group.members.length + 1; // +1 for User
    const splitAmount = amount / totalPeople;

    // Create Expense Record
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUP_EXPENSES) || '[]');
    const newExpense: GroupExpense = {
        id: crypto.randomUUID(),
        groupId,
        description,
        amount,
        paidBy,
        date: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.GROUP_EXPENSES, JSON.stringify([...expenses, newExpense]));

    // Generate Transactions
    if (paidBy === 'user') {
        // You paid, everyone else owes you
        group.members.forEach(memberId => {
            dataService.addTransaction({
                id: crypto.randomUUID(),
                amount: splitAmount,
                description: `Group: ${description}`,
                category: 'Group',
                date: new Date().toISOString(),
                type: TransactionType.LENT,
                personId: memberId,
                tags: ['group', group.name]
            });
        });
        // Record your share as expense
        dataService.addTransaction({
            id: crypto.randomUUID(),
            amount: splitAmount,
            description: `Group Share: ${description}`,
            category: 'Group',
            date: new Date().toISOString(),
            type: TransactionType.SPENT,
            tags: ['group', group.name]
        });
    } else {
        // Someone else paid.
        // You owe them your share.
        dataService.addTransaction({
            id: crypto.randomUUID(),
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

  // --- Budgets ---
  getBudgets: (): Budget[] => {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
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
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  },

  deleteBudget: (category: string) => {
      let budgets = dataService.getBudgets();
      budgets = budgets.filter(b => b.category !== category);
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }
};
