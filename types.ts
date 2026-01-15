
export type ContentType = 'VIDEO' | 'PDF' | 'LINK';
export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
}

export interface Chapter {
  id: string;
  title: string;
  contentType: ContentType;
  contentUrl: string;
  questions: Question[];
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  isCompulsory: boolean;
  targetRoleIds: string[]; // Linked by role ID
  targetDepartmentIds: string[]; // Linked by department ID
  durationMinutes: number;
  chapters: Chapter[];
  isSequential: boolean;
}

export interface Department {
  id: string;
  name: string;
  coreModuleIds: string[]; // Ministry Step (shared by all roles in department)
}

export interface Role {
  id: string;
  name: string;
  departmentId: string;
}

export interface Journey {
  id: string;
  roleId: string;
  progressionModuleIds: string[]; // Specific Role Progression
}

export interface Volunteer {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  roleIds: string[];
  completedChapterIds: string[];
  joinedAt: string;
  isAdmin: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'NEW_MODULE' | 'DEADLINE' | 'COMPLETION';
  timestamp: Date;
  isRead: boolean;
}

export type View = 'DASHBOARD' | 'VOLUNTEERS' | 'MODULES' | 'JOURNEY_BUILDER' | 'ADMIN_STATS';
