chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === 'closeTab' && sender.tab && sender.tab.id) {
    chrome.tabs.remove(sender.tab.id);
  }
});

export {}