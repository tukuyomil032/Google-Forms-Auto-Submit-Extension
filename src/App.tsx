import { useState, useEffect, useRef } from 'react';
import { type SavedForm, type UserProfile, type StorageData, type AppTheme } from './interface';
import { IconGitHub, IconNewTab } from './components/Icons';
import { ThemeToggle } from './components/ThemeToggle';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [theme, setTheme] = useState<AppTheme>('darkBlue');
  const [message, setMessage] = useState('');
  const [inputName, setInputName] = useState('');
  const [newFormName, setNewFormName] = useState('');
  const [newFormUrl, setNewFormUrl] = useState('');
  const [newFormIndex, setNewFormIndex] = useState(0);
  const [newFormAutoCheck, setNewFormAutoCheck] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragItemIndex = useRef<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ index: number; position: 'top' | 'bottom' } | null>(null);
  const [isWideWindow, setIsWideWindow] = useState(window.innerWidth > 500);

  useEffect(() => {
    chrome.storage.local.get(['forms', 'profile', 'theme'], (result) => {
      const data = result as Partial<StorageData>;
      if (Array.isArray(data.forms)) setForms(data.forms);
      if (data.profile) setProfile(data.profile);
      if (data.theme) setTheme(data.theme);
    });

    const handleResize = () => setIsWideWindow(window.innerWidth > 500);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveTheme = theme === 'system' ? (isSystemDark ? 'dark' : 'light') : theme;

    let bgColor = '', textColor = '';
    switch (effectiveTheme) {
      case 'light':
        bgColor = '#f8fafc'; textColor = '#1e293b';
        break;
      case 'dark':
        bgColor = '#202124'; textColor = '#e2e8f0';
        break;
      case 'darkBlue': bgColor = '#0f172a'; textColor = '#f1f5f9';
        break;
    }
    document.body.style.backgroundColor = bgColor;
    document.body.style.color = textColor;
  }, [theme]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const getHeaderClasses = () => {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveTheme = theme === 'system' ? (isSystemDark ? 'dark' : 'light') : theme;
    switch (effectiveTheme) {
      case 'light':
        return 'bg-white border-slate-200';
      case 'dark':
        return 'bg-[#202124] border-gray-700';
      case 'darkBlue':
        return 'bg-slate-900 border-slate-700';
      default:
        return 'bg-white border-slate-200';
    }
  };

  const getCardClasses = () => {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveTheme = theme === 'system' ? (isSystemDark ? 'dark' : 'light') : theme;
    switch (effectiveTheme) {
      case 'light':
        return 'bg-white border-slate-200 text-slate-800';
      case 'dark':
        return 'bg-[#303134] border-gray-600 text-gray-200';
      case 'darkBlue':
        return 'bg-slate-800 border-slate-700 text-slate-100';
      default:
        return 'bg-white border-slate-200';
    }
  };

  const saveProfile = () => {
    if (!inputName.trim()) return;
    const newProfile = { name: inputName };
    chrome.storage.local.set({ profile: newProfile }, () => {
      setProfile(newProfile);
      setInputName('');
      showMessage('名前を保存しました');
    });
  };

  const deleteProfile = () => {
    chrome.storage.local.remove('profile', () => {
      setProfile(null);
      showMessage('名前を削除しました');
    });
  };

  const saveForms = (updatedForms: SavedForm[]) => {
    chrome.storage.local.set({ forms: updatedForms }, () => setForms(updatedForms));
  };

  const handleFormSubmit = () => {
    if (!newFormName || !newFormUrl) { showMessage('名称とURLは必須です'); return; }
    let extractedId = newFormUrl;
    const match = newFormUrl.match(/\/d\/e\/([^/]+)\//);
    if (match && match[1]) extractedId = match[1];

    const formData: SavedForm = {
      id: editingId || crypto.randomUUID(),
      urlId: extractedId,
      displayName: newFormName,
      targetIndex: Number(newFormIndex),
      autoCheckEmail: newFormAutoCheck
    };

    if (editingId) {
      saveForms(forms.map(f => f.id === editingId ? formData : f));
      showMessage('更新しました');
      cancelEditing();
    } else {
      saveForms([...forms, formData]);
      showMessage('追加しました');
      setNewFormName(''); setNewFormUrl(''); setNewFormIndex(0);
    }
  };

  const startEditing = (form: SavedForm) => {
    setEditingId(form.id);
    setNewFormName(form.displayName);
    setNewFormUrl(`https://docs.google.com/forms/d/e/${form.urlId}/viewform`);
    setNewFormIndex(form.targetIndex);
    setNewFormAutoCheck(form.autoCheckEmail);
    setActiveTab('settings');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewFormName(''); setNewFormUrl(''); setNewFormIndex(0); setNewFormAutoCheck(true);
  };

  const deleteForm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('削除しますか？')) {
      const updated = forms.filter(f => f.id !== id);
      saveForms(updated);
      if (editingId === id) cancelEditing();
    }
  };

  const handleDragStart = (index: number) => { dragItemIndex.current = index; };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragItemIndex.current === null || dragItemIndex.current === index) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position = e.clientY < (rect.top + rect.height / 2) ? 'top' : 'bottom';
    setDropTarget({ index, position });
  };
  const handleDrop = () => {
    if (dragItemIndex.current === null || !dropTarget) return;
    const _forms = [...forms];
    const draggedItem = _forms[dragItemIndex.current];
    _forms.splice(dragItemIndex.current, 1);
    let insertIndex = dropTarget.index;
    if (dragItemIndex.current < dropTarget.index) insertIndex--;
    if (dropTarget.position === 'bottom') insertIndex++;
    _forms.splice(insertIndex, 0, draggedItem);
    saveForms(_forms);
    dragItemIndex.current = null; setDropTarget(null);
  };

  const openAndRun = (form: SavedForm) => {
    if (!profile) { showMessage('名前を設定してください'); return; }
    chrome.tabs.create({ url: `https://docs.google.com/forms/d/e/${form.urlId}/viewform`, active: true });
  };
  const openGitHub = () => chrome.tabs.create({ url: 'https://github.com/tukuyomil032/Google-Forms-Auto-Submit-Extension' });
  const openInNewTab = () => chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });

  const saveTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
    chrome.storage.local.set({ theme: newTheme });
  };

  return (
    <div className="w-full min-h-screen pb-8 font-sans">
      <div className={`flex items-center justify-between px-4 py-3 shadow-sm sticky top-0 z-30 border-b transition-colors duration-300 ${getHeaderClasses()}`}>
        <h1 className="font-bold text-sm select-none">N/S/R高通学コース 出席フォーム自動提出アプリ</h1>
        <div className="flex items-center gap-2">

          <ThemeToggle theme={theme} onThemeChange={saveTheme} />

          {isWideWindow && (
            <button onClick={openGitHub} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title="GitHub">
              <IconGitHub />
            </button>
          )}

          <button onClick={openInNewTab} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title="別ウィンドウ">
            <IconNewTab />
          </button>

          <div className="ml-2 flex space-x-1 rounded-lg p-1 border bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10">
            {(['dashboard', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'shadow-sm bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300'
                    : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                {tab === 'dashboard' ? 'リスト' : '設定'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        {message && (
          <div className="mb-4 rounded border border-blue-500/30 bg-blue-500/10 p-2 text-center text-xs text-blue-600 dark:text-blue-300 animate-fadeIn">
            {message}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            forms={forms}
            profile={profile}
            dropTarget={dropTarget}
            getCardClasses={getCardClasses}
            theme={theme}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={() => { dragItemIndex.current = null; setDropTarget(null); }}
            onRun={openAndRun}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            profile={profile}
            getCardClasses={getCardClasses}
            theme={theme}
            inputName={inputName} setInputName={setInputName}
            onSaveProfile={saveProfile} onDeleteProfile={deleteProfile}
            editingId={editingId}
            newFormUrl={newFormUrl} setNewFormUrl={setNewFormUrl}
            newFormName={newFormName} setNewFormName={setNewFormName}
            newFormIndex={newFormIndex} setNewFormIndex={setNewFormIndex}
            newFormAutoCheck={newFormAutoCheck} setNewFormAutoCheck={setNewFormAutoCheck}
            onCancelEditing={cancelEditing} onSubmitForm={handleFormSubmit}
            forms={forms}
            onStartEditing={startEditing} onDeleteForm={deleteForm}
          />
        )}
      </div>
    </div>
  );
}

export default App;