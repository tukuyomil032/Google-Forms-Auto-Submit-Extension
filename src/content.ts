import { type SavedForm, type StorageData } from './interface';

// ページ読み込み完了後に実行
window.addEventListener('load', () => {
  // 描画待ちのために少し遅延させる
  setTimeout(main, 1500);
});

async function main() {
  const url = window.location.href;
  
  // viewformが含まれていない場合は動作しない（編集画面などで誤爆しないように）
  if (!url.includes('viewform')) return;

  chrome.storage.local.get(['forms', 'profile'], (result) => {
    // データが空の場合でもエラーにならないよう安全にキャスト
    const data = result as Partial<StorageData>;
    const forms = data.forms || [];
    const profile = data.profile;

    if (!profile || !profile.name) {
      console.log('Autofill: プロフィール(名前)が設定されていないためスキップします');
      return;
    }

    // URLにIDが含まれている設定を探す
    const targetForm = forms.find((f) => url.includes(f.urlId));

    if (targetForm) {
      console.log(`Autofill: 設定「${targetForm.displayName}」が見つかりました。実行します。`);
      executeAutoFill(targetForm, profile.name);
    }
  });
}

// React/Angular入力ハック
const setNativeValue = (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
};

// メールチェックボックス処理
function handleEmailCheckbox() {
  // role="checkbox" を持つ要素をすべて取得
  const checkboxes = document.querySelectorAll('div[role="checkbox"]');
  checkboxes.forEach((cb) => {
    const el = cb as HTMLElement;
    // 親要素のテキストを含めて判定する
    const container = el.closest('label') || el.parentElement || el; 
    const textContent = (container.textContent || '').replace(/\s/g, ''); // 空白除去

    // "メールアドレス" かつ "記録" という言葉が含まれていれば対象
    if (textContent.includes('メールアドレス') && textContent.includes('記録')) {
      if (el.getAttribute('aria-checked') !== 'true') {
        console.log('Autofill: メールアドレス記録チェックボックスをONにします');
        el.click();
      }
    }
  });
}

function executeAutoFill(formConfig: SavedForm, userName: string) {
  // 1. メールチェック
  if (formConfig.autoCheckEmail) {
    handleEmailCheckbox();
  }

  // 2. 名前入力
  setTimeout(() => {
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    // 設定されたインデックスが存在するか確認してから入力
    if (textInputs[formConfig.targetIndex]) {
      console.log(`Autofill: ${formConfig.targetIndex}番目の入力欄に名前を入力します`);
      setNativeValue(textInputs[formConfig.targetIndex] as HTMLInputElement, userName);
    } else {
      console.warn('Autofill: 指定されたインデックスの入力欄が見つかりませんでした');
    }
  }, 500);

  // 3. 送信ボタンを押す
  // 入力が完了するのを少し待ってからボタンを探し始める
  setTimeout(() => {
    clickSubmitButtonRecursive();
  }, 1000);
}

// 送信ボタンを粘り強く探して押す関数
function clickSubmitButtonRecursive(attempt = 1) {
  if (attempt > 10) {
    console.log('Autofill: タイムアウト - 送信ボタンが見つかりませんでした');
    return;
  }

  // あらゆるボタン要素を取得
  const candidates = Array.from(document.querySelectorAll('div[role="button"], button, span'));
  
  const submitBtn = candidates.find(el => {
    // 空白や改行をすべて削除して判定する ("送　信"対策)
    const text = (el.textContent || '').replace(/\s+/g, '');
    return text === '送信' || text === 'Submit';
  });

  if (submitBtn) {
    // spanが見つかった場合、クリック可能な親要素(role=button)まで遡る
    const clickable = submitBtn.closest('div[role="button"], button') as HTMLElement || submitBtn as HTMLElement;
    
    console.log('Autofill: 送信ボタンを発見。クリック処理を実行します。');
    
    // 視覚的にわかるように赤枠をつける
    clickable.style.border = '4px solid red';

    // 座標付きの強力なクリックイベントを作成
    const rect = clickable.getBoundingClientRect();
    const x = rect.left + (rect.width / 2);
    const y = rect.top + (rect.height / 2);

    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x, // 座標を指定
      clientY: y
    };

    // マウスダウン -> マウスアップ -> クリック の順で発火
    clickable.dispatchEvent(new MouseEvent('mousedown', eventOptions));
    clickable.dispatchEvent(new MouseEvent('mouseup', eventOptions));
    clickable.dispatchEvent(new MouseEvent('click', eventOptions));

  } else {
    // 見つからない場合再試行
    console.log(`Autofill: 送信ボタン探索中...(${attempt}/10)`);
    setTimeout(() => clickSubmitButtonRecursive(attempt + 1), 1000);
  }
}

export {}