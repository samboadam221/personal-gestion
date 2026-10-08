import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  LogOut, 
  Moon, 
  Sun, 
  History, 
  Wallet, 
  BookUser, 
  FolderKanban, 
  FileText, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  Terminal, 
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SecurityLog } from '../types';
import FinanceTab from './FinanceTab';
import ContactsTab from './ContactsTab';
import ProjectsTab from './ProjectsTab';
import NotesTab from './NotesTab';
import MeTab from './MeTab';
import ServerCredentialsModal from './ServerCredentialsModal';

interface DashboardProps {
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  logs: SecurityLog[];
  onAddLog: (action: 'success' | 'failed' | 'generation', details: string) => void;
  userEmail?: string;
  userIdentifier?: string;
}

type TabType = 'overview' | 'finance' | 'contacts' | 'projects' | 'notes' | 'me';

export default function Dashboard({
  onLogout,
  isDarkMode,
  onToggleTheme,
  logs,
  onAddLog,
  userEmail = 'samboadam221@gmail.com',
  userIdentifier = 'admin'
}: DashboardProps) {
  const [activeIdentifier, setActiveIdentifier] = useState<string>(userIdentifier);
  const [isServerCredsModalOpen, setIsServerCredsModalOpen] = useState<boolean>(false);
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('secure_portal_active_tab');
    if (saved && ['overview', 'finance', 'contacts', 'projects', 'notes', 'me'].includes(saved)) {
      return saved as TabType;
    }
    return 'overview';
  });

  // Sauvegarde de l'onglet actif
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem('secure_portal_active_tab', tab);
  };

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' } | null>(null);
  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Statistiques en direct du portail
  const [stats, setStats] = useState({
    balance: '0.00',
    contactsCount: 0,
    projectsCount: 0,
    notesCount: 0
  });

  // Rechargement des compteurs des modules
  useEffect(() => {
    try {
      // 1. Finance
      const finRaw = localStorage.getItem('secure_portal_finance');
      let balance = '14,850.00 €';
      if (finRaw) {
        const parsed = JSON.parse(finRaw);
        if (parsed.balance) balance = parsed.balance;
      }

      // 2. Contacts
      const contRaw = localStorage.getItem('secure_portal_contacts');
      let contactsCount = 4;
      if (contRaw) {
        const parsed = JSON.parse(contRaw);
        if (Array.isArray(parsed)) contactsCount = parsed.length;
      }

      // 3. Projets
      const projRaw = localStorage.getItem('secure_portal_projects');
      let projectsCount = 3;
      if (projRaw) {
        const parsed = JSON.parse(projRaw);
        if (Array.isArray(parsed)) projectsCount = parsed.length;
      }

      // 4. Notes
      const notesRaw = localStorage.getItem('secure_portal_notes');
      let notesCount = 3;
      if (notesRaw) {
        const parsed = JSON.parse(notesRaw);
        if (Array.isArray(parsed)) notesCount = parsed.length;
      }

      setStats({
        balance,
        contactsCount,
        projectsCount,
        notesCount
      });
    } catch (e) {
      // ignore
    }
  }, [activeTab]);

  return (
    <div 
      id="dashboard-root"
      className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#02050e] text-slate-100' 
          : 'bg-[#f4f7fb] text-slate-800'
      }`}
    >
      {/* Background cyber pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{ 
          backgroundImage: isDarkMode ? 'linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)' : 'linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)', 
          backgroundSize: '24px 24px' 
        }}
      ></div>
      <div className={`absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none ${
        isDarkMode ? 'bg-cyan-500/5' : 'bg-cyan-500/5'
      }`}></div>
      <div className={`absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none ${
        isDarkMode ? 'bg-blue-600/5' : 'bg-blue-500/3'
      }`}></div>

      {/* Floating Holographic Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 border px-5 py-3 rounded-2xl shadow-xl text-xs max-w-sm w-full ${
              isDarkMode 
                ? 'bg-[#030712]/95 backdrop-blur-xl border-cyan-500/30 text-white shadow-[0_20px_40px_rgba(0,0,0,0.6)]' 
                : 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.06)]'
            }`}
          >
            <div className="bg-cyan-500/15 p-1.5 rounded-lg border border-cyan-400/30">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Notification Alpha-9</span>
              <p className="font-semibold text-xs leading-snug">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER / NAVIGATION BAR */}
      <header 
        id="dashboard-header"
        className={`sticky top-0 z-40 border-b backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-[#030712]/90 border-white/5 shadow-md' 
            : 'bg-white/90 border-slate-200/80 shadow-xs'
        }`}
      >
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-900/20">
            <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black tracking-widest uppercase text-cyan-400">
                ALPHA-9 PORTAL
              </span>
              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SOUVERAIN
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              USER: <strong className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{activeIdentifier || 'Adam SAMBO'}</strong> ({userEmail})
            </p>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav 
          id="nav-tabs"
          className={`flex items-center gap-1 p-1 rounded-2xl border overflow-x-auto max-w-full ${
            isDarkMode 
              ? 'bg-[#01030a] border-white/5 shadow-inner' 
              : 'bg-slate-100 border-slate-200 shadow-inner'
          }`}
        >
          {/* Tab 1: ACCUEIL */}
          <button
            onClick={() => handleTabChange('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer uppercase font-mono tracking-wider whitespace-nowrap ${
              activeTab === 'overview'
                ? isDarkMode
                  ? 'bg-[#0b1329] border border-cyan-500/40 text-cyan-300 shadow-md font-black'
                  : 'bg-white border border-slate-200 text-cyan-600 shadow-sm font-black'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>ACCUEIL</span>
          </button>

          {/* Tab 2: FINANCE */}
          <button
            onClick={() => handleTabChange('finance')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer uppercase font-mono tracking-wider whitespace-nowrap ${
              activeTab === 'finance'
                ? isDarkMode
                  ? 'bg-[#0b1329] border border-cyan-500/40 text-cyan-300 shadow-md font-black'
                  : 'bg-white border border-slate-200 text-cyan-600 shadow-sm font-black'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>FINANCE</span>
          </button>

          {/* Tab 3: CARNET D'ADRESSE */}
          <button
            onClick={() => handleTabChange('contacts')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer uppercase font-mono tracking-wider whitespace-nowrap ${
              activeTab === 'contacts'
                ? isDarkMode
                  ? 'bg-[#0b1329] border border-cyan-500/40 text-cyan-300 shadow-md font-black'
                  : 'bg-white border border-slate-200 text-cyan-600 shadow-sm font-black'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookUser className="w-3.5 h-3.5" />
            <span>CARNET D'ADRESSE</span>
          </button>

          {/* Tab 4: PROJETS */}
          <button
            onClick={() => handleTabChange('projects')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer uppercase font-mono tracking-wider whitespace-nowrap ${
              activeTab === 'projects'
                ? isDarkMode
                  ? 'bg-[#0b1329] border border-cyan-500/40 text-cyan-300 shadow-md font-black'
                  : 'bg-white border border-slate-200 text-cyan-600 shadow-sm font-black'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>PROJET</span>
          </button>

          {/* Tab 5: NOTES */}
          <button
            onClick={() => handleTabChange('notes')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer uppercase font-mono tracking-wider whitespace-nowrap ${
              activeTab === 'notes'
                ? isDarkMode
                  ? 'bg-[#0b1329] border border-cyan-500/40 text-cyan-300 shadow-md font-black'
                  : 'bg-white border border-slate-200 text-cyan-600 shadow-sm font-black'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>NOTE</span>
          </button>

          {/* Tab 6: MOI */}
          <button
            onClick={() => handleTabChange('me')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer uppercase font-mono tracking-wider whitespace-nowrap ${
              activeTab === 'me'
                ? isDarkMode
                  ? 'bg-[#0b1329] border border-cyan-500/40 text-cyan-300 shadow-md font-black'
                  : 'bg-white border border-slate-200 text-cyan-600 shadow-sm font-black'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>MOI</span>
          </button>
        </nav>

        {/* Global Controls : Theme & Logout */}
        <div className="flex items-center gap-2">
          {/* Server Credentials Button */}
          <button
            onClick={() => setIsServerCredsModalOpen(true)}
            className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
              isDarkMode 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' 
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            }`}
            title="Modifier l'identifiant et mot de passe enregistrés sur le serveur"
          >
            <Server className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">IDENTIFIANTS SERVEUR</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Changer de thème"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            <span className="hidden sm:inline">{isDarkMode ? 'JOUR' : 'NUIT'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="px-3 py-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            title="Verrouiller la session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DÉCONNEXION</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {/* TAB 1: OVERVIEW / ACCUEIL */}
          {activeTab === 'overview' && (
            <motion.div
              key="panel-overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Welcome Security Banner */}
              <div className={`p-6 sm:p-8 rounded-[32px] border relative overflow-hidden transition-all duration-300 shadow-xl ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#060c1e] via-[#030712] to-[#0b142f] border-cyan-500/20' 
                  : 'bg-gradient-to-br from-white via-cyan-50/30 to-indigo-50/40 border-slate-200'
              }`}>
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                        SYSTÈME OPÉRATIONNEL // SÉCURITÉ NIVEAU 5
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    </div>

                    <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      BIENVENUE, ADAM SAMBO !
                    </h1>

                    <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Votre espace sécurisé Alpha-9 est synchronisé. Vous disposez des droits souverains sur la trésorerie, vos contacts, le suivi de projets, les notes confidentielles et votre coffre-fort d'identifiants.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      onClick={() => setIsServerCredsModalOpen(true)}
                      className={`px-4 py-2.5 rounded-2xl border font-mono text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95 ${
                        isDarkMode
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                          : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      <Server className="w-3.5 h-3.5" />
                      <span>Identifiants Serveur</span>
                    </button>

                    <button
                      onClick={() => handleTabChange('me')}
                      className="px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-cyan-900/40 flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Espace Personnel MOI</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Interactive Hub Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Module 1: FINANCE */}
                <div
                  onClick={() => handleTabChange('finance')}
                  className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                    isDarkMode 
                      ? 'bg-[#030712]/80 border-white/5 hover:border-emerald-500/40 hover:bg-[#050b1d]' 
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition duration-300">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1">
                      <span>Accéder</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                    </span>
                  </div>
                  <h3 className="text-xs font-mono uppercase font-bold text-slate-400">Trésorerie & Finance</h3>
                  <p className={`text-xl font-black mt-1 font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {stats.balance}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">Solde actif vérifié</span>
                </div>

                {/* Module 2: CARNET D'ADRESSE */}
                <div
                  onClick={() => handleTabChange('contacts')}
                  className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                    isDarkMode 
                      ? 'bg-[#030712]/80 border-white/5 hover:border-blue-500/40 hover:bg-[#050b1d]' 
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition duration-300">
                      <BookUser className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-blue-400 uppercase flex items-center gap-1">
                      <span>Accéder</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                    </span>
                  </div>
                  <h3 className="text-xs font-mono uppercase font-bold text-slate-400">Carnet d'Adresses</h3>
                  <p className={`text-xl font-black mt-1 font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {stats.contactsCount} <span className="text-xs font-normal text-slate-500">fiches</span>
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">Contacts d'urgence & VIP</span>
                </div>

                {/* Module 3: PROJET */}
                <div
                  onClick={() => handleTabChange('projects')}
                  className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                    isDarkMode 
                      ? 'bg-[#030712]/80 border-white/5 hover:border-indigo-500/40 hover:bg-[#050b1d]' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition duration-300">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1">
                      <span>Accéder</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                    </span>
                  </div>
                  <h3 className="text-xs font-mono uppercase font-bold text-slate-400">Gestion de Projets</h3>
                  <p className={`text-xl font-black mt-1 font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {stats.projectsCount} <span className="text-xs font-normal text-slate-500">missions</span>
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">Tâches & livrables</span>
                </div>

                {/* Module 4: NOTE */}
                <div
                  onClick={() => handleTabChange('notes')}
                  className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                    isDarkMode 
                      ? 'bg-[#030712]/80 border-white/5 hover:border-amber-500/40 hover:bg-[#050b1d]' 
                      : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition duration-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1">
                      <span>Accéder</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                    </span>
                  </div>
                  <h3 className="text-xs font-mono uppercase font-bold text-slate-400">Mémos & Chiffrement</h3>
                  <p className={`text-xl font-black mt-1 font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {stats.notesCount} <span className="text-xs font-normal text-slate-500">notes</span>
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">Protégées par matrice</span>
                </div>
              </div>

              {/* Middle Row : Identity Quick Summary & Live System Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Card: Identité & Raccourci MOI */}
                <div className={`p-6 rounded-[28px] border transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-[#030712]/80 border-white/10 shadow-lg' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400" />
                      <h2 className="text-xs font-mono font-black uppercase tracking-wider">
                        FICHE SOUVERAINE
                      </h2>
                    </div>
                    <button
                      onClick={() => handleTabChange('me')}
                      className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Modifier</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-mono text-2xl font-black text-white shadow-md">
                      A
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Adam SAMBO
                      </h3>
                      <p className="text-xs text-indigo-400 font-mono font-semibold">
                        Administrateur Principal
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        MATRICULE: ADM-8802-ALPHA
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      isDarkMode ? 'bg-[#040817] border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[10px] text-slate-500 font-bold">HABILITATION :</span>
                      <span className="font-bold text-cyan-400">COSMIC SUPREME (LVL 5)</span>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      isDarkMode ? 'bg-[#040817] border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[10px] text-slate-500 font-bold">EMAIL DIRECT :</span>
                      <span className="font-bold truncate max-w-[160px]">{userEmail}</span>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      isDarkMode ? 'bg-[#040817] border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[10px] text-slate-500 font-bold">STATUT ACCÈS :</span>
                      <span className="font-bold text-emerald-400">SOUVERAIN (ACTIF)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTabChange('me')}
                    className="w-full mt-5 py-2.5 rounded-xl bg-cyan-600/15 border border-cyan-500/30 hover:bg-cyan-600/25 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Ouvrir l'Espace MOI</span>
                  </button>
                </div>

                {/* Right 2 Columns: Live System Logs */}
                <div className={`lg:col-span-2 p-6 rounded-[28px] border transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-[#030712]/80 border-white/10 shadow-lg' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <h2 className="text-xs font-mono font-black uppercase tracking-wider">
                        JOURNAL DES ACTIVITÉS & AUDIT ({logs.length})
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">En direct</span>
                    </div>
                  </div>

                  {logs.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-mono text-xs">
                      Aucune activité enregistrée pour le moment.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                      {logs.slice(0, 8).map(log => (
                        <div
                          key={log.id}
                          className={`p-3 rounded-xl border font-mono text-xs flex items-start justify-between gap-3 ${
                            isDarkMode 
                              ? 'bg-[#040818] border-white/5 text-slate-300' 
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                              (log.type || (log as any).action) === 'success' 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                : (log.type || (log as any).action) === 'failed' 
                                  ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                            }`}>
                              {log.type || (log as any).action}
                            </span>
                            <span className="truncate">{log.details}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>TRAÇABILITÉ FORENSIC ALPHA-9 ACTIVE</span>
                    <span>PROTOCOLE SHA-256</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: FINANCE */}
          {activeTab === 'finance' && (
            <motion.div
              key="panel-finance"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <FinanceTab
                isDarkMode={isDarkMode}
                onAddLog={onAddLog}
                triggerToast={triggerToast}
              />
            </motion.div>
          )}

          {/* TAB 3: CARNET D'ADRESSE */}
          {activeTab === 'contacts' && (
            <motion.div
              key="panel-contacts"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <ContactsTab
                isDarkMode={isDarkMode}
                onAddLog={onAddLog}
                triggerToast={triggerToast}
              />
            </motion.div>
          )}

          {/* TAB 4: PROJET */}
          {activeTab === 'projects' && (
            <motion.div
              key="panel-projects"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <ProjectsTab
                isDarkMode={isDarkMode}
                onAddLog={onAddLog}
                triggerToast={triggerToast}
              />
            </motion.div>
          )}

          {/* TAB 5: NOTE */}
          {activeTab === 'notes' && (
            <motion.div
              key="panel-notes"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <NotesTab
                isDarkMode={isDarkMode}
                onAddLog={onAddLog}
                triggerToast={triggerToast}
              />
            </motion.div>
          )}

          {/* TAB 6: MOI */}
          {activeTab === 'me' && (
            <motion.div
              key="panel-me"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <MeTab
                isDarkMode={isDarkMode}
                onAddLog={onAddLog}
                triggerToast={triggerToast}
                onToggleTheme={onToggleTheme}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Server Credentials Configuration Modal */}
      <ServerCredentialsModal
        isOpen={isServerCredsModalOpen}
        onClose={() => setIsServerCredsModalOpen(false)}
        isDarkMode={isDarkMode}
        onAddLog={onAddLog}
        onCredentialsUpdated={(newId) => {
          setActiveIdentifier(newId);
          triggerToast(`Identifiant serveur actualisé : ${newId}`);
        }}
      />
    </div>
  );
}
