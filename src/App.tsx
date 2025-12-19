import { useState, useEffect, useRef } from 'react';
import { type SavedForm, type UserProfile, type StorageData } from './interface';

function App() {
  // タブ管理
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  
  // データ管理
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [message, setMessage] = useState('');

  // プロフィール入力用
  const [inputName, setInputName] = useState('');
  
  // フォーム追加・編集用
  const [newFormName, setNewFormName] = useState('');
  const [newFormUrl, setNewFormUrl] = useState('');
  const [newFormIndex, setNewFormIndex] = useState(0);
  const [newFormAutoCheck, setNewFormAutoCheck] = useState(true);

  // 編集モード用のID管理 (nullなら新規追加モード)
  const [editingId, setEditingId] = useState<string | null>(null);

  // ドラッグ＆ドロップ用の参照
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // 起動時にデータを読み込む
  useEffect(() => {
    chrome.storage.local.get(['forms', 'profile'], (result) => {
      const data = result as unknown as StorageData;
      if (data.forms) setForms(data.forms);
      if (data.profile) setProfile(data.profile);
    });
  }, []);

  // メッセージ表示ヘルパー
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  // プロフィールの保存
  const saveProfile = () => {
    if (!inputName.trim()) return;
    const newProfile: UserProfile = { name: inputName };
    chrome.storage.local.set({ profile: newProfile }, () => {
      setProfile(newProfile);
      setInputName('');
      showMessage('名前を保存しました');
    });
  };

  // プロフィールの削除
  const deleteProfile = () => {
    chrome.storage.local.remove('profile', () => {
      setProfile(null);
      showMessage('名前を削除しました');
    });
  };

  // フォームリストの保存共通処理
  const saveForms = (updatedForms: SavedForm[]) => {
    chrome.storage.local.set({ forms: updatedForms }, () => {
      setForms(updatedForms);
    });
  };

  // フォームの追加 または 更新処理
  const handleFormSubmit = () => {
    if (!newFormName || !newFormUrl) {
      showMessage('名称とURLは必須です');
      return;
    }

    // URLからID部分を簡易抽出
    let extractedId = newFormUrl;
    const match = newFormUrl.match(/\/d\/e\/([^/]+)\//);
    if (match && match[1]) extractedId = match[1];

    if (editingId) {
      // --- 更新モード ---
      const updatedForms = forms.map(f => {
        if (f.id === editingId) {
          return {
            ...f,
            urlId: extractedId,
            displayName: newFormName,
            targetIndex: Number(newFormIndex),
            autoCheckEmail: newFormAutoCheck
          };
        }
        return f;
      });
      saveForms(updatedForms);
      showMessage('設定を更新しました');
      cancelEditing();
    } else {
      // --- 新規追加モード ---
      const newForm: SavedForm = {
        id: crypto.randomUUID(),
        urlId: extractedId,
        displayName: newFormName,
        targetIndex: Number(newFormIndex),
        autoCheckEmail: newFormAutoCheck
      };
      const updatedForms = [...forms, newForm];
      saveForms(updatedForms);
      showMessage('リストに追加しました');
      
      // 入力をリセット
      setNewFormName('');
      setNewFormUrl('');
      setNewFormIndex(0);
    }
  };

  // 編集モードを開始する
  const startEditing = (form: SavedForm) => {
    setEditingId(form.id);
    setNewFormName(form.displayName);
    setNewFormUrl(`https://docs.google.com/forms/d/e/${form.urlId}/viewform`);
    setNewFormIndex(form.targetIndex);
    setNewFormAutoCheck(form.autoCheckEmail);
  };

  // 編集キャンセル
  const cancelEditing = () => {
    setEditingId(null);
    setNewFormName('');
    setNewFormUrl('');
    setNewFormIndex(0);
    setNewFormAutoCheck(true);
  };

  // フォーム削除
  const deleteForm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 親要素のクリック(編集開始)を防ぐ
    if (confirm('本当に削除しますか？')) {
      const updatedForms = forms.filter(f => f.id !== id);
      saveForms(updatedForms);
      if (editingId === id) cancelEditing();
    }
  };

  // --- ドラッグ＆ドロップ処理 ---
  const handleSort = () => {
    const _forms = [...forms];
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    // 要素を移動
    const draggedItemContent = _forms.splice(dragItem.current, 1)[0];
    _forms.splice(dragOverItem.current, 0, draggedItemContent);

    // 参照リセット
    dragItem.current = null;
    dragOverItem.current = null;

    saveForms(_forms);
  };

  // フォームを開いて実行
  const openAndRun = (form: SavedForm) => {
    if (!profile) {
      showMessage('まずは設定タブで名前を登録してください');
      return;
    }
    const fullUrl = `https://docs.google.com/forms/d/e/${form.urlId}/viewform`;
    chrome.tabs.create({ url: fullUrl, active: true });
  };

  // 別タブで開く
  const openInNewTab = () => {
    chrome.tabs.create({ url: 'index.html' });
  };

  return (
    <div className="w-full min-h-screen pb-8 transition-colors duration-300 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 overflow-hidden">
          <h1 className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate">
            N/S/R高 出席フォーム自動化
          </h1>
          <button 
            onClick={openInNewTab}
            title="別ウィンドウで開く"
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-500 transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="flex space-x-1 rounded-lg bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700">
          {(['dashboard', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded px-3 py-1 text-xs font-medium transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm transform scale-105' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'dashboard' ? '送信リスト' : '設定・編集'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {message && (
          <div className="mb-4 rounded bg-blue-100 dark:bg-blue-900/50 p-2 text-center text-xs text-blue-700 dark:text-blue-200 animate-fadeIn shadow-sm border border-blue-200 dark:border-blue-800">
            {message}
          </div>
        )}

        {/* --- ダッシュボード (実行画面) --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-3 animate-fadeIn">
            {!profile && (
              <div className="rounded border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 p-3 text-sm text-yellow-700 dark:text-yellow-200">
                ⚠️ 設定タブで「名前」を登録してください
              </div>
            )}
            
            {forms.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                リストが空です。<br/>設定タブから追加してください。
              </p>
            ) : (
              forms.map((form, index) => (
                <div 
                  key={form.id}
                  draggable
                  onDragStart={() => (dragItem.current = index)}
                  onDragEnter={() => (dragOverItem.current = index)}
                  onDragEnd={handleSort}
                  onDragOver={(e) => e.preventDefault()}
                  className="group relative flex items-center gap-2 cursor-grab active:cursor-grabbing"
                >
                  <div className="text-slate-300 dark:text-slate-600 pl-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  </div>

                  <button
                    onClick={() => openAndRun(form)}
                    disabled={!profile}
                    className="flex-1 flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md active:scale-[0.97] hover:-translate-y-0.5"
                  >
                    <div className="text-left overflow-hidden">
                      <div className="font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{form.displayName}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">ID: {form.urlId.substring(0, 8)}...</div>
                    </div>
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-600 dark:group-hover:text-blue-300">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </button>
                </div>
              ))
            )}
            {forms.length > 0 && (
              <p className="text-center text-[10px] text-slate-400 pt-2">項目をドラッグして並び替えできます</p>
            )}
          </div>
        )}

        {/* --- 設定画面 --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* プロフィール設定 */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">👤 送信する名前</h2>
              
              {profile ? (
                <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3 border border-slate-100 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{profile.name}</span>
                  <button 
                    onClick={deleteProfile}
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded transition-all active:scale-95"
                  >
                    削除
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="例: N高 S太郎"
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={saveProfile}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm hover:shadow"
                  >
                    保存
                  </button>
                </div>
              )}
            </div>

            {/* フォーム追加・編集エリア */}
            <div className={`rounded-xl border transition-colors duration-300 p-4 shadow-sm ${
              editingId 
                ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500' 
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {editingId ? '✏️ 以下の内容を編集・更新' : '📝 新しいフォームを追加'}
                </h2>
                {editingId && (
                  <button 
                    onClick={cancelEditing}
                    className="text-[10px] text-slate-500 hover:text-slate-700 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-300 transition-colors"
                  >
                    キャンセル
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">GoogleフォームのURL</label>
                  <input
                    type="text"
                    value={newFormUrl}
                    onChange={(e) => setNewFormUrl(e.target.value)}
                    placeholder="https://docs.google.com/..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">表示名 (自分がわかる名前)</label>
                  <input
                    type="text"
                    value={newFormName}
                    onChange={(e) => setNewFormName(e.target.value)}
                    placeholder="例: 1Q_プロNΒ"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">名前入力欄の位置 (0~)</label>
                    {/* ここでCSSクラスを追加してスピンボタンを非表示にしました */}
                    <input
                      type="number"
                      value={newFormIndex}
                      onChange={(e) => setNewFormIndex(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 transition-colors">
                      <input
                        type="checkbox"
                        checked={newFormAutoCheck}
                        onChange={(e) => setNewFormAutoCheck(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-300">メアド記録ON</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleFormSubmit}
                  className={`w-full rounded-lg py-3 text-xs font-bold text-white transition-all active:scale-[0.98] shadow hover:shadow-lg ${
                    editingId 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600'
                  }`}
                >
                  {editingId ? '更新して保存' : 'リストに追加'}
                </button>
              </div>

              {/* 登録済みリスト (クリックで編集) */}
              {forms.length > 0 && (
                <div className="mt-8 border-t border-slate-100 dark:border-slate-700 pt-4">
                  <p className="mb-2 text-xs text-slate-400">登録済み (クリックして編集)</p>
                  <ul className="space-y-1">
                    {forms.map(f => (
                      <li 
                        key={f.id} 
                        onClick={() => startEditing(f)}
                        className={`group flex items-center justify-between rounded p-2 cursor-pointer transition-colors border border-transparent ${
                          editingId === f.id 
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                           {editingId === f.id && <span className="text-[10px] text-blue-500">●</span>}
                           <span className={`truncate text-sm ${editingId === f.id ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                             {f.displayName}
                           </span>
                        </div>
                        <button 
                          onClick={(e) => deleteForm(f.id, e)}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="削除"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;