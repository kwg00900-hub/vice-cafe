// =============================================
// script.js - 바이브 카페 주문 앱 기능 파일
// =============================================
// 이 파일은 주문서의 모든 '동작'을 담당합니다.
// 금액 계산, 유효성 검사, 주문 확인 메시지,
// 탭 전환, 주문 내역 관리, Supabase 저장 등을 처리합니다.
// =============================================


// ─────────────────────────────────────────────
// 0. Supabase 연결 설정
// ─────────────────────────────────────────────
// Supabase: 온라인 데이터베이스 서비스입니다.
// 주문 데이터를 인터넷 서버에 저장할 수 있습니다.

// SUPABASE_URL : Supabase 프로젝트 주소 (대시보드 → Project Settings → API에서 복사)
const SUPABASE_URL = 'https://jsjxzvnexjbzdjwfbbod.supabase.co';

// SUPABASE_KEY : 공개 API 키 (대시보드 → Project Settings → API → anon public에서 복사)
// 주의: 이 키는 공개되어도 되는 anon 키입니다. secret 키는 절대 여기에 넣지 마세요!
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzanh6dm5leGpiemRqd2ZiYm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MTU2OTIsImV4cCI6MjEwNjk5MTY5Mn0.msHkgxkUlkKrI7TXqGsFQV_TBrv0Wg87TQ9bPeZEzyc';

// supabase.createClient() : Supabase 서버와 통신할 클라이언트 객체를 만듭니다.
// index.html에서 CDN으로 불러온 supabase 라이브러리를 사용합니다.
// window.supabase : CDN 로드 시 전역 객체로 등록됩니다.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);



// ─────────────────────────────────────────────
// 1. HTML 요소 가져오기 (DOM 요소 참조)
// ─────────────────────────────────────────────
// document.getElementById('아이디') : HTML에서 해당 id를 가진 요소를 찾아옵니다.
// 이렇게 변수에 담아두면 나중에 반복해서 쓸 때 편리합니다.

// 폼 전체
const orderForm = document.getElementById('order-form');

// 입력 요소들
const drinkSelect   = document.getElementById('drink-select');    // 음료 드롭다운
const quantityInput = document.getElementById('quantity');        // 수량 입력칸
const nameInput     = document.getElementById('customer-name');   // 이름 입력칸
const phoneInput    = document.getElementById('customer-phone');  // 전화번호 입력칸
const requestInput  = document.getElementById('request');         // 요청사항 입력칸

// 금액 표시 영역
const totalPriceEl = document.getElementById('total-price'); // "예상 금액: XX원"에서 숫자 부분

// 주문 확인 메시지 영역
const orderConfirmation   = document.getElementById('order-confirmation');  // 확인 영역 전체
const confirmationMessage = document.getElementById('confirmation-message'); // 메시지 텍스트

// 오류 메시지 요소
const nameError = document.getElementById('name-error'); // 이름 미입력 오류 메시지

// 탭 관련 요소
const tabBtnOrder   = document.getElementById('tab-btn-order');   // "주문하기" 탭 버튼
const tabBtnHistory = document.getElementById('tab-btn-history'); // "주문 내역" 탭 버튼
const tabOrder      = document.getElementById('tab-order');       // 주문하기 탭 패널
const tabHistory    = document.getElementById('tab-history');     // 주문 내역 탭 패널

// 주문 내역 관련 요소
const ordersList    = document.getElementById('orders-list');     // 카드 목록이 그려지는 영역
const ordersSummary = document.getElementById('orders-summary');  // 합계 + 전체삭제 영역
const summaryText   = document.getElementById('summary-text');    // "총 주문 금액: XX원 (N건)"
const clearAllBtn   = document.getElementById('clear-all-btn');   // 내역 모두 지우기 버튼
const orderBadge    = document.getElementById('order-badge');     // 탭의 주문 건수 배지


// ─────────────────────────────────────────────
// 2. 주문 데이터 저장소
// ─────────────────────────────────────────────
// orders: 접수된 주문 객체들을 담는 배열입니다.
// 배열(Array)은 여러 데이터를 순서대로 담는 목록입니다.
let orders = [];

// orderCount: 주문 번호를 자동으로 증가시키기 위한 카운터입니다.
// 주문이 취소되어도 번호가 줄어들지 않게 별도로 관리합니다.
let orderCount = 0;


// ─────────────────────────────────────────────
// 3. 예상 금액 계산 함수 (calculateTotal)
// ─────────────────────────────────────────────
// 이 함수 하나에서 모든 금액 계산을 처리합니다.
// 음료, 사이즈, 추가 옵션, 수량을 읽어서 총합을 반환합니다.

function calculateTotal() {

  // ── 음료 가격 읽기 ──────────────────────────
  // 현재 선택된 <option> 요소를 가져옵니다.
  const selectedOption = drinkSelect.options[drinkSelect.selectedIndex];
  // dataset.price : <option data-price="3500"> 에서 "3500"을 읽습니다.
  // Number() : 문자열 "3500"을 숫자 3500으로 변환합니다.
  const drinkPrice = Number(selectedOption.dataset.price) || 0;

  // ── 사이즈 추가 금액 읽기 ───────────────────
  // input[name="size"]:checked : 선택된 라디오 버튼
  const checkedSize = document.querySelector('input[name="size"]:checked');
  const sizePrice   = checkedSize ? Number(checkedSize.dataset.price) : 0;

  // ── 추가 옵션 금액 합산 ─────────────────────
  // 체크된 모든 체크박스를 배열로 만들어 가격을 합산합니다.
  const checkedOptions = document.querySelectorAll('input[name="options"]:checked');
  const optionPrice = Array.from(checkedOptions).reduce(function(sum, el) {
    return sum + Number(el.dataset.price);
  }, 0);

  // ── 수량 읽기 ───────────────────────────────
  const quantity = Math.max(1, parseInt(quantityInput.value) || 1);

  // ── 최종 금액 계산 ──────────────────────────
  // (음료 가격 + 사이즈 추가금액 + 옵션 추가금액) × 수량
  const total = (drinkPrice + sizePrice + optionPrice) * quantity;

  return total;
}


// ─────────────────────────────────────────────
// 4. 화면의 예상 금액 텍스트를 업데이트하는 함수
// ─────────────────────────────────────────────

function updatePriceDisplay() {
  const total = calculateTotal();
  // toLocaleString() : 숫자에 천 단위 쉼표를 붙여줍니다. 예) 5000 → "5,000"
  totalPriceEl.textContent = total.toLocaleString();
}


// ─────────────────────────────────────────────
// 5. 이벤트 리스너 등록 (변경 감지)
// ─────────────────────────────────────────────
// 요소가 바뀔 때마다 updatePriceDisplay()를 자동으로 실행합니다.

drinkSelect.addEventListener('change', updatePriceDisplay);
quantityInput.addEventListener('input', updatePriceDisplay);

document.querySelectorAll('input[name="size"]').forEach(function(radio) {
  radio.addEventListener('change', updatePriceDisplay);
});

document.querySelectorAll('input[name="options"]').forEach(function(checkbox) {
  checkbox.addEventListener('change', updatePriceDisplay);
});


// ─────────────────────────────────────────────
// 6. 탭 전환 기능
// ─────────────────────────────────────────────
// switchTab(탭이름): 클릭한 탭을 활성화하고 나머지는 비활성화합니다.

function switchTab(tabName) {
  // tabName이 'order'이면 주문하기 탭을, 'history'이면 주문 내역 탭을 보여줍니다.

  if (tabName === 'order') {
    // ── 주문하기 탭 활성화 ──
    tabBtnOrder.classList.add('active');
    tabBtnOrder.setAttribute('aria-selected', 'true');
    tabOrder.classList.remove('hidden');

    // ── 주문 내역 탭 비활성화 ──
    tabBtnHistory.classList.remove('active');
    tabBtnHistory.setAttribute('aria-selected', 'false');
    tabHistory.classList.add('hidden');

  } else if (tabName === 'history') {
    // ── 주문 내역 탭 활성화 ──
    tabBtnHistory.classList.add('active');
    tabBtnHistory.setAttribute('aria-selected', 'true');
    tabHistory.classList.remove('hidden');

    // ── 주문하기 탭 비활성화 ──
    tabBtnOrder.classList.remove('active');
    tabBtnOrder.setAttribute('aria-selected', 'false');
    tabOrder.classList.add('hidden');
  }
}

// 탭 버튼 클릭 시 switchTab 호출
tabBtnOrder.addEventListener('click', function() {
  switchTab('order');
});

tabBtnHistory.addEventListener('click', function() {
  switchTab('history');
});


// ─────────────────────────────────────────────
// 7. 주문 내역 목록 그리기 함수 (renderOrders)
// ─────────────────────────────────────────────
// renderOrders(): orders 배열을 읽어서 화면에 카드를 그립니다.
// 주문 추가 · 취소 · 전체 삭제 후에 항상 이 함수를 호출합니다.

function renderOrders() {

  // orders 배열이 비어있으면 안내 문구를 표시합니다.
  if (orders.length === 0) {

    // innerHTML: HTML 태그를 포함한 문자열을 넣을 때 사용합니다.
    // 이 영역은 사용자 입력이 아니므로 innerHTML을 써도 안전합니다.
    ordersList.innerHTML =
      '<p class="empty-orders">아직 주문 내역이 없어요 ☕</p>';

    // 합계 영역 숨기기
    ordersSummary.classList.add('hidden');

    // 배지 숨기기
    orderBadge.classList.add('hidden');

    return; // 더 이상 실행하지 않고 함수를 종료합니다
  }

  // ── 주문 카드 목록 만들기 ────────────────────
  // orders 배열을 돌면서 각 주문을 카드 HTML로 만들어 화면에 표시합니다.

  // 목록 영역을 비웁니다 (이전에 그린 카드를 지웁니다)
  ordersList.innerHTML = '';

  // [...orders]: 배열을 복사한 뒤 reverse()로 최신 주문이 맨 위에 오게 뒤집습니다.
  // 원본 orders 배열은 건드리지 않습니다.
  const reversedOrders = [...orders].reverse();

  reversedOrders.forEach(function(order) {

    // ── 카드 요소 만들기 ────────────────────────
    // document.createElement('div') : 새로운 <div> 태그를 만듭니다.
    const card = document.createElement('div');
    card.className = 'order-card';

    // ── 1번 줄: 주문번호 · 이름 · 금액 ─────────
    const titleEl = document.createElement('p');
    titleEl.className = 'order-card-title';
    // textContent: 사용자가 입력한 텍스트를 안전하게 넣습니다 (XSS 방지).
    // innerHTML과 달리 태그를 해석하지 않아서 악성 코드가 실행되지 않습니다.
    titleEl.textContent =
      '#' + order.id + ' ' + order.name + '님  ·  ' +
      order.total.toLocaleString() + '원';

    // ── 2번 줄: 음료 · 사이즈 · 옵션 · 수량 ────
    const detailEl = document.createElement('p');
    detailEl.className = 'order-card-detail';

    // 옵션이 있을 때만 괄호 표시
    const optionText = order.options.length > 0
      ? ' (' + order.options.join(', ') + ')'
      : '';

    detailEl.textContent =
      order.drink + ' ' + order.size + '사이즈' + optionText +
      ' ' + order.quantity + '잔';

    // ── 3번 줄: 요청사항 · 주문 시간 ───────────
    const metaEl = document.createElement('p');
    metaEl.className = 'order-card-meta';

    // 요청사항이 있을 때만 표시합니다.
    let metaText = order.time; // 주문 시간은 항상 표시
    if (order.request) {
      // 요청사항이 있으면 앞에 붙입니다
      metaText = '📝 ' + order.request + '  ·  ' + order.time;
    }
    metaEl.textContent = metaText;

    // ── 취소 버튼 ────────────────────────────────
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'order-cancel-btn';
    cancelBtn.textContent = '취소';

    // 취소 버튼 클릭 이벤트: confirm으로 한 번 더 확인합니다
    cancelBtn.addEventListener('click', function() {
      // confirm() : 확인/취소 팝업을 띄웁니다. 확인을 누르면 true를 반환합니다.
      const confirmed = confirm(
        '#' + order.id + ' ' + order.name + '님의 주문을 취소할까요?'
      );

      if (confirmed) {
        // orders 배열에서 이 주문을 삭제합니다.
        // filter(): 조건을 만족하는 항목만 남긴 새 배열을 반환합니다.
        // order.id와 다른 주문들만 남기므로 = 이 주문을 제거합니다.
        orders = orders.filter(function(o) {
          return o.id !== order.id;
        });

        // 목록을 다시 그립니다
        renderOrders();
      }
    });

    // ── 카드에 요소들 조립 ───────────────────────
    // appendChild(): 부모 요소의 맨 마지막에 자식 요소를 추가합니다.
    card.appendChild(cancelBtn);
    card.appendChild(titleEl);
    card.appendChild(detailEl);
    card.appendChild(metaEl);

    // 완성된 카드를 목록에 추가합니다
    ordersList.appendChild(card);
  });


  // ── 합계 영역 업데이트 ──────────────────────
  // orders 배열의 모든 금액을 합산합니다.
  const grandTotal = orders.reduce(function(sum, o) {
    return sum + o.total;
  }, 0);

  // textContent로 안전하게 텍스트를 넣습니다
  summaryText.textContent =
    '총 주문 금액: ' + grandTotal.toLocaleString() + '원' +
    ' (' + orders.length + '건)';

  // 합계 영역 표시
  ordersSummary.classList.remove('hidden');


  // ── 배지 업데이트 ───────────────────────────
  // 배지에 주문 건수를 표시하고 숨김 해제합니다.
  orderBadge.textContent = orders.length;
  orderBadge.classList.remove('hidden');
}


// ─────────────────────────────────────────────
// 8. 주문하기 버튼 클릭 처리 (폼 제출 + Supabase 저장)
// ─────────────────────────────────────────────
// async function: 이 함수 안에서 await를 사용할 수 있습니다.
// await: 시간이 걸리는 작업(예: 서버 통신)이 끝날 때까지 기다립니다.

orderForm.addEventListener('submit', async function(event) {

  // 폼의 기본 동작(페이지 새로고침)을 막습니다.
  event.preventDefault();

  // ── 유효성 검사: 이름 ────────────────────────
  const name = nameInput.value.trim();

  if (name === '') {
    nameError.classList.add('show');
    nameInput.classList.add('error');
    nameInput.focus();
    return;
  } else {
    nameError.classList.remove('show');
    nameInput.classList.remove('error');
  }

  // ── 유효성 검사: 음료 ────────────────────────
  if (drinkSelect.value === '') {
    alert('음료를 선택해주세요. ☕');
    drinkSelect.focus();
    return;
  }

  // ── 주문 내용 정리 ─────────────────────────

  // 음료 이름 (가격 부분 제거): "카페라떼 4,000원" → "카페라떼"
  const selectedOptionEl = drinkSelect.options[drinkSelect.selectedIndex];
  const drinkName  = selectedOptionEl.text.split(' ')[0];

  // 음료 단가: data-price 속성에서 읽습니다 (Supabase에 저장할 때 사용)
  const drinkPrice = Number(selectedOptionEl.dataset.price) || 0;

  // 선택된 사이즈
  const selectedSize = document.querySelector('input[name="size"]:checked').value;

  // 선택된 추가 옵션 이름 배열
  const selectedOptions = Array.from(
    document.querySelectorAll('input[name="options"]:checked')
  );
  const optionNames = selectedOptions.map(function(checkbox) {
    const label = document.querySelector('label[for="' + checkbox.id + '"]');
    return label.textContent.trim().split(' (+')[0];
  });

  // 수량
  const quantity = Math.max(1, parseInt(quantityInput.value) || 1);

  // 요청사항 (앞뒤 공백 제거)
  const request = requestInput.value.trim();

  // 전화번호
  const phone = phoneInput.value.trim();

  // 총 금액
  const total = calculateTotal();


  // ── 버튼 비활성화 (저장 중 두 번 클릭 방지) ──
  // Supabase에 데이터를 보내는 동안 버튼을 잠급니다.
  // disabled: 버튼을 클릭할 수 없게 만드는 속성입니다.
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = '저장 중...'; // 사용자에게 진행 중임을 알립니다


  // ── Supabase에 주문 데이터 저장 ──────────────
  // supabaseClient.from('테이블명') : 어느 테이블에 저장할지 지정합니다.
  // .insert({...})                  : 새 행(row)을 추가합니다.
  // await                           : 저장이 완료될 때까지 기다립니다.
  // { data, error }                 : 결과를 data(성공 데이터)와 error(오류)로 받습니다.
  const { data, error } = await supabaseClient
    .from('cafe_menu03')        // 테이블 이름
    .insert({
      customer_name: name,      // 손님 이름
      phone:         phone,     // 전화번호 (없으면 빈 문자열)
      drink:         drinkName, // 음료 이름
      drink_price:   drinkPrice, // 음료 단가 (원)
      size:          selectedSize, // 사이즈 S/M/L
      options:       optionNames,  // 추가 옵션 배열 (Supabase에서 text[] 타입으로 저장됨)
      quantity:      quantity,     // 수량
      request:       request,      // 요청사항 (없으면 빈 문자열)
      total_price:   total         // 최종 결제 금액 (원)
    });


  // ── 저장 결과 처리 ───────────────────────────

  if (error) {
    // ❌ 저장 실패: 오류 처리
    // console.error: 개발자 도구(F12) → Console 탭에서 자세한 오류를 볼 수 있습니다.
    console.error('Supabase 저장 오류:', error);

    // 사용자에게 실패를 알립니다
    alert('주문 저장에 실패했어요. 잠시 후 다시 시도해 주세요. 😢');

    // 버튼을 다시 활성화합니다 (재시도할 수 있도록)
    submitBtn.disabled = false;
    submitBtn.textContent = '주문하기';

    return; // 아래 성공 처리 코드는 실행하지 않습니다
  }

  // ✅ 저장 성공: 이후 처리
  // 버튼 상태를 원래대로 되돌립니다
  submitBtn.disabled = false;
  submitBtn.textContent = '주문하기';


  // ── 주문 시간 기록 ──────────────────────────
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // ── 주문 번호 증가 ──────────────────────────
  orderCount++;

  // ── orders 배열에 저장 (화면 내역용) ──────────
  orders.push({
    id:       orderCount,
    name:     name,
    drink:    drinkName,
    size:     selectedSize,
    options:  optionNames,
    quantity: quantity,
    request:  request,
    total:    total,
    time:     timeStr
  });

  // ── 주문 내역 목록 다시 그리기 ──────────────
  renderOrders();

  // ── 주문 확인 메시지 만들기 (안전한 방법) ──────
  // 문제: innerHTML에 name 같은 사용자 입력을 직접 이어붙이면
  //       "<b>악성코드</b>" 같은 글자가 HTML 태그로 해석됩니다 (XSS 취약점).
  // 해결: 각 조각을 textContent로 안전하게 넣습니다.

  confirmationMessage.textContent = '';

  // 안전한 <strong> 태그를 만드는 헬퍼 함수
  function makeStrong(text) {
    const el = document.createElement('strong');
    el.textContent = text;
    return el;
  }

  // 일반 텍스트 노드를 만드는 헬퍼 함수
  function makeText(text) {
    return document.createTextNode(text);
  }

  const optionTextForMsg = optionNames.length > 0
    ? ' (' + optionNames.join(', ') + ')'
    : '';

  confirmationMessage.appendChild(makeStrong(name + '님'));
  confirmationMessage.appendChild(makeText(', '));
  confirmationMessage.appendChild(makeStrong(drinkName));
  confirmationMessage.appendChild(makeText(' '));
  confirmationMessage.appendChild(makeStrong(selectedSize + '사이즈'));

  if (optionTextForMsg) {
    confirmationMessage.appendChild(makeText(optionTextForMsg));
  }

  confirmationMessage.appendChild(makeText(' '));
  confirmationMessage.appendChild(makeStrong(quantity + '잔'));
  confirmationMessage.appendChild(makeText(', 총 '));
  confirmationMessage.appendChild(makeStrong(total.toLocaleString() + '원'));
  confirmationMessage.appendChild(makeText(' 주문이 접수되었습니다! 🎉'));

  orderConfirmation.classList.remove('hidden');

  // 확인 메시지로 부드럽게 스크롤
  orderConfirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // 폼 숨기기 (중복 제출 방지)
  orderForm.classList.add('hidden');
});


// ─────────────────────────────────────────────
// 9. 다시 작성 버튼 처리 (주문서만 초기화)
// ─────────────────────────────────────────────
// 주문 내역(orders 배열)은 건드리지 않습니다!

document.getElementById('reset-btn').addEventListener('click', function() {

  setTimeout(function() {

    // M 사이즈 기본 선택 복원
    document.getElementById('size-m').checked = true;

    // 수량을 1로 복원
    quantityInput.value = 1;

    // 오류 표시 초기화
    nameError.classList.remove('show');
    nameInput.classList.remove('error');

    // 주문 확인 메시지 숨기기
    orderConfirmation.classList.add('hidden');

    // 폼 다시 보이기
    orderForm.classList.remove('hidden');

    // 예상 금액 0원으로 초기화
    updatePriceDisplay();

    // 페이지 맨 위로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });

  }, 0);
});


// ─────────────────────────────────────────────
// 10. 내역 모두 지우기 버튼
// ─────────────────────────────────────────────

clearAllBtn.addEventListener('click', function() {

  // 주문이 없으면 아무것도 하지 않습니다 (혹시 모를 경우 대비)
  if (orders.length === 0) return;

  // confirm(): 정말 삭제할지 한 번 더 확인합니다.
  const confirmed = confirm(
    '주문 내역 ' + orders.length + '건을 모두 삭제할까요?'
  );

  if (confirmed) {
    // orders 배열을 빈 배열로 초기화합니다.
    orders = [];

    // 목록을 다시 그립니다 (비어있으므로 안내 문구가 표시됩니다)
    renderOrders();
  }
});


// ─────────────────────────────────────────────
// 11. 이름 입력 시 오류 메시지 실시간 제거
// ─────────────────────────────────────────────

nameInput.addEventListener('input', function() {
  if (nameInput.value.trim() !== '') {
    nameError.classList.remove('show');
    nameInput.classList.remove('error');
  }
});


// ─────────────────────────────────────────────
// 12. 페이지 처음 열릴 때 초기화
// ─────────────────────────────────────────────
// 페이지가 로드되면 아래 두 함수를 즉시 실행합니다.

// 예상 금액 초기 표시 (음료 미선택이므로 0원)
updatePriceDisplay();

// 주문 내역 초기 표시 (비어있으므로 안내 문구 표시)
renderOrders();
