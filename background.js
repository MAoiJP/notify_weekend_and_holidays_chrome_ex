const CALENDAR_ID = "ja.japanese%23holiday%40group.v.calendar.google.com";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function getAuthToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });
}

async function fetchHolidayToday() {
  const token = await getAuthToken(false);

  const today = new Date();
  const timeMin = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const timeMax = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events` +
    `?timeMin=${encodeURIComponent(timeMin)}` +
    `&timeMax=${encodeURIComponent(timeMax)}` +
    `&singleEvents=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();

  if (data.items && data.items.length > 0) {
    return data.items[0].summary;
  }
  return null;
}

function isWeekend(dayIndex) {
  return dayIndex === 0 || dayIndex === 6;
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title,
    message,
  });
}

async function checkAndNotify() {
  const today = getTodayString();

  const { lastNotifiedDate } = await chrome.storage.local.get("lastNotifiedDate");
  if (lastNotifiedDate === today) return;

  const dayIndex = new Date().getDay();
  const weekend = isWeekend(dayIndex);
  let holidayName = null;

  try {
    holidayName = await fetchHolidayToday();
  } catch (e) {
    console.error("祝日の取得に失敗しました:", e);
  }

  if (weekend || holidayName) {
    const dayLabel = ["日", "月", "火", "水", "木", "金", "土"][dayIndex];
    let title = "今日はお休みです 🎉";
    let message = "";

    if (holidayName) {
      message = `${holidayName}（${dayLabel}曜日）です。ゆっくりお過ごしください！`;
    } else if (dayIndex === 6) {
      message = "土曜日です。週末をお楽しみください！";
    } else {
      message = "日曜日です。明日からまた頑張りましょう！";
    }

    showNotification(title, message);
    await chrome.storage.local.set({ lastNotifiedDate: today });
  }
}

chrome.runtime.onStartup.addListener(() => {
  checkAndNotify();
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    try {
      await getAuthToken(true);
    } catch (e) {
      console.error("初回認証に失敗しました:", e);
    }
  }
  checkAndNotify();
});
