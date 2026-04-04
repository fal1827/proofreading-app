// Chrome拡張機能のバックグラウンド処理
// サイドパネルの制御やコンテキストメニューの管理を行います。

// 状態管理（現在のタブが編集可能かどうか）
let editableTabs = new Map();

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openSidePanel",
    title: "選択したテキストを校閲する",
    contexts: ["selection"]
  });
});

// コンテンツスクリプトからの通知を受信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ELEMENT_IDENTIFIED" && sender.tab) {
    editableTabs.set(sender.tab.id, request.isEditable);
    // サイドパネルへ現在の状態を即時通知
    chrome.runtime.sendMessage({ type: "SYNC_EDITABLE_STATE", isEditable: request.isEditable }).catch(() => {});
  }
  
  // サイドパネルから「反映」リクエストが来た場合、対象タブへリレー
  if (request.type === "REFLECT_TEXT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, request);
      }
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openSidePanel") {
    chrome.sidePanel.open({ tabId: tab.id });
    
    const sendMessage = (attempt = 1) => {
      chrome.runtime.sendMessage({
        type: "PROOFREAD_TEXT",
        text: info.selectionText,
        isEditable: editableTabs.get(tab.id) || false
      }).catch(err => {
        if (attempt < 3) setTimeout(() => sendMessage(attempt + 1), 500);
      });
    };
    setTimeout(() => sendMessage(1), 500);
  }
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
