export interface UserProfile {
  name: string;
}

export interface SavedForm {
  id: string;
  urlId: string;
  displayName: string;
  targetIndex: number;
  autoCheckEmail: boolean;
}

export interface StorageData {
  profile: UserProfile | null;
  forms: SavedForm[];
  theme?: AppTheme;
}

export type AppTheme = 'light' | 'dark' | 'darkBlue' | 'system';