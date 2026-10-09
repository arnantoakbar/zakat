/*!
 * Flavida · UI behaviours for flavida-extra.css / flavida-app.css  (classic script, adds to window.Flavida)
 * Load after js/flavida.js. Everything is declarative (data-* hooks) and also callable:
 *   dialogs     [data-dialog-open="#id"]  [data-dialog-close]       sheets drag down to dismiss (.fl-sheet--bottom)
 *   popovers    [popovertarget] + .fl-pop  (auto-placed; data-placement="bottom|top|right|left")  menus: role="menu"
 *   hover card  [data-hovercard="#id"]       glossary  .fl-term[data-gloss="plain-language meaning"]
 *   steppers    .fl-stepper[data-min][data-max][data-step]   sliders  input.fl-range (fills the track, data-out="#id")
 *   otp         .fl-otp                      dropzone  .fl-drop  (data-accept=".pdf,image/*")   table sort  .fl-dt[data-sortable]
 *   flashcard   .fl-flash                    resizer   .fl-resizer       tab bar  .fl-tabbar (spring pill)
 *   theme       [data-theme-toggle]  Flavida.theme.set('dark'|'light'|'auto')   copy  [data-copy-html="#sel"]  [data-copy-text="…"]
 *   Flavida.combobox(el, {options}) · Flavida.calendar(el, opts) · Flavida.command(dialog, items, onPick)
 */
(function (root) {
  'use strict';
  var doc = root.document, F = root.Flavida || (root.Flavida = {}), M = root.Motion || null;
  if (!doc) return;
  var qs = function (s, c) { return (c || doc).querySelector(s); };
  var qsa = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduced = function () { return !!F.reduced; };
  var clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };
  var EASE = [0.16, 1, 0.3, 1];
  var uid = 0, nid = function (p) { return (p || 'fl') + '-' + (++uid); };

  /* ───────── dialogs and sheets ───────── */
  function dialogs() {
    doc.addEventListener('click', function (e) {
      var o = e.target.closest('[data-dialog-open]');
      if (o) { var d = qs(o.getAttribute('data-dialog-open')); if (d && d.showModal) { d.__opener = o; d.showModal(); } return; }
      var x = e.target.closest('[data-dialog-close]');
      if (x) { var dd = x.closest('dialog'); if (dd) dd.close(x.getAttribute('data-dialog-close') || ''); return; }
      var t = e.target; // light dismiss: click on the backdrop (the dialog element itself)
      if (t.matches && t.matches('dialog.fl-dialog, dialog.fl-sheet, dialog.fl-cmd') && !t.hasAttribute('data-no-dismiss')) {
        var r = t.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) t.close();
      }
    });
    doc.addEventListener('close', function (e) { var d = e.target; if (d && d.__opener && d.__opener.focus) d.__opener.focus(); }, true);
    // bottom sheet: drag the handle down to dismiss
    qsa('.fl-sheet--bottom').forEach(function (sh) {
      var h = qs('.fl-sheet__handle', sh); if (!h) return;
      var sy = null, dy = 0, t0 = 0;
      h.style.touchAction = 'none'; h.style.cursor = 'grab'; h.style.padding = '14px 0'; h.style.margin = '0 auto'; h.style.boxSizing = 'content-box';
      h.addEventListener('pointerdown', function (e) { sy = e.clientY; dy = 0; t0 = performance.now(); h.setPointerCapture(e.pointerId); sh.style.transition = 'none'; });
      h.addEventListener('pointermove', function (e) { if (sy === null) return; dy = Math.max(0, e.clientY - sy); sh.style.transform = 'translateY(' + dy + 'px)'; });
      var up = function () {
        if (sy === null) return; var v = dy / Math.max(1, performance.now() - t0); sy = null; sh.style.transition = '';
        sh.style.transform = '';
        if (dy > 110 || v > 0.6) sh.close();
      };
      h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
    });
  }

  /* ───────── popover placement, menus, hover cards ───────── */
  function place(trigger, pop, placement) {
    var r = trigger.getBoundingClientRect(), pw = pop.offsetWidth || 260, ph = pop.offsetHeight || 200, vw = root.innerWidth, vh = root.innerHeight, gap = 10, x, y;
    placement = placement || 'bottom';
    if (placement === 'right') { x = r.right + gap; y = r.top; if (x + pw > vw - 12) { x = r.left - pw - gap; } }
    else if (placement === 'left') { x = r.left - pw - gap; y = r.top; if (x < 12) x = r.right + gap; }
    else { x = r.left + r.width / 2 - pw / 2; y = placement === 'top' ? r.top - ph - gap : r.bottom + gap; if (placement === 'bottom' && y + ph > vh - 12 && r.top - ph - gap > 12) y = r.top - ph - gap; }
    pop.style.left = clamp(x, 12, Math.max(12, vw - pw - 12)) + 'px'; pop.style.top = clamp(y, 12, Math.max(12, vh - ph - 12)) + 'px';
  }
  F.placePopover = place;
  function popovers() {
    doc.addEventListener('beforetoggle', function (e) {
      var pop = e.target; if (!pop.classList || !pop.classList.contains('fl-pop') || e.newState !== 'open') return;
      var tr = qs('[popovertarget="' + pop.id + '"]') || pop.__trigger; if (!tr) return;
      pop.style.position = 'fixed'; pop.style.inset = 'auto'; place(tr, pop, tr.getAttribute('data-placement') || pop.getAttribute('data-placement'));
    }, true);
    doc.addEventListener('toggle', function (e) {
      var pop = e.target; if (!pop.classList || !pop.classList.contains('fl-pop')) return;
      var tr = qs('[popovertarget="' + pop.id + '"]'); if (tr) tr.setAttribute('aria-expanded', String(e.newState === 'open'));
      if (e.newState === 'open' && pop.getAttribute('role') === 'menu') { var first = qs('[role^="menuitem"]:not([aria-disabled="true"])', pop); if (first) first.focus(); }
      if (e.newState === 'open') place(tr || pop.__trigger || pop, pop, (tr && tr.getAttribute('data-placement')) || pop.getAttribute('data-placement'));
    }, true);
    doc.addEventListener('keydown', function (e) {
      var menu = e.target.closest && e.target.closest('[role="menu"]'); if (!menu) return;
      var items = qsa('[role^="menuitem"]:not([aria-disabled="true"])', menu), i = items.indexOf(doc.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); } else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key.length === 1 && /\S/.test(e.key)) { var k = e.key.toLowerCase(); for (var j = 1; j <= items.length; j++) { var it = items[(i + j) % items.length]; if (it.textContent.trim().toLowerCase().indexOf(k) === 0) { it.focus(); break; } } }
    });
    doc.addEventListener('click', function (e) {
      var it = e.target.closest('.fl-pop [role^="menuitem"]'); if (!it || it.hasAttribute('data-keep')) return;
      if (it.getAttribute('role') === 'menuitemradio') { qsa('[role="menuitemradio"]', it.parentNode).forEach(function (r) { r.setAttribute('aria-checked', String(r === it)); }); }
      else if (it.getAttribute('role') === 'menuitemcheckbox') it.setAttribute('aria-checked', String(it.getAttribute('aria-checked') !== 'true'));
      var pop = it.closest('[popover]'); if (pop && pop.hidePopover) pop.hidePopover();
    });
    // hover cards (open on hover or focus with a short delay)
    qsa('[data-hovercard]').forEach(function (tr) {
      var pop = qs(tr.getAttribute('data-hovercard')); if (!pop || !pop.showPopover) return; pop.setAttribute('popover', 'manual'); pop.__trigger = tr;
      var t; var open = function () { clearTimeout(t); t = setTimeout(function () { if (!pop.matches(':popover-open')) pop.showPopover(); }, 220); }, close = function () { clearTimeout(t); t = setTimeout(function () { if (pop.matches(':popover-open')) pop.hidePopover(); }, 160); };
      tr.addEventListener('pointerenter', open); tr.addEventListener('pointerleave', close); tr.addEventListener('focus', open); tr.addEventListener('blur', close);
      pop.addEventListener('pointerenter', function () { clearTimeout(t); }); pop.addEventListener('pointerleave', close);
    });
    // glossary terms: plain-language gloss in the same view
    var gl = null;
    qsa('.fl-term[data-gloss]').forEach(function (term) {
      if (term.tagName !== 'BUTTON') { term.setAttribute('tabindex', '0'); term.setAttribute('role', 'button'); }
      var show = function () {
        if (!gl) { gl = doc.createElement('div'); gl.className = 'fl-pop fl-pop--card'; gl.setAttribute('popover', 'manual'); gl.id = nid('gloss'); gl.setAttribute('role', 'tooltip'); doc.body.appendChild(gl); }
        gl.innerHTML = '<h4></h4><p></p>'; gl.querySelector('h4').textContent = term.textContent; gl.querySelector('p').textContent = term.getAttribute('data-gloss');
        gl.__trigger = term; gl.showPopover(); gl.style.position = 'fixed'; gl.style.inset = 'auto'; place(term, gl, 'bottom');
      };
      var hide = function () { if (gl && gl.matches(':popover-open')) gl.hidePopover(); };
      var pinned = false;
      term.addEventListener('click', function (e) { e.preventDefault(); if (pinned && gl && gl.matches(':popover-open') && gl.__trigger === term) { pinned = false; hide(); } else { pinned = true; show(); } });
      term.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = true; show(); } else if (e.key === 'Escape') { pinned = false; hide(); } });
      term.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') show(); }); term.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !pinned) hide(); });
      term.addEventListener('blur', function () { pinned = false; hide(); });
    });
  }

  /* ───────── steppers, sliders, counters, search, OTP ───────── */
  function inputs() {
    qsa('.fl-stepper').forEach(function (s) {
      var out = qs('output,input', s), minus = qs('[data-stepper-minus]', s) || qsa('button', s)[0], plus = qs('[data-stepper-plus]', s) || qsa('button', s)[1];
      var min = +(s.getAttribute('data-min') || 0), max = s.hasAttribute('data-max') ? +s.getAttribute('data-max') : Infinity, step = +(s.getAttribute('data-step') || 1);
      var get = function () { return +(out.value !== undefined && out.tagName === 'INPUT' ? out.value : out.textContent) || 0; };
      var set = function (v) { v = clamp(v, min, max); if (out.tagName === 'INPUT') out.value = v; else out.textContent = v; minus.disabled = v <= min; plus.disabled = v >= max; s.setAttribute('data-value', v); s.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: v } })); if (M && !reduced()) M.animate(out, { scale: [1.25, 1] }, { type: 'spring', bounce: 0.5, visualDuration: 0.3 }); };
      minus.addEventListener('click', function () { set(get() - step); }); plus.addEventListener('click', function () { set(get() + step); });
      minus.disabled = get() <= min; plus.disabled = get() >= max;
    });
    qsa('input.fl-range').forEach(function (r) {
      var out = r.getAttribute('data-out') ? qs(r.getAttribute('data-out')) : null;
      var fill = function () { var p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--fill', p + '%'); if (out) out.textContent = r.value; };
      r.addEventListener('input', fill); fill();
    });
    qsa('[data-count-for]').forEach(function (c) {
      var t = qs(c.getAttribute('data-count-for')), max = +(c.getAttribute('data-max') || t.getAttribute('maxlength') || 0);
      var up = function () { var n = t.value.length; c.textContent = max ? n + ' / ' + max : String(n); c.classList.toggle('is-over', max && n > max); }; t.addEventListener('input', up); up();
    });
    qsa('.fl-search__clear').forEach(function (b) { b.addEventListener('click', function () { var i = qs('input', b.parentNode); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); i.focus(); }); });
    qsa('.fl-otp').forEach(function (o) {
      var ins = qsa('input', o);
      var val = function () { return ins.map(function (i) { return i.value; }).join(''); };
      ins.forEach(function (i, n) {
        i.setAttribute('inputmode', 'numeric'); i.setAttribute('maxlength', '1'); i.setAttribute('placeholder', ' '); i.setAttribute('autocomplete', n === 0 ? 'one-time-code' : 'off'); i.setAttribute('aria-label', 'Digit ' + (n + 1));
        i.addEventListener('input', function () { i.value = i.value.replace(/\D/g, '').slice(-1); if (i.value && ins[n + 1]) ins[n + 1].focus(); o.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: val(), complete: val().length === ins.length } })); });
        i.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !i.value && ins[n - 1]) { ins[n - 1].focus(); ins[n - 1].value = ''; } else if (e.key === 'ArrowLeft' && ins[n - 1]) ins[n - 1].focus(); else if (e.key === 'ArrowRight' && ins[n + 1]) ins[n + 1].focus(); });
        i.addEventListener('paste', function (e) { var t = (e.clipboardData || root.clipboardData).getData('text').replace(/\D/g, ''); if (!t) return; e.preventDefault(); ins.forEach(function (x, k) { x.value = t[k] || ''; }); (ins[Math.min(t.length, ins.length - 1)]).focus(); o.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: val(), complete: t.length >= ins.length } })); });
      });
    });
  }

  /* ───────── dropzone ───────── */
  function dropzones() {
    qsa('.fl-drop').forEach(function (z) {
      var input = qs('input[type=file]', z), list = z.nextElementSibling && z.nextElementSibling.classList.contains('fl-files') ? z.nextElementSibling : null;
      var accept = (z.getAttribute('data-accept') || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
      var ok = function (f) { if (!accept.length) return true; return accept.some(function (a) { return a.charAt(0) === '.' ? f.name.toLowerCase().slice(-a.length) === a : (a.slice(-2) === '/*' ? f.type.indexOf(a.slice(0, -1)) === 0 : f.type === a); }); };
      var size = function (n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; };
      var add = function (files) {
        Array.prototype.forEach.call(files, function (f) {
          if (!list) return; var li = doc.createElement('li'); var good = ok(f);
          li.innerHTML = '<span class="fl-card__icon" style="width:40px;height:40px"><svg class="fl-icon" aria-hidden="true"><use href="#i-file-text"/></svg></span><div><b></b><small></small></div><span class="fl-badge"></span>' + (good ? '<div class="fl-progress"><i style="--value:0%"></i></div>' : '');
          qs('b', li).textContent = f.name; qs('small', li).textContent = size(f.size) + (good ? '' : ' · not an accepted type');
          var bd = qs('.fl-badge', li); bd.textContent = good ? 'Uploading' : 'Rejected'; bd.className = 'fl-badge ' + (good ? 'fl-badge--info' : 'fl-badge--error');
          list.appendChild(li);
          if (good) { var bar = qs('.fl-progress i', li), p = 0; var iv = setInterval(function () { p = Math.min(100, p + 8 + Math.random() * 14); bar.style.setProperty('--value', p + '%'); if (p >= 100) { clearInterval(iv); bd.textContent = 'Ready'; bd.className = 'fl-badge fl-badge--success'; } }, 120); }
          z.dispatchEvent(new CustomEvent('files', { bubbles: true, detail: { file: f, accepted: good } }));
        });
      };
      z.addEventListener('click', function () { if (input) input.click(); });
      z.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (input) input.click(); } });
      if (input) input.addEventListener('change', function () { add(input.files); input.value = ''; });
      ['dragenter', 'dragover'].forEach(function (n) { z.addEventListener(n, function (e) { e.preventDefault(); z.classList.add('is-over'); }); });
      ['dragleave', 'drop'].forEach(function (n) { z.addEventListener(n, function (e) { e.preventDefault(); z.classList.remove('is-over'); }); });
      z.addEventListener('drop', function (e) { add(e.dataTransfer.files); });
    });
  }

  /* ───────── sortable tables ───────── */
  function tables() {
    qsa('.fl-dt[data-sortable]').forEach(function (t) {
      var ths = qsa('thead th', t), tb = qs('tbody', t);
      ths.forEach(function (th, i) {
        if (th.hasAttribute('data-nosort')) return;
        th.setAttribute('aria-sort', 'none');
        var b = doc.createElement('button'); b.type = 'button'; b.innerHTML = th.innerHTML + '<svg class="fl-icon" aria-hidden="true"><use href="#i-chevron-down"/></svg>'; th.innerHTML = ''; th.appendChild(b);
        b.addEventListener('click', function () {
          var dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
          ths.forEach(function (o) { if (o.hasAttribute('aria-sort')) o.setAttribute('aria-sort', 'none'); }); th.setAttribute('aria-sort', dir);
          var rows = qsa('tr', tb), val = function (r) { var c = r.children[i], v = c.getAttribute('data-sort') || c.textContent.trim(), n = parseFloat(v.replace(/[^\d,.\-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')); return isNaN(n) ? v.toLowerCase() : n; };
          rows.sort(function (a, c) { var x = val(a), y = val(c); return (x > y ? 1 : x < y ? -1 : 0) * (dir === 'ascending' ? 1 : -1); }).forEach(function (r) { tb.appendChild(r); });
          if (M && !reduced()) M.animate(rows, { opacity: [0.4, 1], y: [6, 0] }, { duration: 0.35, ease: EASE, delay: M.stagger(0.02) });
        });
      });
    });
  }

  /* ───────── flashcards, tab bar, resizer ───────── */
  function widgets() {
    qsa('.fl-flash').forEach(function (c) {
      c.setAttribute('role', 'button'); c.setAttribute('tabindex', '0'); c.setAttribute('aria-pressed', 'false');
      var flip = function () { var on = !c.classList.contains('is-flipped'); c.classList.toggle('is-flipped', on); c.setAttribute('aria-pressed', String(on)); c.dispatchEvent(new CustomEvent('flip', { bubbles: true, detail: { flipped: on } })); };
      c.addEventListener('click', flip); c.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
    });
    qsa('.fl-tabbar').forEach(function (bar) { F.tabbar(bar); });
    qsa('.fl-resizer').forEach(function (r) {
      var app = r.closest('.fl-app') || r.parentNode, min = +(r.getAttribute('data-min') || 180), max = +(r.getAttribute('data-max') || 520);
      r.setAttribute('role', 'separator'); r.setAttribute('aria-orientation', 'vertical'); r.setAttribute('tabindex', '0'); r.setAttribute('aria-label', 'Resize sidebar');
      var cur = function () { return parseFloat(getComputedStyle(app).getPropertyValue('--side-w')) || 260; };
      var setW = function (w) { w = clamp(w, min, max); app.style.setProperty('--side-w', w + 'px'); r.setAttribute('aria-valuenow', Math.round(w)); };
      var sx = null, sw = 0;
      r.addEventListener('pointerdown', function (e) { sx = e.clientX; sw = cur(); r.setPointerCapture(e.pointerId); r.classList.add('is-drag'); });
      r.addEventListener('pointermove', function (e) { if (sx !== null) setW(sw + e.clientX - sx); });
      var end = function () { sx = null; r.classList.remove('is-drag'); }; r.addEventListener('pointerup', end); r.addEventListener('pointercancel', end);
      r.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') { e.preventDefault(); setW(cur() - 16); } else if (e.key === 'ArrowRight') { e.preventDefault(); setW(cur() + 16); } });
      r.addEventListener('dblclick', function () { setW(260); });
    });
    qsa('[data-accordion-single]').forEach(function (g) { qsa('details', g).forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) qsa('details', g).forEach(function (o) { if (o !== d) o.open = false; }); }); }); });
    doc.addEventListener('click', function (e) {
      var h = e.target.closest('[data-copy-html]'), t = e.target.closest('[data-copy-text]'); if (!h && !t) return;
      var txt = h ? (qs(h.getAttribute('data-copy-html')) || {}).outerHTML : t.getAttribute('data-copy-text');
      if (txt == null) return;
      var done = function () { if (F.toast) F.toast((h || t).getAttribute('data-toast') || 'Copied', { pose: 'thumbs', base: F.base || '' }); };
      if (root.navigator.clipboard && root.isSecureContext) root.navigator.clipboard.writeText(txt).then(done, done); else { var a = doc.createElement('textarea'); a.value = txt; a.style.cssText = 'position:fixed;left:-9999px'; doc.body.appendChild(a); a.select(); try { doc.execCommand('copy'); } catch (er) {} a.remove(); done(); }
    });
  }
  /* tab bar with a spring pill that follows the selected tab (role=tablist, buttons role=tab) */
  F.tabbar = function (bar, onChange) {
    var pill = qs('.fl-tabbar__pill', bar), tabs = qsa('[role="tab"]', bar); if (!pill || !tabs.length) return;
    var move = function (instant) { var cur = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]; var x = cur.offsetLeft + (cur.offsetWidth - pill.offsetWidth) / 2;
      if (M && !reduced() && !instant) M.animate(pill, { x: x }, { type: 'spring', bounce: 0.3, visualDuration: 0.5 }); else pill.style.transform = 'translateX(' + x + 'px)'; };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { tabs.forEach(function (o) { o.setAttribute('aria-selected', String(o === t)); o.tabIndex = o === t ? 0 : -1; }); move(); if (onChange) onChange(t, i); bar.dispatchEvent(new CustomEvent('tabchange', { bubbles: true, detail: { tab: t, index: i } })); });
      t.addEventListener('keydown', function (e) { var j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : -1; if (j > -1) { e.preventDefault(); tabs[j].focus(); tabs[j].click(); } });
    });
    pill.style.left = '0'; pill.style.marginLeft = '0'; bar.style.setProperty('--tabs', tabs.length); root.addEventListener('resize', function () { move(true); }); move(true); if (root.ResizeObserver) new ResizeObserver(function () { move(true); }).observe(bar);
  };

  /* ───────── theme ───────── */
  var KEY = 'fl-theme';
  F.theme = {
    get: function () { try { return root.localStorage.getItem(KEY) || doc.documentElement.getAttribute('data-theme') || 'light'; } catch (e) { return doc.documentElement.getAttribute('data-theme') || 'light'; } },
    set: function (v) { doc.documentElement.setAttribute('data-theme', v); try { root.localStorage.setItem(KEY, v); } catch (e) {} qsa('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', String(v === 'dark')); }); doc.dispatchEvent(new CustomEvent('flavida:theme', { detail: { theme: v } })); },
    toggle: function () { var cur = doc.documentElement.getAttribute('data-theme'); var dark = cur === 'dark' || (cur === 'auto' && root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches); F.theme.set(dark ? 'light' : 'dark'); }
  };
  function theme() {
    var persist = doc.documentElement.hasAttribute('data-theme-persist');
    if (persist) { try { var s = root.localStorage.getItem(KEY); if (s) doc.documentElement.setAttribute('data-theme', s); } catch (e) {} }
    qsa('[data-theme-toggle]').forEach(function (b) {
      var cur = doc.documentElement.getAttribute('data-theme'); b.setAttribute('aria-pressed', String(cur === 'dark'));
      b.addEventListener('click', function () { if (persist) F.theme.toggle(); else { var d = doc.documentElement.getAttribute('data-theme') === 'dark'; doc.documentElement.setAttribute('data-theme', d ? 'light' : 'dark'); b.setAttribute('aria-pressed', String(!d)); doc.dispatchEvent(new CustomEvent('flavida:theme', { detail: { theme: d ? 'light' : 'dark' } })); } });
    });
  }

  /* ───────── combobox ───────── */
  F.combobox = function (el, opts) {
    opts = opts || {}; var options = opts.options || JSON.parse(el.getAttribute('data-options') || '[]');
    var input = qs('input', el), list = qs('.fl-combo__list', el) || (function () { var u = doc.createElement('ul'); u.className = 'fl-combo__list'; el.appendChild(u); return u; })();
    var lid = nid('combo'); list.id = lid; list.setAttribute('role', 'listbox'); list.hidden = true; input.setAttribute('role', 'combobox'); input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', lid); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('autocomplete', 'off');
    var cur = 0, shown = [];
    var norm = function (o) { return typeof o === 'string' ? { v: o, l: o } : { v: o.value || o.v, l: o.label || o.l, s: o.hint || o.s }; };
    var render = function (q) {
      q = (q || '').toLowerCase(); shown = options.map(norm).filter(function (o) { return !q || o.l.toLowerCase().indexOf(q) > -1; }); cur = 0;
      list.innerHTML = shown.length ? shown.map(function (o, i) { return '<li class="fl-combo__opt" role="option" id="' + lid + '-' + i + '" data-i="' + i + '"' + (i === 0 ? ' aria-selected="true"' : '') + '><span>' + o.l.replace(/</g, '&lt;') + '</span>' + (o.s ? '<small>' + o.s + '</small>' : '') + '</li>'; }).join('') : '<li class="fl-combo__empty">No match</li>';
    };
    var open = function () { render(input.value); list.hidden = false; input.setAttribute('aria-expanded', 'true'); };
    var close = function () { list.hidden = true; input.setAttribute('aria-expanded', 'false'); };
    var pick = function (i) { var o = shown[i]; if (!o) return; input.value = o.l; close(); el.dispatchEvent(new CustomEvent('select', { bubbles: true, detail: o })); };
    var hi = function (n) { var os = qsa('.fl-combo__opt', list); if (!os.length) return; cur = (n + os.length) % os.length; os.forEach(function (o, i) { o.setAttribute('aria-selected', String(i === cur)); }); os[cur].scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', os[cur].id); };
    input.addEventListener('focus', open); input.addEventListener('input', function () { open(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) open(); else hi(cur + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); hi(cur - 1); } else if (e.key === 'Enter' && !list.hidden) { e.preventDefault(); pick(cur); } else if (e.key === 'Escape') close(); });
    list.addEventListener('mousedown', function (e) { var o = e.target.closest('.fl-combo__opt'); if (o) { e.preventDefault(); pick(+o.dataset.i); } });
    input.addEventListener('blur', function () { setTimeout(close, 120); });
    return { open: open, close: close };
  };

  /* ───────── calendar ───────── */
  F.calendar = function (el, opts) {
    opts = opts || {}; var locale = opts.locale || root.document.documentElement.lang || 'en', first = opts.weekStart == null ? 1 : opts.weekStart;
    var sel = opts.value ? new Date(opts.value) : null, view = new Date((sel || new Date()).getFullYear(), (sel || new Date()).getMonth(), 1), min = opts.min ? new Date(opts.min) : null, max = opts.max ? new Date(opts.max) : null;
    el.classList.add('fl-cal'); var ym = function (d) { return d.getFullYear() * 12 + d.getMonth(); };
    var same = function (a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); };
    function draw(focusDay) {
      var fm = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }), fd = new Intl.DateTimeFormat(locale, { weekday: 'narrow' }), fl = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });
      var html = '<div class="fl-cal__head"><button class="fl-cal__nav" type="button" data-n="-1" aria-label="Previous month"><svg class="fl-icon" aria-hidden="true"><use href="#i-arrow-left"/></svg></button><b aria-live="polite">' + fm.format(view) + '</b><button class="fl-cal__nav" type="button" data-n="1" aria-label="Next month"><svg class="fl-icon" aria-hidden="true"><use href="#i-arrow-right"/></svg></button></div><div class="fl-cal__grid" role="grid">';
      for (var d = 0; d < 7; d++) html += '<div class="fl-cal__dow" role="columnheader">' + fd.format(new Date(2023, 0, 1 + ((first + d) % 7))) + '</div>';
      var start = new Date(view.getFullYear(), view.getMonth(), 1 - ((view.getDay() - first + 7) % 7)), today = new Date();
      for (var i = 0; i < 42; i++) { var day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), out = day.getMonth() !== view.getMonth(), dis = (min && day < min) || (max && day > max);
        html += '<button class="fl-cal__day' + (out ? ' is-out' : '') + (same(day, today) ? ' is-today' : '') + '" type="button" role="gridcell" data-d="' + day.getTime() + '" aria-label="' + fl.format(day) + '" aria-selected="' + (same(day, sel) ? 'true' : 'false') + '"' + (dis ? ' disabled' : '') + '>' + day.getDate() + '</button>'; }
      el.innerHTML = html + '</div>';
      if (focusDay) { var b = qs('[data-d="' + focusDay + '"]', el); if (b) b.focus(); }
    }
    el.addEventListener('click', function (e) {
      var n = e.target.closest('[data-n]'); if (n) { view = new Date(view.getFullYear(), view.getMonth() + (+n.dataset.n), 1); draw(); return; }
      var b = e.target.closest('[data-d]'); if (b) { sel = new Date(+b.dataset.d); if (sel.getMonth() !== view.getMonth()) view = new Date(sel.getFullYear(), sel.getMonth(), 1); draw(sel.getTime()); el.dispatchEvent(new CustomEvent('select', { bubbles: true, detail: { date: sel } })); if (opts.onSelect) opts.onSelect(sel); }
    });
    el.addEventListener('keydown', function (e) { var b = e.target.closest('[data-d]'); if (!b) return; var d = new Date(+b.dataset.d), k = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]; if (k) { e.preventDefault(); var nd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k); if (ym(nd) !== ym(view)) view = new Date(nd.getFullYear(), nd.getMonth(), 1); draw(nd.getTime()); } });
    draw(); return { value: function () { return sel; }, set: function (d) { sel = new Date(d); view = new Date(sel.getFullYear(), sel.getMonth(), 1); draw(); } };
  };

  /* ───────── command list (slash menu / palette body) ───────── */
  F.command = function (dialog, items, onPick) {
    var input = qs('input', dialog), list = qs('.fl-cmd__list', dialog), cur = 0, shown = items;
    var render = function (q) { q = (q || '').toLowerCase(); shown = items.filter(function (i) { return !q || (i.label + ' ' + (i.keywords || '')).toLowerCase().indexOf(q) > -1; }); cur = 0; var last = '', h = '';
      shown.forEach(function (i, n) { if (i.group && i.group !== last) { h += '<li class="fl-cmd__group" role="presentation">' + i.group + '</li>'; last = i.group; } h += '<li class="fl-cmd__item" role="option" data-i="' + n + '"' + (n === 0 ? ' aria-selected="true"' : '') + '>' + (i.icon ? '<svg class="fl-icon" aria-hidden="true"><use href="#i-' + i.icon + '"/></svg>' : '') + '<span>' + i.label + '</span>' + (i.hint ? '<kbd>' + i.hint + '</kbd>' : '') + '</li>'; });
      list.innerHTML = h || '<li class="fl-cmd__group">No results</li>'; };
    var move = function (d) { var os = qsa('.fl-cmd__item', list); if (!os.length) return; cur = (cur + d + os.length) % os.length; os.forEach(function (o, i) { o.setAttribute('aria-selected', String(i === cur)); }); os[cur].scrollIntoView({ block: 'nearest' }); };
    input.addEventListener('input', function () { render(input.value); });
    dialog.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); } else if (e.key === 'Enter') { e.preventDefault(); if (shown[cur]) { dialog.close(); onPick(shown[cur]); } } });
    list.addEventListener('click', function (e) { var o = e.target.closest('.fl-cmd__item'); if (o) { var it = shown[+o.dataset.i]; dialog.close(); onPick(it); } });
    dialog.addEventListener('close', function () { input.value = ''; render(''); }); render('');
  };

  function boot() { try { dialogs(); popovers(); inputs(); dropzones(); tables(); widgets(); theme(); qsa('.fl-combo[data-options]').forEach(function (c) { F.combobox(c); }); qsa('[data-calendar]').forEach(function (c) { F.calendar(c, { locale: c.getAttribute('data-locale') || undefined, weekStart: c.hasAttribute('data-week-start') ? +c.getAttribute('data-week-start') : undefined }); }); } catch (err) { if (root.console) console.warn('[Flavida UI]', err); } }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : this);
