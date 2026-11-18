/* ============================================================
   Executive Movement — tracking.js
   Envia eventos para o dataLayer do GTM (GTM-W9K26S6W).
   O GTM é quem repassa para GA4 e Google Ads.

   NÃO coloque aqui IDs de GA4/Ads: eles ficam no container do GTM.

   Para testar sem abrir o GTM: no console do navegador rode
       localStorage.setItem('dc_debug', '1')
   e recarregue a página. Cada evento aparece no console como [dc-track].
   (Para desligar: localStorage.removeItem('dc_debug'))
   ============================================================ */
(function () {
  'use strict';

  var w = window;
  w.dataLayer = w.dataLayer || [];

  var DEBUG = false;
  try { DEBUG = localStorage.getItem('dc_debug') === '1'; } catch (e) {}

  /* ---------- Utilitários ---------- */
  function slug(s) {
    return String(s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }
  function uid() {
    return (w.crypto && w.crypto.randomUUID) ? w.crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  // Só grava no navegador (sessionStorage) se a pessoa permitiu Análise ou Marketing.
  // Sem consentimento, os valores ficam apenas em memória, durante a página.
  var mem = {};
  function allowed() {
    var c = w.dcGetConsent && w.dcGetConsent();
    return !!(c && (c.analytics || c.marketing));
  }
  function store(key, value) {
    if (value === undefined) {
      try { var v = sessionStorage.getItem(key); if (v !== null) return v; } catch (e) {}
      return mem[key] === undefined ? null : mem[key];
    }
    mem[key] = value;
    if (allowed()) { try { sessionStorage.setItem(key, value); } catch (e) {} }
    return null;
  }
  function pageSlug() {
    var p = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/^\/|\/$/g, '');
    return p || 'home';
  }

  /* ---------- UTM (persistem durante a sessão da aba) ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  function getUtm() {
    var stored = {};
    try { stored = JSON.parse(store('dc_utm') || '{}'); } catch (e) {}
    var fromUrl = {};
    try {
      var qs = new URLSearchParams(location.search);
      UTM_KEYS.forEach(function (k) { if (qs.get(k)) fromUrl[k] = qs.get(k).slice(0, 100); });
    } catch (e) {}
    if (Object.keys(fromUrl).length) {            // chegou com UTM nova: substitui a anterior
      stored = fromUrl;
      store('dc_utm', JSON.stringify(stored));
    }
    return stored;
  }
  function landing() {
    var l = store('dc_landing') || location.pathname;
    store('dc_landing', l);
    return l;
  }
  w.dcGetUtm = getUtm;

  /* ---------- Envio ao dataLayer ----------
     Todo evento carrega a MESMA lista de chaves. As que não se aplicam vão como
     undefined: isso limpa o valor do evento anterior (o dataLayer do GTM guarda o
     último valor de cada chave e, sem isso, um evento herdaria dados do outro). */
  var PARAM_KEYS = [
    'link_name', 'link_location', 'link_type', 'link_text', 'link_url', 'link_domain',
    'section_name', 'percent_scrolled', 'seconds',
    'form_id', 'form_name', 'lead_type', 'service', 'first_field',
    'whatsapp_origin', 'carousel_name', 'direction', 'method',
    'faq_question', 'menu_state'
  ];

  function track(eventName, params) {
    params = params || {};
    var utm = getUtm();
    var payload = {
      event: eventName,
      dc_event: true,
      event_id: uid(),
      landing_page: landing()
    };
    PARAM_KEYS.forEach(function (k) { payload[k] = params[k]; });
    UTM_KEYS.forEach(function (k) { payload[k] = utm[k]; });
    w.dataLayer.push(payload);
    if (DEBUG && w.console) console.log('[dc-track]', eventName, payload);
  }
  w.dcTrack = track;

  /* Lead (envio de formulário): dispara lead_form_submit + generate_lead.
     generate_lead é o evento padrão do GA4 para lead; marque-o como evento-chave. */
  w.dcTrackLead = function (info) {
    info = info || {};
    if (!info.form_name) info.form_name = (info.form_id || 'form') + '_' + pageSlug();
    track('lead_form_submit', info);
    track('generate_lead', info);
  };

  /* ---------- Nomes de seção e localização de cada elemento ---------- */
  var SECTION_NAMES = {
    'topo': 'hero', 'turismo': 'turismo', 'sobre': 'sobre', 'orcamento': 'orcamento',
    'servicos': 'servicos', 'duvida': 'faq', 'contato': 'rodape'
  };
  function sectionName(sec) {
    if (sec.id && SECTION_NAMES[sec.id]) return SECTION_NAMES[sec.id];
    return sec.id ? slug(sec.id) : 'secao';
  }
  function locationOf(el) {
    if (el.closest('.wa-float')) return 'flutuante';
    if (el.closest('#siteHeader')) return 'navbar';
    if (el.closest('footer')) return 'rodape';
    var sec = el.closest('section');
    return sec ? sectionName(sec) : 'pagina';
  }

  /* ---------- Cliques em links ---------- */
  function linkType(a) {
    var href = a.getAttribute('href') || '';
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)/i.test(a.href)) return 'whatsapp';
    if (/^mailto:/i.test(href)) return 'email';
    if (/^tel:/i.test(href)) return 'phone';
    var u;
    try { u = new URL(a.href, location.href); } catch (e) { return 'other'; }
    if (u.origin !== location.origin) return 'outbound';
    if (href.charAt(0) === '#' || (u.pathname === location.pathname && u.hash)) return 'anchor';
    return 'internal';
  }
  function labelOf(a) {
    var h = a.querySelector('h3, h4');
    var t = a.getAttribute('data-track-label') || a.getAttribute('aria-label') || (h && h.textContent) || a.textContent;
    t = String(t || '').replace(/[→›»]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) { var img = a.querySelector('img'); t = (img && img.alt) || a.getAttribute('href') || ''; }
    return t;
  }

  function onLinkClick(a) {
    var href = a.getAttribute('href');
    if (!href || /^javascript:/i.test(href)) return;
    var type = linkType(a);
    var loc = locationOf(a);
    var label = labelOf(a);
    var name = a.getAttribute('data-track') || (loc + '_' + slug(label));
    var base = {
      link_name: name,
      link_location: loc,
      link_type: type,
      link_text: label.slice(0, 100),
      link_url: a.href,
      link_domain: (function () { try { return new URL(a.href).hostname; } catch (e) { return undefined; } })()
    };
    if (type === 'whatsapp') { base.whatsapp_origin = loc; return track('click_whatsapp', base); }
    if (type === 'email')    return track('click_email', base);
    if (type === 'phone')    return track('click_telefone', base);
    track(('click_' + name).slice(0, 40).replace(/_+$/, ''), base);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;

    // Hambúrguer do menu (roda antes do script da página alternar a classe)
    var toggle = t.closest('#menuToggle');
    if (toggle) {
      var h = document.getElementById('siteHeader');
      return track('menu_toggle', { menu_state: h && h.classList.contains('open') ? 'fechar' : 'abrir' });
    }

    // FAQ: pergunta aberta (roda antes do accordion; só conta quando vai abrir)
    var q = t.closest('.faq-q');
    if (q) {
      var item = q.closest('.faq-item');
      var txt = q.textContent.replace('+', '').replace(/\s+/g, ' ').trim();
      if (item && !item.classList.contains('open') && txt && !faqSeen[txt]) {
        faqSeen[txt] = true;
        track('faq_open', { faq_question: txt.slice(0, 100), link_location: 'faq' });
      }
      return;
    }

    var a = t.closest('a[href]');
    if (a) onLinkClick(a);
  }, true);
  var faqSeen = {};

  /* ---------- Formulários: começou a preencher ---------- */
  var startedForms = {};
  function onFieldInput(e) {
    var t = e.target;
    if (!(t instanceof Element) || !t.matches('input, select, textarea')) return;
    var id, name;
    if (t.closest('#quoteForm')) { id = 'orcamento'; name = 'orcamento_' + pageSlug(); }
    else return;
    if (startedForms[id]) return;
    startedForms[id] = true;
    track('lead_form_start', {
      form_id: id, form_name: name,
      first_field: t.name || t.id || t.type,
      link_location: locationOf(t)
    });
  }
  document.addEventListener('input', onFieldInput, true);
  document.addEventListener('change', onFieldInput, true);

  /* ---------- Rolagem: 25 / 50 / 75 / 100% ---------- */
  function initScrollDepth() {
    var marks = [25, 50, 75, 100], fired = {}, ticking = false;
    function check() {
      ticking = false;
      var scrollable = document.documentElement.scrollHeight - w.innerHeight;
      if (scrollable <= 0) return;
      var pct = Math.min(100, Math.round((w.scrollY / scrollable) * 100));
      marks.forEach(function (m) {
        if (pct >= m && !fired[m]) { fired[m] = true; track('scroll_depth', { percent_scrolled: m }); }
      });
    }
    w.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; w.requestAnimationFrame(check); }
    }, { passive: true });
  }

  /* ---------- Seções vistas (navegação na página) ---------- */
  function initSectionViews() {
    if (!('IntersectionObserver' in w)) return;
    var secs = Array.prototype.slice.call(document.querySelectorAll('body > section, body > footer'));
    var seen = {};
    var thresholds = []; for (var i = 0; i <= 10; i++) thresholds.push(i / 10);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var name = en.target.tagName === 'FOOTER' ? 'rodape' : sectionName(en.target);
        if (seen[name]) return;
        var visibleH = en.intersectionRect.height;
        var need = Math.min(en.boundingClientRect.height * 0.5, w.innerHeight * 0.4);
        if (visibleH > 0 && visibleH >= need) {
          seen[name] = true;
          track('section_view', { section_name: name });
          io.unobserve(en.target);
        }
      });
    }, { threshold: thresholds });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Tempo de sessão (soma das páginas, só com a aba visível) ---------- */
  function initSessionTime() {
    var MILESTONES = [30, 60, 120, 300, 600];       // segundos ativos na sessão
    var active = Number(store('dc_active_ms')) || 0;
    var fired = [];
    try { fired = JSON.parse(store('dc_time_fired') || '[]'); } catch (e) {}
    var last = Date.now();
    setInterval(function () {
      var now = Date.now(), dt = now - last; last = now;
      if (document.visibilityState === 'visible') active += Math.min(dt, 2000);
      store('dc_active_ms', String(active));
      MILESTONES.forEach(function (m) {
        if (active >= m * 1000 && fired.indexOf(m) === -1) {
          fired.push(m);
          store('dc_time_fired', JSON.stringify(fired));
          track('session_time', { seconds: m });
        }
      });
    }, 1000);
  }

  /* ---------- Início ---------- */
  function init() {
    initScrollDepth();
    initSectionViews();
    initSessionTime();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
