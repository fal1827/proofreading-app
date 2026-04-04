// Webページ内のテキストを扱うためのコンテンツスクリプト
let lastFocusedElement = null;

// コンテキストメニューが開かれた際の要素を記録
document.addEventListener("contextmenu", (event) => {
  const el = event.target;
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable) {
    lastFocusedElement = el;
    // 拡張機能へ「編集可能な要素から開始された」ことを通知
    chrome.runtime.sendMessage({ type: "ELEMENT_IDENTIFIED", isEditable: true });
  } else {
    lastFocusedElement = null;
    chrome.runtime.sendMessage({ type: "ELEMENT_IDENTIFIED", isEditable: false });
  }
}, true);

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "REFLECT_TEXT" && lastFocusedElement) {
    if (lastFocusedElement.isContentEditable) {
      lastFocusedElement.innerText = request.text;
    } else {
      lastFocusedElement.value = request.text;
    }
    // 入力イベントを発火させて、Webサイト側のスクリプト（文字数カウント等）に通知
    lastFocusedElement.dispatchEvent(new Event('input', { bubbles: true }));
    sendResponse({ success: true });
  }
});

console.log("Proofreading App Content Script loaded.");
