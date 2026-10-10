/* =========================================================
   Hero Store — Store Builder
   يعمل بالكامل في المتصفح، بدون خادم.
   ========================================================= */
(() => {
  'use strict';

  const STORAGE_KEY = 'hero_store_builder_v1';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- State ---------- */
  let state = {
    store: { name: '', tagline: '', whatsapp: '', email: '', currency: 'ج.م' },
    products: [],
    template: 'minimal',
    payment: { whatsapp: true, paypal: false, paypalLink: '', bank: false, bankInfo: '', wallet: false, walletInfo: '', phone: false }
  };

  /* ---------- Persistence ---------- */
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const load = () => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) state = { ...state, ...JSON.parse(raw) }; } catch {}
  };

  /* ---------- Products ---------- */
  function productRow(p = {}) {
    const el = document.createElement('div');
    el.className = 'product-item';
    el.innerHTML = `
      <button type="button" class="remove" title="حذف">×</button>
      <input type="text"  placeholder="اسم المنتج"  value="${esc(p.name||'')}"      data-k="name" />
      <input type="text"  placeholder="السعر"        value="${esc(p.price||'')}"     data-k="price" inputmode="decimal" />
      <textarea class="full" rows="2" placeholder="وصف قصير (اختياري)" data-k="desc">${esc(p.desc||'')}</textarea>
      <input type="url" class="full" placeholder="رابط صورة المنتج (اختياري)" value="${esc(p.image||'')}" data-k="image" />
    `;
    el.querySelector('.remove').addEventListener('click', () => {
      el.remove(); syncProducts();
    });
    el.addEventListener('input', syncProducts);
    return el;
  }

  function syncProducts() {
    state.products = $$('#products-list .product-item').map(el => {
      const get = k => el.querySelector(`[data-k="${k}"]`).value.trim();
      return { name: get('name'), price: get('price'), desc: get('desc'), image: get('image') };
    }).filter(p => p.name && p.price);
    save(); render();
  }

  function addProduct(p) {
    $('#products-list').appendChild(productRow(p));
    syncProducts();
  }

  /* ---------- Bind store fields ---------- */
  function bindStoreFields() {
    const map = {
      storeName: ['store','name'], storeTagline:['store','tagline'], storeWhatsapp:['store','whatsapp'],
      storeEmail:['store','email'], storeCurrency:['store','currency']
    };
    Object.entries(map).forEach(([id,[group,key]]) => {
      const el = $('#'+id);
      el.value = state[group][key] || '';
      el.addEventListener('input', () => { state[group][key] = el.value; save(); render(); });
    });
    const payMap = {
      payWhatsapp:['whatsapp'], payPaypal:['paypal'], paypalLink:['paypalLink'],
      payBank:['bank'], bankInfo:['bankInfo'], payWallet:['wallet'],
      walletInfo:['walletInfo'], payPhone:['phone']
    };
    Object.entries(payMap).forEach(([id,[key]]) => {
      const el = $('#'+id);
      if (el.type === 'checkbox') { el.checked = !!state.payment[key]; el.addEventListener('change', () => { state.payment[key] = el.checked; save(); render(); }); }
      else { el.value = state.payment[key] || ''; el.addEventListener('input', () => { state.payment[key] = el.value; save(); render(); }); }
    });
  }

  /* ---------- Template picker ---------- */
  $$('input[name="template"]').forEach(r => {
    r.checked = r.value === state.template;
    r.addEventListener('change', () => { state.template = r.value; save(); render(); });
  });

  /* ---------- Device toggle ---------- */
  $$('.preview-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.preview-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('#preview-frame').classList.toggle('desktop', btn.dataset.device === 'desktop');
    });
  });

  /* ---------- Build store HTML ---------- */
  function buildStoreHTML(s) {
    const themes = {
      minimal: { bg:'#ffffff', card:'#ffffff', fg:'#111827', muted:'#6b7280', primary:'#6d28d9', border:'#e5e7eb', radius:'10px', font:"'Segoe UI',Tahoma,sans-serif", layout:'grid' },
      warm:    { bg:'#fff7ed', card:'#ffffff', fg:'#7c2d12', muted:'#9a3412', primary:'#ea580c', border:'#fed7aa', radius:'20px', font:"'Segoe UI',Tahoma,sans-serif", layout:'grid' },
      dark:    { bg:'#0b1020', card:'#151b34', fg:'#e5e7eb', muted:'#94a3b8', primary:'#a78bfa', border:'#1f2750', radius:'14px', font:"'Segoe UI',Tahoma,sans-serif", layout:'grid' },
      market:  { bg:'#f8fafc', card:'#ffffff', fg:'#0f172a', muted:'#64748b', primary:'#4f46e5', border:'#e2e8f0', radius:'12px', font:"'Segoe UI',Tahoma,sans-serif", layout:'market' }
    };
    const t = themes[s.template] || themes.minimal;

    const products = s.products.map((p,i)=>`
      <article class="product" data-name="${esc(p.name)}" data-price="${esc(p.price)}">
        <div class="product-img">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"/>` : `<span>${esc(p.name.charAt(0))}</span>`}</div>
        <div class="product-body">
          <h3>${esc(p.name)}</h3>
          ${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
          <div class="product-foot">
            <strong>${esc(p.price)} ${esc(s.store.currency)}</strong>
            <button class="add" data-i="${i}">أضف للسلة</button>
          </div>
        </div>
      </article>`).join('');

    const payments = [];
    if (s.payment.whatsapp) payments.push('طلب عبر واتساب');
    if (s.payment.paypal && s.payment.paypalLink) payments.push(`PayPal: <a href="${esc(s.payment.paypalLink)}" target="_blank" rel="noopener">${esc(s.payment.paypalLink)}</a>`);
    if (s.payment.bank && s.payment.bankInfo) payments.push(`تحويل بنكي: ${esc(s.payment.bankInfo)}`);
    if (s.payment.wallet && s.payment.walletInfo) payments.push(`محفظة إلكترونية: ${esc(s.payment.walletInfo)}`);
    if (s.payment.phone) payments.push(`اتصال هاتفي: ${esc(s.store.whatsapp)}`);

    const waLink = `https://wa.me/${(s.store.whatsapp||'').replace(/\D/g,'')}`;

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(s.store.name || 'متجري')}</title>
<meta name="description" content="${esc(s.store.tagline || s.store.name || 'متجر إلكتروني')}"/>
<meta property="og:title" content="${esc(s.store.name||'')}"/>
<meta property="og:description" content="${esc(s.store.tagline||'')}"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:${t.font};background:${t.bg};color:${t.fg};line-height:1.6}
a{color:${t.primary};text-decoration:none}
img{max-width:100%;display:block}
.wrap{max-width:1080px;margin:0 auto;padding:0 16px}
header{padding:28px 0;border-bottom:1px solid ${t.border};background:${t.card}}
header h1{font-size:1.6rem;letter-spacing:-.02em}
header p{color:${t.muted};margin-top:4px}
main{padding:28px 0 90px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}
.product{background:${t.card};border:1px solid ${t.border};border-radius:${t.radius};overflow:hidden;transition:transform .2s,box-shadow .2s}
.product:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,.08)}
.product-img{aspect-ratio:1;background:linear-gradient(135deg,${t.primary}22,${t.primary}11);display:grid;place-items:center;color:${t.primary};font-size:3rem;font-weight:900}
.product-img img{width:100%;height:100%;object-fit:cover}
.product-body{padding:14px}
.product-body h3{font-size:1rem;margin-bottom:6px}
.product-body p{color:${t.muted};font-size:.88rem;margin-bottom:10px;min-height:1.2em}
.product-foot{display:flex;justify-content:space-between;align-items:center;gap:10px}
.product-foot strong{color:${t.primary};font-size:1.05rem}
.add{background:${t.primary};color:#fff;border:0;padding:8px 14px;border-radius:8px;font-weight:700;cursor:pointer;font-size:.85rem}
.add:hover{filter:brightness(.92)}
.payments{margin-top:32px;padding:18px;background:${t.card};border:1px solid ${t.border};border-radius:${t.radius}}
.payments h4{margin-bottom:8px}
.payments ul{list-style:none;display:flex;flex-wrap:wrap;gap:12px;color:${t.muted};font-size:.9rem}
.cart{position:fixed;bottom:16px;left:16px;background:${t.card};border:1px solid ${t.border};border-radius:${t.radius};padding:12px 16px;box-shadow:0 10px 30px rgba(0,0,0,.15);display:none;font-size:.9rem;z-index:20}
.cart.show{display:block}
.cart strong{color:${t.primary}}
.cart .actions{margin-top:8px;display:flex;gap:8px}
.wa{position:fixed;bottom:16px;right:16px;background:#25D366;color:#fff;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;box-shadow:0 8px 24px rgba(37,211,102,.4);font-size:1.6rem;z-index:20}
footer{margin-top:60px;padding:24px 0;border-top:1px solid ${t.border};text-align:center;color:${t.muted};font-size:.85rem}
footer a{font-weight:700;color:${t.primary}}
.empty{padding:40px;text-align:center;color:${t.muted}}
</style>
</head>
<body>
<header>
  <div class="wrap">
    <h1>${esc(s.store.name || 'متجري')}</h1>
    ${s.store.tagline ? `<p>${esc(s.store.tagline)}</p>` : ''}
  </div>
</header>
<main>
  <div class="wrap">
    ${s.products.length ? `<div class="grid">${products}</div>` : `<div class="empty">لا توجد منتجات بعد.</div>`}

    ${payments.length ? `<section class="payments"><h4>طرق الطلب والدفع</h4><ul>${payments.map(x=>`<li>• ${x}</li>`).join('')}</ul></section>` : ''}
  </div>
</main>

<div class="cart" id="cart">
  <div><strong id="cart-count">0</strong> عنصر — الإجمالي: <strong id="cart-total">0</strong> ${esc(s.store.currency)}</div>
  <div class="actions">
    <a id="checkout" class="add" href="#" target="_blank" rel="noopener">إتمام الطلب</a>
    <button class="add" style="background:#e5e7eb;color:#111" onclick="localStorage.removeItem('hs_cart_${slug(s.store.name)}');location.reload()">تفريغ</button>
  </div>
</div>

<a class="wa" href="${waLink}" target="_blank" rel="noopener" aria-label="واتساب">💬</a>

<footer>
  <div class="wrap">
    صُنع بواسطة <a href="https://hero-store.github.io/" target="_blank" rel="noopener">هيرو ستور</a> — أنشئ متجرك مجانًا.
  </div>
</footer>

<script>
(function(){
  const KEY='hs_cart_${slug(s.store.name)}';
  const store=${JSON.stringify({name:s.store.name, whatsapp:s.store.whatsapp, currency:s.store.currency})};
  const cart=JSON.parse(localStorage.getItem(KEY)||'{}');
  function render(){
    let count=0,total=0,lines=[];
    document.querySelectorAll('.product').forEach((el,i)=>{
      const n=cart[i]||0; if(!n) return;
      const name=el.dataset.name, price=+el.dataset.price;
      count+=n; total+=n*price;
      lines.push('• '+name+' × '+n+' = '+(n*price)+' '+store.currency);
    });
    const box=document.getElementById('cart');
    document.getElementById('cart-count').textContent=count;
    document.getElementById('cart-total').textContent=total;
    if(count>0){
      box.classList.add('show');
      const msg='مرحبًا ${esc(s.store.name)} 👋%0Aأرغب في طلب:%0A'+encodeURIComponent(lines.join('\\n'))+'%0A%0Aالإجمالي: '+total+' '+store.currency+'%0A%0Aالاسم:%0Aالعنوان:%0Aملاحظات:';
      document.getElementById('checkout').href='https://wa.me/'+store.whatsapp.replace(/\\D/g,'')+'?text='+msg;
    } else box.classList.remove('show');
    localStorage.setItem(KEY, JSON.stringify(cart));
  }
  document.querySelectorAll('.add[data-i]').forEach(b=>{
    b.addEventListener('click',()=>{const i=b.dataset.i;cart[i]=(cart[i]||0)+1;render();});
  });
  render();
})();
<\/script>
</body>
</html>`;
  }

  const esc = s => String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug = s => String(s||'store').replace(/[^\w\u0600-\u06FF]+/g,'-').toLowerCase() || 'store';

  /* ---------- Live preview ---------- */
  function render() {
    const html = buildStoreHTML(state);
    $('#preview-iframe').srcdoc = html;
  }

  /* ---------- Download ---------- */
  $('#download-store').addEventListener('click', () => {
    if (!state.store.name || !state.store.whatsapp) {
      alert('يرجى إدخال اسم المتجر ورقم واتساب على الأقل.');
      return;
    }
    const html = buildStoreHTML(state);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug(state.store.name)}.html`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });

  /* ---------- Share ---------- */
  $('#share-store').addEventListener('click', async () => {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert('تم نسخ رابط الأداة. شاركه ليصل المزيد من التجار.');
    } catch { prompt('انسخ الرابط:', url); }
  });

  /* ---------- Reset ---------- */
  $('#reset-form').addEventListener('click', () => {
    if (!confirm('سيتم مسح كل شيء. متابعة؟')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

/* ---------- Custom form → WhatsApp / Telegram ---------- */
const CONTACT = {
  whatsapp: '201234567890',        // ← ضع رقمك بدون + وبدون مسافات
  telegram: 'hero_store'           // ← ضع معرف تليجرام بدون @
};

$('#custom-form').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  const channel = e.submitter?.dataset.channel || 'whatsapp';
  const data = Object.fromEntries(new FormData(form).entries());

  const message =
`طلب قالب مخصص
──────────────
الاسم: ${data.name || '-'}
النشاط: ${data.business || '-'}
القالب المفضل: ${data.template || '-'}
وسيلة التواصل المفضلة: ${data.prefer || '-'}

تفاصيل:
${data.details || '-'}`;

  const encoded = encodeURIComponent(message);

  if (channel === 'telegram') {
    // تليجرام لا يدعم نصًا مسبقًا في الروابط المباشرة، لذا ننسخ الرسالة ونفتح المحادثة
    navigator.clipboard?.writeText(message).catch(() => {});
    alert('تم نسخ تفاصيل طلبك. سيتم فتح تليجرام — الصق الرسالة في المحادثة.');
    window.open(`https://t.me/${CONTACT.telegram}`, '_blank', 'noopener');
  } else {
    window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encoded}`, '_blank', 'noopener');
  }
});

  /* ---------- Init ---------- */
  load();
  bindStoreFields();
  if (state.products.length) state.products.forEach(p => addProduct(p));
  else addProduct();
  $('#add-product').addEventListener('click', () => addProduct());
  render();
})();
