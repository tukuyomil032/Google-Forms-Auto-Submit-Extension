import React from 'react';
import { type SavedForm, type UserProfile } from '../interface';
import { IconUser, IconForm, IconTrash } from './Icons';

interface Props {
  profile: UserProfile | null;
  getCardClasses: () => string;
  theme: string;
  inputName: string;
  setInputName: (s: string) => void;
  onSaveProfile: () => void;
  onDeleteProfile: () => void;
  editingId: string | null;
  newFormUrl: string;
  setNewFormUrl: (s: string) => void;
  newFormName: string;
  setNewFormName: (s: string) => void;
  newFormIndex: number;
  setNewFormIndex: (n: number) => void;
  newFormAutoCheck: boolean;
  setNewFormAutoCheck: (b: boolean) => void;
  onCancelEditing: () => void;
  onSubmitForm: () => void;
  forms: SavedForm[];
  onStartEditing: (f: SavedForm) => void;
  onDeleteForm: (id: string, e: React.MouseEvent) => void;
}

export const Settings: React.FC<Props> = ({
  profile, getCardClasses, theme,
  inputName, setInputName, onSaveProfile, onDeleteProfile,
  editingId, newFormUrl, setNewFormUrl, newFormName, setNewFormName, newFormIndex, setNewFormIndex, newFormAutoCheck, setNewFormAutoCheck,
  onCancelEditing, onSubmitForm,
  forms, onStartEditing, onDeleteForm
}) => {

  const inputBgClass = theme === 'light' ? 'bg-white border-slate-300' : 'bg-black/20 border-white/10';

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className={`rounded-xl border p-4 shadow-sm ${getCardClasses()}`}>
        <div className="flex items-center gap-2 mb-3 opacity-60">
          <IconUser />
          <h2 className="text-xs font-bold uppercase tracking-wider">送信する名前</h2>
        </div>

        {profile ? (
          <div className={`flex items-center justify-between rounded-lg p-3 border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-white/10'}`}>
            <span className="font-bold">{profile.name}</span>
            <button onClick={onDeleteProfile} className="text-xs text-red-500 hover:opacity-70 p-1.5 flex items-center gap-1">
              <IconTrash /> 削除
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="例: N高 S太郎"
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${inputBgClass}`}
            />
            <button onClick={onSaveProfile} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">保存</button>
          </div>
        )}
      </div>
      <div className={`rounded-xl border p-4 shadow-sm ${editingId ? 'border-blue-400/50 bg-blue-500/5' : getCardClasses()}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 opacity-60">
            <IconForm />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              {editingId ? '編集モード' : '新規追加'}
            </h2>
          </div>
          {editingId && <button onClick={onCancelEditing} className="text-xs opacity-60 hover:opacity-100 bg-black/10 px-2 py-1 rounded">キャンセル</button>}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium opacity-60">フォームURL</label>
            <input
              type="text"
              value={newFormUrl}
              onChange={(e) => setNewFormUrl(e.target.value)}
              placeholder="https://docs.google.com/forms/..."
              className={`w-full rounded-lg border px-3 py-2 text-sm ${inputBgClass}`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium opacity-60">表示名</label>
            <input
              type="text"
              value={newFormName}
              onChange={(e) => setNewFormName(e.target.value)}
              placeholder="例: 1Q_プロジェクトNα  /  3Q_リベラルアーツ基礎(理科)"
              className={`w-full rounded-lg border px-3 py-2 text-sm ${inputBgClass}`}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium opacity-60">名前の位置 (0~)</label>
              <input
                type="number"
                value={newFormIndex}
                onChange={(e) => setNewFormIndex(Number(e.target.value))}
                className={`w-full rounded-lg border px-3 py-2 text-sm ${inputBgClass}`}
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFormAutoCheck}
                  onChange={(e) => setNewFormAutoCheck(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-offset-0"
                />
                <span className="text-xs opacity-80">メアド記録ON</span>
              </label>
            </div>
          </div>

          <button
            onClick={onSubmitForm}
            className={`w-full rounded-lg py-3 text-xs font-bold text-white transition-all ${editingId ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            {editingId ? '更新して保存' : 'リストに追加'}
          </button>
        </div>

        {forms.length > 0 && !editingId && (
          <div className="mt-8 border-t border-dashed border-slate-300 dark:border-slate-700 pt-4">
            <p className="mb-2 text-xs opacity-60">登録済み (タップで編集)</p>
            <ul className="space-y-1">
              {forms.map(f => (
                <li
                  key={f.id}
                  onClick={() => onStartEditing(f)}
                  className={`flex items-center justify-between rounded p-2 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-black/5`}
                >
                  <span className="text-sm opacity-80">{f.displayName}</span>
                  <button
                    onClick={(e) => onDeleteForm(f.id, e)}
                    className="opacity-50 hover:opacity-100 hover:text-red-500 px-2"
                  >
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};