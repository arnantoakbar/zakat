/*!
 * Flavida · charts (classic script, adds Flavida.chart). Lightweight SVG charts that follow the theme.
 * Needs flavida-extra.css. Optional: js/motion.min.js for the entrance animation (skipped under reduced motion).
 *
 *   Flavida.chart(el, spec)  ->  { update(spec), destroy() }        or  <div data-chart='{"type":"bar",...}'></div>
 *
 * spec.type  'bar' | 'hbar' | 'line' | 'area' | 'donut' | 'pie' | 'gauge' | 'waffle'
 *   bar/hbar/line/area : labels:[..], series:[{name, values:[..], color?}], stacked?:bool, smooth?:bool, minimal?:bool (sparkline)
 *   donut/pie          : data:[{label, value, color?}], center?:{value,label}
 *   gauge              : value, min=0, max=100, steps?:[{to, color, label}], label, unit
 *   waffle             : total=40, filled=1, cols=10, label
 * common: height, title, desc (accessible description), format (fn) | unit ('%', 'Rp', ...), locale ('en'|'id-ID'), legend (default true when >1 series),
 *         values (print values on marks), ticks, colors:[css colors], animate (default true), highlight: index
 * Colors default to --chart-1..8 so dark mode and brand themes just work. Every chart ships a hidden data table for screen readers.
 */
(function (root) {
  'use strict';
  var doc = root.document, F = root.Flavida || (root.Flavida = {});
  if (!doc) return;
  var M = function () { return root.Motion || null; };
  var NS = 'http://www.w3.org/2000/svg';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };
  var col = function (spec, i) { var c = spec.colors && spec.colors[i % spec.colors.length]; return c || 'var(--chart-' + (i % 8 + 1) + ')'; };

  function nice(max, ticks) {
    if (max <= 0) return { max: 1, step: 0.25 };
    var raw = max / (ticks || 4), p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p, s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10, step = s * p;
    return { max: Math.ceil(max / step) * step, step: step };
  }
  function fmtOf(spec) {
    if (typeof spec.format === 'function') return spec.format;
    var nf = new Intl.NumberFormat(spec.locale || undefined, { maximumFractionDigits: spec.digits == null ? 1 : spec.digits, notation: spec.compact ? 'compact' : 'standard' }), u = spec.unit || '';
    return function (v) { var s = nf.format(v); return u === 'Rp' ? 'Rp ' + s : u === '$' ? '$' + s : (u ? s + (u.length === 1 ? u : ' ' + u) : s); };
  }
  function roundedTop(x, y, w, h, r) { r = Math.min(r, w / 2, h); return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z'; }
  function roundedRight(x, y, w, h, r) { r = Math.min(r, h / 2, w); return 'M' + x + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h - r) + 'Q' + (x + w) + ',' + (y + h) + ' ' + (x + w - r) + ',' + (y + h) + 'H' + x + 'Z'; }
  function smoothPath(pts) {
    if (pts.length < 3) return 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join('L');
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) { var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, t = 0.18;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) * t) + ',' + (p1[1] + (p2[1] - p0[1]) * t) + ' ' + (p2[0] - (p3[0] - p1[0]) * t) + ',' + (p2[1] - (p3[1] - p1[1]) * t) + ' ' + p2[0] + ',' + p2[1]; }
    return d;
  }
  var reduced = function () { return !!F.reduced || (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); };

  /* ───────── renderers: return { svg, marks(for animation), tipAt(x,y) } ───────── */
  function cartesian(spec, W, f) {
    var type = spec.type, horiz = type === 'hbar', labels = spec.labels || [], series = spec.series || [], n = labels.length, s = series.length, stacked = !!spec.stacked;
    var H = spec.height || (spec.minimal ? 56 : Math.round(clamp(W * 0.5, 200, 340)));
    var minimal = !!spec.minimal, show = spec.values;
    var maxV = 0, minV = 0; for (var i = 0; i < n; i++) { var tot = 0; for (var k = 0; k < s; k++) { var v = series[k].values[i] || 0; tot += v; maxV = Math.max(maxV, stacked ? tot : v); minV = Math.min(minV, v); } }
    if (type === 'line' && !stacked) { var lo = Infinity; series.forEach(function (se) { se.values.forEach(function (v) { lo = Math.min(lo, v); }); }); if (spec.zero === false && isFinite(lo)) minV = Math.floor(lo - (maxV - lo) * 0.1); }
    var ns = nice(maxV - Math.min(0, minV) || 1, spec.ticks || 4), top = ns.max + Math.min(0, minV), ticks = []; for (var t = Math.min(0, minV); t <= top + 1e-9; t += ns.step) ticks.push(+t.toFixed(6));
    var yMax = ticks[ticks.length - 1], yMin = ticks[0];
    var lw = 0; ticks.forEach(function (tv) { lw = Math.max(lw, f(tv).length); });
    var ml = minimal ? 4 : horiz ? Math.min(150, Math.max.apply(null, labels.map(function (l) { return String(l).length; }).concat(4)) * 7 + 14) : lw * 7 + 16, mr = minimal ? 4 : horiz ? (show ? 56 : 14) : 12, mt = minimal ? 6 : (show && !horiz ? 26 : 12), mb = minimal ? 6 : horiz ? 24 : 30;
    var iw = W - ml - mr, ih = H - mt - mb, x0 = ml, y0 = mt;
    var xs = function (i) { return x0 + (n === 1 ? iw / 2 : (type === 'bar' ? iw * (i + 0.5) / n : iw * i / (n - 1))); };
    var ys = function (v) { return y0 + ih - (v - yMin) / (yMax - yMin) * ih; };
    var out = '<defs>' + series.map(function (se, k) { return '<linearGradient id="g' + spec.__id + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:' + col(spec, k) + ';stop-opacity:.34"/><stop offset="1" style="stop-color:' + col(spec, k) + ';stop-opacity:0"/></linearGradient>'; }).join('') + '</defs>';
    var marks = [];
    if (!minimal) {
      out += '<g class="grid">' + ticks.map(function (tv) { return horiz ? '<line x1="' + (x0 + (tv - yMin) / (yMax - yMin) * iw) + '" x2="' + (x0 + (tv - yMin) / (yMax - yMin) * iw) + '" y1="' + y0 + '" y2="' + (y0 + ih) + '"/>' : '<line x1="' + x0 + '" x2="' + (x0 + iw) + '" y1="' + ys(tv) + '" y2="' + ys(tv) + '"/>'; }).join('') + '</g>';
      out += '<g class="ax">' + (horiz ? ticks.map(function (tv) { return '<text x="' + (x0 + (tv - yMin) / (yMax - yMin) * iw) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(f(tv)) + '</text>'; }).join('') + labels.map(function (l, i) { return '<text x="' + (x0 - 10) + '" y="' + (y0 + ih * (i + 0.5) / n + 4) + '" text-anchor="end" style="fill:var(--color-mid)">' + esc(l) + '</text>'; }).join('')
        : ticks.map(function (tv) { return '<text x="' + (x0 - 10) + '" y="' + (ys(tv) + 4) + '" text-anchor="end">' + esc(f(tv)) + '</text>'; }).join('') + labels.map(function (l, i) { return '<text x="' + xs(i) + '" y="' + (H - 8) + '" text-anchor="middle" style="fill:var(--color-mid)">' + esc(l) + '</text>'; }).join('')) + '</g>';
    }
    if (type === 'bar' || type === 'hbar') {
      var band = (horiz ? ih : iw) / n, gw = Math.min(band * 0.72, 56 * (stacked ? 1 : s)), bw = stacked ? gw : (gw - (s - 1) * 4) / s;
      for (var i2 = 0; i2 < n; i2++) { var acc = 0; for (var k2 = 0; k2 < s; k2++) { var v2 = series[k2].values[i2] || 0, c = col(spec, k2), hot = spec.highlight === i2 ? ' is-hot' : '';
          if (horiz) { var bh = Math.min(band * 0.62, 30), by = y0 + band * i2 + (band - (stacked ? bh : bh * s + (s - 1) * 4)) / 2 + (stacked ? 0 : k2 * (bh + 4)), x1 = x0 + (stacked ? acc : 0) / (yMax - yMin) * iw, ww = Math.max(2, v2 / (yMax - yMin) * iw);
            out += '<path class="mark' + hot + '" data-i="' + i2 + '" data-k="' + k2 + '" d="' + roundedRight(x1, by, ww, bh, 10) + '" style="fill:' + c + '"/>';
            if (show && !stacked) out += '<text class="val" x="' + (x1 + ww + 8) + '" y="' + (by + bh / 2 + 4) + '">' + esc(f(v2)) + '</text>';
          } else { var bx = xs(i2) - gw / 2 + (stacked ? 0 : k2 * (bw + 4)), hh = Math.max(2, Math.abs(ys(v2) - ys(0))), by2 = stacked ? ys(acc + v2) : ys(Math.max(v2, 0));
            out += '<path class="mark' + hot + '" data-i="' + i2 + '" data-k="' + k2 + '" d="' + roundedTop(bx, by2, bw, hh, 9) + '" style="fill:' + c + '"/>';
            if (show && !stacked) out += '<text class="val" x="' + (bx + bw / 2) + '" y="' + (by2 - 7) + '" text-anchor="middle">' + esc(f(v2)) + '</text>'; }
          acc += v2; }
        out += '<rect class="hit" data-i="' + i2 + '" x="' + (horiz ? 0 : xs(i2) - band / 2) + '" y="' + (horiz ? y0 + band * i2 : 0) + '" width="' + (horiz ? W : band) + '" height="' + (horiz ? band : H) + '" fill="transparent"/>'; }
    } else {
      var cum = series.map(function (se, k) { return se.values.map(function (v, i) { if (!stacked) return v; var t = 0; for (var q = 0; q <= k; q++) t += series[q].values[i] || 0; return t; }); });
      var order = series.map(function (se, k) { return k; }); if (stacked) order.reverse();
      order.forEach(function (k) { var se = series[k], pts = cum[k].map(function (v, i) { return [xs(i), ys(v)]; }), c = col(spec, k);
        var d = spec.smooth === false ? 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join('L') : smoothPath(pts), base = ys(Math.max(0, yMin));
        if (type === 'area') out += '<path class="mark area" d="' + d + 'L' + pts[pts.length - 1][0] + ',' + base + 'L' + pts[0][0] + ',' + base + 'Z" style="fill:url(#g' + spec.__id + k + ')"/>';
        out += '<path class="mark line" pathLength="1" d="' + d + '" style="fill:none;stroke:' + c + ';stroke-width:' + (minimal ? 2.5 : 3.5) + ';stroke-linecap:round;stroke-linejoin:round"/>';
        if (!minimal) pts.forEach(function (p, i) { out += '<circle class="mark dot" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (spec.highlight === i ? 6 : 4.5) + '" style="fill:var(--surface);stroke:' + c + ';stroke-width:2.5"/>'; });
        else out += '<circle cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '" r="3.5" style="fill:' + c + '"/>'; });
      if (!minimal) { out += '<line class="crosshair" x1="0" x2="0" y1="' + y0 + '" y2="' + (y0 + ih) + '" style="opacity:0"/>'; var step = n > 1 ? iw / (n - 1) : iw; for (var j = 0; j < n; j++) out += '<rect class="hit" data-i="' + j + '" x="' + (xs(j) - step / 2) + '" y="0" width="' + step + '" height="' + H + '" fill="transparent"/>'; }
    }
    return { svg: out, W: W, H: H, kind: 'cartesian', xs: xs, y0: y0, ih: ih };
  }

  function donut(spec, W, f) {
    var data = spec.data || [], total = data.reduce(function (a, d) { return a + d.value; }, 0) || 1, H = spec.height || Math.round(clamp(W * 0.62, 220, 300)), cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 10, pie = spec.type === 'pie', sw = pie ? R : R * 0.36, r = pie ? R / 2 : R - sw / 2, C = 2 * Math.PI * r, acc = 0, out = '<g transform="rotate(-90 ' + cx + ' ' + cy + ')">';
    data.forEach(function (d, i) { var len = d.value / total * C, gap = data.length > 1 ? Math.min(5, len * 0.2) : 0; out += '<circle class="mark seg" data-i="' + i + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke-width="' + sw + '" style="stroke:' + (d.color || col(spec, i)) + '" stroke-dasharray="' + Math.max(0.01, len - gap) + ' ' + (C - Math.max(0.01, len - gap)) + '" stroke-dashoffset="' + (-acc - gap / 2) + '" data-len="' + (len - gap) + '" data-off="' + (-acc - gap / 2) + '" data-c="' + C + '"/>'; acc += len; });
    out += '</g>';
    if (!pie && spec.center) out += '<text x="' + cx + '" y="' + (cy + 2) + '" text-anchor="middle" style="font-family:var(--font-display);font-weight:900;font-size:' + Math.round(R * 0.34) + 'px;fill:var(--color-ink)">' + esc(spec.center.value) + '</text><text x="' + cx + '" y="' + (cy + R * 0.26) + '" text-anchor="middle" style="font-size:12px;fill:var(--color-light)">' + esc(spec.center.label || '') + '</text>';
    return { svg: out, W: W, H: H, kind: 'donut', cx: cx, cy: cy, total: total };
  }

  function gauge(spec, W, f) {
    var min = spec.min == null ? 0 : spec.min, max = spec.max == null ? 100 : spec.max, v = clamp(spec.value, min, max), H = spec.height || Math.round(clamp(W * 0.62, 170, 230)), cx = W / 2, cy = H - 22, R = Math.min(W / 2 - 14, H - 34), sw = Math.max(16, R * 0.2), r = R - sw / 2;
    var ptR = function (t, rad) { var a = Math.PI * (1 - t); return [cx + rad * Math.cos(a), cy - rad * Math.sin(a)]; };
    var pt = function (t) { return ptR(t, r); };
    var arcR = function (a, b, rad) { var p = ptR(a, rad), q = ptR(b, rad); return 'M' + p[0] + ',' + p[1] + 'A' + rad + ',' + rad + ' 0 0 1 ' + q[0] + ',' + q[1]; };
    var arc = function (a, b) { return arcR(a, b, r); };
    var steps = spec.steps || [{ to: max, color: 'var(--chart-1)' }], out = '<path d="' + arc(0, 1) + '" fill="none" stroke-width="' + sw + '" stroke-linecap="round" style="stroke:var(--surface-sunk)"/>', t = (v - min) / (max - min), cur = steps[steps.length - 1];
    for (var i = 0; i < steps.length; i++) if (v <= steps[i].to) { cur = steps[i]; break; }
    var a0 = 0, outer = r + sw / 2 + 9; steps.forEach(function (st) { var a1 = (st.to - min) / (max - min); out += '<path d="' + arcR(a0 + 0.006, a1 - 0.006, outer) + '" fill="none" stroke-width="5" stroke-linecap="round" style="stroke:' + (st.color || 'var(--chart-1)') + '"/>'; a0 = a1; });
    out += '<path class="mark val-arc" pathLength="1" d="' + arc(0, Math.max(0.001, t)) + '" fill="none" stroke-width="' + sw + '" stroke-linecap="round" style="stroke:' + (cur.color || 'var(--chart-1)') + '"/>';
    var np = pt(t); out += '<circle class="mark" cx="' + np[0] + '" cy="' + np[1] + '" r="' + (sw * 0.22) + '" style="fill:#fff"/>';
    out += '<text x="' + cx + '" y="' + (cy - R * 0.18) + '" text-anchor="middle" style="font-family:var(--font-display);font-weight:900;font-size:' + Math.round(R * 0.46) + 'px;fill:var(--color-ink)">' + esc(f(v)) + '</text><text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" style="font-size:13px;font-weight:800;fill:' + (cur.color || 'var(--color-mid)') + '">' + esc(cur.label || spec.label || '') + '</text>';
    return { svg: out, W: W, H: H, kind: 'gauge' };
  }

  function waffle(spec, W, f) {
    var total = spec.total || 40, filled = spec.filled == null ? 1 : spec.filled, cols = spec.cols || 10, rows = Math.ceil(total / cols), gap = 6, cell = Math.floor((Math.min(W, 560) - gap * (cols - 1)) / cols), H = rows * cell + (rows - 1) * gap, ox = (W - (cols * cell + (cols - 1) * gap)) / 2, out = '';
    for (var i = 0; i < total; i++) { var r = Math.floor(i / cols), c = i % cols, on = i < filled, partial = !on && i < filled + (filled % 1 ? 1 : 0); out += '<rect class="' + (on ? 'mark ' : '') + 'cell" data-i="' + i + '" x="' + (ox + c * (cell + gap)) + '" y="' + (r * (cell + gap)) + '" width="' + cell + '" height="' + cell + '" rx="' + Math.round(cell * 0.28) + '" style="fill:' + (on ? (spec.color || 'var(--chart-1)') : 'var(--surface-sunk)') + (on ? '' : ';stroke:var(--color-border);stroke-width:1.5') + '"/>'; }
    return { svg: out, W: W, H: H, kind: 'waffle' };
  }

  /* ───────── controller ───────── */
  var seq = 0;
  F.chart = function (el, spec) {
    spec = spec || {}; var id = 'c' + (++seq), ro = null, done = false, lastW = 0, tip = null, svgEl = null, current = spec, destroyed = false;
    el.classList.add('fl-chart'); el.setAttribute('role', 'group');
    function describe(sp) {
      var f = fmtOf(sp), rows = '', caption = sp.title || 'Chart data';
      if (sp.type === 'donut' || sp.type === 'pie') { var tot = sp.data.reduce(function (a, d) { return a + d.value; }, 0) || 1; rows = '<tr><th>Item</th><th>Value</th><th>Share</th></tr>' + sp.data.map(function (d) { return '<tr><td>' + esc(d.label) + '</td><td>' + esc(f(d.value)) + '</td><td>' + Math.round(d.value / tot * 100) + '%</td></tr>'; }).join(''); }
      else if (sp.type === 'gauge') rows = '<tr><th>Measure</th><th>Value</th></tr><tr><td>' + esc(sp.label || 'Value') + '</td><td>' + esc(f(sp.value)) + '</td></tr>';
      else if (sp.type === 'waffle') rows = '<tr><th>Filled</th><th>Total</th></tr><tr><td>' + (sp.filled == null ? 1 : sp.filled) + '</td><td>' + (sp.total || 40) + '</td></tr>';
      else rows = '<tr><th></th>' + sp.series.map(function (s) { return '<th>' + esc(s.name || '') + '</th>'; }).join('') + '</tr>' + sp.labels.map(function (l, i) { return '<tr><td>' + esc(l) + '</td>' + sp.series.map(function (s) { return '<td>' + esc(f(s.values[i])) + '</td>'; }).join('') + '</tr>'; }).join('');
      var summary = sp.desc || (sp.type === 'donut' || sp.type === 'pie' ? sp.data.map(function (d) { return d.label + ' ' + f(d.value); }).join(', ') : sp.type === 'gauge' ? (sp.label || 'Value') + ' ' + f(sp.value) : sp.type === 'waffle' ? (sp.filled == null ? 1 : sp.filled) + ' of ' + (sp.total || 40) : sp.series.map(function (s) { return (s.name || 'Series') + ': ' + sp.labels.map(function (l, i) { return l + ' ' + f(s.values[i]); }).join(', '); }).join('. '));
      return { table: '<table class="fl-sr-only"><caption>' + esc(caption) + '</caption>' + rows + '</table>', summary: (sp.title ? sp.title + '. ' : '') + summary };
    }
    function legendFor(sp) {
      var items = sp.type === 'donut' || sp.type === 'pie' ? sp.data.map(function (d, i) { return { n: d.label + (sp.legendValues === false ? '' : ' · ' + fmtOf(sp)(d.value)), c: d.color || col(sp, i) }; }) : (sp.series || []).map(function (s, k) { return { n: s.name, c: s.color || col(sp, k) }; });
      var want = sp.legend === undefined ? (items.length > 1) : sp.legend; if (!want || sp.type === 'gauge' || sp.type === 'waffle' || sp.minimal) return '';
      return '<ul class="fl-legend">' + items.map(function (it) { return '<li><i style="--c:' + it.c + '"></i>' + esc(it.n) + '</li>'; }).join('') + '</ul>';
    }
    function render() {
      if (destroyed) return; var sp = current; sp.__id = id; var W = Math.max(160, Math.round(el.clientWidth || 360)); if (W === lastW && svgEl) return; lastW = W;
      var f = fmtOf(sp), r = sp.type === 'donut' || sp.type === 'pie' ? donut(sp, W, f) : sp.type === 'gauge' ? gauge(sp, W, f) : sp.type === 'waffle' ? waffle(sp, W, f) : cartesian(sp, W, f), d = describe(sp);
      el.innerHTML = '<svg viewBox="0 0 ' + r.W + ' ' + r.H + '" width="' + r.W + '" height="' + r.H + '" role="img" aria-label="' + esc(d.summary) + '" tabindex="0" focusable="true">' + r.svg + '</svg><div class="fl-chart__tip" role="status"></div>' + legendFor(sp) + d.table;
      svgEl = el.querySelector('svg'); tip = el.querySelector('.fl-chart__tip');
      wire(r, sp, f); if (!done) { done = true; animateIn(sp, r); }
    }
    function tipHtml(sp, f, i) {
      if (sp.type === 'donut' || sp.type === 'pie') { var d = sp.data[i], tot = sp.data.reduce(function (a, x) { return a + x.value; }, 0) || 1; return '<b>' + esc(d.label) + '</b><span><span><i style="background:' + (d.color || col(sp, i)) + '"></i>' + esc(f(d.value)) + '</span><span>' + Math.round(d.value / tot * 100) + '%</span></span>'; }
      return '<b>' + esc(sp.labels[i]) + '</b>' + sp.series.map(function (s, k) { return '<span><span><i style="background:' + (s.color || col(sp, k)) + '"></i>' + esc(s.name || '') + '</span><span>' + esc(f(s.values[i])) + '</span></span>'; }).join('');
    }
    function showTip(r, sp, f, i, px, py) {
      if (i == null) { tip.classList.remove('is-on'); el.classList.remove('is-hovering'); qsAll('.mark.is-hot').forEach(function (m) { m.classList.remove('is-hot'); }); var ch = svgEl.querySelector('.crosshair'); if (ch) ch.style.opacity = 0; return; }
      tip.innerHTML = tipHtml(sp, f, i); tip.classList.add('is-on'); el.classList.add('is-hovering');
      var bw = el.getBoundingClientRect(); var tw = tip.offsetWidth; tip.style.left = clamp(px, tw / 2 + 4, bw.width - tw / 2 - 4) + 'px'; tip.style.top = Math.max(40, py) + 'px';
      qsAll('.mark').forEach(function (m) { m.classList.toggle('is-hot', m.getAttribute('data-i') == i); });
      var ch2 = svgEl.querySelector('.crosshair'); if (ch2 && r.xs) { var x = r.xs(i); ch2.setAttribute('x1', x); ch2.setAttribute('x2', x); ch2.style.opacity = 1; }
    }
    function qsAll(s) { return Array.prototype.slice.call(el.querySelectorAll(s)); }
    function wire(r, sp, f) {
      var idx = 0, count = sp.type === 'donut' || sp.type === 'pie' ? sp.data.length : (sp.labels || []).length;
      if (r.kind === 'cartesian' && !sp.minimal) {
        svgEl.addEventListener('pointermove', function (e) { var h = e.target.closest && e.target.closest('.hit'); if (!h) return; var i = +h.getAttribute('data-i'), b = el.getBoundingClientRect(), box = h.getBoundingClientRect(); showTip(r, sp, f, i, box.left + box.width / 2 - b.left, e.clientY - b.top - 8); idx = i; });
        svgEl.addEventListener('pointerleave', function () { showTip(r, sp, f, null); });
      } else if (r.kind === 'donut') {
        qsAll('.seg').forEach(function (s) { s.addEventListener('pointermove', function (e) { var b = el.getBoundingClientRect(); showTip(r, sp, f, +s.getAttribute('data-i'), e.clientX - b.left, e.clientY - b.top - 6); }); s.addEventListener('pointerleave', function () { showTip(r, sp, f, null); }); });
      }
      if (count && r.kind !== 'gauge' && r.kind !== 'waffle' && !sp.minimal) svgEl.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); idx = (idx + (e.key === 'ArrowRight' ? 1 : -1) + count) % count; var b = el.getBoundingClientRect(), tgt = svgEl.querySelector('[data-i="' + idx + '"]'); if (tgt) { var bx = tgt.getBoundingClientRect(); showTip(r, sp, f, idx, bx.left + bx.width / 2 - b.left, bx.top - b.top); } } else if (e.key === 'Escape') showTip(r, sp, f, null); });
      if (r.kind !== 'gauge') svgEl.addEventListener('blur', function () { showTip(r, sp, f, null); });
    }
    function animateIn(sp, r) {
      var Mo = M(); if (!Mo || reduced() || sp.animate === false) return;
      var go = function () {
        if (sp.type === 'bar') Mo.animate(qsAll('.mark'), { transform: ['scaleY(0)', 'scaleY(1)'] }, { delay: Mo.stagger(0.04), type: 'spring', bounce: 0.22, visualDuration: 0.7 });
        else if (sp.type === 'hbar') { qsAll('.mark').forEach(function (m) { m.style.transformOrigin = 'left center'; }); Mo.animate(qsAll('.mark'), { transform: ['scaleX(0)', 'scaleX(1)'] }, { delay: Mo.stagger(0.05), type: 'spring', bounce: 0.2, visualDuration: 0.7 }); }
        else if (sp.type === 'line' || sp.type === 'area') { var lines = qsAll('.mark.line'); lines.forEach(function (l) { l.style.strokeDasharray = '1'; }); Mo.animate(lines, { strokeDashoffset: [1, 0] }, { duration: 1.0, ease: [0.16, 1, 0.3, 1] }); Mo.animate(qsAll('.mark.area'), { opacity: [0, 1] }, { duration: 0.9, delay: 0.3 }); Mo.animate(qsAll('.mark.dot'), { opacity: [0, 1], scale: [0, 1] }, { delay: Mo.stagger(0.05, { startDelay: 0.5 }), duration: 0.35 }); }
        else if (sp.type === 'donut' || sp.type === 'pie') { var segs = qsAll('.seg'); segs.forEach(function (s) { s.setAttribute('stroke-dasharray', '0 ' + s.getAttribute('data-c')); }); Mo.animate(0, 1, { duration: 1.0, ease: [0.16, 1, 0.3, 1], onUpdate: function (p) { segs.forEach(function (s) { var len = +s.getAttribute('data-len') * p; s.setAttribute('stroke-dasharray', Math.max(0.01, len) + ' ' + s.getAttribute('data-c')); }); } }); }
        else if (sp.type === 'gauge') { var a = svgEl.querySelector('.val-arc'); a.style.strokeDasharray = '1'; Mo.animate(a, { strokeDashoffset: [1, 0] }, { duration: 1.1, ease: [0.16, 1, 0.3, 1] }); Mo.animate(qsAll('.mark:not(.val-arc)'), { opacity: [0, 1] }, { delay: 0.9, duration: 0.3 }); }
        else if (sp.type === 'waffle') Mo.animate(qsAll('.mark'), { transform: ['scale(0.2)', 'scale(1)'], opacity: [0, 1] }, { delay: Mo.stagger(0.05), type: 'spring', bounce: 0.5, visualDuration: 0.55 });
      };
      if (root.IntersectionObserver) { qsAll('.mark').forEach(function (m) { m.style.opacity = '0'; }); var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); qsAll('.mark').forEach(function (m) { m.style.opacity = ''; }); go(); } }, { threshold: 0.25 }); io.observe(el); setTimeout(function () { io.disconnect(); qsAll('.mark').forEach(function (m) { m.style.opacity = ''; }); }, 4000); } else go();
    }
    if (root.ResizeObserver) { ro = new ResizeObserver(function () { clearTimeout(render.t); render.t = setTimeout(render, 60); }); ro.observe(el); }
    render();
    return { update: function (s) { current = s; lastW = 0; svgEl = null; render(); }, destroy: function () { destroyed = true; if (ro) ro.disconnect(); el.innerHTML = ''; } };
  };

  function boot() { Array.prototype.forEach.call(doc.querySelectorAll('[data-chart]'), function (el) { try { F.chart(el, JSON.parse(el.getAttribute('data-chart'))); } catch (e) { if (root.console) console.warn('[Flavida chart]', e); } }); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : this);
