/* ============================================================
   HERO Store — App Logic (home + results + product page)
   ============================================================ */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var DATA = { categories: [], products: [] };

  /* ---------- Load data (fetch → fallback) ---------- */
  function loadData() {
    return fetch('data/products.json')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .catch(function () {
        var el = $('#products-fallback');
        if (!el) return { categories: [], products: [] };
        try { return JSON.parse(el.textContent); }
        catch (e) { return { categories: [], products: [] }; }
      });
  }

  /* ---------- Helpers ---------- */
  function catOf(id) {
    for (var i = 0; i < DATA.categories.length; i++)
      if (DATA.categories[i].id === id) return DATA.categories[i];
    return { id: id, name: id, icon: '📦' };
  }
  function stars(r) {
    var full = Math.round(r);
    var s = '';
    for (var i = 0; i < 5; i++) s += (i < full ? '★' : '☆');
    return s;
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }
  function toast(msg) {
    var t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._id);
    t._id = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- Card markup ---------- */
  function cardHTML(p) {
    var badge = p.new ? '<span class="card-badge new">جديد</span>'
              : p.featured ? '<span class="card-badge">مميز</span>' : '';
    var img = p.image
      ? '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.name) +
        '" loading="lazy" onerror="this.remove()">'
      : '';
    var priceCls = p.priceValue === 0 ? 'price free' : 'price';

    return '' +
      '<article class="card" data-id="' + escapeHtml(p.id) + '" data-list="catalog">' +
        '<a class="card-link" href="' + escapeHtml(p.url) + '" aria-label="' + escapeHtml(p.name) + '">' +
          '<div class="card-media" style="--c1:' + (p.c1 || '#5B3DF5') + ';--c2:' + (p.c2 || '#8B5CF6') + '">' +
            badge +
            '<span class="card-emoji">' + (p.emoji || '📦') + '</span>' +
            img +
          '</div>' +
        '</a>' +
        '<div class="card-body">' +
          '<span class="card-seller">🏷️ ' + escapeHtml(p.seller || 'HERO') + '</span>' +
          '<h3 class="card-title">' + escapeHtml(p.name) + '</h3>' +
          '<p class="card-desc">' + escapeHtml(p.description) + '</p>' +
          '<div class="card-meta">' +
            '<span class="rating"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.9 7.5.8-5.6 5 1.6 7.3L12 18.3 5.5 22l1.6-7.3-5.6-5 7.5-.8z"/></svg>' +
              p.rating.toFixed(1) + '</span>' +
            '<span class="' + priceCls + '">' + escapeHtml(p.price) + '</span>' +
          '</div>' +
          '<a class="btn btn-outline btn-block" href="' + escapeHtml(p.url) + '" ' +
             'data-hero-event="select_item" data-hero-id="' + escapeHtml(p.id) + '" ' +
             'data-hero-list="catalog" style="margin-top:6px">عرض المنتج</a>' +
        '</div>' +
      '</article>';
  }

  function skeletonGrid(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += '<div class="sk sk-card"></div>';
    return s;
  }

  /* ---------- Render ---------- */
  function renderChips(activeId) {
    var box = $('#chips'); if (!box) return;
    var html = '<button class="chip' + (!activeId ? ' active' : '') + '" data-cat="">الكل</button>';
    DATA.categories.forEach(function (c) {
      html += '<button class="chip' + (activeId === c.id ? ' active' : '') +
              '" data-cat="' + c.id + '">' + c.icon + ' ' + c.name + '</button>';
    });
    box.innerHTML = html;
  }

  function renderDrawerCats() {
    var box = $('#drawer-cats'); if (!box) return;
    box.innerHTML = DATA.categories.map(function (c) {
      return '<a href="index.html?category=' + c.id + '">' + c.icon + ' ' + c.name + '</a>';
    }).join('');
  }

  function renderCatGrid() {
    var box = $('#cat-grid'); if (!box) return;
    box.innerHTML = DATA.categories.map(function (c) {
      var count = DATA.products.filter(function (p) { return p.category === c.id; }).length;
      return '<a class="cat-card" href="index.html?category=' + c.id + '">' +
               '<span class="cat-icon">' + c.icon + '</span>' +
               '<span class="cat-name">' + c.name + '</span>' +
               '<span class="muted" style="font-size:11.5px">' + count + ' منتج</span>' +
             '</a>';
    }).join('');
  }

  function renderHome() {
    var featured = DATA.products.filter(function (p) { return p.featured; }).slice(0, 8);
    var latest   = DATA.products.slice().sort(function (a, b) { return (b.new ? 1 : 0) - (a.new ? 1 : 0); }).slice(0, 8);

    var fg = $('#featured-grid'), lg = $('#latest-grid');
    if (fg) fg.innerHTML = featured.map(cardHTML).join('');
    if (lg) lg.innerHTML = latest.map(cardHTML).join('');

    if (window.HeroTrack) {
      window.HeroTrack.viewItemList('featured_products', featured);
      window.HeroTrack.viewItemList('latest_products', latest);
    }
  }

  /* ---------- Search / Category results ---------- */
  function matches(p, term) {
    if (!term) return true;
    var t = term.toLowerCase();
    return (p.name + ' ' + p.description + ' ' + p.category + ' ' +
            (p.tags || []).join(' ') + ' ' + (p.seller || '')).toLowerCase().indexOf(t) !== -1;
  }

  function sortProducts(list, mode) {
    var l = list.slice();
    if (mode === 'newest')     l.sort(function (a, b) { return (b.new ? 1 : 0) - (a.new ? 1 : 0); });
    if (mode === 'rating')     l.sort(function (a, b) { return b.rating - a.rating; });
    if (mode === 'price-asc')  l.sort(function (a, b) { return a.priceValue - b.priceValue; });
    if (mode === 'price-desc') l.sort(function (a, b) { return b.priceValue - a.priceValue; });
    if (mode === 'featured')   l.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
    return l;
  }

  function showResults(opts) {
    var term = (opts.term || '').trim();
    var cat  = opts.category || '';
    var sort = opts.sort || 'featured';

    var list = DATA.products.filter(function (p) {
      if (cat && p.category !== cat) return false;
      return matches(p, term);
    });
    list = sortProducts(list, sort);

    $('#home').hidden = true;
    $('#results').hidden = false;

    var title = term
      ? 'نتائج البحث عن: ' + term
      : (cat ? catOf(cat).icon + ' ' + catOf(cat).name : 'كل المنتجات');
    $('#results-title').textContent = title;
    $('#results-count').textContent = 'وجدنا ' + list.length + ' منتج';

    var box = $('#results-grid');
    if (!list.length) {
      box.innerHTML = '<div class="empty" style="grid-column:1/-1">' +
        '<div class="big">🔍</div><h3>لا توجد نتائج</h3>' +
        '<p>جرّب كلمات بحث أخرى أو تصفّح التصنيفات.</p></div>';
    } else {
      box.innerHTML = list.map(cardHTML).join('');
    }

    if (window.HeroTrack) {
      if (term) window.HeroTrack.search(term, list.length);
      window.HeroTrack.viewItemList(cat ? ('category_' + cat) : 'search_results', list);
    }

    /* sync chips + URL */
    renderChips(cat);
    var url = new URL(location.href);
    if (term) url.searchParams.set('q', term); else url.searchParams.delete('q');
    if (cat)  url.searchParams.set('category', cat); else url.searchParams.delete('category');
    if (opts.all) url.searchParams.set('all', '1');
    history.replaceState(null, '', url.pathname + url.search);
  }

  function showHome() {
    $('#home').hidden = false;
    $('#results').hidden = true;
    renderChips('');
    var url = new URL(location.href);
    ['q', 'category', 'all'].forEach(function (k) { url.searchParams.delete(k); });
    history.replaceState(null, '', url.pathname + url.search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Product Page ---------- */
  function renderProductPage() {
    var body = document.body;
    var pid  = body.getAttribute('data-product-id');
    if (!pid) return;

    var p = DATA.products.filter(function (x) { return x.id === pid; })[0];
    if (!p) { document.title = 'منتج غير موجود — HERO Store'; return; }

    document.title = p.name + ' — HERO Store';

    var img = p.image
      ? '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.name) +
        '" onerror="this.remove()">'
      : '';

    var featuresHTML = (p.features || [
      ['سهل الاستخدام', 'واجهة بسيطة تناسب الجميع.'],
      ['تحديثات مستمرة', 'تحسينات دورية بدون تكلفة إضافية.'],
      ['دعم فني', 'مساعدة مباشرة عند الحاجة.'],
      ['جودة احترافية', 'محتوى وأدوات بمستوى احترافي.']
    ]).map(function (f) {
      return '<div class="feature"><span class="tick">✓</span><div><b>' +
             escapeHtml(f[0]) + '</b><p>' + escapeHtml(f[1]) + '</p></div></div>';
    }).join('');

    var faqHTML = (p.faq || [
      ['ما هو هذا المنتج؟', p.description],
      ['هل أحتاج خبرة سابقة؟', 'لا، المنتج مناسب للمبتدئين والمحترفين.'],
      ['كيف أحصل عليه؟', 'اضغط على "ابدأ الآن" وسيتم توجيهك للرابط الخارجي.']
    ]).map(function (q) {
      return '<details><summary>' + escapeHtml(q[0]) + '</summary><p>' +
             escapeHtml(q[1]) + '</p></details>';
    }).join('');

    var root = $('#pdp-root');
    if (!root) return;

    root.innerHTML = '' +
      '<a class="back-link" href="/index.html">← العودة للمنتجات</a>' +

      '<div class="pdp-hero">' +
        '<div class="pdp-media" style="--c1:' + (p.c1 || '#5B3DF5') + ';--c2:' + (p.c2 || '#8B5CF6') + '">' +
          '<span class="pdp-emoji">' + (p.emoji || '📦') + '</span>' + img +
        '</div>' +
        '<div class="pdp-info">' +
          '<span class="pdp-cat">' + catOf(p.category).icon + ' ' + catOf(p.category).name + '</span>' +
          '<h1 class="pdp-title">' + escapeHtml(p.name) + '</h1>' +
          '<div class="rating" style="font-size:14px">' + stars(p.rating) + ' ' +
            p.rating.toFixed(1) + ' <span class="muted">(' + (p.reviews || 0) + ' تقييم)</span></div>' +
          '<p class="pdp-desc">' + escapeHtml(p.description) + '</p>' +
          '<div class="pdp-price">' + escapeHtml(p.price) + '</div>' +
          '<div class="pdp-actions">' +
            '<button class="btn btn-primary btn-lg" id="pdp-buy" style="flex:1;min-width:180px">ابدأ الآن</button>' +
            '<button class="btn btn-outline btn-lg" id="pdp-share">مشاركة</button>' +
          '</div>' +
          '<div class="pdp-trust">' +
            '<span>⚡ وصول فوري</span><span>🔒 دفع آمن</span><span>↩️ دعم بعد الشراء</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="panel">' +
        '<h3>لماذا هذا المنتج؟</h3>' +
        '<div class="features">' + featuresHTML + '</div>' +
      '</div>' +

      '<div class="panel">' +
        '<h3>عن التاجر</h3>' +
        '<div class="seller-box">' +
          '<div class="seller-avatar">' + (p.seller || 'H').charAt(0) + '</div>' +
          '<div style="flex:1;min-width:160px">' +
            '<b style="font-size:15px">' + escapeHtml(p.seller || 'HERO') + '</b>' +
            '<p class="muted" style="margin:2px 0 0;font-size:13px">منتجات رقمية عالية الجودة.</p>' +
          '</div>' +
          '<button class="btn btn-outline" id="pdp-seller">زيارة صفحة التاجر</button>' +
        '</div>' +
      '</div>' +

      '<div class="panel faq">' +
        '<h3>الأسئلة الشائعة</h3>' + faqHTML +
      '</div>' +

      '<div class="panel" style="text-align:center">' +
        '<h3>جاهز للبدء؟</h3>' +
        '<p class="muted" style="margin:0 0 16px">احصل على ' + escapeHtml(p.name) + ' الآن.</p>' +
        '<button class="btn btn-primary btn-lg" id="pdp-buy-2">ابدأ الآن</button>' +
      '</div>';

    /* Sticky mobile bar */
    var bar = document.createElement('div');
    bar.className = 'sticky-buy';
    bar.innerHTML = '<div class="info"><b>' + escapeHtml(p.name) + '</b><span>' +
                    escapeHtml(p.price) + '</span></div>' +
                    '<button class="btn btn-primary" id="pdp-buy-3">ابدأ الآن</button>';
    document.body.appendChild(bar);
    document.body.classList.add('has-sticky-buy');

    setTimeout(function () { bar.classList.add('show'); }, 400);

    /* CTA handler */
    function buy(source) {
      if (window.HeroTrack) {
        window.HeroTrack.clickBuy(p, { listName: 'product_page', url: p.buyUrl || p.url });
      }
      toast('جاري تحويلك إلى ' + p.name + ' ...');
      if (p.buyUrl) setTimeout(function () { window.open(p.buyUrl, '_blank', 'noopener'); }, 500);
    }
    ['pdp-buy', 'pdp-buy-2', 'pdp-buy-3'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', function () { buy(id); });
    });

    /* Seller */
    var sb = $('#pdp-seller');
    if (sb) sb.addEventListener('click', function () {
      if (window.HeroTrack) window.HeroTrack.viewSeller(p, p.seller);
      toast('صفحة التاجر قريبًا');
    });

    /* Share */
    var sh = $('#pdp-share');
    if (sh) sh.addEventListener('click', function () {
      if (navigator.share) navigator.share({ title: p.name, url: location.href });
      else { navigator.clipboard.writeText(location.href); toast('تم نسخ الرابط'); }
    });

    /* view_item — fired once, after render */
    if (window.HeroTrack) window.HeroTrack.viewItem(p);
  }

  /* ---------- Header / Drawer / Chips events ---------- */
  function bindUI() {
    /* Drawer */
    var menuBtn = $('#menu-btn'), drawer = $('#drawer'),
        overlay = $('#overlay'), closeBtn = $('#drawer-close');

    function openDrawer()  { drawer.classList.add('open'); overlay.classList.add('show');
                             drawer.setAttribute('aria-hidden', 'false');
                             menuBtn.setAttribute('aria-expanded', 'true'); }
    function closeDrawer() { drawer.classList.remove('open'); overlay.classList.remove('show');
                             drawer.setAttribute('aria-hidden', 'true');
                             menuBtn.setAttribute('aria-expanded', 'false'); }

    if (menuBtn) menuBtn.addEventListener('click', function () {
      drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    if (overlay) overlay.addEventListener('click', closeDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    /* Chips (delegated) */
    document.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var cat = chip.getAttribute('data-cat');
      if (!cat) showHome(); else showResults({ category: cat });
    });

    /* Search */
    var input = $('#search-input');
    if (input) {
      var t;
      input.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          var v = input.value.trim();
          if (!v) { showHome(); return; }
          showResults({ term: v });
        }, 280);
      });
    }

    /* Sort */
    var sortSel = $('#sort-select');
    if (sortSel) sortSel.addEventListener('change', function () {
      var url = new URL(location.href);
      showResults({
        term: url.searchParams.get('q') || '',
        category: url.searchParams.get('category') || '',
        sort: sortSel.value,
        all: url.searchParams.get('all') === '1'
      });
    });

    /* Home CTAs */
    var heroCta = $('#hero-cta');
    if (heroCta) heroCta.addEventListener('click', function () {
      if (window.HeroTrack) window.HeroTrack.selectPromotion({ promotion_id: 'hero_cta', promotion_name: 'اكتشف المنتجات' });
      showResults({ all: true });
    });

    var heroCats = $('#hero-cats');
    if (heroCats) heroCats.addEventListener('click', function () {
      var el = $('#cats-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });

    var showAll = $('#show-all');
    if (showAll) showAll.addEventListener('click', function () { showResults({ all: true }); });

    /* Card clicks → select_item (analytics only; navigation is native) */
    document.addEventListener('click', function (e) {
      var card = e.target.closest('.card');
      if (!card) return;
      var id = card.getAttribute('data-id');
      var p = DATA.products.filter(function (x) { return x.id === id; })[0];
      if (p && window.HeroTrack) window.HeroTrack.selectItem(p, card.getAttribute('data-list') || 'catalog');
    }, true);
  }

  /* ---------- Init ---------- */
  function init() {
    var page = document.body.getAttribute('data-page') || 'home';

    loadData().then(function (d) {
      DATA = { categories: d.categories || [], products: d.products || [] };

      renderChips('');
      renderDrawerCats();
      bindUI();

      if (page === 'product') {
        renderProductPage();
        return;
      }

      renderHome();
      renderCatGrid();

      /* deep-link: /?q=... | /?category=... | /?all=1 */
      var url = new URL(location.href);
      var q = url.searchParams.get('q');
      var c = url.searchParams.get('category');
      var all = url.searchParams.get('all');

      if (q) showResults({ term: q });
      else if (c) showResults({ category: c });
      else if (all) showResults({ all: true });
    });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();

})();