import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Server, 
  Key, 
  ArrowRight, 
  RefreshCw, 
  Mail, 
  ShieldAlert, 
  Clock, 
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthUser } from '../types';

interface LoginPortalProps {
  onLoginSuccess: (user: AuthUser) => void;
  onAddLog: (type: 'success' | 'failed' | 'generation', details: string) => void;
  isDarkMode?: boolean;
}

export default function LoginPortal({
  onLoginSuccess,
  onAddLog,
  isDarkMode = true
}: LoginPortalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Password Recovery State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'reset'>('request');
  const [recoveryInput, setRecoveryInput] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');

  // Check server connectivity on mount
  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        const res = await fetch('/api/auth/status');
        if (res.ok) {
          if (isMounted) setServerStatus('online');
        } else {
          if (isMounted) setServerStatus('online');
        }
      } catch (err) {
        if (isMounted) setServerStatus('offline');
      }
    };
    checkServer();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLocked || lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          setErrorMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked, lockoutSeconds]);

  // Detect CapsLock
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  // Purely server-authoritative submission - ZERO client-side fallback
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setErrorMessage(`Votre compte est temporairement verrouillé. Veuillez patienter ${Math.ceil(lockoutSeconds / 60)} minute(s).`);
      return;
    }
    if (!identifier.trim()) {
      setErrorMessage('Veuillez saisir votre identifiant ou adresse email.');
      return;
    }
    if (!password) {
      setErrorMessage('Veuillez saisir votre mot de passe.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        setAttemptsLeft(null);
        setIsLocked(false);

        onAddLog(
          'success',
          `Session certifiée par le serveur (Cookie HttpOnly) pour : ${data.user?.identifier || identifier.trim()}`
        );

        if (rememberMe) {
          localStorage.setItem('alpha9_auth_user', JSON.stringify(data.user));
        }

        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 800);
      } else if (response.status === 429) {
        // Rate limit exceeded / Account locked
        setIsLocked(true);
        const rem = data.remainingSeconds || 900;
        setLockoutSeconds(rem);
        setErrorMessage(data.error || 'Compte temporairement verrouillé suite à trop de tentatives.');
        onAddLog('failed', `Compte verrouillé suite à 5 tentatives infructueuses pour : ${identifier.trim()}`);
      } else {
        // Invalid credentials - authoritative rejection
        const msg = data.error || 'Identifiant ou mot de passe incorrect.';
        setErrorMessage(msg);
        if (typeof data.attemptsLeft === 'number') {
          setAttemptsLeft(data.attemptsLeft);
        }
        onAddLog('failed', `Échec d'authentification serveur pour l'identifiant : ${identifier.trim()}`);
      }
    } catch (err) {
      // Server down or network failure: STRICTLY block login without any browser-side bypass
      console.error('[Auth Error] Server unreachable:', err);
      setErrorMessage('Erreur de communication avec le serveur d\'authentification. Connexion impossible hors-ligne.');
      onAddLog('failed', `Erreur réseau : serveur d'authentification inaccessible pour ${identifier.trim()}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Password Recovery: Step 1 - Send Recovery Code
  const handleRequestRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryInput.trim()) {
      setRecoveryMessage({ type: 'error', text: 'Veuillez saisir votre identifiant ou adresse email.' });
      return;
    }

    setRecoveryLoading(true);
    setRecoveryMessage(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrIdentifier: recoveryInput.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMaskedEmail(data.maskedEmail || 'votre adresse email');
        setRecoveryStep('reset');
        setRecoveryMessage({
          type: 'success',
          text: `Un code de sécurité à 6 chiffres a été expédié à ${data.maskedEmail || 'votre email'}.`
        });
        onAddLog('generation', `Demande de récupération de mot de passe initiée pour ${recoveryInput.trim()}`);
      } else {
        setRecoveryMessage({
          type: 'error',
          text: data.error || 'Identifiant ou email introuvable.'
        });
      }
    } catch (err) {
      setRecoveryMessage({
        type: 'error',
        text: 'Impossible de joindre le serveur pour la récupération.'
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Password Recovery: Step 2 - Reset Password with OTP Code
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim() || recoveryCode.trim().length !== 6) {
      setRecoveryMessage({ type: 'error', text: 'Le code de vérification doit comporter 6 chiffres.' });
      return;
    }
    if (!recoveryNewPassword || recoveryNewPassword.length < 6) {
      setRecoveryMessage({ type: 'error', text: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
      return;
    }
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryMessage({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }

    setRecoveryLoading(true);
    setRecoveryMessage(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: recoveryCode.trim(),
          newPassword: recoveryNewPassword.trim()
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRecoveryMessage({
          type: 'success',
          text: 'Votre mot de passe a été réinitialisé et scellé sur le serveur !'
        });
        onAddLog('success', 'Mot de passe administrateur réinitialisé avec succès par email');
        setIsLocked(false);
        setLockoutSeconds(0);
        setErrorMessage('');
        setTimeout(() => {
          setShowForgotModal(false);
          setRecoveryStep('request');
          setRecoveryCode('');
          setRecoveryNewPassword('');
          setRecoveryConfirmPassword('');
          setPassword('');
        }, 1500);
      } else {
        setRecoveryMessage({
          type: 'error',
          text: data.error || 'Code invalide ou expiré.'
        });
      }
    } catch (err) {
      setRecoveryMessage({
        type: 'error',
        text: 'Erreur réseau lors de la réinitialisation.'
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative rounded-3xl p-7 sm:p-9 backdrop-blur-2xl transition-all duration-300 border shadow-2xl overflow-hidden ${
          isDarkMode
            ? 'bg-[#080e1e]/90 border-blue-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(37,99,235,0.1)] text-slate-100'
            : 'bg-white/95 border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_0_30px_rgba(59,130,246,0.06)] text-slate-900'
        }`}
      >
        {/* Futuristic cyber circuit top glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80" />

        {/* Server status indicator pill */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                serverStatus === 'offline' ? 'bg-red-400' : 'bg-emerald-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                serverStatus === 'offline' ? 'bg-red-500' : 'bg-emerald-500'
              }`} />
            </span>
            <span className={`text-[10px] font-mono tracking-wider font-semibold uppercase ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {serverStatus === 'checking' ? 'Vérification serveur...' : serverStatus === 'offline' ? 'Serveur Inaccessible' : 'Serveur Sécurisé Alpha-9'}
            </span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border ${
            isDarkMode 
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <Server className="w-3 h-3" />
            <span>HASH SCRYPT ACTIF</span>
          </div>
        </div>

        {/* Header with high-tech badge */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105 ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-blue-500/25'
                : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20'
            }`}>
              {isSuccess ? (
                <CheckCircle2 className="w-9 h-9 text-emerald-300 animate-bounce" />
              ) : isLocked ? (
                <ShieldAlert className="w-8 h-8 text-amber-300" />
              ) : (
                <Shield className="w-8 h-8 drop-shadow" />
              )}
            </div>
            <div className="absolute -inset-1.5 bg-blue-500/20 rounded-2xl blur-sm -z-10" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight font-sans">
            PORTAIL D'ACCÈS SÉCURISÉ
          </h1>
          <p className={`text-xs mt-1.5 font-medium tracking-wide ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Authentification certifiée et hachée par le serveur Alpha-9
          </p>
        </div>

        {/* Lockout Warning Banner */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-3 overflow-hidden shadow-lg"
            >
              <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-400 animate-pulse" />
              <div className="flex-1">
                <p className="font-bold text-amber-300">Accès temporairement verrouillé</p>
                <p className="text-[11px] opacity-90 mt-1">
                  Protection active contre les attaques par force brute (5 tentatives erronées).
                </p>
                <div className="mt-2.5 font-mono text-[11px] font-bold text-amber-200 bg-amber-500/10 px-2.5 py-1 rounded-lg inline-block border border-amber-500/20">
                  Déverrouillage dans : {Math.floor(lockoutSeconds / 60)}m {lockoutSeconds % 60}s
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Standard Error Message Alert */}
        <AnimatePresence>
          {errorMessage && !isLocked && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
                {attemptsLeft !== null && attemptsLeft > 0 && (
                  <p className="text-[11px] opacity-80 mt-0.5 text-red-300/90 font-mono">
                    Attention : {attemptsLeft} tentative(s) restante(s) avant verrouillage de sécurité.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success message */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 mb-5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5 font-medium"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Authentification serveur validée. Session sécurisée active...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifiant Field */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wider font-mono ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Identifiant / Email <span className="text-blue-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className={`w-4 h-4 transition-colors ${
                  isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'
                }`} />
              </div>
              <input
                id="login-identifier-input"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={e => {
                  setIdentifier(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                disabled={isLoading || isSuccess || isLocked}
                placeholder="Votre identifiant ou adresse email"
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none border ${
                  isDarkMode
                    ? 'bg-[#030712]/70 border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-100 placeholder-slate-600'
                    : 'bg-slate-50 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 text-slate-900 placeholder-slate-400'
                } ${errorMessage ? 'border-red-500/60' : ''}`}
              />
            </div>
          </div>

          {/* Mot de passe Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-xs font-semibold uppercase tracking-wider font-mono ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Mot de passe <span className="text-blue-500">*</span>
              </label>
              {isCapsLockOn && (
                <span className="text-[10px] text-amber-400 font-medium font-mono animate-pulse">
                  ⚠ VERR. MAJ ACTIVÉ
                </span>
              )}
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className={`w-4 h-4 transition-colors ${
                  isDarkMode ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-600'
                }`} />
              </div>
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                onKeyUp={handleKeyUp}
                disabled={isLoading || isSuccess || isLocked}
                placeholder="••••••••••••"
                className={`w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none border ${
                  isDarkMode
                    ? 'bg-[#030712]/70 border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-100 placeholder-slate-600 font-mono'
                    : 'bg-slate-50 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 text-slate-900 placeholder-slate-400 font-mono'
                } ${errorMessage ? 'border-red-500/60' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                }`}
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Options Row: Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/30 border-slate-600 accent-blue-600 cursor-pointer"
              />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Mémoriser la session
              </span>
            </label>

            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setRecoveryStep('request');
                setRecoveryMessage(null);
                setRecoveryInput(identifier || '');
              }}
              className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Mot de passe oublié ?</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-button"
            type="submit"
            disabled={isLoading || isSuccess || isLocked}
            className={`w-full py-3.5 px-4 mt-2 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300 shadow-lg cursor-pointer ${
              isLoading || isSuccess || isLocked
                ? 'opacity-80 cursor-not-allowed bg-blue-600/70 text-white'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 active:scale-[0.99] text-white shadow-blue-600/30'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Vérification cryptographique serveur...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Session Sécurisée Validée !</span>
              </>
            ) : isLocked ? (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-300" />
                <span>COMPTE TEMPORAIREMENT VERROUILLÉ</span>
              </>
            ) : (
              <>
                <span>SE CONNECTER</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Security badge footer inside card */}
        <div className={`mt-8 pt-5 border-t flex items-center justify-between text-[10px] font-mono ${
          isDarkMode ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-400'
        }`}>
          <div className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-blue-500" />
            <span>SÉCURITÉ ZERO-LEAK • SCRYPT HASH</span>
          </div>
          <span>ALPHA-9 SHIELD</span>
        </div>
      </motion.div>

      {/* Password Recovery Modal (Email OTP flow) */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl relative overflow-hidden transition-all ${
                isDarkMode
                  ? 'bg-[#080e1e] border-blue-500/30 text-slate-100 shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
                  : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowForgotModal(false)}
                className={`absolute top-5 right-5 p-2 rounded-xl transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-150 text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Récupération de mot de passe</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Protocole certifié par email Alpha-9
                  </p>
                </div>
              </div>

              {/* Status Message */}
              <AnimatePresence>
                {recoveryMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3 mb-4 rounded-xl text-xs flex items-start gap-2.5 font-medium border ${
                      recoveryMessage.type === 'success'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : recoveryMessage.type === 'info'
                        ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                        : 'bg-red-500/15 border-red-500/30 text-red-400'
                    }`}
                  >
                    {recoveryMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    )}
                    <span>{recoveryMessage.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step 1: Request Code */}
              {recoveryStep === 'request' && (
                <form onSubmit={handleRequestRecoveryCode} className="space-y-4">
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Saisissez votre identifiant ou l'adresse email de votre compte pour recevoir un code temporaire de sécurité à 6 chiffres.
                  </p>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 font-mono uppercase ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Identifiant ou Email
                    </label>
                    <input
                      type="text"
                      value={recoveryInput}
                      onChange={e => setRecoveryInput(e.target.value)}
                      placeholder="ex: Adam SAMBO ou samboadam221@gmail.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none border transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] border-slate-700 text-slate-100 focus:border-blue-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                      }`}
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                        isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={recoveryLoading}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50"
                    >
                      {recoveryLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Envoi en cours...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5" />
                          <span>Envoyer le code</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Input Code & New Password */}
              {recoveryStep === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] leading-relaxed flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      Un code à usage unique a été envoyé à <strong>{maskedEmail}</strong>. Veuillez vérifier votre messagerie et saisir le code ci-dessous.
                    </span>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 font-mono uppercase ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Code à 6 chiffres reçu
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={recoveryCode}
                      onChange={e => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-center text-lg font-mono font-bold tracking-widest outline-none border transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] border-slate-700 text-cyan-300 focus:border-cyan-500'
                          : 'bg-slate-50 border-slate-300 text-blue-700 focus:border-blue-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 font-mono uppercase ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Nouveau mot de passe (min 6 caractères)
                    </label>
                    <input
                      type="password"
                      value={recoveryNewPassword}
                      onChange={e => setRecoveryNewPassword(e.target.value)}
                      placeholder="Nouveau mot de passe"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono outline-none border transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] border-slate-700 text-slate-100 focus:border-blue-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 font-mono uppercase ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      value={recoveryConfirmPassword}
                      onChange={e => setRecoveryConfirmPassword(e.target.value)}
                      placeholder="Confirmez le mot de passe"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono outline-none border transition-all ${
                        isDarkMode
                          ? 'bg-[#030712] border-slate-700 text-slate-100 focus:border-blue-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                      }`}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep('request')}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Renvoyer un code
                    </button>
                    <button
                      type="submit"
                      disabled={recoveryLoading}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50"
                    >
                      {recoveryLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Hachage & Enregistrement...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Réinitialiser</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
