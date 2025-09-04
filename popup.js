document.addEventListener('DOMContentLoaded', function () {
  // --- DOM Elements ---
  const monthYearElement = document.getElementById('monthYear');
  const calendarElement = document.getElementById('calendar');
  const prevMonthButton = document.getElementById('prevMonth');
  const nextMonthButton = document.getElementById('nextMonth');
  const classListElements = document.querySelectorAll('#classList li');
  const rankResultElement = document.getElementById('rankResult');

  // --- State and Constants ---
  let displayDate = new Date();
  const holidaysCache = {};
  const baseDate = new Date('2025-09-04T00:00:00');
  const baseOrder = ['2반', '3반', '4반', '1반'];

  // --- Helper Functions ---
  function toYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // --- Core Logic ---

  // Fetches and caches holidays for a given year
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

  // Checks if a date is a weekend (Saturday or Sunday)
  function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  // Calculates the number of working days between two dates
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

  // Gets the lunch order for a specific date
  async function getOrderForDate(date) {
    const workingDaysPassed = await calculateWorkingDays(baseDate, date);
    const rotation = (workingDaysPassed > 0 ? workingDaysPassed - 1 : 0) % baseOrder.length;

    let newOrder = [...baseOrder];
    for (let i = 0; i < rotation; i++) {
      newOrder.unshift(newOrder.pop());
    }
    return newOrder;
  }

  // --- UI Rendering ---

  // Renders the main calendar view
  async function renderCalendar() {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    monthYearElement.textContent = `${year}년 ${month + 1}월`;
    calendarElement.innerHTML = '';

    const holidays = await fetchHolidays(year);
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    daysOfWeek.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'grid-cell day-header';
      dayHeader.textContent = day;
      if (day === '일') dayHeader.classList.add('weekend');
      calendarElement.appendChild(dayHeader);
    });

    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    for (let i = 0; i < startDayOfWeek; i++) {
      calendarElement.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayCell = document.createElement('div');
      const dayDate = new Date(year, month, i);
      const dateString = toYYYYMMDD(dayDate);

      dayCell.className = 'grid-cell day-cell';
      dayCell.innerHTML = `<span class="day-number">${i}</span>`;

      if (isWeekend(dayDate)) dayCell.classList.add('weekend');
      if (holidays.includes(dateString)) dayCell.classList.add('holiday');
      if (toYYYYMMDD(dayDate) === toYYYYMMDD(new Date())) dayCell.classList.add('today');

      if (!isWeekend(dayDate) && !holidays.includes(dateString) && dayDate >= baseDate) {
        const order = await getOrderForDate(dayDate);
        const firstPlaceTeam = order[0];
        dayCell.innerHTML += `<span class="team-name">${firstPlaceTeam}</span>`;
      }
      calendarElement.appendChild(dayCell);
    }
  }

  // Updates the rank display for the selected class
  async function updateRankDisplay(selectedClass) {
    const today = new Date();
    const todaysOrder = await getOrderForDate(today);
    const rank = todaysOrder.indexOf(selectedClass) + 1;

    if (rank && todaysOrder.length > 0) {
      let emoji = '';
      // 등수에 따라 다른 이모티콘을 설정합니다. 원하는 이모티콘으로 변경하세요.
      switch (rank) {
        case 1:
          emoji = '😋'; // 1등 이모티콘
          break;
        case 2:
          emoji = '😚'; // 2등 이모티콘
          break;
        case 3:
          emoji = '😭'; // 3등 이모티콘
          break;
        case 4:
          emoji = '😵'; // 4등 이모티콘
          break;
      }
      rankResultElement.textContent = `${emoji} ${selectedClass}은 오늘 ${rank}번째 입니다.`;
    } else {
      rankResultElement.textContent = '오늘은 점심 순서가 없습니다.';
    }
  }

  // --- Event Listeners ---
  prevMonthButton.addEventListener('click', () => {
    displayDate.setMonth(displayDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthButton.addEventListener('click', () => {
    displayDate.setMonth(displayDate.getMonth() + 1);
    renderCalendar();
  });

  classListElements.forEach(elem => {
    elem.addEventListener('click', function () {
      const selectedClass = this.getAttribute('data-class');
      updateRankDisplay(selectedClass);
    });
  });

  // --- Initial Load ---
  renderCalendar();
  rankResultElement.textContent = '반을 선택하여 오늘 순위를 확인하세요.';
});
