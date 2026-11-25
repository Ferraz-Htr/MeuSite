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

  var css = '.wl-ov .wl-box{display:block !important;grid-template-columns:none !important;gap:0 !important}.wl-ov .wl-box>*{grid-column:auto !important;max-width:none}' +
    '.wl-ov{position:fixed;inset:0;background:rgba(8,8,8,.7);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);z-index:100000;display:none;align-items:center;justify-content:center;padding:16px}' +
    '.wl-ov.on{display:flex}.wl-ov.on .wl-box{animation:wlIn .25s ease}@keyframes wlIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}' +
    '.wl-box{background:#111;color:#fff;border:1px solid rgba(255,255,255,.08);border-radius:20px;max-width:400px;width:100%;padding:36px 30px 26px;box-shadow:0 40px 90px rgba(0,0,0,.65);font-family:Inter,system-ui,sans-serif;position:relative}' +
    '.wl-box h3{margin:0 0 8px;font-family:Fraunces,Georgia,serif;font-weight:500;font-size:28px;line-height:1.15;color:#fff}' +
    '.wl-box h3 em{font-style:italic;color:#E4C87E}' +
    '.wl-box p.wl-sub{margin:0 0 24px;font-size:14px;color:rgba(255,255,255,.6);line-height:1.55}' +
    '.wl-f{margin:0 0 14px;position:relative}' +
    '.wl-box label{display:block;width:auto !important;font-family:Inter,system-ui,sans-serif !important;text-transform:none !important;letter-spacing:0 !important;font-size:13px;font-weight:500;color:rgba(255,255,255,.7);margin:0 0 6px}' +
    '.wl-box input,.wl-box textarea{width:100%;box-sizing:border-box;padding:14px 16px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.05);color:#fff;font:inherit;font-size:16px;outline:none;box-shadow:none;transition:border-color .2s,background .2s}' +
    '.wl-box input:focus,.wl-box textarea:focus{border-color:#C6A15B;background:rgba(198,161,91,.07)}' +
    '.wl-box ::placeholder{color:rgba(255,255,255,.3)}' +
    '.wl-box textarea{min-height:76px;resize:none;line-height:1.45}' +
    '.wl-err{display:none;color:#f09b9b;font-size:12px;margin-top:6px}.wl-f.bad .wl-err{display:block}.wl-f.bad input{border-color:#f09b9b}' +
    '.wl-btn{margin-top:10px;width:100%;padding:16px;border:0;border-radius:999px;background:linear-gradient(180deg,#E4C87E,#C6A15B);color:#111;font:inherit;font-weight:700;font-size:15px;cursor:pointer;transition:transform .15s,filter .2s}' +
    '.wl-btn:hover{filter:brightness(1.07);transform:translateY(-1px)}' +
    '.wl-note{margin:14px 0 0;text-align:center;font-size:12px;color:rgba(255,255,255,.38)}' +
    '.wl-x{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.07);border:0;font-size:20px;line-height:1;cursor:pointer;color:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;padding:0}.wl-x:hover{background:rgba(255,255,255,.14)}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ov = document.createElement('div');
  ov.className = 'wl-ov';
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = '<form class="wl-box" id="wlForm" novalidate><button type="button" class="wl-x" aria-label="Fechar">&times;</button>' +
    '<h3>Solicitar <em>orçamento</em></h3><p class="wl-sub">Conte o que você precisa e continue o atendimento pelo WhatsApp.</p>' +
    '<div class="wl-f"><label for="wlNome">Nome</label><input id="wlNome" name="nome" required autocomplete="name" placeholder="Seu nome"></div>' +
    '<div class="wl-f" id="wlTelBox"><label for="wlTel">Seu WhatsApp</label><input id="wlTel" name="tel" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="(51) 99999-9999" maxlength="15"><div class="wl-err">Informe um número válido com DDD.</div></div>' +
    '<div class="wl-f"><label for="wlServ">Serviço desejado</label><textarea id="wlServ" name="servico" required placeholder="Ex.: transfer do aeroporto, city tour, Gramado..."></textarea></div>' +
    '<button type="submit" class="wl-btn">Continuar no WhatsApp</button>' +
    '<p class="wl-note">Usamos seus dados apenas para o atendimento.</p></form>';
  document.body.appendChild(ov);

  var form = ov.querySelector('#wlForm'), pending = null;
  function close() { ov.classList.remove('on'); pending = null; }
  ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('.wl-x')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  var tel = ov.querySelector('#wlTel');
  function maskTel(v) {
    var d = String(v).replace(/\D/g, '');
    if (d.indexOf('55') === 0 && d.length > 11) d = d.slice(2);
    d = d.slice(0, 11);
    if (d.length > 6) return '(' + d.slice(0,2) + ') ' + d.slice(2, d.length > 10 ? 7 : 6) + '-' + d.slice(d.length > 10 ? 7 : 6);
    if (d.length > 2) return '(' + d.slice(0,2) + ') ' + d.slice(2);
    return d ? '(' + d : '';
  }
  tel.addEventListener('input', function () { tel.value = maskTel(tel.value); ov.querySelector('#wlTelBox').classList.remove('bad'); });
  function telOk(v) { var d = v.replace(/\D/g, ''); return (d.length === 10 || d.length === 11) && +d.slice(0,2) >= 11 && (d.length === 10 || d.charAt(2) === '9'); }

  function origin(a) { return a.closest('.wa-float') ? 'Botão flutuante' : a.closest('footer') ? (/^tel:/i.test(a.getAttribute('href')) ? 'Telefone (rodapé)' : 'WhatsApp (rodapé)') : a.getAttribute('data-servico') ? 'Saber mais — ' + a.getAttribute('data-servico') : a.hasAttribute('data-lead-modal') ? 'Botão Solicitar orçamento (topo)' : 'Menu superior'; }
  function originKey(o) { return o === 'Botão flutuante' ? 'flutuante' : /rodapé/.test(o) ? 'rodape' : /Saber mais/.test(o) ? 'passeio' : /Solicitar/.test(o) ? 'hero' : 'menu'; }

  document.addEventListener('click', function (e) {
    var a = e.target instanceof Element && e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href^="tel:"], a[data-lead-modal]');
    if (!a) return;
    e.preventDefault();
    pending = { href: a.href, origem: origin(a) };
    form.servico.value = a.getAttribute('data-servico') || '';
    form.querySelector('.wl-btn').textContent = /^tel:/i.test(a.getAttribute('href')) ? 'Continuar para ligar' : 'Continuar no WhatsApp';
    ov.classList.add('on');
    setTimeout(function () { var n = document.getElementById('wlNome'); if (n) n.focus(); }, 50);
  });


  // ---- envio confiável do lead por e-mail (fila + reenvio + status no dataLayer) ----
  var QK = 'dc_lead_queue';
  function qGet(){ try { return JSON.parse(localStorage.getItem(QK) || '[]'); } catch(e){ return []; } }
  function qSet(a){ try { localStorage.setItem(QK, JSON.stringify(a.slice(-10))); } catch(e){} }
  function dl(ev, extra){ try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: ev }, extra || {})); } catch(e){} }
  function post(item){
    var cfg = window.DC_CONFIG || {};
    var url = 'https://formsubmit.co/ajax/' + encodeURIComponent(cfg.formEmail);
    return fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', 'Accept':'application/json' }, body: JSON.stringify(item.data), keepalive: true })
      .then(function (r) { return r.json().catch(function(){ return {}; }).then(function (j) {
        if (!r.ok || (j && (j.success === false || j.success === 'false'))) throw new Error('fs_' + r.status);
        return true; }); });
  }
  function done(id){ qSet(qGet().filter(function(x){ return x.id !== id; })); }
  function send(item, tries){
    return post(item).then(function(){ done(item.id); dl('lead_email_sent', { lead_form: item.form }); })
      .catch(function(err){
        if (tries < 2) { return new Promise(function(r){ setTimeout(r, 1500); }).then(function(){ return send(item, tries + 1); }); }
        dl('lead_email_failed', { lead_form: item.form, error: String(err && err.message || err) });
        try { var cfg = window.DC_CONFIG||{}; var b = new URLSearchParams(); Object.keys(item.data).forEach(function(k){ b.append(k, item.data[k]); });
          if (navigator.sendBeacon) navigator.sendBeacon('https://formsubmit.co/ajax/' + encodeURIComponent(cfg.formEmail), b); } catch(e){}
      });
  }
  window.dcSendLead = function (data, form) {
    var cfg = window.DC_CONFIG || {};
    if (!cfg.formEmail) return;
    data = Object.assign({ _cc: cfg.formEmailCc || '', _template: 'table', _captcha: 'false' }, data);
    var item = { id: Date.now() + '_' + Math.random().toString(36).slice(2, 7), form: form || '', data: data };
    var q = qGet(); q.push(item); qSet(q);
    send(item, 0);
  };
  // reenvia leads que ficaram pendentes (página fechou antes da confirmação)
  setTimeout(function () {
    if (!(window.DC_CONFIG || {}).formEmail) return;
    qGet().forEach(function (it) {
      if (Date.now() - parseInt(it.id, 10) < 5000) return;
      it.data._subject = '[reenvio] ' + (it.data._subject || 'Novo lead site');
      send(it, 0);
    });
  }, 2500);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!pending) return close();
    var nome = form.nome.value.trim(), zap = form.tel.value.trim(), serv = form.servico.value.trim();
    if (!nome || !serv) { (!nome ? form.nome : form.servico).focus(); return; }
    if (!telOk(zap)) { ov.querySelector('#wlTelBox').classList.add('bad'); tel.focus(); return; }
    var o = pending; close();

    if (window.dcTrackLead) window.dcTrackLead({ form_id: 'whatsapp_modal', form_name: 'whatsapp_' + originKey(o.origem), lead_type: 'whatsapp' });

    window.dcSendLead(Object.assign({
      _subject: window.dcLeadSubject(),
      Nome: nome, WhatsApp: zap, 'Serviço desejado': serv, Origem: o.origem, Página: pageName()
    }, window.dcUtmFields()), 'whatsapp_modal');

    if (/^tel:/i.test(o.href)) { form.reset(); window.location.href = o.href; return; }
    var base = o.href.split('?')[0];
    var msg = 'Olá! Gostaria de um orçamento personalizado.\nNome: ' + nome + '\nWhatsApp: ' + zap + '\nServiço desejado: ' + serv;
    window.open(base + '?text=' + encodeURIComponent(msg), '_blank');
    form.reset();
  });
})();
