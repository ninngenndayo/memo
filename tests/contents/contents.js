// 1. 最もシンプル & パフォーマンスに優しい基本形（おすすめNo.1）
let lastKnownScrollY = 0;
let ticking = false;

function onScroll() {
  lastKnownScrollY = window.scrollY;  // または document.documentElement.scrollTop

  if (!ticking) {
    window.requestAnimationFrame(() => {
      // ここで実際の処理を書く（重い処理は避ける）
      doSomethingWithScrollPosition(lastKnownScrollY);
      ticking = false;
    });
    ticking = true;
  }
}

// passive: true が超重要！（特にモバイル）
window.addEventListener('scroll', onScroll, { passive: true });

function doSomethingWithScrollPosition(y) {
  // 例: ヘッダーのクラス切り替え
  if (y > 100) {
    document.body.classList.add('scrolled');
  } else {
    document.body.classList.remove('scrolled');
  }
  
  // 例: パララックス的な動き
  // document.querySelector('.bg').style.transform = `translateY(${y * 0.3}px)`;
}