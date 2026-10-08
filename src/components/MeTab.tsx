import React, { useState, useEffect } from 'react';
import { 
  User, 
  Key, 
  Lock, 
  Unlock, 
  Mail, 
  MapPin, 
  Calendar, 
  HeartPulse, 
  Briefcase, 
  Building2, 
  Fingerprint, 
  Check, 
  Copy, 
  Edit3, 
  Save, 
  X, 
  Trash2, 
  Plus, 
  Globe, 
  AlertTriangle, 
  ShieldAlert, 
  PhoneCall, 
  MessageCircle,
  RefreshCw,
  Download,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ServerCredentialsModal from './ServerCredentialsModal';

export interface UserPersonalProfile {
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  birthDate: string;
  bloodType: string;
  allergies: string;
  location: string;
  matricule: string;
  clearanceLevel: string;
  bio: string;
}

export interface GoogleAccount {
  id: string;
  email: string;
  secret: string;
  label?: string;
}

interface MeTabProps {
  isDarkMode: boolean;
  onAddLog: (action: 'success' | 'failed' | 'generation', details: string) => void;
  triggerToast: (message: string, type?: 'success' | 'info') => void;
  onToggleTheme?: () => void;
}

const DEFAULT_PROFILE: UserPersonalProfile = {
  name: 'Adam SAMBO',
  role: 'Administrateur',
  email: 'samboadam221@gmail.com',
  phone: '',
  department: '',
  birthDate: '',
  bloodType: '',
  allergies: '',
  location: '',
  matricule: 'ADM-ALPHA-9',
  clearanceLevel: 'Niveau 5 - SOUVERAIN',
  bio: 'Espace personnel vierge. Personnalisez vos informations en cliquant sur "Modifier Mes Infos".'
};

const DEFAULT_ACCOUNTS: GoogleAccount[] = [];

export default function MeTab({
  isDarkMode,
  onAddLog,
  triggerToast
}: MeTabProps) {
  // Profil personnel persistant
  const [profile, setProfile] = useState<UserPersonalProfile>(() => {
    try {
      const saved = localStorage.getItem('secure_portal_user_profile_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_PROFILE;
  });

  // Modal d'édition de profil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<UserPersonalProfile>(profile);

  // Comptes Google gérés
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>(() => {
    try {
      const saved = localStorage.getItem('secure_portal_google_accounts_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_ACCOUNTS;
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAddGoogleModal, setShowAddGoogleModal] = useState(false);
  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [newGoogleSecret, setNewGoogleSecret] = useState('');
  const [newGoogleLabel, setNewGoogleLabel] = useState('Compte Personnel');
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<GoogleAccount | null>(null);

  // Clés copiées & Jeton de session
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState('ALPHA9-AUTH-' + Math.random().toString(36).substring(2, 10).toUpperCase());
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);

  // Sauvegarde profil
  const saveProfileToStorage = (newProfile: UserPersonalProfile) => {
    setProfile(newProfile);
    localStorage.setItem('secure_portal_user_profile', JSON.stringify(newProfile));
    localStorage.setItem('secure_portal_user_profile_v2', JSON.stringify(newProfile));
    window.dispatchEvent(new Event('storage'));
  };

  // Sauvegarde comptes Google
  const saveAccountsToStorage = (accounts: GoogleAccount[]) => {
    setGoogleAccounts(accounts);
    localStorage.setItem('secure_portal_google_accounts', JSON.stringify(accounts));
    localStorage.setItem('secure_portal_google_accounts_v2', JSON.stringify(accounts));
    window.dispatchEvent(new Event('storage'));
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    triggerToast('Copié dans le presse-papier !', 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileToStorage(editForm);
    setIsEditingProfile(false);
    onAddLog('generation', `Mise à jour du profil personnel: ${editForm.name}`);
    triggerToast('Profil personnel enregistré avec succès !', 'success');
  };

  const handleAddGoogleAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoogleEmail.trim() || !newGoogleSecret.trim()) {
      triggerToast('Veuillez remplir l\'adresse email et le mot de passe.', 'info');
      return;
    }

    const newAcc: GoogleAccount = {
      id: Date.now().toString(),
      email: newGoogleEmail.trim(),
      secret: newGoogleSecret.trim(),
      label: newGoogleLabel.trim() || 'Compte Google'
    };

    const updated = [...googleAccounts, newAcc];
    saveAccountsToStorage(updated);
    onAddLog('generation', `Compte Google rattaché: ${newAcc.email}`);
    triggerToast(`Compte ${newAcc.email} enregistré sous coffre-fort.`, 'success');
    setNewGoogleEmail('');
    setNewGoogleSecret('');
    setShowAddGoogleModal(false);
  };

  const confirmDeleteAccount = () => {
    if (!deleteConfirmAccount) return;
    const updated = googleAccounts.filter(a => a.id !== deleteConfirmAccount.id);
    saveAccountsToStorage(updated);
    if (selectedAccountId === deleteConfirmAccount.id) {
      setSelectedAccountId(null);
    }
    onAddLog('generation', `Suppression autorisée du compte Google: ${deleteConfirmAccount.email}`);
    triggerToast(`Compte ${deleteConfirmAccount.email} purgé.`, 'info');
    setDeleteConfirmAccount(null);
  };

  const regenerateToken = () => {
    const newToken = 'ALPHA9-AUTH-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setSessionToken(newToken);
    onAddLog('generation', 'Jeton d\'authentification de session renouvelé');
    triggerToast('Nouveau jeton d\'authentification généré !', 'success');
  };

  const handleExportProfile = () => {
    const exportData = {
      profile,
      googleAccountsCount: googleAccounts.length,
      exportedAt: new Date().toISOString(),
      clearance: profile.clearanceLevel
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `profil_adam_sambo_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('Fiche de profil téléchargée !', 'success');
  };

  return (
    <div id="me-tab-view" className="space-y-6">
      {/* Header Banner : Carte d'identité Principale "MOI" */}
      <div 
        id="me-hero-card"
        className={`p-6 lg:p-8 rounded-[32px] border relative overflow-hidden transition-all duration-500 shadow-2xl ${
          isDarkMode 
            ? 'bg-gradient-to-br from-[#060c1e] via-[#030712] to-[#0a122c] border-cyan-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.6)]' 
            : 'bg-gradient-to-br from-white via-cyan-50/40 to-indigo-50/50 border-slate-200 shadow-[0_12px_32px_rgba(0,0,0,0.05)]'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Avatar & Identité principale */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Grand Avatar */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1.5 rounded-3xl blur-md opacity-80 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500"></div>
              <div className={`relative w-24 h-24 rounded-2xl flex items-center justify-center font-mono text-4xl font-black border shadow-xl ${
                isDarkMode 
                  ? 'bg-[#050b1d] text-cyan-300 border-cyan-500/40 shadow-[inset_0_2px_6px_rgba(255,255,255,0.1)]' 
                  : 'bg-white text-cyan-600 border-cyan-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]'
              }`}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 border-2 border-[#030712] flex items-center gap-1 text-[9px] text-white font-bold font-mono shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                <span>ACTIF</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className={`text-2xl lg:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {profile.name}
                </h1>
                <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-black tracking-widest px-2.5 py-1 rounded-lg border border-cyan-500/30 font-mono">
                  {profile.clearanceLevel}
                </span>
              </div>

              <p className="text-xs font-mono font-bold text-indigo-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{profile.role}</span>
              </p>

              <p className={`text-xs max-w-xl leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {profile.bio}
              </p>

              {/* Raccourcis Rapides de Contact */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <a
                  href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`}
                  className="px-3 py-1.5 rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-mono font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Appel direct"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{profile.phone}</span>
                </a>

                <a
                  href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-mono font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Ouvrir WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`mailto:${profile.email}`}
                  className="px-3 py-1.5 rounded-xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-mono font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Envoyer un email"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{profile.email}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Boutons d'Action Profil */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => {
                setEditForm(profile);
                setIsEditingProfile(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modifier Mes Infos</span>
            </button>

            <button
              onClick={handleExportProfile}
              className={`px-4 py-2.5 rounded-2xl border text-xs font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                isDarkMode 
                  ? 'border-white/10 bg-[#081024] hover:bg-[#0c1836] text-slate-300' 
                  : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exporter Fiche</span>
            </button>

            <button
              onClick={() => copyToClipboard(profile.email, 'me-email')}
              className={`px-4 py-2.5 rounded-2xl border text-xs font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                isDarkMode 
                  ? 'border-white/10 bg-[#081024] hover:bg-[#0c1836] text-slate-300' 
                  : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              {copiedField === 'me-email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copier Email</span>
            </button>

            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[10px] font-mono ${
              isDarkMode ? 'bg-[#02050f]/80 border-cyan-500/20 text-cyan-300' : 'bg-slate-100 border-slate-200 text-cyan-700'
            }`}>
              <span className="text-slate-500 font-bold">MATRICULE:</span>
              <span className="font-extrabold">{profile.matricule}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grille principale : Renseignements Personnels & Coffre-Fort Google */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne 1 & 2 : Fiche Personnelle & Statut de Sécurité */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Fiche Données Personnelles Détaillées */}
          <div className={`p-6 rounded-[28px] border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#030712]/80 border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.3)]' 
              : 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.03)]'
          }`}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className={`text-xs font-black uppercase font-mono tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    RENSEIGNEMENTS PERSONNELS & CIVILS
                  </h2>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Dossier d'enregistrement confidentiel
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditForm(profile);
                  setIsEditingProfile(true);
                }}
                className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Éditer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Carte 1: Département */}
              <div className={`p-3.5 rounded-2xl border ${
                isDarkMode ? 'bg-[#040817] border-white/5' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono uppercase mb-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Division & Rattachement</span>
                </div>
                <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {profile.department}
                </p>
              </div>

              {/* Carte 2: Date de Naissance */}
              <div className={`p-3.5 rounded-2xl border ${
                isDarkMode ? 'bg-[#040817] border-white/5' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono uppercase mb-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Date de Naissance</span>
                </div>
                <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {profile.birthDate}
                </p>
              </div>

              {/* Carte 3: Groupe Sanguin & Médical */}
              <div className={`p-3.5 rounded-2xl border ${
                isDarkMode ? 'bg-[#040817] border-white/5' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono uppercase mb-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                  <span>Profil Médical / Groupe Sanguin</span>
                </div>
                <p className="text-xs font-bold text-rose-400 font-mono">
                  {profile.bloodType} • <span className="font-sans font-normal text-slate-400">Allergies: {profile.allergies}</span>
                </p>
              </div>

              {/* Carte 4: Localisation Principale */}
              <div className={`p-3.5 rounded-2xl border ${
                isDarkMode ? 'bg-[#040817] border-white/5' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono uppercase mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Localisation de Base</span>
                </div>
                <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {profile.location}
                </p>
              </div>
            </div>
          </div>

          {/* Module 2: Mes Comptes Google & Identifiants Liés */}
          <div className={`p-6 rounded-[28px] border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#030712]/80 border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.3)]' 
              : 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.03)]'
          }`}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h2 className={`text-xs font-black uppercase font-mono tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    MES COMPTES GOOGLE LIÉS ({googleAccounts.length})
                  </h2>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Coffre-fort d'identifiants chiffrés par la matrice 128-bit
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowAddGoogleModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-md shadow-indigo-900/30"
              >
                <Plus className="w-3 h-3" />
                <span>Ajouter un compte</span>
              </button>
            </div>

            <div className="space-y-3">
              {googleAccounts.map(account => {
                const isRevealed = selectedAccountId === account.id;
                return (
                  <div
                    key={account.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-[#040818] border-white/5 hover:border-indigo-500/30' 
                        : 'bg-slate-50/80 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center p-1.5 shrink-0">
                          <Globe className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {account.email}
                            </span>
                            {account.label && (
                              <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {account.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-mono">Mot de passe :</span>
                            <span className={`font-mono text-xs font-black ${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>
                              {isRevealed ? account.secret : '••••••••••••••••'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          onClick={() => setSelectedAccountId(isRevealed ? null : account.id)}
                          title={isRevealed ? "Masquer le mot de passe" : "Révéler le mot de passe"}
                          className={`p-2 rounded-xl border text-xs transition cursor-pointer active:scale-95 ${
                            isRevealed
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : isDarkMode 
                                ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' 
                                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {isRevealed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => copyToClipboard(account.secret, `pwd-${account.id}`)}
                          title="Copier le mot de passe"
                          className="p-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs transition cursor-pointer active:scale-95"
                        >
                          {copiedField === `pwd-${account.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => setDeleteConfirmAccount(account)}
                          title="Supprimer ce compte avec autorisation"
                          className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Colonne 3 : Sécurité Personnelle & Clés d'Accès */}
        <div className="space-y-6">
          {/* Carte Identifiants de Connexion Serveur */}
          <div className={`p-6 rounded-[28px] border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#030712]/80 border-blue-500/20 shadow-[0_16px_40px_rgba(0,0,0,0.3)]' 
              : 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.03)]'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                <h3 className={`text-xs font-black uppercase font-mono tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  IDENTIFIANTS SERVEUR
                </h3>
              </div>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                PERSISTÉ
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed mb-4 font-sans">
              Vos identifiants et mot de passe de connexion au portail sont scellés et hachés (scrypt) sur le serveur dans <code className="text-blue-400 font-mono">server/credentials.json</code>.
            </p>

            <button
              onClick={() => setIsCredsModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Modifier Identifiants Serveur</span>
            </button>
          </div>

          {/* Session & Jeton d'authentification */}
          <div className={`p-6 rounded-[28px] border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#030712]/80 border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.3)]' 
              : 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.03)]'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <h3 className={`text-xs font-black uppercase font-mono tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  SESSION & SÉCURITÉ SERVEUR
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode ? 'bg-[#040817] border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-500 font-bold">JETON ACTIF:</span>
                <span className="font-bold text-emerald-400 truncate max-w-[170px]">{sessionToken}</span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode ? 'bg-[#040817] border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-500 font-bold">STOCKAGE SESSION:</span>
                <span className="font-bold text-cyan-400">COOKIE HTTPONLY (SCELLÉ)</span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDarkMode ? 'bg-[#040817] border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-500 font-bold">STATUT ACCÈS:</span>
                <span className="font-bold text-emerald-400">SOUVERAIN (ROOT)</span>
              </div>
            </div>

            <button
              onClick={regenerateToken}
              className="w-full mt-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 hover:border-cyan-500/40 text-xs font-mono font-bold text-slate-400 hover:text-cyan-400 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renouveler le jeton</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal d'édition du profil utilisateur */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`max-w-xl w-full p-6 rounded-3xl border shadow-2xl max-h-[90vh] overflow-y-auto ${
                isDarkMode 
                  ? 'bg-[#030712] border-cyan-500/30 text-slate-200' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase font-mono tracking-wider">
                      MODIFICATION DU PROFIL PERSONNEL (MOI)
                    </h3>
                    <span className="text-[10px] text-slate-500">Mise à jour de la fiche d'identité Alpha-9</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 font-sans text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Nom Complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                        isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Rôle / Fonction *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.role}
                      onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border text-xs ${
                        isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Téléphone Direct *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.phone}
                      onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                        isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Email Principal *
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border text-xs ${
                        isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Département / Division
                    </label>
                    <input
                      type="text"
                      value={editForm.department}
                      onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border text-xs ${
                        isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Date de Naissance
                    </label>
                    <input
                      type="text"
                      value={editForm.birthDate}
                      onChange={e => setEditForm(prev => ({ ...prev, birthDate: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border text-xs ${
                        isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Groupe Sanguin
                    </label>
                    <input
                      type="text"
                      value={editForm.bloodType}
                      onChange={e => setEditForm(prev => ({ ...prev, bloodType: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                        isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Allergies & Remarques Médicales
                    </label>
                    <input
                      type="text"
                      value={editForm.allergies}
                      onChange={e => setEditForm(prev => ({ ...prev, allergies: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border text-xs ${
                        isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Localisation (Ville, Pays)
                    </label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border text-xs ${
                        isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                      Niveau d'Habilitation
                    </label>
                    <input
                      type="text"
                      value={editForm.clearanceLevel}
                      onChange={e => setEditForm(prev => ({ ...prev, clearanceLevel: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                        isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                    Bio & Déclaration de Mission
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.bio}
                    onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    className={`w-full p-2.5 rounded-xl border text-xs leading-relaxed ${
                      isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-400 hover:text-white cursor-pointer transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-black uppercase tracking-wider transition shadow-lg shadow-cyan-900/40 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ajout Compte Google */}
      <AnimatePresence>
        {showAddGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl ${
                isDarkMode 
                  ? 'bg-[#030712] border-indigo-500/30 text-slate-200' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase font-mono tracking-wider">
                      RATTACHER UN COMPTE GOOGLE
                    </h3>
                    <span className="text-[10px] text-slate-500">Chiffrement AES au coffre-fort</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddGoogleModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddGoogleAccount} className="space-y-3 font-sans text-xs">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                    Adresse Email Google *
                  </label>
                  <input
                    type="email"
                    required
                    value={newGoogleEmail}
                    onChange={e => setNewGoogleEmail(e.target.value)}
                    placeholder="exemple@gmail.com"
                    className={`w-full p-2.5 rounded-xl border text-xs ${
                      isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                    Mot de Passe Chiffré *
                  </label>
                  <input
                    type="password"
                    required
                    value={newGoogleSecret}
                    onChange={e => setNewGoogleSecret(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                    Libellé / Tag
                  </label>
                  <input
                    type="text"
                    value={newGoogleLabel}
                    onChange={e => setNewGoogleLabel(e.target.value)}
                    placeholder="Personnel, Travail, Secondaire..."
                    className={`w-full p-2.5 rounded-xl border text-xs ${
                      isDarkMode ? 'bg-[#0b1329] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddGoogleModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-400 hover:text-white cursor-pointer transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-black uppercase tracking-wider transition shadow-lg shadow-indigo-900/40 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Sauvegarder</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Demande d'Autorisation de Suppression Compte Google */}
      <AnimatePresence>
        {deleteConfirmAccount && (
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
                    AUTORISATION DE SUPPRESSION REQUISE
                  </h3>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Révocation définitive d'un identifiant du coffre-fort
                  </span>
                </div>
              </div>

              <p className="text-xs font-sans leading-relaxed text-slate-400 mb-3">
                Confirmez-vous l'autorisation de suppression pour le compte Google <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{deleteConfirmAccount.email}</strong> ? Son mot de passe chiffré sera définitivement purgé du coffre-fort.
              </p>

              <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-[11px] font-mono text-red-300 mb-5 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>Cette action nécessite votre confirmation d'administrateur.</span>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmAccount(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-400 hover:text-white cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAccount}
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

      {/* Modal Identifiants Serveur */}
      <ServerCredentialsModal
        isOpen={isCredsModalOpen}
        onClose={() => setIsCredsModalOpen(false)}
        isDarkMode={isDarkMode}
        onAddLog={onAddLog}
        onCredentialsUpdated={(newId) => triggerToast(`Identifiants serveur mis à jour : ${newId}`, 'success')}
      />
    </div>
  );
}
