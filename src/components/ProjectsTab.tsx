import React, { useState, useEffect } from 'react';
import { Project, ProjectTask } from '../types';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  ListChecks, 
  ChevronDown, 
  ChevronUp,
  Tag,
  CheckSquare,
  Square,
  AlertTriangle,
  ShieldAlert,
  Edit3,
  Download,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectsTabProps {
  isDarkMode: boolean;
  onAddLog: (type: 'success' | 'failed' | 'generation', details: string) => void;
  triggerToast: (message: string, type?: 'success' | 'info') => void;
}

const DEFAULT_PROJECTS: Project[] = [];

export default function ProjectsTab({ isDarkMode, onAddLog, triggerToast }: ProjectsTabProps) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('secure_portal_projects_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_PROJECTS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed' | 'pending'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>('prj-1');
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);

  // Project Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [category, setCategory] = useState('Général');
  const [assignedTo, setAssignedTo] = useState('Adam SAMBO');
  const [taskInput, setTaskInput] = useState('');
  const [tasksList, setTasksList] = useState<string[]>([]);

  // Persist
  useEffect(() => {
    localStorage.setItem('secure_portal_projects', JSON.stringify(projects));
    localStorage.setItem('secure_portal_projects_v2', JSON.stringify(projects));
  }, [projects]);

  const filteredProjects = projects.filter(p => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(q) ||
                          p.description.toLowerCase().includes(q) ||
                          p.category.toLowerCase().includes(q) ||
                          (p.assignedTo && p.assignedTo.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const handleToggleTask = (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const updatedTasks = p.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
      
      // Auto update status if all tasks done
      const allDone = updatedTasks.length > 0 && updatedTasks.every(t => t.done);
      return {
        ...p,
        tasks: updatedTasks,
        status: allDone ? 'completed' : p.status === 'completed' ? 'in_progress' : p.status
      };
    }));

    onAddLog('generation', `Mise à jour d'une tâche de projet.`);
  };

  const handleAddQuickTask = (projectId: string, taskText: string) => {
    if (!taskText.trim()) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const newTask: ProjectTask = {
        id: 't-' + Date.now(),
        text: taskText.trim(),
        done: false
      };
      return {
        ...p,
        tasks: [...p.tasks, newTask]
      };
    }));
    triggerToast('Tâche ajoutée au projet !', 'success');
  };

  const handleDeleteTask = (projectId: string, taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        tasks: p.tasks.filter(t => t.id !== taskId)
      };
    }));
    triggerToast('Tâche retirée du projet.', 'info');
  };

  const handleCycleStatus = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycleMap: Record<string, 'in_progress' | 'completed' | 'pending'> = {
      'in_progress': 'completed',
      'completed': 'pending',
      'pending': 'in_progress'
    };
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const nextStatus = cycleMap[p.status] || 'in_progress';
      return { ...p, status: nextStatus };
    }));
    triggerToast('Statut du projet mis à jour !', 'info');
  };

  const handleRequestDeleteProject = (project: Project) => {
    setDeleteConfirmProject(project);
  };

  const confirmDeleteProject = () => {
    if (!deleteConfirmProject) return;
    setProjects(prev => prev.filter(p => p.id !== deleteConfirmProject.id));
    onAddLog('generation', `Suppression autorisée du projet: ${deleteConfirmProject.title}`);
    triggerToast(`Projet "${deleteConfirmProject.title}" retiré.`, 'info');
    setDeleteConfirmProject(null);
  };

  const handleExportProjects = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `projets_alpha9_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast(`Export de ${projects.length} projets téléchargé !`, 'success');
  };

  const handleOpenCreateModal = () => {
    setEditingProjectId(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setDueDate(d.toISOString().split('T')[0]);
    setCategory('Général');
    setAssignedTo('Adam SAMBO');
    setTasksList(['Phase d\'analyse initiale', 'Mise en œuvre technique']);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setEditingProjectId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setPriority(project.priority);
    setDueDate(project.dueDate);
    setCategory(project.category);
    setAssignedTo(project.assignedTo || 'Adam SAMBO');
    setTasksList(project.tasks.map(t => t.text));
    setShowAddModal(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      triggerToast('Le titre du projet est requis.', 'info');
      return;
    }

    if (editingProjectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === editingProjectId) {
          const existingMap = new Map(p.tasks.map(t => [t.text, t.done]));
          const updatedTasks: ProjectTask[] = tasksList
            .filter(t => t.trim().length > 0)
            .map((t, idx) => ({
              id: p.tasks[idx]?.id || `t-${Date.now()}-${idx}`,
              text: t.trim(),
              done: existingMap.get(t.trim()) ?? false
            }));

          return {
            ...p,
            title: title.trim(),
            description: description.trim() || 'Aucune description spécifiée.',
            priority,
            dueDate,
            category: category.trim() || 'Général',
            assignedTo: assignedTo.trim() || 'Adam SAMBO',
            tasks: updatedTasks
          };
        }
        return p;
      }));
      onAddLog('generation', `Projet mis à jour: ${title.trim()}`);
      triggerToast('Projet mis à jour avec succès !', 'success');
    } else {
      const createdTasks: ProjectTask[] = tasksList
        .filter(t => t.trim().length > 0)
        .map((t, idx) => ({
          id: `t-${Date.now()}-${idx}`,
          text: t.trim(),
          done: false
        }));

      const newProject: Project = {
        id: 'prj-' + Date.now(),
        title: title.trim(),
        description: description.trim() || 'Aucune description spécifiée.',
        status: 'in_progress',
        priority,
        dueDate,
        category: category.trim() || 'Général',
        assignedTo: assignedTo.trim() || 'Adam SAMBO',
        tasks: createdTasks
      };

      setProjects(prev => [newProject, ...prev]);
      onAddLog('generation', `Nouveau projet créé: ${newProject.title}`);
      triggerToast('Projet planifié avec succès !', 'success');
    }

    // Reset
    setTitle('');
    setDescription('');
    setTasksList(['Phase d\'analyse initiale', 'Mise en œuvre technique']);
    setShowAddModal(false);
  };

  return (
    <div id="projects-tab-view" className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 rounded-[28px] border transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#030712]/75 border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.3)]' 
          : 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.03)]'
      }`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <FolderKanban className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xs font-black uppercase font-mono tracking-widest ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  GESTION DES PROJETS
                </h2>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {projects.length} PROJETS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Pilotage des jalons techniques, chantiers de sécurité et objectifs Alpha-9
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportProjects}
              title="Exporter tous les projets au format JSON"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400 text-xs font-mono font-bold transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter</span>
            </button>

            <button
              id="btn-add-project"
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer font-mono uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouveau Projet
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un projet, responsable, catégorie..."
              className={`w-full pl-10 pr-4 py-2 text-xs font-sans rounded-xl focus:outline-none focus:ring-2 transition ${
                isDarkMode 
                  ? 'bg-[#010309] border border-white/10 text-slate-200 focus:ring-cyan-500/30' 
                  : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                filterStatus === 'all'
                  ? isDarkMode ? 'bg-[#0b1329] text-cyan-300 border border-blue-500/30' : 'bg-white text-cyan-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                filterStatus === 'in_progress'
                  ? isDarkMode ? 'bg-[#0b1329] text-cyan-400 border border-cyan-500/30' : 'bg-white text-cyan-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              En cours
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                filterStatus === 'completed'
                  ? isDarkMode ? 'bg-[#0b1329] text-emerald-400 border border-emerald-500/30' : 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Terminé
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                filterStatus === 'pending'
                  ? isDarkMode ? 'bg-[#0b1329] text-amber-400 border border-amber-500/30' : 'bg-white text-amber-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              En attente
            </button>
          </div>
        </div>
      </div>

      {/* Projects Cards List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-sans text-xs border rounded-2xl border-dashed border-slate-300 dark:border-white/10">
            Aucun projet ne correspond à ces critères.
          </div>
        ) : (
          filteredProjects.map((project) => {
            const completedCount = project.tasks.filter(t => t.done).length;
            const totalCount = project.tasks.length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isExpanded = expandedProjectId === project.id;

            return (
              <div
                key={project.id}
                className={`p-6 rounded-[24px] border transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-[#030712]/80 border-white/10 hover:border-cyan-500/30 shadow-[0_8px_25px_rgba(0,0,0,0.3)]' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-[0_4px_16px_rgba(0,0,0,0.03)]'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleCycleStatus(project.id, e)}
                        title="Cliquer pour changer le statut du projet"
                        className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 active:scale-95 transition ${
                        project.status === 'completed'
                          ? isDarkMode ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : project.status === 'in_progress'
                            ? isDarkMode ? 'bg-cyan-950/40 text-cyan-400 border-cyan-900/30' : 'bg-cyan-50 text-cyan-600 border-cyan-200'
                            : isDarkMode ? 'bg-amber-950/40 text-amber-400 border-amber-900/30' : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {project.status === 'completed' ? '✓ TERMINÉ' : project.status === 'in_progress' ? '● EN COURS' : '○ EN ATTENTE'}
                      </button>

                      <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        project.priority === 'high'
                          ? isDarkMode ? 'bg-rose-950/40 text-rose-400 border-rose-900/30' : 'bg-rose-50 text-rose-600 border-rose-200'
                          : project.priority === 'medium'
                            ? isDarkMode ? 'bg-blue-950/40 text-blue-400 border-blue-900/30' : 'bg-blue-50 text-blue-600 border-blue-200'
                            : isDarkMode ? 'bg-slate-800 text-slate-400 border-white/5' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        PRIORITÉ : {project.priority === 'high' ? 'HAUTE' : project.priority === 'medium' ? 'MOYENNE' : 'BASSE'}
                      </span>

                      <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded-md border ${
                        isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {project.category}
                      </span>
                    </div>

                    <h3 className={`text-sm font-black transition-colors ${
                      isDarkMode ? 'text-slate-100' : 'text-slate-800'
                    }`}>
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-sans leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Right side stats and buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] font-mono text-slate-400">{project.dueDate}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                        Resp: <strong className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{project.assignedTo || 'Adam'}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                      className={`p-2 rounded-xl border transition cursor-pointer ${
                        isDarkMode 
                          ? 'bg-[#010207] border-white/10 text-cyan-400 hover:bg-[#0b1329]' 
                          : 'bg-slate-50 border-slate-200 text-cyan-600 hover:bg-slate-100'
                      }`}
                      title={isExpanded ? 'Réduire' : 'Voir les tâches'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(project)}
                      className="p-2 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition cursor-pointer active:scale-95"
                      title="Modifier les détails de ce projet"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleRequestDeleteProject(project)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer active:scale-95"
                      title="Demander l'autorisation de suppression"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                      Progression ({completedCount}/{totalCount} étapes)
                    </span>
                    <span className={`font-black ${
                      progressPercent === 100 
                        ? 'text-emerald-400' 
                        : isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                    }`}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        progressPercent === 100 ? 'bg-emerald-500' : 'bg-cyan-500'
                      }`} 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Expanded Checklist */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 space-y-2.5 overflow-hidden"
                    >
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2">
                        LISTE DES JALONS & TÂCHES (CLIQUEZ POUR COCHER) :
                      </span>

                      <div className="space-y-1.5">
                        {project.tasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => handleToggleTask(project.id, task.id)}
                            className={`group/task p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                              task.done
                                ? isDarkMode ? 'bg-[#020617] border-white/5 opacity-60' : 'bg-slate-100 border-slate-200 opacity-70'
                                : isDarkMode ? 'bg-[#010207] border-white/10 hover:border-cyan-500/30' : 'bg-slate-50 border-slate-200 hover:border-cyan-400'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {task.done ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className={`text-xs font-sans truncate ${
                                task.done 
                                  ? 'line-through text-slate-500' 
                                  : isDarkMode ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                {task.text}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteTask(project.id, task.id, e)}
                              title="Supprimer cette tâche"
                              className="opacity-40 hover:opacity-100 p-1 text-slate-400 hover:text-red-400 rounded transition shrink-0 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add quick task line */}
                      <div className="pt-2">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const input = (e.currentTarget.elements.namedItem('quickTask') as HTMLInputElement);
                            if (input && input.value.trim()) {
                              handleAddQuickTask(project.id, input.value);
                              input.value = '';
                            }
                          }}
                          className="flex gap-2"
                        >
                          <input
                            name="quickTask"
                            type="text"
                            placeholder="Ajouter une tâche rapide à ce projet..."
                            className={`flex-1 p-2 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                              isDarkMode 
                                ? 'bg-[#010309] border border-white/10 text-slate-200 focus:ring-cyan-500/30' 
                                : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                            }`}
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono rounded-xl cursor-pointer"
                          >
                            + Ajouter
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* New Project Modal */}
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
                <h3 className="text-xs font-black uppercase font-mono tracking-wider">
                  {editingProjectId ? 'MODIFIER LE PROJET' : 'CRÉER UN NOUVEAU PROJET'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Titre du projet * :
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Migration infrastructure, Audit sécurité..."
                    className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Description :
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Objectifs et contexte du projet..."
                    rows={2}
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
                      Priorité :
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                      }`}
                    >
                      <option value="high">Haute</option>
                      <option value="medium">Moyenne</option>
                      <option value="low">Basse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Date d'échéance :
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
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
                      Catégorie :
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Infrastructure, Sécurité..."
                      className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Responsable :
                    </label>
                    <input
                      type="text"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      placeholder="Adam SAMBO"
                      className={`w-full p-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-[#0b1329] border border-white/10 text-slate-100 focus:ring-cyan-500/30' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-cyan-500/20'
                      }`}
                    />
                  </div>
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
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-95 cursor-pointer active:scale-95 transition"
                  >
                    {editingProjectId ? 'Enregistrer les Modifications' : 'Créer le Projet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Demande d'Autorisation de Suppression Projet */}
      <AnimatePresence>
        {deleteConfirmProject && (
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
                    Suppression d'un jalon technique
                  </span>
                </div>
              </div>

              <p className="text-xs font-sans leading-relaxed text-slate-400 mb-3">
                Confirmez-vous l'autorisation de suppression pour le projet <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{deleteConfirmProject.title}</strong> ? Toutes les tâches et son avancement associé seront purgés.
              </p>

              <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-[11px] font-mono text-red-300 mb-5 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>Cette opération affecte les indicateurs généraux du tableau de bord.</span>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmProject(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-400 hover:text-white cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteProject}
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
