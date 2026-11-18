/* ============================================================
   Executive Movement — consent.js
   Banner de consentimento de cookies (LGPD) + Google Consent Mode v2.

   Funciona em conjunto com o trecho inline do <head> de cada página, que:
     1) define o consentimento padrão como NEGADO antes do GTM carregar;
     2) reaplica a escolha guardada, se houver (dcGetConsent).

   Categorias:
     - Necessários: sempre ativos (guardam a própria escolha).
     - Análise:     Google Analytics            -> analytics_storage
     - Marketing:   Google Ads              -> ad_storage, ad_user_data, ad_personalization

   A escolha fica em localStorage ('dc_consent') por 12 meses.
   Para reabrir: qualquer elemento com [data-open-consent] (link do rodapé).
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'dc_consent';
  var root, custom, boxes = {};

  function gtagSafe() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }
  var gt = window.gtag || gtagSafe;

  function persist(analytics, marketing) {
    var c = { v: 1, necessary: true, analytics: !!analytics, marketing: !!marketing, ts: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }

  // Avisa o Google (Consent Mode) e o GTM. O evento 'consent_update' serve para
  // disparar de novo as tags que ficaram bloqueadas antes da escolha.
  function announce(c) {
    gt('consent', 'update', window.dcConsentSignals(c));
    window.dataLayer.push({
      event: 'consent_update',
      dc_event: undefined,                 // não deixa o GTM tratar isto como evento do site
      consent_analytics: c.analytics,
      consent_marketing: c.marketing
    });
  }

  // Sem Análise nem Marketing, apaga o que o site guardou na sessão (UTM, tempo, página de entrada)
  function clearSession() {
    ['dc_utm', 'dc_landing', 'dc_active_ms', 'dc_time_fired'].forEach(function (k) {
      try { sessionStorage.removeItem(k); } catch (e) {}
    });
  }

  function choose(analytics, marketing) {
    announce(persist(analytics, marketing));
    if (!analytics && !marketing) clearSession();
    hide();
  }

  // Aceitar, Recusar e Personalizar têm o mesmo peso visual de propósito: o guia da ANPD (2022)
  // pede botão de rejeitar de fácil visualização e sem maior destaque só para o aceite.
  function build() {
    root = document.createElement('div');
    root.className = 'cc';
    root.id = 'dcCookie';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-labelledby', 'ccTitle');
    root.setAttribute('aria-describedby', 'ccDesc');
    root.hidden = true;
    root.innerHTML =
      '<h2 id="ccTitle">Sua privacidade</h2>' +
      '<p id="ccDesc">Usamos cookies para o site funcionar, entender como ele é usado e medir nossos anúncios. ' +
      'Você escolhe o que permitir. <a href="/politica-de-cookies.html">Política de cookies</a></p>' +
      '<div class="cc-custom" hidden>' +
        row('Necessários', 'Fazem o site funcionar e guardam as suas escolhas. Sempre ativos.', 'necessary', true, true) +
        row('Análise', 'Mostram como o site é usado, para melhorarmos a experiência (Google Analytics).', 'analytics', false, false) +
        row('Marketing', 'Medem a eficácia dos anúncios e permitem mostrar anúncios relevantes (Google Ads).', 'marketing', false, false) +
      '</div>' +
      '<div class="cc-actions">' +
        '<button type="button" class="btn btn-ghost" data-cc="accept">Aceitar todos</button>' +
        '<button type="button" class="btn btn-ghost" data-cc="reject">Recusar</button>' +
        '<button type="button" class="btn btn-ghost" data-cc="customize">Personalizar</button>' +
      '</div>';
    document.body.appendChild(root);

    custom = root.querySelector('.cc-custom');
    ['analytics', 'marketing'].forEach(function (k) { boxes[k] = root.querySelector('[data-cc-cat="' + k + '"]'); });

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]');
      if (!b) return;
      var a = b.getAttribute('data-cc');
      if (a === 'accept') choose(true, true);
      else if (a === 'reject') choose(false, false);
      else if (a === 'customize') openCustom();
      else if (a === 'save') choose(boxes.analytics.checked, boxes.marketing.checked);
    });
  }

  function row(title, text, cat, checked, disabled) {
    return '<label class="cc-row"><span class="cc-row-text"><strong>' + title + '</strong><small>' + text + '</small></span>' +
      '<span class="cc-switch"><input type="checkbox" data-cc-cat="' + cat + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '><i></i></span></label>';
  }

  // Painel "Personalizar": mostra os interruptores e troca os botões
  function openCustom() {
    var c = window.dcGetConsent && window.dcGetConsent();
    boxes.analytics.checked = !!(c && c.analytics);
    boxes.marketing.checked = !!(c && c.marketing);
    custom.hidden = false;
    root.querySelector('.cc-actions').innerHTML =
      '<button type="button" class="btn btn-primary" data-cc="save">Salvar escolhas</button>' +
      '<button type="button" class="btn btn-ghost" data-cc="accept">Aceitar todos</button>';
    boxes.analytics.focus();
  }

  function show(customize) {
    if (!root) build();
    root.hidden = false;
    if (customize) openCustom();
  }

  function hide() {
    if (root) root.hidden = true;
  }

  // Reabrir (link "Preferências de cookies" no rodapé)
  window.dcOpenConsent = function () {
    if (root) {
      // volta ao estado inicial dos botões antes de abrir o painel
      root.parentNode.removeChild(root); root = null; boxes = {};
    }
    show(true);
  };

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.closest && t.closest('[data-open-consent]')) {
      e.preventDefault();
      window.dcOpenConsent();
    }
  });

  // Esc fecha o banner quando já existe uma escolha (nunca esconde a 1ª decisão)
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root && !root.hidden && window.dcGetConsent && window.dcGetConsent()) hide();
  });

  function init() {
    if (!window.dcGetConsent || !window.dcConsentSignals) return;   // trecho do <head> ausente
    if (!window.dcGetConsent()) show(false);                        // 1ª visita (ou escolha com mais de 12 meses)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
