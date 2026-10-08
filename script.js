// =============================================
// script.js - 바이브 카페 주문 앱 기능 파일
// =============================================
// 이 파일은 주문서의 모든 '동작'을 담당합니다.
// 금액 계산, 유효성 검사, 주문 확인 메시지,
// 탭 전환, 주문 내역 관리, Supabase 저장,
// 팝업 메뉴 선택 및 메뉴별 전용 옵션 처리를 포함합니다.
// =============================================


// ─────────────────────────────────────────────
// 0. Supabase 연결 설정
// ─────────────────────────────────────────────
const SUPABASE_URL = 'https://jsjxzvnexjbzdjwfbbod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzanh6dm5leGpiemRqd2ZiYm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MTU2OTIsImV4cCI6MjEwNjk5MTY5Mn0.msHkgxkUlkKrI7TXqGsFQV_TBrv0Wg87TQ9bPeZEzyc';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// ─────────────────────────────────────────────
// 1. 카페 메뉴 데이터베이스 (카테고리 & 전용 옵션)
// ─────────────────────────────────────────────
// 각 메뉴마다 고유 ID, 골든 이름, 실제 금값 수준의 럭셔리 가격, 아이콘, 카테고리, 24K 전용 옵션을 가집니다.
const MENU_ITEMS = [
  // ── ☕ 골든 커피 섹션 ──
  {
    id: 'americano',
    category: 'coffee',
    name: '골든 24K 아메리카노',
    price: 450000,
    icon: '👑',
    desc: '순도 99.9% 식용 금박이 흩날리는 황제 전용 에스프레소 (금 1돈 가치)',
    options: [
      { id: 'opt-shot', name: '골든 샷 추가', price: 45000 },
      { id: 'opt-decaf', name: '24K 디카페인 원두', price: 0 },
      { id: 'opt-gold-leaf', name: '순금박 1장 추가 토핑 ✨', price: 80000 }
    ]
  },
  {
    id: 'cafe-latte',
    category: 'coffee',
    name: '골든 로얄 카페라떼',
    price: 480000,
    icon: '🏆',
    desc: '부드러운 프리미엄 골든 밀크와 황금빛 크레마의 환상적인 조화',
    options: [
      { id: 'opt-shot', name: '골든 샷 추가', price: 45000 },
      { id: 'opt-decaf', name: '24K 디카페인 원두', price: 0 },
      { id: 'opt-vanilla-syrup', name: '황금 마다가스카르 바닐라빈 시럽', price: 30000 },
      { id: 'opt-gold-dust', name: '황금 가루 듬뿍 뿌리기 ✨', price: 60000 }
    ]
  },
  {
    id: 'cafe-mocha',
    category: 'coffee',
    name: '골든 스위스 카페모카',
    price: 510000,
    icon: '🍫',
    desc: '스위스 최고급 다크 초콜릿 위에 황금 돔과 금가루 휘핑크림',
    options: [
      { id: 'opt-shot', name: '골든 샷 추가', price: 45000 },
      { id: 'opt-decaf', name: '24K 디카페인 원두', price: 0 },
      { id: 'opt-cream', name: '황금빛 24K 휘핑크림', price: 50000 },
      { id: 'opt-gold-drizzle', name: '리얼 골드 시럽 드리즐', price: 40000 }
    ]
  },
  {
    id: 'vanilla-latte',
    category: 'coffee',
    name: '골든 임페리얼 바닐라라떼',
    price: 495000,
    icon: '✨',
    desc: '천연 버번 바닐라 향과 반짝이는 황금펄이 어우러진 시그니처',
    options: [
      { id: 'opt-shot', name: '골든 샷 추가', price: 45000 },
      { id: 'opt-decaf', name: '24K 디카페인 원두', price: 0 },
      { id: 'opt-gold-leaf', name: '식용 순금박 추가 토핑', price: 80000 }
    ]
  },
  {
    id: 'einspanner',
    category: 'coffee',
    name: '골든 슈프림 아인슈페너',
    price: 550000,
    icon: '🍨',
    desc: '진한 더치커피 위에 묵직하게 올라간 24K 수제 골든 크림',
    options: [
      { id: 'opt-decaf', name: '24K 디카페인 원두', price: 0 },
      { id: 'opt-extra-cream', name: '황금 수제 크림 더블 추가', price: 70000 }
    ]
  },

  // ── 🥛 골든 라떼 & 논커피 섹션 ──
  {
    id: 'green-tea-latte',
    category: 'non-coffee',
    name: '골든 제주 말차라떼',
    price: 470000,
    icon: '🍵',
    desc: '첫물 유기농 말차 찻잎에 24K 금가루가 아낌없이 뿌려진 명품 라떼',
    options: [
      { id: 'opt-shot', name: '골든 에스프레소 샷 추가', price: 45000 },
      { id: 'opt-cream', name: '황금 생크림 토핑', price: 50000 },
      { id: 'opt-gold-dust', name: '순금 분말 더블 업 ✨', price: 60000 }
    ]
  },
  {
    id: 'choco-latte',
    category: 'non-coffee',
    name: '골든 벨벳 초코라떼',
    price: 465000,
    icon: '🪙',
    desc: '카카오 85% 벨기에 초콜릿과 황금빛 금박이 녹아내리는 극상의 달콤함',
    options: [
      { id: 'opt-cream', name: '황금빛 휘핑크림', price: 50000 },
      { id: 'opt-gold-marshmallow', name: '금박 감싼 마시멜로 토핑', price: 50000 }
    ]
  },
  {
    id: 'milktea',
    category: 'non-coffee',
    name: '골든 로얄 얼그레이 밀크티',
    price: 490000,
    icon: '🧋',
    desc: '영국 황실 인증 홍차에 24K 황금 펄을 담은 귀족의 음료',
    options: [
      { id: 'opt-gold-pearl', name: '골든 타피오카 펄 추가 ✨', price: 55000 },
      { id: 'opt-gold-dust', name: '순금 파우더 토핑', price: 60000 }
    ]
  },

  // ── 🍧 골든 스무디 & 프라페 섹션 ──
  {
    id: 'strawberry-smoothie',
    category: 'smoothie',
    name: '골든 루비 딸기 요거트 스무디',
    price: 520000,
    icon: '🍓',
    desc: '설향 딸기와 생요거트에 흩뿌려진 반짝이는 순금 펄',
    options: [
      { id: 'opt-gold-pearl', name: '황금 타피오카 펄 추가', price: 55000 },
      { id: 'opt-gold-leaf', name: '24K 순금박 토핑 ✨', price: 80000 }
    ]
  },
  {
    id: 'mango-smoothie',
    category: 'smoothie',
    name: '골든 트로피칼 망고 스무디',
    price: 530000,
    icon: '🥭',
    desc: '애플망고의 샛노란 빛깔과 24K 순금이 만나 눈부신 황금빛 잔치',
    options: [
      { id: 'opt-gold-jelly', name: '황금 알로에 젤리 추가', price: 50000 },
      { id: 'opt-gold-dust', name: '순금 분말 추가 ✨', price: 60000 }
    ]
  },
  {
    id: 'java-chip-frappe',
    category: 'smoothie',
    name: '골든 블링 자바칩 프라페',
    price: 560000,
    icon: '🍪',
    desc: '초코칩과 함께 씹히는 24K 크리스탈 골드칩! 궁극의 럭셔리 프라페',
    options: [
      { id: 'opt-shot', name: '골든 샷 추가', price: 45000 },
      { id: 'opt-cream', name: '황금 휘핑크림 듬뿍', price: 50000 },
      { id: 'opt-gold-chip', name: '골든 크런치 칩 더블', price: 40000 }
    ]
  },

  // ── 🍋 골든 에이드 & 티 섹션 ──
  {
    id: 'grapefruit-ade',
    category: 'ade-tea',
    name: '골든 썬셋 자몽 에이드',
    price: 485000,
    icon: '🍊',
    desc: '프랑스산 탄산수에 붉은 자몽 과육과 눈부신 황금빛 탄산 버블',
    options: [
      { id: 'opt-gold-sparkling', name: '골든 탄산 초강력 업', price: 0 },
      { id: 'opt-gold-leaf', name: '순금박 1장 추가 ✨', price: 80000 }
    ]
  },
  {
    id: 'lemon-ade',
    category: 'ade-tea',
    name: '골든 오로라 블루레몬 에이드',
    price: 485000,
    icon: '🍋',
    desc: '빛을 비추면 영롱하게 반짝이는 금빛 은하수를 담은 레몬 에이드',
    options: [
      { id: 'opt-gold-jelly', name: '황금 젤리 추가', price: 50000 },
      { id: 'opt-gold-dust', name: '은하수 금가루 추가 ✨', price: 60000 }
    ]
  },
  {
    id: 'chamomile-tea',
    category: 'ade-tea',
    name: '골든 허니 캐모마일 티',
    price: 430000,
    icon: '🌼',
    desc: '마누카 골든 허니와 유기농 캐모마일에 24K 금박을 띄운 힐링 티',
    options: [
      { id: 'opt-honey', name: '최고급 골든 허니 추가', price: 30000 },
      { id: 'opt-gold-leaf', name: '순금박 추가 토핑 ✨', price: 80000 }
    ]
  }
];



// ─────────────────────────────────────────────
// 2. HTML 요소 가져오기 (DOM 참조)
// ─────────────────────────────────────────────
const orderForm        = document.getElementById('order-form');
const quantityInput    = document.getElementById('quantity');
const nameInput        = document.getElementById('customer-name');
const phoneInput       = document.getElementById('customer-phone');
const requestInput     = document.getElementById('request');

// 메뉴 선택 팝업 모달 관련 요소
const selectedMenuCard  = document.getElementById('selected-menu-card');
const selectedDrinkId   = document.getElementById('selected-drink-id');
const cardDrinkIcon     = document.getElementById('card-drink-icon');
const cardDrinkTitle    = document.getElementById('card-drink-title');
const cardDrinkDesc     = document.getElementById('card-drink-desc');
const menuOptionsList   = document.getElementById('menu-options-list');

const menuModal         = document.getElementById('menu-modal');
const modalBackdrop     = document.getElementById('modal-backdrop');
const modalCloseBtn     = document.getElementById('modal-close-btn');
const modalCancelBtn    = document.getElementById('modal-cancel-btn');
const menuModalBody     = document.getElementById('menu-modal-body');
const categoryTabs      = document.getElementById('menu-category-tabs');

// 금액 및 메시지
const totalPriceEl      = document.getElementById('total-price');
const orderConfirmation = document.getElementById('order-confirmation');
const confirmationMessage = document.getElementById('confirmation-message');
const nameError         = document.getElementById('name-error');

// 탭 관련
const tabBtnOrder   = document.getElementById('tab-btn-order');
const tabBtnHistory = document.getElementById('tab-btn-history');
const tabOrder      = document.getElementById('tab-order');
const tabHistory    = document.getElementById('tab-history');

// 주문 내역
const ordersList    = document.getElementById('orders-list');
const ordersSummary = document.getElementById('orders-summary');
const summaryText   = document.getElementById('summary-text');
const clearAllBtn   = document.getElementById('clear-all-btn');
const orderBadge    = document.getElementById('order-badge');


// ─────────────────────────────────────────────
// 3. 주문 데이터 저장소
// ─────────────────────────────────────────────
let orders = [];
let orderCount = 0;

// 현재 선택된 메뉴 객체 (null이면 미선택)
let currentSelectedMenu = null;


// ─────────────────────────────────────────────
// 4. 메뉴 선택 팝업 렌더링 및 모달 제어
// ─────────────────────────────────────────────

// 카테고리 한글 라벨 (골든 에디션)
const CATEGORY_NAMES = {
  'coffee': '👑 24K 골든 커피 (Golden Coffee)',
  'non-coffee': '🏆 골든 라떼 & 논커피 (Royal Latte)',
  'smoothie': '🍧 황금빛 스무디 & 프라페 (Gold Smoothie)',
  'ade-tea': '✨ 골든 오로라 에이드 & 티 (Golden Tea)'
};

// 팝업 모달 열기
function openMenuModal() {
  renderModalMenuGrid('all');
  menuModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
}

// 팝업 모달 닫기
function closeMenuModal() {
  menuModal.classList.add('hidden');
  document.body.style.overflow = '';
}

// 모달 내부에 메뉴 카드들을 카테고리별로 렌더링
function renderModalMenuGrid(filterCategory = 'all') {
  menuModalBody.innerHTML = '';

  const categories = filterCategory === 'all'
    ? ['coffee', 'non-coffee', 'smoothie', 'ade-tea']
    : [filterCategory];

  categories.forEach(catKey => {
    const items = MENU_ITEMS.filter(m => m.category === catKey);
    if (items.length === 0) return;

    // 섹션 래퍼
    const section = document.createElement('div');
    section.className = 'menu-section';

    // 섹션 타이틀
    const title = document.createElement('h3');
    title.className = 'menu-section-title';
    title.textContent = CATEGORY_NAMES[catKey];
    section.appendChild(title);

    // 그리드 컨테이너
    const grid = document.createElement('div');
    grid.className = 'menu-grid';

    items.forEach(item => {
      const itemCard = document.createElement('div');
      itemCard.className = 'popup-menu-item';
      if (currentSelectedMenu && currentSelectedMenu.id === item.id) {
        itemCard.classList.add('selected');
      }

      itemCard.innerHTML = `
        <span class="popup-item-icon">${item.icon}</span>
        <div class="popup-item-info">
          <strong class="popup-item-name">${item.name}</strong>
          <span class="popup-item-price">${item.price.toLocaleString()}원</span>
          <span class="popup-item-desc">${item.desc}</span>
        </div>
      `;

      // 메뉴 클릭 시 선택 처리
      itemCard.addEventListener('click', () => {
        selectMenu(item);
        closeMenuModal();
      });

      grid.appendChild(itemCard);
    });

    section.appendChild(grid);
    menuModalBody.appendChild(section);
  });
}

// 메뉴 선택 완료 처리
function selectMenu(item) {
  currentSelectedMenu = item;
  selectedDrinkId.value = item.id;

  // 트리거 카드 업데이트
  selectedMenuCard.classList.remove('empty');
  cardDrinkIcon.textContent = item.icon;
  cardDrinkTitle.textContent = `${item.name} (${item.price.toLocaleString()}원)`;
  cardDrinkDesc.textContent = item.desc;

  // 메뉴 전용 옵션 체크박스 동적 생성
  renderMenuOptions(item.options);

  // 금액 갱신
  updatePriceDisplay();
}

// 메뉴별 맞춤 옵션 목록 생성
function renderMenuOptions(options) {
  menuOptionsList.innerHTML = '';

  if (!options || options.length === 0) {
    menuOptionsList.innerHTML = '<p class="no-options-tip">이 메뉴는 선택 가능한 추가 옵션이 없습니다.</p>';
    return;
  }

  options.forEach(opt => {
    const label = document.createElement('label');
    label.className = 'menu-option-item';
    label.htmlFor = opt.id;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = opt.id;
    input.name = 'options';
    input.value = opt.name;
    input.dataset.price = opt.price;

    const priceText = opt.price > 0 ? `+${opt.price.toLocaleString()}원` : '+0원';

    // 체크 아이콘, 옵션명, 가격을 분리해서 여유로운 카드 형태로 구성
    label.innerHTML = `
      <div class="option-left">
        <span class="custom-check-box"></span>
        <span class="option-name">${opt.name}</span>
      </div>
      <span class="option-price">${priceText}</span>
    `;

    // input 요소를 label 맨 앞에 삽입
    label.insertBefore(input, label.firstChild);

    // 디카페인 vs 샷추가 상호 배타 체크 로직 연결
    input.addEventListener('change', (e) => {
      handleMutualExclusion(e.target);
      updatePriceDisplay();
    });

    menuOptionsList.appendChild(label);
  });
}


// 디카페인과 샷 추가 상호 배타 로직
function handleMutualExclusion(changedCheckbox) {
  const shotInput = document.getElementById('opt-shot');
  const decafInput = document.getElementById('opt-decaf');

  if (!shotInput || !decafInput) return;

  if (changedCheckbox === shotInput && shotInput.checked) {
    if (decafInput.checked) decafInput.checked = false;
  } else if (changedCheckbox === decafInput && decafInput.checked) {
    if (shotInput.checked) shotInput.checked = false;
  }
}

// 모달 이벤트 리스너들
selectedMenuCard.addEventListener('click', openMenuModal);
modalCloseBtn.addEventListener('click', closeMenuModal);
modalCancelBtn.addEventListener('click', closeMenuModal);
modalBackdrop.addEventListener('click', closeMenuModal);

// 카테고리 탭 클릭 필터링
categoryTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-tab-btn');
  if (!btn) return;

  document.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  renderModalMenuGrid(btn.dataset.cat);
});


// ─────────────────────────────────────────────
// 5. 예상 금액 계산 함수 (calculateTotal)
// ─────────────────────────────────────────────
function calculateTotal() {
  if (!currentSelectedMenu) {
    return 0; // 음료를 아직 안 골랐으면 0원
  }

  // 기본 음료 가격
  const drinkPrice = currentSelectedMenu.price;

  // 사이즈 추가 금액
  const checkedSize = document.querySelector('input[name="size"]:checked');
  const sizePrice = checkedSize ? Number(checkedSize.dataset.price) : 0;

  // 동적 생성된 옵션 중 체크된 옵션 가격 합산
  const checkedOptions = document.querySelectorAll('#menu-options-list input[name="options"]:checked');
  const optionPrice = Array.from(checkedOptions).reduce((sum, el) => {
    return sum + Number(el.dataset.price);
  }, 0);

  // 수량 (1~10개 엄격 제한)
  const rawQty = parseInt(quantityInput.value, 10);
  const quantity = isNaN(rawQty) ? 1 : Math.min(10, Math.max(1, rawQty));

  return (drinkPrice + sizePrice + optionPrice) * quantity;
}

// 금액 표시 업데이트
function updatePriceDisplay() {
  const total = calculateTotal();
  totalPriceEl.textContent = total.toLocaleString();
}


// ─────────────────────────────────────────────
// 6. 폼 입력 실시간 리스너
// ─────────────────────────────────────────────
// 사이즈 라디오 변경 시
document.querySelectorAll('input[name="size"]').forEach(radio => {
  radio.addEventListener('change', updatePriceDisplay);
});

// 수량 입력 시 실시간 1~10개 유지
quantityInput.addEventListener('input', () => {
  const val = parseInt(quantityInput.value, 10);
  if (val > 10) quantityInput.value = 10;
  updatePriceDisplay();
});

quantityInput.addEventListener('change', () => {
  const val = parseInt(quantityInput.value, 10);
  if (isNaN(val) || val < 1) {
    quantityInput.value = 1;
  } else if (val > 10) {
    quantityInput.value = 10;
  }
  updatePriceDisplay();
});


// ─────────────────────────────────────────────
// 7. 탭 전환 기능
// ─────────────────────────────────────────────
function switchTab(tabName) {
  if (tabName === 'order') {
    tabBtnOrder.classList.add('active');
    tabBtnOrder.setAttribute('aria-selected', 'true');
    tabOrder.classList.remove('hidden');

    tabBtnHistory.classList.remove('active');
    tabBtnHistory.setAttribute('aria-selected', 'false');
    tabHistory.classList.add('hidden');
  } else if (tabName === 'history') {
    tabBtnHistory.classList.add('active');
    tabBtnHistory.setAttribute('aria-selected', 'true');
    tabHistory.classList.remove('hidden');

    tabBtnOrder.classList.remove('active');
    tabBtnOrder.setAttribute('aria-selected', 'false');
    tabOrder.classList.add('hidden');
  }
}

tabBtnOrder.addEventListener('click', () => switchTab('order'));
tabBtnHistory.addEventListener('click', () => switchTab('history'));


// ─────────────────────────────────────────────
// 8. 주문 내역 렌더링 (renderOrders)
// ─────────────────────────────────────────────
function renderOrders() {
  if (orders.length === 0) {
    ordersList.innerHTML = '<p class="empty-orders">아직 주문 내역이 없어요 ☕</p>';
    ordersSummary.classList.add('hidden');
    orderBadge.classList.add('hidden');
    return;
  }

  ordersList.innerHTML = '';
  const reversedOrders = [...orders].reverse();

  reversedOrders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';

    const titleEl = document.createElement('p');
    titleEl.className = 'order-card-title';
    titleEl.textContent = `#${order.id} ${order.name}님  ·  ${order.total.toLocaleString()}원`;

    const detailEl = document.createElement('p');
    detailEl.className = 'order-card-detail';
    const optionText = order.options.length > 0 ? ` (${order.options.join(', ')})` : '';
    detailEl.textContent = `${order.drink} ${order.size}사이즈${optionText} ${order.quantity}잔`;

    const metaEl = document.createElement('p');
    metaEl.className = 'order-card-meta';
    metaEl.textContent = order.request ? `📝 ${order.request}  ·  ${order.time}` : order.time;

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'order-cancel-btn';
    cancelBtn.textContent = '취소';

    cancelBtn.addEventListener('click', () => {
      if (confirm(`#${order.id} ${order.name}님의 주문을 취소할까요?`)) {
        orders = orders.filter(o => o.id !== order.id);
        renderOrders();
      }
    });

    card.appendChild(cancelBtn);
    card.appendChild(titleEl);
    card.appendChild(detailEl);
    card.appendChild(metaEl);

    ordersList.appendChild(card);
  });

  const grandTotal = orders.reduce((sum, o) => sum + o.total, 0);
  summaryText.textContent = `총 주문 금액: ${grandTotal.toLocaleString()}원 (${orders.length}건)`;
  ordersSummary.classList.remove('hidden');

  orderBadge.textContent = orders.length;
  orderBadge.classList.remove('hidden');
}


// ─────────────────────────────────────────────
// 9. 주문하기 제출 처리 (Supabase 저장)
// ─────────────────────────────────────────────
orderForm.addEventListener('submit', async function(event) {
  event.preventDefault();

  // 유효성 검사: 이름
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

  // 유효성 검사: 메뉴 선택
  if (!currentSelectedMenu) {
    alert('메뉴를 먼저 선택해주세요. ☕');
    openMenuModal();
    return;
  }

  // 수량 검증
  const rawQty = parseInt(quantityInput.value, 10);
  if (isNaN(rawQty) || rawQty < 1 || rawQty > 10) {
    alert('수량은 1잔부터 최대 10잔까지만 주문 가능합니다. ☕');
    quantityInput.value = Math.min(10, Math.max(1, isNaN(rawQty) ? 1 : rawQty));
    quantityInput.focus();
    updatePriceDisplay();
    return;
  }
  const quantity = rawQty;

  const drinkName = currentSelectedMenu.name;
  const drinkPrice = currentSelectedMenu.price;
  const selectedSize = document.querySelector('input[name="size"]:checked').value;

  // 체크된 옵션 이름들
  const checkedOptionInputs = Array.from(document.querySelectorAll('#menu-options-list input[name="options"]:checked'));
  const optionNames = checkedOptionInputs.map(cb => cb.value);

  const request = requestInput.value.trim();
  const phone = phoneInput.value.trim();
  const total = calculateTotal();

  // 버튼 잠금
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = '황금 주문 접수 중... ✨';

  // Supabase cafe_menu03 테이블에 저장
  const { data, error } = await supabaseClient
    .from('cafe_menu03')
    .insert({
      customer_name: name,
      phone: phone,
      drink: drinkName,
      drink_price: drinkPrice,
      size: selectedSize,
      options: optionNames,
      quantity: quantity,
      request: request,
      total_price: total
    });

  if (error) {
    console.error('Supabase 저장 오류:', error);
    alert('주문 저장에 실패했어요. 잠시 후 다시 시도해 주세요. 😢');
    submitBtn.disabled = false;
    submitBtn.textContent = '✨ 골든 주문하기';
    return;
  }

  submitBtn.disabled = false;
  submitBtn.textContent = '✨ 골든 주문하기';

  // 로컬 주문 목록에 추가
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  orderCount++;

  orders.push({
    id: orderCount,
    name: name,
    drink: drinkName,
    size: selectedSize,
    options: optionNames,
    quantity: quantity,
    request: request,
    total: total,
    time: timeStr
  });

  renderOrders();

  // 안전한 확인 메시지 표시 (XSS 방지)
  confirmationMessage.textContent = '';
  function makeStrong(text) {
    const el = document.createElement('strong');
    el.textContent = text;
    return el;
  }
  function makeText(text) {
    return document.createTextNode(text);
  }

  const optMsg = optionNames.length > 0 ? ` (${optionNames.join(', ')})` : '';

  confirmationMessage.appendChild(makeStrong(name + '님'));
  confirmationMessage.appendChild(makeText(', '));
  confirmationMessage.appendChild(makeStrong(drinkName));
  confirmationMessage.appendChild(makeText(' '));
  confirmationMessage.appendChild(makeStrong(selectedSize + '사이즈'));
  if (optMsg) confirmationMessage.appendChild(makeText(optMsg));
  confirmationMessage.appendChild(makeText(' '));
  confirmationMessage.appendChild(makeStrong(quantity + '잔'));
  confirmationMessage.appendChild(makeText(', 총 '));
  confirmationMessage.appendChild(makeStrong(total.toLocaleString() + '원'));
  confirmationMessage.appendChild(makeText(' 주문이 접수되었습니다! 🎉'));

  orderConfirmation.classList.remove('hidden');
  orderConfirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
  orderForm.classList.add('hidden');
});


// ─────────────────────────────────────────────
// 10. 다시 작성 버튼 (리셋)
// ─────────────────────────────────────────────
document.getElementById('reset-btn').addEventListener('click', () => {
  setTimeout(() => {
    // 메뉴 선택 초기화
    currentSelectedMenu = null;
    selectedDrinkId.value = '';
    selectedMenuCard.classList.add('empty');
    cardDrinkIcon.textContent = '👑';
    cardDrinkTitle.textContent = '황금 메뉴를 선택해 주세요';
    cardDrinkDesc.textContent = '터치하여 24K 골든 메뉴와 전용 옵션을 확인하세요';
    menuOptionsList.innerHTML = '<p class="no-options-tip">메뉴를 먼저 선택하시면 24K 맞춤 옵션이 표시됩니다 ✨</p>';

    document.getElementById('size-m').checked = true;
    quantityInput.value = 1;

    nameError.classList.remove('show');
    nameInput.classList.remove('error');

    orderConfirmation.classList.add('hidden');
    orderForm.classList.remove('hidden');

    updatePriceDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 0);
});


// ─────────────────────────────────────────────
// 11. 전체 내역 삭제 & 기타 편의 리스너
// ─────────────────────────────────────────────
clearAllBtn.addEventListener('click', () => {
  if (orders.length === 0) return;
  if (confirm(`주문 내역 ${orders.length}건을 모두 삭제할까요?`)) {
    orders = [];
    renderOrders();
  }
});

nameInput.addEventListener('input', () => {
  if (nameInput.value.trim() !== '') {
    nameError.classList.remove('show');
    nameInput.classList.remove('error');
  }
});

// 전화번호 자동 하이픈
phoneInput.addEventListener('input', () => {
  const rawNumber = phoneInput.value.replace(/[^0-9]/g, '');
  let formatted = '';

  if (rawNumber.length < 4) {
    formatted = rawNumber;
  } else if (rawNumber.length < 8) {
    formatted = rawNumber.slice(0, 3) + '-' + rawNumber.slice(3);
  } else if (rawNumber.length < 11) {
    formatted = rawNumber.slice(0, 3) + '-' + rawNumber.slice(3, 6) + '-' + rawNumber.slice(6);
  } else {
    formatted = rawNumber.slice(0, 3) + '-' + rawNumber.slice(3, 7) + '-' + rawNumber.slice(7, 11);
  }

  phoneInput.value = formatted;
});


// ─────────────────────────────────────────────
// 12. 초기 실행
// ─────────────────────────────────────────────
updatePriceDisplay();
renderOrders();
