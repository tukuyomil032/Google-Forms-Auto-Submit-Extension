import React from 'react';
import { type SavedForm, type UserProfile } from '../interface';
import { IconDrag, IconPlay } from './Icons';

interface Props {
  forms: SavedForm[];
  profile: UserProfile | null;
  dropTarget: { index: number; position: 'top' | 'bottom' } | null;
  getCardClasses: () => string;
  theme: string;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onRun: (form: SavedForm) => void;
}

export const Dashboard: React.FC<Props> = ({
  forms,
  profile,
  dropTarget,
  getCardClasses,
  theme,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRun
}) => {
  if (forms.length === 0) {
    return (
      <p className="py-10 text-center text-sm opacity-50">
        リストが空です。<br/>設定タブから追加してください。
      </p>
    );
  }

  return (
    <div className="space-y-3 animate-fadeIn">
      {!profile && (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
          ⚠️ 設定タブで「名前」を登録してください
        </div>
      )}

      {forms.map((form, index) => {
        const isOver = dropTarget?.index === index;
        const isTop = isOver && dropTarget?.position === 'top';
        const isBottom = isOver && dropTarget?.position === 'bottom';

        return (
          <div
            key={form.id}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            className={`relative transition-all duration-100 ${isOver ? 'scale-[1.02]' : ''}`}
          >
            {isTop && <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg z-10 pointer-events-none" />}

            <div className="flex items-center gap-2 group cursor-grab active:cursor-grabbing">
              <div className="text-slate-400 px-1 opacity-50 group-hover:opacity-100">
                <IconDrag />
              </div>
              <button
                onClick={() => onRun(form)}
                disabled={!profile}
                className={`flex-1 flex items-center justify-between rounded-xl border p-3 shadow-sm hover:shadow-md transition-all active:scale-[0.98] ${getCardClasses()} ${!profile ? 'opacity-50' : 'hover:border-blue-400'}`}
              >
                <div className="text-left overflow-hidden">
                  <div className="font-bold truncate">{form.displayName}</div>
                  <div className="text-[10px] opacity-60">ID: {form.urlId.substring(0, 8)}...</div>
                </div>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${theme === 'light' ? 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600' : 'bg-white/10 text-slate-300 group-hover:bg-blue-500 group-hover:text-white'}`}>
                  <IconPlay />
                </div>
              </button>
            </div>

            {isBottom && <div className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg z-10 pointer-events-none" />}
          </div>
        );
      })}
    </div>
  );
};