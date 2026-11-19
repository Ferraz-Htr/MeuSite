/* Captura de lead nos botões de WhatsApp (menu superior e flutuante):
   abre um mini-formulário (nome, e-mail, serviço desejado), envia por e-mail
   e segue para o WhatsApp. Usa DC_CONFIG.formEmail / formEmailCc (js/config.js). */
(function () {
  'use strict';
  var BRAND = 'Executive Movement';

  function pageName() {
    var p = location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '');
    if (!p) return 'Home';
    var s = p.split('/').pop().replace(/\.html$/, '').replace(/-/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  window.dcLeadSubject = function () { return 'Novo lead site ' + BRAND + ' - ' + pageName(); };

  var css = '.wl-ov{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100000;display:none;align-items:center;justify-content:center;padding:16px}' +
    '.wl-ov.on{display:flex}' +
    '.wl-box{background:#fff;color:#111;border-radius:14px;max-width:420px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.4);font-family:inherit;position:relative}' +
    '.wl-box h3{margin:0 0 4px;font-size:20px}.wl-box p{margin:0 0 16px;font-size:14px;color:#555}' +
    '.wl-box label{display:block;font-size:13px;font-weight:600;margin:10px 0 4px}' +
    '.wl-box input,.wl-box textarea{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #ccc;border-radius:8px;font:inherit;font-size:15px}' +
    '.wl-box textarea{min-height:70px;resize:vertical}' +
    '.wl-btn{margin-top:16px;width:100%;padding:13px;border:0;border-radius:999px;background:#25d366;color:#fff;font:inherit;font-weight:700;font-size:15px;cursor:pointer}' +
    '.wl-x{position:absolute;top:8px;right:12px;background:none;border:0;font-size:26px;line-height:1;cursor:pointer;color:#666}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ov = document.createElement('div');
  ov.className = 'wl-ov';
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = '<form class="wl-box" id="wlForm"><button type="button" class="wl-x" aria-label="Fechar">&times;</button>' +
    '<h3>Falar no WhatsApp</h3><p>Preencha para iniciarmos o atendimento.</p>' +
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
          body: JSON.stringify({
            _subject: window.dcLeadSubject(), _cc: cfg.formEmailCc || '', _template: 'table', _captcha: 'false',
            Nome: nome, Email: email, 'Serviço desejado': serv, Origem: o.origem, Página: pageName()
          }),
          keepalive: true
        }).catch(function () {});
      } catch (err) {}
    }

    var base = o.href.split('?')[0];
    var msg = 'Olá! Meu nome é ' + nome + '. Gostaria de: ' + serv;
    window.open(base + '?text=' + encodeURIComponent(msg), '_blank');
    form.reset();
  });
})();
