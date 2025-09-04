document.addEventListener('DOMContentLoaded', function() {
  // 기준 날짜와 그날의 순서 (1등부터 4등 순)
  const baseDate = new Date('2025-09-04');
  const baseOrder = ['4반', '1반', '2반', '3반'];
  const classes = ['1반', '2반', '3반', '4반'];

  // 오늘 날짜와 기준 날짜의 차이(일)를 계산
  const today = new Date();
  // UTC 기준으로 날짜 차이를 계산하여 일광 절약 시간제 등의 영향을 받지 않도록 함
  const diffTime = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 날짜 차이만큼 순서를 회전
  let todaysOrder = [...baseOrder];
  for (let i = 0; i < diffDays; i++) {
    // 가장 마지막 순서를 맨 앞으로 가져옴
    todaysOrder.unshift(todaysOrder.pop());
  }

  // 각 반(li)에 클릭 이벤트 리스너 추가
  const classElements = document.querySelectorAll('#classList li');
  classElements.forEach(elem => {
    elem.addEventListener('click', function() {
      const selectedClass = this.getAttribute('data-class');
      const rank = todaysOrder.indexOf(selectedClass) + 1;
      
      const resultElement = document.getElementById('result');
      if (rank) {
        resultElement.textContent = `${selectedClass}은 오늘 ${rank}번째 입니다.`;
      } else {
        resultElement.textContent = `순서 정보를 찾을 수 없습니다.`;
      }
    });
  });
});
