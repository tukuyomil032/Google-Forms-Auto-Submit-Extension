// ユーザー自身のプロフィール（名前）
export interface UserProfile {
  name: string;
}

// 登録するフォームの設定
export interface SavedForm {
  id: string;      // 内部管理用のユニークID
  urlId: string;   // GoogleフォームのURLに含まれるID部分
  displayName: string; // 表示名
  targetIndex: number; // 名前の入力欄が上から何番目か（デフォルト0）
  autoCheckEmail: boolean; // メール記録チェックボックスを押すか
}

// ストレージ全体の構造
export interface StorageData {
  profile: UserProfile | null;
  forms: SavedForm[];
}