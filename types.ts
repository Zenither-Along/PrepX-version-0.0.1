export enum PathStatus {
  Completed = 'Completely built',
}

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
  FLOATING = 'FLOATING',
  LINK = 'LINK',
}

export interface DynamicContentSection {
  id: string;
  type: SectionType;
  content: any; 
}

export interface PathItem {
  id: string;
  title: string;
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
  status: PathStatus;
  createdAt: string;
  isMajor: boolean;
}

export type View = 'create_initial' | 'edit' | 'major' | 'library' | 'view_path';

export interface PathContextType {
  paths: LearningPath[];
  majorPath: LearningPath | null;
  addPath: (title: string, callback: (newPath: LearningPath) => void) => void;
  updatePath: (updatedPath: LearningPath) => void;
  deletePath: (id: string) => void;
  setMajorPath: (id: string) => void;
  getPathById: (id: string) => LearningPath | undefined;
}