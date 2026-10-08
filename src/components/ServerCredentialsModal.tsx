import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Key, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  Save, 
  X, 
  RefreshCw, 
  CheckCircle2,
  FileCode2,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ServerCredentialsInfo } from '../types';

interface ServerCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onCredentialsUpdated?: (newIdentifier: string) => void;
  onAddLog: (type: 'success' | 'failed' | 'generation', details: string) => void;
}

export default function ServerCredentialsModal({
  isOpen,
  onClose,
  isDarkMode,
  onCredentialsUpdated,
  onAddLog
}: ServerCredentialsModalProps) {
  const [currentInfo, setCurrentInfo] = useState<ServerCredentialsInfo | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newIdentifier, setNewIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current server credentials info (without password)
  useEffect(() => {
    if (!isOpen) return;
    setStatusMessage(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsLoading(true);

    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setCurrentInfo(data.user);
          setNewIdentifier(data.user.identifier || '');
        }
      })
      .catch(err => {
        console.error('Error fetching /api/auth/me:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!newIdentifier.trim()) {
      setStatusMessage({ type: 'error', text: 'L’identifiant ne peut pas être vide.' });
      return;
    }
    if (!newPassword.trim()) {
      setStatusMessage({ type: 'error', text: 'Veuillez saisir un nouveau mot de passe.' });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/auth/update-credentials', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newIdentifier: newIdentifier.trim(),
          newPassword: newPassword.trim()
        })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatusMessage({
          type: 'success',
          text: 'Mot de passe haché (scrypt) et identifiants enregistrés avec succès sur le serveur !'
        });
        setCurrentInfo(prev => ({
          ...prev,
          identifier: newIdentifier.trim(),
          userEmail: prev?.userEmail || 'samboadam221@gmail.com'
        }));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onAddLog('success', `Identifiants et mot de passe serveur hachés et mis à jour pour [${newIdentifier.trim()}]`);
        if (onCredentialsUpdated) {
          onCredentialsUpdated(newIdentifier.trim());
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Erreur lors de la mise à jour des identifiants.'
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Impossible de joindre le serveur pour enregistrer les identifiants.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden transition-all max-h-[92vh] overflow-y-auto ${
          isDarkMode
            ? 'bg-[#080e1e] border-blue-500/20 text-slate-100 shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Top glow decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-xl transition-colors cursor-pointer ${
            isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-150 text-slate-500 hover:text-slate-800'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Identifiants Serveur Alpha-9</h2>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Modification sécurisée avec hachage scrypt côté serveur
            </p>
          </div>
        </div>

        {/* Info card regarding file storage & hashing */}
        <div className={`p-3.5 rounded-2xl border text-xs mb-5 flex items-start gap-3 ${
          isDarkMode ? 'bg-[#030712]/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <FileCode2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <p className="font-semibold text-blue-400 mb-0.5">Sécurité Cryptographique Serveur :</p>
            <p>
              Le mot de passe est haché avec un sel aléatoire via l'algorithme <strong>scrypt 64-bit</strong> et stocké dans <code className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">server/credentials.json</code>.
              Aucun mot de passe n'est stocké en clair.
            </p>
          </div>
        </div>

        {/* Status notification */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-3.5 mb-5 rounded-xl text-xs flex items-center gap-2.5 font-medium border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/15 border-red-500/30 text-red-400'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{statusMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifiant */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 uppercase font-mono tracking-wider ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Identifiant / Login Serveur
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                value={newIdentifier}
                onChange={e => setNewIdentifier(e.target.value)}
                placeholder="ex: Adam SAMBO"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${
                  isDarkMode
                    ? 'bg-[#030712]/80 border-slate-700 focus:border-blue-500 text-slate-100'
                    : 'bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-900'
                }`}
              />
            </div>
            {currentInfo && (
              <p className={`text-[10px] mt-1 font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Identifiant serveur configuré : <span className="text-blue-400 font-bold">{currentInfo.identifier}</span>
              </p>
            )}
          </div>

          {/* Mot de passe actuel (si requis pour validation de sécurité) */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 uppercase font-mono tracking-wider ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Mot de passe actuel (ou session active)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Entrez votre mot de passe actuel"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none border transition-all font-mono ${
                  isDarkMode
                    ? 'bg-[#030712]/80 border-slate-700 focus:border-blue-500 text-slate-100'
                    : 'bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 uppercase font-mono tracking-wider ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Nouveau mot de passe (min 6 caractères)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Définir le nouveau mot de passe"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none border transition-all font-mono ${
                  isDarkMode
                    ? 'bg-[#030712]/80 border-slate-700 focus:border-blue-500 text-slate-100'
                    : 'bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmer le nouveau mot de passe */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 uppercase font-mono tracking-wider ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ressaisir pour confirmation"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none border transition-all font-mono ${
                  isDarkMode
                    ? 'bg-[#030712]/80 border-slate-700 focus:border-blue-500 text-slate-100'
                    : 'bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Hachage & Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Hacher & Enregistrer sur le serveur</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
