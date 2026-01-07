import { type SavedForm, type StorageData } from './interface';

let autoSubmitted = false;

window.addEventListener('load', () => {
  if (window.location.href.includes('formResponse')) {
    if (autoSubmitted) {
      requestCloseTab();
      return;
    }
    return;
  }

  setTimeout(main, 1500);
});

async function main() {
  const url = window.location.href;

  if (!url.includes('viewform')) {
    return;
  }

  chrome.storage.local.get(['forms', 'profile'], (result) => {
    const data = result as Partial<StorageData>;
    const forms = data.forms || [];
    const profile = data.profile;

    if (!profile || !profile.name) {
      console.log('Autofill: Profile (name) is not set; skipping');
      return;
    }

    const targetForm = forms.find((f) => url.includes(f.urlId));

    if (targetForm) {
      console.log(`Autofill: Configuration "${targetForm.displayName}" found. Executing.`);
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
        console.log('Autofill: Enabling save email address checkbox');

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
      console.log(`Autofill: Inputting name into field index ${formConfig.targetIndex}`);
      setNativeValue(textInputs[formConfig.targetIndex] as HTMLInputElement, userName);
    } else {
      console.warn('Autofill: Specified input index not found');
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
    console.log('Autofill: Timeout - submit button not found');
    return;
  }

  const candidates = Array.from(document.querySelectorAll('div[role="button"], button, span'));

  const submitBtn = candidates.find(el => {
    const text = (el.textContent || '').replace(/\s+/g, '');
    return text === '送信' || text === 'Submit';
  });

  if (submitBtn) {
    const clickable = submitBtn.closest('div[role="button"], button') as HTMLElement || submitBtn as HTMLElement;

    console.log('Autofill: Submit button found. Performing click.');
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

    autoSubmitted = true;
    clickable.dispatchEvent(new MouseEvent('mousedown', eventOptions));
    clickable.dispatchEvent(new MouseEvent('mouseup', eventOptions));
    clickable.dispatchEvent(new MouseEvent('click', eventOptions));

    monitorSubmission();

  } else {
    console.log(`Autofill: Searching for submit button...(${attempt}/10)`);
    setTimeout(() => clickSubmitButtonRecursive(attempt + 1), 1000);
  }
}

function monitorSubmission() {
  console.log('Autofill: Monitoring for submission completion...');

  let checks = 0;
  const interval = setInterval(() => {
    checks++;
    if (window.location.href.includes('formResponse')) {
      clearInterval(interval);
      console.log('Autofill: Submission confirmed. Closing tab.');
      requestCloseTab();
    } else if (checks > 20) {
      clearInterval(interval);
      console.log('Autofill: Could not confirm submission (timeout)');
    }
  }, 1000);
}

function requestCloseTab() {
  if (!autoSubmitted) {
    return;
  }

  try {
    chrome.runtime.sendMessage({ action: 'closeTab' }, () => {
      if (chrome.runtime.lastError) {
        console.warn('Autofill: Error sending message; attempting fallback', chrome.runtime.lastError);
        try {
          window.postMessage({ type: 'AUTOFILL_CLOSE_TAB_ATTEMPT' }, '*');
        } catch (err) {
          console.error('Autofill: Fallback postMessage failed', err);
        }
      }
    });
  } catch (e) {
      console.error('Autofill: Exception while sending close tab message', e);
    try {
      window.postMessage({ type: 'AUTOFILL_CLOSE_TAB_ATTEMPT' }, '*');
    } catch (err) {
      console.error('Autofill: Fallback postMessage failed (exception)', err);
    }
  }
}

export {}