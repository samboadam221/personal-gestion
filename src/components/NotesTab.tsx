import React, { useState, useEffect } from 'react';
import { NoteItem } from '../types';
import { 
  FileText, 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Copy, 
  Check, 
  Tag, 
  Clock, 
  Edit3, 
  Sparkles,
  BookOpen,
  AlertTriangle,
  ShieldAlert,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotesTabProps {
  isDarkMode: boolean;
  onAddLog: (type: 'success' | 'failed' | 'generation', details: string) => void;
  triggerToast: (message: string, type?: 'success' | 'info') => void;
}

const DEFAULT_NOTES: NoteItem[] = [];

export default function NotesTab({ isDarkMode, onAddLog, triggerToast }: NotesTabProps) {
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('secure_portal_notes_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_NOTES;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<NoteItem | null>(null);

  // Form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTag, setNoteTag] = useState('Général');
  const [notePinned, setNotePinned] = useState(false);
  const [noteColor, setNoteColor] = useState('cyan');

  // Persist
  useEffect(() => {
    localStorage.setItem('secure_portal_notes', JSON.stringify(notes));
    localStorage.setItem('secure_portal_notes_v2', JSON.stringify(notes));
  }, [notes]);

  const tags = ['all', 'Sécurité', 'Réunion', 'Personnel', 'Idées', 'Général'];

  const filteredNotes = notes
    .filter(n => {
      const matchesTag = selectedTag === 'all' || n.tag === selectedTag;
      const q = searchTerm.toLowerCase();
      const matchesSearch = n.title.toLowerCase().includes(q) ||
                            n.content.toLowerCase().includes(q) ||
                            n.tag.toLowerCase().includes(q);
      return matchesTag && matchesSearch;
    })
    .sort((a, b) => {
      // Pinned notes come first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  const handleOpenCreateModal = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteTag('Général');
    setNotePinned(false);
    setNoteColor('cyan');
    setShowModal(true);
  };

  const handleOpenEditModal = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTag(note.tag);
    setNotePinned(note.pinned);
    setNoteColor(note.color || 'cyan');
    setShowModal(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      triggerToast('Titre et contenu obligatoires.', 'info');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (editingNoteId) {
      // Update existing note
      setNotes(prev => prev.map(n => n.id === editingNoteId ? {
        ...n,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        tag: noteTag,
        pinned: notePinned,
        color: noteColor,
        updatedAt: formattedDate
      } : n));
      onAddLog('generation', `Note mise à jour: ${noteTitle}`);
      triggerToast('Note modifiée avec succès !', 'success');
    } else {
      // Add new note
      const newNote: NoteItem = {
        id: 'note-' + Date.now(),
        title: noteTitle.trim(),
        content: noteContent.trim(),
        tag: noteTag,
        pinned: notePinned,
        color: noteColor,
        updatedAt: formattedDate
      };
      setNotes(prev => [newNote, ...prev]);
      onAddLog('generation', `Nouvelle note consignée: ${newNote.title}`);
      triggerToast('Note enregistrée dans le bloc-notes !', 'success');
    }

    setShowModal(false);
  };

  const handleTogglePin = (id: string) => {
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        const nextPinned = !n.pinned;
        triggerToast(nextPinned ? 'Note épinglée en haut.' : 'Note désépinglée.', 'info');
        return { ...n, pinned: nextPinned };
      }
      return n;
    }));
  };

  const handleRequestDeleteNote = (note: NoteItem) => {
    setDeleteConfirmNote(note);
  };

  const confirmDeleteNote = () => {
    if (!deleteConfirmNote) return;
    setNotes(prev => prev.filter(n => n.id !== deleteConfirmNote.id));
    onAddLog('generation', `Suppression autorisée de la note: ${deleteConfirmNote.title}`);
    triggerToast(`Note "${deleteConfirmNote.title}" supprimée.`, 'info');
    setDeleteConfirmNote(null);
  };

  const handleCopyNote = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNoteId(id);
    triggerToast('Contenu de la note copié !', 'info');
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const handleExportNotes = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `notes_alpha9_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast(`Export de ${notes.length} notes téléchargé !`, 'success');
  };

  return (
    <div id="notes-tab-view" className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 rounded-[28px] border transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#030712]/75 border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.3)]' 
          : 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.03)]'
      }`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <FileText className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xs font-black uppercase font-mono tracking-widest ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  BLOC-NOTES & MÉMOS SÉCURISÉS
                </h2>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {notes.length} NOTES
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Espace confidentiel de prise de notes, directives et synthèses de travail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportNotes}
              title="Exporter toutes les notes au format JSON"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter</span>
            </button>

            <button
              id="btn-add-note"
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer font-mono uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvelle Note
            </button>
          </div>
        </div>

        {/* Search & Tag Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher dans les notes par titre, contenu ou mot-clé..."
              className={`w-full pl-10 pr-4 py-2 text-xs font-sans rounded-xl focus:outline-none focus:ring-2 transition ${
                isDarkMode 
                  ? 'bg-[#010309] border border-white/10 text-slate-200 focus:ring-cyan-500/30' 
                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                  selectedTag === tag
                    ? isDarkMode ? 'bg-[#0b1329] text-cyan-300 border border-blue-500/30' : 'bg-white text-cyan-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tag === 'all' ? 'Toutes' : tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 font-sans text-xs border rounded-2xl border-dashed border-slate-300 dark:border-white/10">
            Aucune note enregistrée pour ces critères.
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`p-5 rounded-[24px] border transition-all duration-300 flex flex-col justify-between relative group ${
                note.pinned 
                  ? isDarkMode 
                    ? 'bg-[#050b1a]/90 border-cyan-500/30 shadow-[0_8px_25px_rgba(6,182,212,0.1)]' 
                    : 'bg-cyan-50/50 border-cyan-200 shadow-[0_4px_16px_rgba(6,182,212,0.06)]'
                  : isDarkMode 
                    ? 'bg-[#030712]/80 border-white/10 hover:border-white/20 shadow-[0_6px_20px_rgba(0,0,0,0.3)]' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
              }`}
            >
              <div>
                {/* Note header: tag + pin button */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      note.tag === 'Sécurité'
                        ? isDarkMode ? 'bg-red-950/40 text-red-400 border-red-900/30' : 'bg-red-50 text-red-600 border-red-200'
                        : note.tag === 'Réunion'
                          ? isDarkMode ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                          : note.tag === 'Idées'
                            ? isDarkMode ? 'bg-amber-950/40 text-amber-400 border-amber-900/30' : 'bg-amber-50 text-amber-600 border-amber-200'
                            : isDarkMode ? 'bg-cyan-950/40 text-cyan-400 border-cyan-900/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    }`}>
                      {note.tag}
                    </span>

                    {note.pinned && (
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5" />
                        ÉPINGLÉ
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleTogglePin(note.id)}
                    title={note.pinned ? "Désépingler la note" : "Épingler en haut"}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      note.pinned 
                        ? 'text-cyan-400 hover:bg-cyan-500/20' 
                        : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-500/10'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Title & Body */}
                <h3 className={`text-xs font-black mb-2 transition-colors leading-snug ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-800'
                }`}>
                  {note.title}
                </h3>

                <p className={`text-[11px] leading-relaxed font-sans whitespace-pre-line line-clamp-6 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {note.content}
                </p>
              </div>

              {/* Note Footer with timestamps & actions */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-slate-500 text-[10px] font-mono">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{note.updatedAt}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyNote(`${note.title}\n\n${note.content}`, note.id)}
                    title="Copier le texte"
                    className="p-1 text-slate-400 hover:text-cyan-400 rounded transition cursor-pointer"
                  >
                    {copiedNoteId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(note)}
                    title="Modifier la note"
                    className="p-1 text-slate-400 hover:text-indigo-400 rounded transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleRequestDeleteNote(note)}
                    title="Demander l'autorisation de suppression"
                    className="p-1 text-slate-400 hover:text-red-400 rounded transition cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note Modal (Create / Edit) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`max-w-lg w-full p-6 rounded-3xl border shadow-2xl ${
                isDarkMode 
                  ? 'bg-[#030712] border-white/10 text-slate-200' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-white/5 pb-3">
                <h3 className="text-xs font-black uppercase font-mono tracking-wider">
                  {editingNoteId ? 'MODIFIER LA NOTE' : 'CRÉER UNE NOTE'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Titre de la note * :
                  </label>
                  <input
                    type="text"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="ex: Directives de sécurité, Synthèse réunion..."
                    className={`w-full p-2.5 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Catégorie / Tag :
                    </label>
                    <select
                      value={noteTag}
                      onChange={(e) => setNoteTag(e.target.value)}
                      className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                      }`}
                    >
                      <option value="Sécurité">Sécurité</option>
                      <option value="Réunion">Réunion</option>
                      <option value="Personnel">Personnel</option>
                      <option value="Idées">Idées</option>
                      <option value="Général">Général</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={notePinned}
                        onChange={(e) => setNotePinned(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-[11px] font-bold">Épingler en haut de liste</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Contenu de la note * :
                  </label>
                  <textarea
                    required
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Tapez vos notes, mémos ou directives ici..."
                    rows={6}
                    className={`w-full p-3 text-xs leading-relaxed rounded-xl focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                    }`}
                  />
                  <div className="text-right text-[10px] text-slate-500 font-mono mt-1">
                    {noteContent.length} caractères • {noteContent.split(/\s+/).filter(Boolean).length} mots
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-95"
                  >
                    {editingNoteId ? 'Enregistrer les modifications' : 'Consigner la Note'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Demande d'Autorisation de Suppression Note */}
      <AnimatePresence>
        {deleteConfirmNote && (
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
                    Purge sécurisée d'une note chiffrée
                  </span>
                </div>
              </div>

              <p className="text-xs font-sans leading-relaxed text-slate-400 mb-3">
                Confirmez-vous l'autorisation de suppression pour la note <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{deleteConfirmNote.title}</strong> ? Son contenu textuel et ses métadonnées seront définitivement écrasés.
              </p>

              <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-[11px] font-mono text-red-300 mb-5 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>Cette action est irréversible.</span>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmNote(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-400 hover:text-white cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteNote}
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
