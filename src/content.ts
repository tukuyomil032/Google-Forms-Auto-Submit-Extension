import { type SavedForm, type StorageData } from './interface';

window.addEventListener('load', () => {
  if (window.location.href.includes('formResponse')) {
    requestCloseTab();
    return;
  }

  setTimeout(main, 1500);
});

async function main() {
  const url = window.location.href;

  if (!url.includes('viewform')) return;

  chrome.storage.local.get(['forms', 'profile'], (result) => {
    const data = result as Partial<StorageData>;
    const forms = data.forms || [];
    const profile = data.profile;

    if (!profile || !profile.name) {
      console.log('Autofill: プロフィール(名前)が設定されていないためスキップします');
      return;
    }

    const targetForm = forms.find((f) => url.includes(f.urlId));

    if (targetForm) {
      console.log(`Autofill: 設定「${targetForm.displayName}」が見つかりました。実行します。`);
      executeAutoFill(targetForm, profile.name);
    }
  });
}

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

function handleEmailCheckbox() {
  const checkboxes = document.querySelectorAll('div[role="checkbox"]');
  checkboxes.forEach((cb) => {
    const el = cb as HTMLElement;
    const container = el.closest('label') || el.parentElement || el;
    const textContent = (container.textContent || '').replace(/\s/g, '');

    if (textContent.includes('メールアドレス') && textContent.includes('記録')) {
      if (el.getAttribute('aria-checked') !== 'true') {
        console.log('Autofill: メールアドレス記録チェックボックスをONにします');
        el.click();
      }
    }
  });
}

function executeAutoFill(formConfig: SavedForm, userName: string) {
  if (formConfig.autoCheckEmail) {
    handleEmailCheckbox();
  }

  setTimeout(() => {
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    if (textInputs[formConfig.targetIndex]) {
      console.log(`Autofill: ${formConfig.targetIndex}番目の入力欄に名前を入力します`);
      setNativeValue(textInputs[formConfig.targetIndex] as HTMLInputElement, userName);
    } else {
      console.warn('Autofill: 指定されたインデックスの入力欄が見つかりませんでした');
    }
  }, 500);

  setTimeout(() => {
    clickSubmitButtonRecursive();
  }, 1000);
}

function clickSubmitButtonRecursive(attempt = 1) {
  if (window.location.href.includes('formResponse')) {
    requestCloseTab();
    return;
  }

  if (attempt > 10) {
    console.log('Autofill: タイムアウト - 送信ボタンが見つかりませんでした');
    return;
  }

  const candidates = Array.from(document.querySelectorAll('div[role="button"], button, span'));

  const submitBtn = candidates.find(el => {
    const text = (el.textContent || '').replace(/\s+/g, '');
    return text === '送信' || text === 'Submit';
  });

  if (submitBtn) {
    const clickable = submitBtn.closest('div[role="button"], button') as HTMLElement || submitBtn as HTMLElement;

    console.log('Autofill: 送信ボタンを発見。クリック処理を実行します。');

    clickable.style.border = '4px solid red';

    const rect = clickable.getBoundingClientRect();
    const x = rect.left + (rect.width / 2);
    const y = rect.top + (rect.height / 2);

    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y
    };

    clickable.dispatchEvent(new MouseEvent('mousedown', eventOptions));
    clickable.dispatchEvent(new MouseEvent('mouseup', eventOptions));
    clickable.dispatchEvent(new MouseEvent('click', eventOptions));

    monitorSubmission();

  } else {
    console.log(`Autofill: 送信ボタン探索中...(${attempt}/10)`);
    setTimeout(() => clickSubmitButtonRecursive(attempt + 1), 1000);
  }
}

function monitorSubmission() {
  console.log('Autofill: 送信完了を監視します...');

  let checks = 0;
  const interval = setInterval(() => {
    checks++;
    if (window.location.href.includes('formResponse')) {
      clearInterval(interval);
      console.log('Autofill: 送信完了を確認しました。タブを閉じます。');
      requestCloseTab();
    } else if (checks > 20) {
      clearInterval(interval);
      console.log('Autofill: 送信完了を確認できませんでした（タイムアウト）');
    }
  }, 1000);
}

function requestCloseTab() {
  try {
    chrome.runtime.sendMessage({ action: 'closeTab' });
  } catch (e) {
    console.error('Autofill: タブを閉じるメッセージの送信に失敗しました', e);
  }
}

export {}