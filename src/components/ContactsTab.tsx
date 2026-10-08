import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  PhoneCall,
  MessageCircle,
  Building2, 
  Briefcase, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Shield, 
  Tag,
  AlertTriangle,
  ShieldAlert,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContactsTabProps {
  isDarkMode: boolean;
  onAddLog: (type: 'success' | 'failed' | 'generation', details: string) => void;
  triggerToast: (message: string, type?: 'success' | 'info') => void;
}

const DEFAULT_CONTACTS: Contact[] = [];

export default function ContactsTab({ isDarkMode, onAddLog, triggerToast }: ContactsTabProps) {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('secure_portal_contacts_v2');
    if (saved) {
      try {
        const parsed: any[] = JSON.parse(saved);
        return parsed.map(c => ({
          ...c,
          category: c.category === 'Sécurité' ? 'Professionnel' : c.category
        }));
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_CONTACTS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmContact, setDeleteConfirmContact] = useState<Contact | null>(null);

  // Contact Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState<'Professionnel' | 'Personnel' | 'Partenaire'>('Professionnel');
  const [notes, setNotes] = useState('');

  // Persist
  useEffect(() => {
    localStorage.setItem('secure_portal_contacts', JSON.stringify(contacts));
    localStorage.setItem('secure_portal_contacts_v2', JSON.stringify(contacts));
  }, [contacts]);

  const categories = ['all', 'Professionnel', 'Partenaire', 'Personnel'];

  const filteredContacts = contacts.filter(c => {
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) ||
                          c.email.toLowerCase().includes(q) ||
                          c.phone.toLowerCase().includes(q) ||
                          c.company.toLowerCase().includes(q) ||
                          c.role.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingContactId(null);
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setRole('');
    setCategory('Professionnel');
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (contact: Contact) => {
    setEditingContactId(contact.id);
    setName(contact.name);
    setEmail(contact.email);
    setPhone(contact.phone);
    setCompany(contact.company);
    setRole(contact.role);
    setCategory(contact.category as any);
    setNotes(contact.notes || '');
    setShowAddModal(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      triggerToast('Nom et email requis.', 'info');
      return;
    }

    if (editingContactId) {
      // Edit existing
      setContacts(prev => prev.map(c => {
        if (c.id === editingContactId) {
          return {
            ...c,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || 'Non renseigné',
            company: company.trim() || 'Indépendant',
            role: role.trim() || 'Collaborateur',
            category,
            notes: notes.trim() || undefined
          };
        }
        return c;
      }));
      onAddLog('generation', `Mise à jour du contact: ${name.trim()}`);
      triggerToast('Fiche contact mise à jour avec succès !', 'success');
    } else {
      // Create new
      const colors = [
        'from-cyan-500 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-blue-500 to-cyan-600',
        'from-purple-500 to-pink-600',
        'from-amber-500 to-orange-600'
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newContact: Contact = {
        id: 'cnt-' + Date.now(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || 'Non renseigné',
        company: company.trim() || 'Indépendant',
        role: role.trim() || 'Collaborateur',
        category,
        notes: notes.trim() || undefined,
        avatarColor: randomColor
      };

      setContacts(prev => [newContact, ...prev]);
      onAddLog('generation', `Contact enregistré dans le carnet: ${newContact.name}`);
      triggerToast('Contact ajouté au carnet avec succès !', 'success');
    }

    // Reset
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setRole('');
    setNotes('');
    setEditingContactId(null);
    setShowAddModal(false);
  };

  const handleExportContacts = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contacts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `contacts_alpha9_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast(`Export de ${contacts.length} contacts téléchargé !`, 'success');
  };

  const handleRequestDeleteContact = (contact: Contact) => {
    setDeleteConfirmContact(contact);
  };

  const confirmDeleteContact = () => {
    if (!deleteConfirmContact) return;
    setContacts(prev => prev.filter(c => c.id !== deleteConfirmContact.id));
    onAddLog('generation', `Suppression autorisée du contact: ${deleteConfirmContact.name}`);
    triggerToast(`Contact "${deleteConfirmContact.name}" supprimé définitivement.`, 'info');
    setDeleteConfirmContact(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerToast('Coordonnée copiée dans le presse-papier.', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="contacts-tab-view" className="space-y-6">
      {/* Top Banner & Action */}
      <div className={`p-6 rounded-[28px] border transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#030712]/75 border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.3)]' 
          : 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.03)]'
      }`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <Users className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xs font-black uppercase font-mono tracking-widest ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  CARNET D'ADRESSES SÉCURISÉ
                </h2>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {contacts.length} CONTACTS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Annuaire chiffré des correspondants, partenaires et équipes de sécurité
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportContacts}
              title="Exporter tous les contacts au format JSON"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter</span>
            </button>

            <button
              id="btn-add-contact"
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer font-mono uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouveau Contact
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, email, entreprise, téléphone..."
              className={`w-full pl-10 pr-4 py-2 text-xs font-sans rounded-xl focus:outline-none focus:ring-2 transition ${
                isDarkMode 
                  ? 'bg-[#010309] border border-white/10 text-slate-200 focus:ring-cyan-500/30' 
                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                  selectedCategory === cat
                    ? isDarkMode ? 'bg-[#0b1329] text-cyan-300 border border-blue-500/30' : 'bg-white text-cyan-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {cat === 'all' ? 'Tous' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contacts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 font-sans text-xs">
            Aucun contact trouvé pour cette recherche.
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isDarkMode 
                  ? 'bg-[#030712]/80 border-white/10 hover:border-cyan-500/30 shadow-[0_8px_20px_rgba(0,0,0,0.3)]' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
              }`}
            >
              <div>
                {/* Header card with avatar */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${contact.avatarColor || 'from-cyan-500 to-indigo-600'} flex items-center justify-center text-white font-mono font-black text-sm shadow-md`}>
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className={`text-xs font-black truncate max-w-[150px] ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-800'
                      }`}>
                        {contact.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {contact.role}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    contact.category === 'Personnel'
                      ? isDarkMode ? 'bg-purple-950/40 text-purple-400 border-purple-900/30' : 'bg-purple-50 text-purple-600 border-purple-200'
                      : contact.category === 'Partenaire'
                        ? isDarkMode ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        : isDarkMode ? 'bg-cyan-950/40 text-cyan-400 border-cyan-900/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                  }`}>
                    {contact.category}
                  </span>
                </div>

                {/* Info List */}
                <div className="space-y-2 py-2 border-y border-slate-200 dark:border-white/5 my-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-500 truncate min-w-0">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-cyan-500" />
                      <span className="truncate text-[11px] font-mono">{contact.email}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(contact.email, contact.id + '-email')}
                      title="Copier l'email"
                      className="text-slate-400 hover:text-cyan-400 p-1 rounded transition"
                    >
                      {copiedId === contact.id + '-email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-500 truncate min-w-0">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-cyan-500" />
                      <span className="text-[11px] font-mono">{contact.phone}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(contact.phone, contact.id + '-phone')}
                      title="Copier le numéro"
                      className="text-slate-400 hover:text-cyan-400 p-1 rounded transition"
                    >
                      {copiedId === contact.id + '-phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-cyan-500" />
                    <span className="truncate">{contact.company}</span>
                  </div>
                </div>

                {contact.notes && (
                  <p className="text-[10.5px] text-slate-400 italic bg-slate-100/50 dark:bg-white/[0.02] p-2 rounded-xl mt-2 border border-slate-200 dark:border-white/5">
                    "{contact.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons: Appel, WhatsApp, Email, and Supprimer avec demande d'autorisation */}
              <div className="mt-4 pt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200 dark:border-white/5">
                {/* Bouton Appel Direct */}
                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                  title={`Appeler ${contact.name} au ${contact.phone}`}
                  className="flex-1 min-w-[70px] py-1.5 px-2 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-center text-[10px] font-mono font-bold transition flex items-center justify-center gap-1 active:scale-95"
                >
                  <PhoneCall className="w-3 h-3 text-blue-400" />
                  <span>Appel</span>
                </a>

                {/* Bouton WhatsApp */}
                <a
                  href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Ouvrir une discussion WhatsApp avec ${contact.name}`}
                  className="flex-1 min-w-[85px] py-1.5 px-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-center text-[10px] font-mono font-bold transition flex items-center justify-center gap-1 active:scale-95"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>

                {/* Bouton Email */}
                <a
                  href={`mailto:${contact.email}`}
                  title={`Envoyer un email à ${contact.email}`}
                  className="flex-1 min-w-[65px] py-1.5 px-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-center text-[10px] font-mono font-bold transition flex items-center justify-center gap-1 active:scale-95"
                >
                  <Mail className="w-3 h-3 text-cyan-400" />
                  <span>Email</span>
                </a>

                {/* Bouton Modifier */}
                <button
                  onClick={() => handleOpenEditModal(contact)}
                  title="Modifier les informations de ce contact"
                  className="p-1.5 text-slate-500 hover:text-cyan-400 rounded-lg transition hover:bg-cyan-500/10 cursor-pointer shrink-0 active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {/* Bouton Supprimer - Ouvre la demande d'autorisation */}
                <button
                  onClick={() => handleRequestDeleteContact(contact)}
                  title="Demander l'autorisation de suppression"
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition hover:bg-red-500/10 cursor-pointer shrink-0 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Contact Modal */}
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
                  {editingContactId ? 'MODIFIER LE CONTACT' : 'NOUVEAU CONTACT CARNET'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveContact} className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Nom complet * :
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Jean Dupont"
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
                      Email * :
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: jean@domaine.com"
                      className={`w-full p-2.5 text-xs font-mono rounded-xl focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Téléphone :
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 6..."
                      className={`w-full p-2.5 text-xs font-mono rounded-xl focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Société / Organisation :
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="ex: Portail Alpha-9"
                      className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Poste / Rôle :
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="ex: Développeur, Expert..."
                      className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Catégorie :
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                    }`}
                  >
                    <option value="Professionnel">Professionnel</option>
                    <option value="Partenaire">Partenaire</option>
                    <option value="Personnel">Personnel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Notes / Remarques :
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Informations utiles..."
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
                    {editingContactId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Demande d'Autorisation de Suppression */}
      <AnimatePresence>
        {deleteConfirmContact && (
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
                    Action de purge définitive sur le carnet d'adresses
                  </span>
                </div>
              </div>

              <p className="text-xs font-sans leading-relaxed text-slate-400 mb-3">
                Confirmez-vous l'autorisation de suppression pour le contact <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{deleteConfirmContact.name}</strong> ({deleteConfirmContact.role} • {deleteConfirmContact.company}) ?
              </p>

              <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-[11px] font-mono text-red-300 mb-5 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>Cette action révoquera immédiatement ses coordonnées et son accès au réseau Alpha-9.</span>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmContact(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-400 hover:text-white cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteContact}
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
