// --- Constants and State ---
const baseDate = new Date('2025-09-04T00:00:00');
const baseOrder = ['2반', '3반', '4반', '1반'];
const holidaysCache = {};

// --- Helper Functions (copied from popup.js) ---
function toYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function fetchHolidays(year) {
  if (holidaysCache[year]) return holidaysCache[year];
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`);
    if (!response.ok) return [];
    const holidays = await response.json();
    const holidayDates = holidays.map(h => h.date);
    holidaysCache[year] = holidayDates;
    return holidayDates;
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return [];
  }
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

async function calculateWorkingDays(start, end) {
  if (end < start) return 0;
  let count = 0;
  let currentDate = new Date(start);
  const holidays = await fetchHolidays(end.getFullYear());
  if (start.getFullYear() !== end.getFullYear()) {
      const prevYearHolidays = await fetchHolidays(start.getFullYear());
      holidays.push(...prevYearHolidays);
  }
  while (currentDate <= end) {
    const dateString = toYYYYMMDD(currentDate);
    if (!isWeekend(currentDate) && !holidays.includes(dateString)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
}

async function getOrderForDate(date) {
  const workingDaysPassed = await calculateWorkingDays(baseDate, date);
  const rotation = (workingDaysPassed > 0 ? workingDaysPassed - 1 : 0) % baseOrder.length;
  let newOrder = [...baseOrder];
  for (let i = 0; i < rotation; i++) {
      newOrder.push(newOrder.shift());
  }
  return newOrder;
}

// --- Badge Logic ---
async function updateBadge() {
  const today = new Date();
  const order = await getOrderForDate(today);
  const firstPlace = order[0] || '';

  // To save space, show the number only (e.g., "2" instead of "2반")
  const badgeText = firstPlace.replace('반', '');

  chrome.action.setBadgeText({
    text: badgeText
  });
  chrome.action.setBadgeBackgroundColor({
    color: '#4CAF50' // Green color
  });
}

// --- Event Listeners ---

// Run when the extension is first installed, or updated.
chrome.runtime.onInstalled.addListener(() => {
  console.log("Lunch order extension installed.");
  updateBadge();
  // Create an alarm to update the badge once a day.
  chrome.alarms.create('dailyBadgeUpdate', {
    delayInMinutes: 1, // Start after 1 minute
    periodInMinutes: 1440 // Repeat every 24 hours
  });
});

// Run when the browser is started.
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started.");
  updateBadge();
});

// Run when the daily alarm fires.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyBadgeUpdate') {
    console.log("Daily alarm fired.");
    updateBadge();
  }
});
