import React, { useState, useEffect } from 'react';
import { SecurityLog, AuthUser } from './types';
import LoginPortal from './components/LoginPortal';
import Dashboard from './components/Dashboard';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Permutation mode nuit et mode jour
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('secure_portal_theme') !== 'light';
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('secure_portal_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Current authenticated user info
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('alpha9_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  });

  // Authentication status
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('secure_portal_auth') === 'true';
  });

  // System log register
  const [logs, setLogs] = useState<SecurityLog[]>(() => {
    const now = new Date();
    const getFormattedTimeOffset = (secondsOffset: number) => {
      const d = new Date(now.getTime() - secondsOffset * 1000);
      return [
        String(d.getHours()).padStart(2, '0'),
        String(d.getMinutes()).padStart(2, '0'),
        String(d.getSeconds()).padStart(2, '0')
      ].join(':');
    };

    return [
      {
        id: '1',
        timestamp: getFormattedTimeOffset(10),
        type: 'generation',
        details: 'Système initialisé. Connexion au serveur central Alpha-9 active.'
      },
      {
        id: '2',
        timestamp: getFormattedTimeOffset(5),
        type: 'generation',
        details: 'Chiffrement scrypt et sessions sécurisées vérifiés.'
      }
    ];
  });

  // Append new event to security logbook
  const handleAddLog = (type: 'success' | 'failed' | 'generation', details: string) => {
    const now = new Date();
    const ts = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join(':');

    setLogs(prev => [
      {
        id: Math.random().toString(),
        timestamp: ts,
        type,
        details
      },
      ...prev
    ]);
  };

  // Authenticate session validity with server on mount via HttpOnly cookie
  useEffect(() => {
    fetch('/api/auth/verify-session', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.valid && data.user) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
        } else {
          // Session expired or absent on server
          setIsAuthenticated(false);
          setCurrentUser(null);
          localStorage.removeItem('secure_portal_auth');
          localStorage.removeItem('alpha9_auth_user');
        }
      })
      .catch(() => {
        // Maintain safe state if offline
      });
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('secure_portal_auth', 'true');
    localStorage.setItem('alpha9_auth_user', JSON.stringify(user));
    handleAddLog('success', `Session certifiée établie (Cookie HttpOnly) pour [${user.identifier}]. Accès accordé.`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      // ignore
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('secure_portal_auth');
    localStorage.removeItem('alpha9_auth_user');
    handleAddLog('generation', 'Déconnexion volontaire. Session et cookie HttpOnly révoqués sur le serveur.');
  };

  return (
    <div 
      id="app-root-container" 
      className={`min-h-screen transition-all duration-500 relative overflow-hidden flex flex-col justify-between ${
        isDarkMode 
          ? 'bg-[#01040d] text-slate-200' 
          : 'bg-[#f4f7fb] text-slate-800'
      }`}
    >
      {/* Background Atmospheric Elements */}
      <div className={`absolute top-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none transition-all duration-550 ${
        isDarkMode ? 'bg-blue-600/10' : 'bg-blue-500/5'
      }`}></div>
      <div className={`absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none transition-all duration-550 ${
        isDarkMode ? 'bg-cyan-600/10' : 'bg-cyan-500/5'
      }`}></div>
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none transition-all duration-500" 
        style={{ 
          backgroundImage: isDarkMode ? 'radial-gradient(#fff 1px, transparent 1px)' : 'radial-gradient(#000 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}
      ></div>

      <AnimatePresence mode="wait">
        {isAuthenticated ? (
          <motion.div
            key="dash-view-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="authenticated-screen-wrapper"
            className="w-full relative z-10"
          >
            <Dashboard
              userEmail={currentUser?.email || "samboadam221@gmail.com"}
              userIdentifier={currentUser?.identifier || "admin"}
              onLogout={handleLogout}
              logs={logs}
              onAddLog={handleAddLog}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          </motion.div>
        ) : (
          <motion.div
            key="login-view-transition"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            id="login-screen-wrapper"
            className="py-12 px-4 max-w-4xl mx-auto w-full min-h-screen flex flex-col justify-center relative z-10"
          >
            {/* Theme Switcher above Login Card */}
            <div className="w-full max-w-[480px] mx-auto flex justify-end mb-5 px-1">
              <button
                id="theme-toggle-button"
                onClick={toggleTheme}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-bold font-mono tracking-widest transition-all duration-300 shadow-md border hover:scale-105 active:scale-95 cursor-pointer ${
                  isDarkMode
                    ? 'bg-[#030712]/80 hover:bg-[#0b1329] border-white/10 text-cyan-400 hover:text-cyan-300'
                    : 'bg-white hover:bg-slate-150 border-slate-200 text-slate-700 hover:text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
                }`}
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>MODE JOUR</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>MODE NUIT</span>
                  </>
                )}
              </button>
            </div>

            {/* Centered Login Portal */}
            <div id="split-view" className="flex justify-center items-center w-full">
              <div id="cell-left-portal" className="w-full flex justify-center">
                <LoginPortal
                  onLoginSuccess={handleLoginSuccess}
                  onAddLog={handleAddLog}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
