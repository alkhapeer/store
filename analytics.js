/* ============================================================
   HERO Store — Central Analytics Layer
   ------------------------------------------------------------
   Drop this in every page:  <script src="/assets/js/analytics.js"></script>
   Later, just fill in the IDs below. No other file changes needed.
   ============================================================ */
(function (window, document) {
  'use strict';

  /* ---------- 1. CONFIG (fill these later) ---------- */
  var CONFIG = {
    GA4_ID: 'G-EFXR4NFC0G',                 // e.g. 'G-XXXXXXXXXX'
    GTM_ID: 'GTM-PJB2HZC4',                 // e.g. 'GTM-XXXXXXX'
    ADS_ID: '',                 // e.g. 'AW-XXXXXXXXX'
    ADS_CONVERSION_LABEL: '',   // e.g. 'AbC-D_efGh'
    CURRENCY: 'USD',
    DEBUG: true,
    SITE: 'store.hero1.vip'
  };

  /* ---------- 2. dataLayer bootstrap ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  /* ---------- 3. Consent Mode default (safe & future-proof) ---------- */
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  /* ---------- 4. Load Google tags only if IDs exist ---------- */
  if (CONFIG.GTM_ID) {
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s), dl = l !== 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', CONFIG.GTM_ID);
  }

  if (CONFIG.GA4_ID || CONFIG.ADS_ID) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + (CONFIG.GA4_ID || CONFIG.ADS_ID);
    document.head.appendChild(s);
    if (CONFIG.GA4_ID) gtag('js', new Date());
    if (CONFIG.GA4_ID) gtag('config', CONFIG.GA4_ID, { send_page_view: false });
    if (CONFIG.ADS_ID) gtag('config', CONFIG.ADS_ID);
  }

  /* ---------- 5. Helpers ---------- */
  function log() {
    if (!CONFIG.DEBUG) return;
    var a = Array.prototype.slice.call(arguments);
    console.log('%c[HERO Analytics]', 'color:#5B3DF5;font-weight:700', ...a);
  }

  function push(eventName, params) {
    params = params || {};
    var payload = Object.assign({
      event: eventName,
      site: CONFIG.SITE,
      currency: CONFIG.CURRENCY,
      page_path: location.pathname + location.search
    }, params);

    window.dataLayer.push(payload);
    if (CONFIG.GA4_ID) gtag('event', eventName, params);
    log(eventName, payload);
  }

  /* ---------- 6. Public API (HeroTrack) ---------- */
  var HeroTrack = {

    /* page_view */
    pageView: function (extra) {
      push('page_view', Object.assign({
        page_title: document.title,
        page_location: location.href
      }, extra || {}));
    },

    /* Homepage / category: list of products rendered */
    viewItemList: function (listName, items) {
      push('view_item_list', {
        item_list_name: listName,
        items: (items || []).map(toGA4Item)
      });
    },

    /* Product landing page load */
    viewItem: function (product) {
      push('view_item', {
        item_list_name: 'product_page',
        value: product.priceValue || 0,
        items: [toGA4Item(product)]
      });
    },

    /* Click on a product card */
    selectItem: function (product, listName) {
      push('select_item', {
        item_list_name: listName || 'catalog',
        items: [toGA4Item(product)]
      });
    },

    /* Search box */
    search: function (term, resultsCount) {
      push('search', {
        search_term: term,
        results_count: resultsCount
      });
    },

    /* "Buy" / "ابدأ الآن" / external link */
    clickBuy: function (product, options) {
      options = options || {};
      var payload = {
        item_list_name: options.listName || 'product_page',
        value: product.priceValue || 0,
        items: [toGA4Item(product)],
        outbound_url: options.url || product.url || ''
      };
      push('click_buy', payload);

      /* Google Ads conversion (only if configured) */
      if (CONFIG.ADS_ID && CONFIG.ADS_CONVERSION_LABEL) {
        gtag('event', 'conversion', {
          send_to: CONFIG.ADS_ID + '/' + CONFIG.ADS_CONVERSION_LABEL,
          value: product.priceValue || 0,
          currency: CONFIG.CURRENCY,
          transaction_id: product.id + '-' + Date.now()
        });
        log('ads_conversion', payload);
      }
    },

    /* Seller box click */
    viewSeller: function (product, sellerName) {
      push('view_seller', {
        seller: sellerName || product.seller,
        items: [toGA4Item(product)]
      });
    },

    /* Hero banners / promos */
    viewPromotion: function (promotion) {
      push('view_promotion', promotion);
    },
    selectPromotion: function (promotion) {
      push('select_promotion', promotion);
    }
  };

  /* ---------- 7. GA4 item formatter ---------- */
  function toGA4Item(p) {
    return {
      item_id: p.id,
      item_name: p.name,
      item_category: p.category,
      item_brand: p.seller || 'HERO',
      price: p.priceValue || 0,
      currency: CONFIG.CURRENCY
    };
  }

  /* ---------- 8. Auto-tracking via data-* attributes ---------- */
  /* Usage:
       <a data-hero-event="click_buy" data-hero-id="trend-studio" ...>
  */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-hero-event]');
    if (!el) return;
    var name = el.getAttribute('data-hero-event');
    var id   = el.getAttribute('data-hero-id') || '';
    var list = el.getAttribute('data-hero-list') || 'catalog';
    push(name, { item_id: id, item_list_name: list });
  }, true);

  /* ---------- 9. Expose + fire initial page_view ---------- */
  window.HeroTrack = HeroTrack;
  window.HERO_ANALYTICS = CONFIG;

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    HeroTrack.pageView();
  } else {
    document.addEventListener('DOMContentLoaded', function () { HeroTrack.pageView(); });
  }

})(window, document);
