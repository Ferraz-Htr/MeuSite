/* Captura de lead nos botões de WhatsApp (menu superior e flutuante):
   abre um mini-formulário (nome, e-mail, serviço desejado), envia por e-mail
   e segue para o WhatsApp. Usa DC_CONFIG.formEmail / formEmailCc (js/config.js). */
(function () {
  'use strict';
  var BRAND = 'Executive Movement';

  /* ---------- UTMs / origem do tráfego ---------- */
  var UKEYS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','gbraid','wbraid'];
  var UL = { utm_source:'UTM Source', utm_medium:'UTM Medium', utm_campaign:'UTM Campaign', utm_term:'UTM Term', utm_content:'UTM Content', gclid:'GCLID', gbraid:'GBRAID', wbraid:'WBRAID' };
  function ssGet(k){ try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch(e){ return null; } }
  function ssSet(k,v){ try { sessionStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  (function captureUtm(){
    var q = new URLSearchParams(location.search), found = {}, any = false;
    UKEYS.forEach(function(k){ var v = q.get(k); if (v) { found[k] = v; any = true; } });
    var cur = ssGet('dc_utm');
    if (any) { found.landing_page = location.href.split('#')[0]; found.referrer = document.referrer || ''; ssSet('dc_utm', found); }
    else if (!cur) { ssSet('dc_utm', { landing_page: location.href.split('#')[0], referrer: document.referrer || '' }); }
  })();
  /* devolve os campos de origem prontos para entrar no e-mail */
  window.dcUtmFields = function () {
    var u = ssGet('dc_utm') || {}, out = {};
    UKEYS.forEach(function(k){ if (u[k]) out[UL[k]] = u[k]; });
    out['Página de entrada'] = u.landing_page || location.href.split('#')[0];
    out['Referrer'] = u.referrer || 'direto';
    if (!u.utm_source && !u.gclid) out['Origem do tráfego'] = u.referrer ? 'Orgânico/Referência' : 'Direto';
    else out['Origem do tráfego'] = u.gclid ? 'Google Ads' : (u.utm_source + (u.utm_medium ? ' / ' + u.utm_medium : ''));
    return out;
  };

  function pageName() {
    var p = location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '');
    if (!p) return 'Home';
    var s = p.split('/').pop().replace(/\.html$/, '').replace(/-/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  window.dcLeadSubject = function () { return 'Novo lead site ' + BRAND + ' - ' + pageName(); };

  var css = '.wl-ov .wl-box{display:block !important;grid-template-columns:none !important;gap:0 !important}.wl-ov .wl-box>*{grid-column:auto !important;max-width:none}.wl-box label{width:auto !important}.wl-ov{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:100000;display:none;align-items:center;justify-content:center;padding:16px}' +
    '.wl-ov.on{display:flex}' +
    '.wl-box{background:#0A0A0A;color:#fff;border:1px solid #C6A15B;border-radius:2px;max-width:440px;width:100%;padding:32px 28px 28px;box-shadow:0 24px 70px rgba(0,0,0,.6);font-family:Inter,system-ui,sans-serif;position:relative}' +
    '.wl-box h3{margin:0 0 6px;font-family:Fraunces,Georgia,serif;font-weight:500;font-size:26px;color:#E4C87E;letter-spacing:.2px}' +
    '.wl-box p{margin:0 0 18px;font-size:14px;color:rgba(255,255,255,.7);line-height:1.5}' +
    '.wl-box label{display:block;font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#C6A15B;margin:14px 0 6px}' +
    '.wl-box input,.wl-box textarea{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid rgba(198,161,91,.45);border-radius:2px;background:#151515;color:#fff;font:inherit;font-size:15px;outline:none}' +
    '.wl-box input:focus,.wl-box textarea:focus{border-color:#E4C87E}' +
    '.wl-box ::placeholder{color:rgba(255,255,255,.35)}' +
    '.wl-box textarea{min-height:84px;resize:vertical}' +
    '.wl-btn{margin-top:22px;width:100%;padding:15px;border:0;border-radius:2px;background:#C6A15B;color:#0A0A0A;font:inherit;font-weight:700;font-size:13px;letter-spacing:1.6px;text-transform:uppercase;cursor:pointer;transition:background .2s}' +
    '.wl-btn:hover{background:#E4C87E}' +
    '.wl-x{position:absolute;top:10px;right:14px;background:none;border:0;font-size:28px;line-height:1;cursor:pointer;color:rgba(255,255,255,.6)}.wl-x:hover{color:#E4C87E}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ov = document.createElement('div');
  ov.className = 'wl-ov';
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = '<form class="wl-box" id="wlForm"><button type="button" class="wl-x" aria-label="Fechar">&times;</button>' +
    '<h3>Solicitar orçamento</h3><p>Conte-nos o que você precisa e continue o atendimento pelo WhatsApp.</p>' +
    '<label for="wlNome">Nome</label><input id="wlNome" name="nome" required autocomplete="name">' +
    '<label for="wlEmail">E-mail</label><input id="wlEmail" name="email" type="email" required autocomplete="email">' +
    '<label for="wlServ">Serviço desejado</label><textarea id="wlServ" name="servico" required placeholder="Ex.: transfer do aeroporto, city tour, roteiro em Gramado..."></textarea>' +
    '<button type="submit" class="wl-btn">Continuar no WhatsApp</button></form>';
  document.body.appendChild(ov);

  var form = ov.querySelector('#wlForm'), pending = null;
  function close() { ov.classList.remove('on'); pending = null; }
  ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('.wl-x')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function origin(a) { return a.closest('.wa-float') ? 'Botão flutuante' : 'Menu superior'; }

  document.addEventListener('click', function (e) {
    var a = e.target instanceof Element && e.target.closest('a.wa-float, #siteHeader a[href*="wa.me"]');
    if (!a) return;
    e.preventDefault();
    pending = { href: a.href, origem: origin(a) };
    ov.classList.add('on');
    setTimeout(function () { var n = document.getElementById('wlNome'); if (n) n.focus(); }, 50);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!pending) return close();
    var nome = form.nome.value.trim(), email = form.email.value.trim(), serv = form.servico.value.trim();
    var o = pending; close();

    if (window.dcTrackLead) window.dcTrackLead({ form_id: 'whatsapp_modal', form_name: 'whatsapp_' + (o.origem === 'Botão flutuante' ? 'flutuante' : 'menu'), lead_type: 'whatsapp' });

    var cfg = window.DC_CONFIG || {};
    if (cfg.formEmail) {
      try {
        fetch('https://formsubmit.co/ajax/' + encodeURIComponent(cfg.formEmail), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(Object.assign({
            _subject: window.dcLeadSubject(), _cc: cfg.formEmailCc || '', _template: 'table', _captcha: 'false',
            Nome: nome, Email: email, 'Serviço desejado': serv, Origem: o.origem, Página: pageName()
          }, window.dcUtmFields())),
          keepalive: true
        }).catch(function () {});
      } catch (err) {}
    }

    var base = o.href.split('?')[0];
    var msg = 'Olá! Gostaria de um orçamento personalizado.\nNome: ' + nome + '\nEmail: ' + email + '\nServiço desejado: ' + serv;
    window.open(base + '?text=' + encodeURIComponent(msg), '_blank');
    form.reset();
  });
})();
