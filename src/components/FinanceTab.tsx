import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Search, 
  Trash2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter,
  Calendar,
  Tag,
  CreditCard,
  AlertTriangle,
  ShieldAlert,
  Edit3,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinanceTabProps {
  isDarkMode: boolean;
  onAddLog: (type: 'success' | 'failed' | 'generation', details: string) => void;
  triggerToast: (message: string, type?: 'success' | 'info') => void;
}

const DEFAULT_TRANSACTIONS: Transaction[] = [];

export default function FinanceTab({ isDarkMode, onAddLog, triggerToast }: FinanceTabProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('secure_portal_finance_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_TRANSACTIONS;
  });

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<Transaction | null>(null);

  // Transaction form state
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState('Général');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newDesc, setNewDesc] = useState('');

  // Persist transactions
  useEffect(() => {
    localStorage.setItem('secure_portal_finance', JSON.stringify(transactions));
    localStorage.setItem('secure_portal_finance_v2', JSON.stringify(transactions));
  }, [transactions]);

  // Financial calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingTxId(null);
    setNewTitle('');
    setNewAmount('');
    setNewType('expense');
    setNewCategory('Général');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewDesc('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setNewTitle(tx.title);
    setNewAmount(tx.amount.toString());
    setNewType(tx.type);
    setNewCategory(tx.category);
    setNewDate(tx.date);
    setNewDesc(tx.description || '');
    setShowAddModal(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      triggerToast('Veuillez entrer un titre et un montant valide.', 'info');
      return;
    }

    if (editingTxId) {
      // Edit existing transaction
      setTransactions(prev => prev.map(t => {
        if (t.id === editingTxId) {
          return {
            ...t,
            title: newTitle.trim(),
            amount: parsedAmount,
            type: newType,
            category: newCategory.trim() || 'Général',
            date: newDate,
            description: newDesc.trim() || undefined
          };
        }
        return t;
      }));
      onAddLog('generation', `Mise à jour transaction: ${newTitle.trim()} (${parsedAmount.toFixed(2)} €)`);
      triggerToast('Transaction mise à jour avec succès !', 'success');
    } else {
      // Create new transaction
      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        title: newTitle.trim(),
        amount: parsedAmount,
        type: newType,
        category: newCategory.trim() || 'Général',
        date: newDate,
        description: newDesc.trim() || undefined
      };

      setTransactions(prev => [newTx, ...prev]);
      onAddLog('generation', `Transaction ajoutée: ${newTx.title} (${newTx.amount.toFixed(2)} €)`);
      triggerToast('Transaction enregistrée avec succès !', 'success');
    }

    // Reset form
    setNewTitle('');
    setNewAmount('');
    setNewDesc('');
    setEditingTxId(null);
    setShowAddModal(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Titre', 'Type', 'Montant (EUR)', 'Catégorie', 'Date', 'Description'];
    const rows = transactions.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.type === 'income' ? 'Revenu' : 'Dépense',
      t.amount,
      `"${t.category.replace(/"/g, '""')}"`,
      t.date,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers.join(','), ...rows.map(e => e.join(','))].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `finances_alpha9_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast(`Rapport financier (${transactions.length} écritures) exporté en CSV !`, 'success');
  };

  const handleRequestDeleteTx = (tx: Transaction) => {
    setDeleteConfirmTx(tx);
  };

  const confirmDeleteTx = () => {
    if (!deleteConfirmTx) return;
    setTransactions(prev => prev.filter(t => t.id !== deleteConfirmTx.id));
    onAddLog('generation', `Suppression autorisée de la transaction: ${deleteConfirmTx.title}`);
    triggerToast(`Transaction "${deleteConfirmTx.title}" retirée.`, 'info');
    setDeleteConfirmTx(null);
  };

  return (
    <div id="finance-tab-view" className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Balance Card */}
        <div className={`p-6 rounded-[24px] border transition-all duration-300 relative overflow-hidden ${
          isDarkMode 
            ? 'bg-[#030712]/80 border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.3)]' 
            : 'bg-white border-slate-200 shadow-[0_8px_20px_rgba(0,0,0,0.03)]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase font-mono tracking-widest text-slate-500">
              SOLDE TOTAL NET
            </span>
            <div className={`p-2 rounded-xl ${
              netBalance >= 0 
                ? isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                : isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl lg:text-3xl font-black font-mono tracking-tight ${
              netBalance >= 0 
                ? isDarkMode ? 'text-emerald-400' : 'text-emerald-600' 
                : isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              {netBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans mt-2">
            Actifs disponibles calculés en temps réel
          </p>
        </div>

        {/* Total Incomes */}
        <div className={`p-6 rounded-[24px] border transition-all duration-300 ${
          isDarkMode 
            ? 'bg-[#030712]/80 border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.3)]' 
            : 'bg-white border-slate-200 shadow-[0_8px_20px_rgba(0,0,0,0.03)]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase font-mono tracking-widest text-slate-500">
              TOTAL REVENUS
            </span>
            <div className={`p-2 rounded-xl ${
              isDarkMode ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
            }`}>
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl font-black font-mono tracking-tight ${
            isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
          }`}>
            +{totalIncome.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
          <p className="text-[11px] text-slate-500 font-sans mt-2">
            {transactions.filter(t => t.type === 'income').length} entrées financières
          </p>
        </div>

        {/* Total Expenses */}
        <div className={`p-6 rounded-[24px] border transition-all duration-300 ${
          isDarkMode 
            ? 'bg-[#030712]/80 border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.3)]' 
            : 'bg-white border-slate-200 shadow-[0_8px_20px_rgba(0,0,0,0.03)]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase font-mono tracking-widest text-slate-500">
              TOTAL DÉPENSES
            </span>
            <div className={`p-2 rounded-xl ${
              isDarkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl font-black font-mono tracking-tight ${
            isDarkMode ? 'text-rose-400' : 'text-rose-600'
          }`}>
            -{totalExpense.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
          <p className="text-[11px] text-slate-500 font-sans mt-2">
            {transactions.filter(t => t.type === 'expense').length} débits enregistrés
          </p>
        </div>
      </div>

      {/* Main Transactions Container */}
      <div className={`p-6 rounded-[28px] border transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#030712]/75 border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.3)]' 
          : 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.03)]'
      }`}>
        {/* Action Header & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <CreditCard className="w-4 h-4 text-cyan-500" />
            </div>
            <div>
              <h3 className={`text-xs font-black uppercase font-mono tracking-widest ${
                isDarkMode ? 'text-slate-200' : 'text-slate-800'
              }`}>
                HISTORIQUE DES TRANSACTIONS
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Gestion des flux de trésorerie et dépenses de sécurité
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              title="Exporter l'historique financier au format CSV"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter (CSV)</span>
            </button>

            <button
              id="btn-add-transaction"
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer font-mono uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvelle Transaction
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par libellé ou catégorie..."
              className={`w-full pl-10 pr-4 py-2 text-xs font-sans rounded-xl focus:outline-none focus:ring-2 transition ${
                isDarkMode 
                  ? 'bg-[#010309] border border-white/10 text-slate-200 focus:ring-cyan-500/30' 
                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
              }`}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-white/5 self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                filterType === 'all'
                  ? isDarkMode ? 'bg-[#0b1329] text-cyan-300 border border-blue-500/30' : 'bg-white text-cyan-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                filterType === 'income'
                  ? isDarkMode ? 'bg-[#0b1329] text-emerald-400 border border-emerald-500/30' : 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Revenus
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                filterType === 'expense'
                  ? isDarkMode ? 'bg-[#0b1329] text-rose-400 border border-rose-500/30' : 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Dépenses
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-sans text-xs">
              Aucune transaction trouvée.
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-[#010207] border-white/5 hover:border-white/10 hover:bg-[#020512]' 
                    : 'bg-slate-50/70 border-slate-100 hover:border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    tx.type === 'income'
                      ? isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : isDarkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}>
                    {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <h4 className={`text-xs font-bold truncate ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {tx.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {tx.date}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {tx.category}
                      </span>
                      {tx.description && (
                        <span className="text-[10px] text-slate-500 truncate max-w-xs font-sans hidden md:inline">
                          • {tx.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className={`text-sm font-mono font-black ${
                    tx.type === 'income'
                      ? isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                      : isDarkMode ? 'text-rose-400' : 'text-rose-600'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>

                  <button
                    onClick={() => handleOpenEditModal(tx)}
                    title="Modifier cette transaction"
                    className="p-1.5 text-slate-500 hover:text-cyan-400 rounded-lg transition cursor-pointer hover:bg-cyan-500/10 active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleRequestDeleteTx(tx)}
                    title="Demander l'autorisation de suppression"
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition cursor-pointer hover:bg-red-500/10 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl ${
                isDarkMode 
                  ? 'bg-[#030712] border-white/10 text-slate-200' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase font-mono tracking-wider text-cyan-400">
                  {editingTxId ? 'MODIFIER LA TRANSACTION' : 'AJOUTER UNE TRANSACTION'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="space-y-4">
                {/* Type toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-[#010207]">
                  <button
                    type="button"
                    onClick={() => setNewType('income')}
                    className={`py-2 text-xs font-mono font-bold rounded-lg transition ${
                      newType === 'income'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    + Revenu
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('expense')}
                    className={`py-2 text-xs font-mono font-bold rounded-lg transition ${
                      newType === 'expense'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    - Dépense
                  </button>
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Libellé / Titre * :
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="ex: Facture hébergement, Salaire..."
                    className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Montant (€) * :
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="ex: 150.00"
                      className={`w-full p-2.5 text-xs font-mono font-bold rounded-xl focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Catégorie :
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                      }`}
                    >
                      <option value="Consulting">Consulting</option>
                      <option value="Salaire">Salaire</option>
                      <option value="Serveurs">Serveurs & Cloud</option>
                      <option value="Matériel">Matériel & Équipement</option>
                      <option value="Logiciels">Logiciels & Licences</option>
                      <option value="Sécurité">Audit & Sécurité</option>
                      <option value="Général">Autre / Général</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Date :
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className={`w-full p-2.5 text-xs font-mono rounded-xl focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Description complémentaire :
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Notes ou détails supplémentaires..."
                    className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                    }`}
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-95"
                  >
                    {editingTxId ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Demande d'Autorisation de Suppression Transaction */}
      <AnimatePresence>
        {deleteConfirmTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl ${
                isDarkMode 
                  ? 'bg-[#030712] border-red-500/30 text-slate-200 shadow-[0_20px_50px_rgba(239,68,68,0.15)]' 
                  : 'bg-white border-red-200 text-slate-800 shadow-2xl'
              }`}
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-white/5">
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase font-mono tracking-wider text-red-400">
                    AUTORISATION DE SUPPRESSION
                  </h3>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Modification du grand livre comptable
                  </span>
                </div>
              </div>

              <p className="text-xs font-sans leading-relaxed text-slate-400 mb-3">
                Confirmez-vous l'autorisation de suppression pour l'écriture <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{deleteConfirmTx.title}</strong> d'un montant de <strong className={deleteConfirmTx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>{deleteConfirmTx.type === 'income' ? '+' : '-'}{deleteConfirmTx.amount.toFixed(2)} €</strong> ?
              </p>

              <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-[11px] font-mono text-red-300 mb-5 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>Le solde net du portail sera recalculé immédiatement.</span>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTx(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-400 hover:text-white cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTx}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:opacity-95 text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/50 cursor-pointer transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Autoriser la Suppression
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
