
import { TrainingModule, Volunteer, Journey, Department, Role } from './types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Guest Services', coreModuleIds: ['m3'] },
  { id: 'd2', name: 'Worship Arts', coreModuleIds: [] },
  { id: 'd3', name: 'Family Ministry', coreModuleIds: [] }
];

export const INITIAL_ROLES: Role[] = [
  { id: 'r1', name: 'Usher', departmentId: 'd1' },
  { id: 'r2', name: 'Greeter', departmentId: 'd1' },
  { id: 'r3', name: 'Sunday School Teacher', departmentId: 'd3' },
  { id: 'r4', name: 'Worship Team', departmentId: 'd2' }
];

export const INITIAL_MODULES: TrainingModule[] = [
  {
    id: 'm1',
    title: 'Safe Sanctuary Basics',
    description: 'Essential safety protocols for protecting children and vulnerable adults.',
    isCompulsory: true,
    targetRoleIds: [],
    targetDepartmentIds: [],
    durationMinutes: 45,
    isSequential: true,
    chapters: [
      {
        id: 'c1-1',
        title: 'Introduction to Safety',
        contentType: 'VIDEO',
        contentUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 
        questions: [{ id: 'q1', text: 'What is the primary goal of Safe Sanctuary?', type: 'TEXT', correctAnswer: 'safety' }]
      }
    ]
  },
  {
    id: 'm2',
    title: 'Church Vision & Values',
    description: 'Understanding our mission and core beliefs.',
    isCompulsory: true,
    targetRoleIds: [],
    targetDepartmentIds: [],
    durationMinutes: 30,
    isSequential: false,
    chapters: [{ id: 'c2-1', title: 'Our Core Mission', contentType: 'LINK', contentUrl: 'https://www.church.com/vision', questions: [] }]
  },
  {
    id: 'm3',
    title: 'Guest Hospitality Fundamentals',
    description: 'The core mindset of serving every person who walks through our doors.',
    isCompulsory: false,
    targetRoleIds: ['r1', 'r2'],
    targetDepartmentIds: ['d1'],
    durationMinutes: 20,
    chapters: [{ id: 'c3-1', title: 'The Heart of a Servant', contentType: 'VIDEO', contentUrl: 'https://www.youtube.com/watch?v=XW9O9_f0DYo', questions: [] }],
    isSequential: true
  },
  {
    id: 'm4',
    title: 'Emergency Response for Ushers',
    description: 'Specific security and medical response procedures for the ushering team.',
    isCompulsory: false,
    targetRoleIds: ['r1'],
    targetDepartmentIds: [],
    durationMinutes: 40,
    chapters: [{ id: 'c4-1', title: 'Crisis Management', contentType: 'VIDEO', contentUrl: 'https://www.youtube.com/watch?v=kYI9F6Y9fN4', questions: [] }],
    isSequential: true
  }
];

export const INITIAL_JOURNEYS: Journey[] = [
  { id: 'j1', roleId: 'r1', progressionModuleIds: ['m4'] }
];

export const INITIAL_VOLUNTEERS: Volunteer[] = [
  { id: 'v1', username: 'jsmith', fullName: 'John Smith', email: 'john@example.com', phone: '555-0101', roleIds: ['r1'], completedChapterIds: ['c1-1'], joinedAt: '2023-01-15', isAdmin: true },
  { id: 'v2', username: 'aleee', fullName: 'Alice Lee', email: 'alice@example.com', phone: '555-0102', roleIds: ['r4'], completedChapterIds: [], joinedAt: '2023-03-20', isAdmin: false }
];
