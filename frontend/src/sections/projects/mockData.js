// Mock data for Projects module (front-end only)

// Use image-based avatars (matches the UI used across the website)
import defaultProfile from '../../assets/images/default_profile.png';

export const projectStats = {
  totalProjects: 7,
  totalTasks: 49,
  assignedTasks: 12,
  completedTasks: 6,
  overdueTasks: 3,
};

export const members = [
  { id: 'm1', name: 'Brooklyn', role: 'Project Manager', avatarLetter: 'B', avatar: defaultProfile },
  { id: 'm2', name: 'Praveen', role: 'Developer', avatarLetter: 'P', avatar: defaultProfile },
  { id: 'm3', name: 'Umatharan', role: 'UI Designer', avatarLetter: 'U', avatar: defaultProfile },
  { id: 'm4', name: 'Keerthana', role: 'Web Designer', avatarLetter: 'K', avatar: defaultProfile },
  { id: 'm5', name: 'Arlene McCoy', role: 'Web Designer', avatarLetter: 'A', avatar: defaultProfile },
  { id: 'm6', name: 'Maria Memon', role: 'UI Designer', avatarLetter: 'M', avatar: defaultProfile },
  { id: 'm7', name: 'Albert Watson', role: 'UI/UX Designer', avatarLetter: 'A', avatar: defaultProfile },
  { id: 'm8', name: 'Jerome Bell', role: 'Developer', avatarLetter: 'J', avatar: defaultProfile },
];

export const projects = [
  {
    id: 'p1',
    title: 'Restro',
    subtitle: 'Coffee Shop Website',
    managerId: 'm1',
    date: '01/15/2026',
    status: 'Upcoming',
  },
  {
    id: 'p2',
    title: 'Yellow Branding',
    subtitle: 'Coffee Shop Website',
    managerId: 'm1',
    date: '01/15/2026',
    status: '',
  },
  {
    id: 'p3',
    title: 'Run Branding',
    subtitle: 'Coffee Shop Website',
    managerId: 'm1',
    date: '01/15/2026',
    status: '',
  },
  {
    id: 'p4',
    title: 'Hajime Illustration',
    subtitle: 'Coffee Shop Website',
    managerId: 'm1',
    date: '01/15/2026',
    status: '',
  },
  {
    id: 'p5',
    title: 'Restro',
    subtitle: 'Coffee Shop Website',
    managerId: 'm1',
    date: '01/15/2026',
    status: '',
  },
  {
    id: 'p6',
    title: 'Yellow Branding',
    subtitle: 'Coffee Shop Website',
    managerId: 'm1',
    date: '01/15/2026',
    status: '',
  },
  {
    id: 'p7',
    title: 'Run Branding',
    subtitle: 'Coffee Shop Website',
    managerId: 'm1',
    date: '01/15/2026',
    status: 'Completed',
  },
  {
    id: 'p8',
    title: 'Hajime Illustration',
    subtitle: 'Coffee Shop Website',
    managerId: 'm1',
    date: '01/15/2026',
    status: 'Completed',
  },
];

export const tasksByProject = {
  p1: [
    {
      id: 1,
      name: 'Design app wireframe',
      startDate: '25 Jan 2026',
      assignedTo: 'Umatharan',
      dueDate: '28 Dec 2026',
      priority: 'Medium',
      progress: 'Completed',
      description: 'Create initial wireframes for the app screens.',
    },
    {
      id: 2,
      name: 'Write project report',
      startDate: '21 Jan 2026',
      assignedTo: 'Praveen',
      dueDate: '29 Jan 2026',
      priority: 'High',
      progress: 'In Progress',
      description: 'Prepare the project status report for stakeholders.',
    },
    {
      id: 3,
      name: 'Review Budget plan',
      startDate: '13 Jan 2026',
      assignedTo: 'Umatharan',
      dueDate: '15 Jan 2026',
      priority: 'Low',
      progress: 'Not Started',
      description: 'Check budget allocations and update if needed.',
    },
    {
      id: 4,
      name: 'Client Meeting Preparation',
      startDate: '18 Jan 2026',
      assignedTo: 'Keerthana',
      dueDate: '22 Jan 2026',
      priority: 'Medium',
      progress: 'In Progress',
      description: 'Prepare meeting agenda and demo materials.',
    },
  ],
};

export function getMemberById(id) {
  return members.find((m) => m.id === id);
}

export function getProjectById(projectId) {
  return projects.find((p) => p.id === projectId) || projects[0];
}

export function getTasks(projectId) {
  return tasksByProject[projectId] || tasksByProject.p1;
}