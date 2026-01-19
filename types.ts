
export type UserRole = 'volunteer' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  username?: string;
  phone?: string;
  avatar_url?: string;
  role_ids?: string[];
  completed_chapter_ids?: string[];
}

export type View = 'DASHBOARD' | 'VOLUNTEERS' | 'MODULES' | 'JOURNEY_BUILDER' | 'SETTINGS';

export interface Department {
  id: string;
  name: string;
  coreModuleIds: string[];
}

export interface Role {
  id: string;
  name: string;
  departmentId: string;
}

export type ContentType = 'VIDEO' | 'PDF' | 'LINK';
export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
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
  targetRoleIds: string[];
  targetDepartmentIds: string[];
  durationMinutes: number;
  isSequential: boolean;
  chapters: Chapter[];
}

export interface Journey {
  id: string;
  roleId: string;
  progressionModuleIds: string[];
}

export interface Volunteer {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  roleIds: string[];
  completedChapterIds: string[];
  joinedAt: string;
  isAdmin: boolean;
}
