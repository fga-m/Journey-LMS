
export type UserRole = 'volunteer' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  username?: string;
  phone?: string;
  role_ids?: string[];
  completed_chapter_ids?: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  is_published: boolean;
  duration_minutes: number;
  created_at: string;
}

export interface Enrollment {
  id: string;
  profile_id: string;
  course_id: string;
  progress_percent: number;
  enrolled_at: string;
  course?: Course; // Joined data
}

// Updated View type to include all views used in Sidebar and App components
export type View = 'DASHBOARD' | 'DIRECTORY' | 'LIBRARY' | 'SETTINGS' | 'VOLUNTEERS' | 'MODULES' | 'JOURNEY_BUILDER';

// Added Department type
export interface Department {
  id: string;
  name: string;
  coreModuleIds: string[];
}

// Added Role type
export interface Role {
  id: string;
  name: string;
  departmentId: string;
}

// Added ContentType and QuestionType
export type ContentType = 'VIDEO' | 'PDF' | 'LINK';
export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE';

// Added Question type
export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
}

// Added Chapter type
export interface Chapter {
  id: string;
  title: string;
  contentType: ContentType;
  contentUrl: string;
  questions: Question[];
}

// Added TrainingModule type
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

// Added Journey type
export interface Journey {
  id: string;
  roleId: string;
  progressionModuleIds: string[];
}

// Added Volunteer type
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
