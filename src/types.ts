export interface SecurityLog {
  id: string;
  timestamp: string;
  type: 'success' | 'failed' | 'generation';
  details: string;
  ipAddress?: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  category: 'Professionnel' | 'Personnel' | 'Partenaire';
  notes?: string;
  avatarColor?: string;
}

export interface ProjectTask {
  id: string;
  text: string;
  done: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'in_progress' | 'completed' | 'pending';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  category: string;
  tasks: ProjectTask[];
  assignedTo?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tag: string;
  pinned: boolean;
  color?: string;
  updatedAt: string;
}

export interface AuthUser {
  identifier: string;
  email: string;
  displayName: string;
  role: string;
}

export interface ServerCredentialsInfo {
  identifier: string;
  userEmail: string;
  displayName?: string;
  role?: string;
  updatedAt?: string;
  serverStoragePath?: string;
}
