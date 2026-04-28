const STORAGE_KEY = "customNotification";

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    const custom = data[STORAGE_KEY];
    if (custom) {
      document.getElementById("title").value = custom.title ?? "";
      document.getElementById("message").value = custom.message ?? "";
    }
  });

  document.getElementById("save").addEventListener("click", () => {
    const title = document.getElementById("title").value;
    const message = document.getElementById("message").value;
    chrome.storage.local.set({ [STORAGE_KEY]: { title, message } }, () => {
      const feedback = document.getElementById("feedback");
      feedback.textContent = "保存しました";
      setTimeout(() => {
        feedback.textContent = "";
      }, 2000);
    });
  });
});
