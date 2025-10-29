export type View = 'library' | 'major' | 'create_initial' | 'edit' | 'view_path' | 'profile';

export enum ColumnType {
  BRANCH = 'BRANCH',
  DYNAMIC = 'DYNAMIC',
}

export enum SectionType {
  HEADING = 'HEADING',
  SUB_HEADING = 'SUB_HEADING',
  PARAGRAPH = 'PARAGRAPH',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  BULLETS = 'BULLETS',
  QANDA = 'QANDA',
  LINK = 'LINK',
  TABLE = 'TABLE',
  FLOATING = 'FLOATING',
}

export interface PathItem {
  id: string;
  title: string;
}

export interface DynamicContentSection {
  id: string;
  type: SectionType;
  content: any;
}

export interface PathColumn {
  id: string;
  title: string;
  type: ColumnType;
  parentItemId: string | null;
  width: number;
  items: PathItem[];
  sections: DynamicContentSection[];
}

export interface LearningPath {
  id: string;
  title: string;
  columns: PathColumn[];
  createdAt: string;
  isMajor?: boolean;
}

export interface User {
  id: number | string;
  username: string;
}

export interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string; }>;
  register: (username: string, password: string) => Promise<{ success: boolean; message: string; }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string; }>;
}

export interface PathContextType {
  paths: LearningPath[];
  majorPath: LearningPath | null;
  isLoading: boolean;
  error: string | null;
  addPath: (title: string, callback: (newPath: LearningPath) => void) => void;
  getPathById: (id: string) => LearningPath | undefined;
  updatePath: (updatedPath: LearningPath) => void;
  deletePath: (id: string) => void;
  setMajorPath: (id: string) => void;
}