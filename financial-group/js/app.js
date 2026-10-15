/* Financial Group - lógica de la aplicación (datos guardados en localStorage) */
const KEY = 'fg_v1';
const $ = (s, r = document) => r.querySelector(s);
const fmt = n => '$' + Math.round(n).toLocaleString('es-CO');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ini = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const iso = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-CA'); };
const ago = s => {
  const d = Math.round((new Date().setHours(0,0,0,0) - new Date(s + 'T00:00:00')) / 864e5);
  return d <= 0 ? 'Hoy' : d === 1 ? 'Ayer' : `Hace ${d} días`;
};

function seed() {
  const me = 'Rafael Sierra';
  return {
    user: { name: me, email: 'rafael@correo.com' },
    goals: [
      { id: 1, name: 'Vacaciones en grupo', type: 'Grupal', icon: '🏝️', target: 5000000, date: '2027-12-15', members: [me, 'María Gómez', 'Juan Pérez', 'Laura Cruz'] },
      { id: 2, name: 'Fondo de emergencia', type: 'Individual', icon: '🛡️', target: 2000000, date: '2027-06-30', members: [me] },
      { id: 3, name: 'Regalo cumpleaños mamá', type: 'Grupal', icon: '🎁', target: 1000000, date: '2026-12-01', members: [me, 'María Gómez'] }
    ],
    contribs: [
      { goal: 1, who: 'Laura Cruz', amount: 900000, date: iso(5) },
      { goal: 1, who: 'Juan Pérez', amount: 1200000, date: iso(3) },
      { goal: 2, who: me, amount: 700000, date: iso(2) },
      { goal: 3, who: me, amount: 400000, date: iso(2) },
      { goal: 1, who: 'María Gómez', amount: 800000, date: iso(1) },
      { goal: 3, who: 'María Gómez', amount: 500000, date: iso(1) },
      { goal: 1, who: me, amount: 500000, date: iso(0) }
    ],
    alerts: [
      { icon: '🔔', title: 'Nuevo aporte en “Vacaciones en grupo”', text: 'María Gómez aportó $800.000 · Hace 1 hora', read: false },
      { icon: '🎁', title: 'Meta “Regalo cumpleaños mamá”', text: '¡Vas muy bien! Has alcanzado el 90% de tu meta · Ayer', read: false },
      { icon: '🛡️', title: 'Recordatorio: Fondo de emergencia', text: 'No olvides aportar para alcanzar tu meta · Hace 2 días', read: true },
      { icon: '👥', title: 'Juan Pérez se unió a “Vacaciones en grupo”', text: 'Hace 3 días', read: true }
    ],
    cards: [{ brand: 'Visa', last4: '1234' }, { brand: 'Mastercard', last4: '5678' }]
  };
}
let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
S = S || seed();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const saved = g => S.contribs.filter(c => c.goal == g.id).reduce((a, c) => a + c.amount, 0);
const pct = g => Math.min(100, Math.round(saved(g) / g.target * 100));
const goalById = id => S.goals.find(g => g.id == id);
const param = k => new URLSearchParams(location.search).get(k);
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg; document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

/* ---------- Componentes ---------- */
const card = g => `
<a class="card goal" href="meta.html?id=${g.id}">
  <span class="ic">${g.icon}</span>
  <div>
    <div class="row"><b>${esc(g.name)}</b><b class="ok">${pct(g)}%</b></div>
    <span class="mu">${g.type}</span>
    <div class="bar"><i style="width:${pct(g)}%"></i></div>
    <span class="mu">${fmt(saved(g))} de ${fmt(g.target)}</span>
  </div>
</a>`;
const contribRow = (c, showGoal = true) => {
  const g = goalById(c.goal);
  return `<div class="li"><div><span class="av">${ini(c.who)}</span><div><b>${esc(c.who)}</b><br><span class="mu">${showGoal && g ? esc(g.name) + ' · ' : ''}${ago(c.date)}</span></div></div><b>${fmt(c.amount)}</b></div>`;
};
const recent = n => [...S.contribs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n);

/* ---------- Vistas ---------- */
const V = {
  home() {
    const total = S.goals.reduce((a, g) => a + saved(g), 0);
    return `
    <div class="row"><div><h1>Hola, ${esc(S.user.name.split(' ')[0])}</h1><p class="mu">Así van tus metas de ahorro</p></div><span class="av">${ini(S.user.name)}</span></div>
    <section class="hero2"><span>Balance total ahorrado</span><b>${fmt(total)}</b><span>${S.goals.length} metas activas</span></section>
    <div class="row sh"><h2>Tus metas</h2><a class="ok" href="metas.html">Ver todas</a></div>
    <div class="grid">${S.goals.map(card).join('')}</div>
    <h2 class="sh">Aportes recientes</h2>
    <div class="card">${recent(4).map(c => contribRow(c)).join('')}</div>`;
  },
  metas() {
    return `
    <div class="row"><h1>Mis metas</h1><button class="btn m" id="nueva">+ Nueva meta</button></div>
    <div class="grid" style="margin-top:20px">${S.goals.map(card).join('')}</div>
    <dialog id="dlg"><form id="fm" method="dialog">
      <h2>Crear nueva meta</h2>
      <label for="n">Nombre</label><input id="n" required maxlength="40">
      <label for="t">Tipo</label><select id="t"><option>Individual</option><option>Grupal</option></select>
      <label for="i">Ícono</label><select id="i"><option>🎯</option><option>🏝️</option><option>🏠</option><option>🚗</option><option>🎓</option><option>🎁</option></select>
      <label for="m">Monto objetivo (COP)</label><input id="m" type="number" min="10000" required>
      <label for="d">Fecha límite</label><input id="d" type="date" required>
      <button class="btn p w" value="ok">Crear meta</button>
      <button class="btn w" value="cancel" formnovalidate>Cancelar</button>
    </form></dialog>`;
  },
  meta() {
    const g = goalById(param('id'));
    if (!g) return '<h1>Meta no encontrada</h1><p class="mu"><a class="ok" href="metas.html">Volver a mis metas</a></p>';
    const falta = Math.max(0, g.target - saved(g));
    const fecha = new Date(g.date + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    return `
    <a class="ok" href="metas.html">← Volver</a>
    <h1 style="margin-top:8px">${g.icon} ${esc(g.name)}</h1>
    <p style="margin-top:6px"><span class="chip">${g.type}</span><span class="chip">${g.members.length} integrante${g.members.length > 1 ? 's' : ''}</span></p>
    <section class="card" style="margin-top:16px">
      <div class="row"><b>${fmt(saved(g))} <span class="mu">de ${fmt(g.target)}</span></b><b class="ok">${pct(g)}%</b></div>
      <div class="bar"><i style="width:${pct(g)}%"></i></div>
      <span class="mu">Faltan ${fmt(falta)} · ${fecha}</span>
    </section>
    <div class="tabs" role="tablist"><button class="on" data-t="aportes">Aportes</button><button data-t="miembros">Miembros</button><button data-t="actividad">Actividad</button></div>
    <div class="card" id="tabbody" style="margin-top:12px"></div>
    <a class="btn m w" href="aporte.html?id=${g.id}">Aportar a esta meta</a>`;
  },
  aporte() {
    const g = goalById(param('id')) || S.goals[0];
    return `
    <h1>Aportar a una meta</h1><p class="mu">Elige el monto y el método de pago</p>
    <form class="form card" id="fa" style="margin-top:18px">
      <label for="g">Meta</label><select id="g">${S.goals.map(x => `<option value="${x.id}" ${x.id == g.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
      <label>Monto rápido</label>
      <div class="amts">${[50000, 100000, 200000].map(v => `<button type="button" data-v="${v}">${fmt(v)}</button>`).join('')}</div>
      <label for="a">Monto personalizado (COP)</label><input id="a" type="number" min="1000" required value="100000">
      <label for="p">Método de pago</label>
      <select id="p">${S.cards.map(c => `<option>${c.brand} terminada en ${c.last4}</option>`).join('')}</select>
      <button class="btn p w">Confirmar aporte</button>
      <a class="btn w" href="home.html">Cancelar</a>
    </form>`;
  },
  alertas() {
    return `
    <div class="row"><h1>Alertas</h1><button class="btn" id="todas">Marcar todas como leídas</button></div>
    <div class="card" style="margin-top:18px">${S.alerts.map((a, i) => `
      <div class="li al ${a.read ? 'read' : ''}" data-i="${i}" tabindex="0" role="button">
        <div><span class="ic">${a.icon}</span><div><b>${esc(a.title)}</b><br><span class="mu">${esc(a.text)}</span></div></div><span class="dot"></span>
      </div>`).join('')}</div>`;
  },
  perfil() {
    return `
    <h1>Perfil</h1>
    <div class="card row" style="margin-top:18px;justify-content:flex-start"><span class="av" style="width:56px;height:56px;font-size:18px">${ini(S.user.name)}</span><div><b>${esc(S.user.name)}</b><br><span class="mu">${esc(S.user.email)}</span></div></div>
    <h2 class="sh">Métodos de pago</h2>
    <div class="card">${S.cards.map(c => `<div class="li"><b>${c.brand}</b><span class="mu">terminada en ${c.last4}</span></div>`).join('')}</div>
    <form id="fc" class="card form" style="margin-top:12px">
      <b>+ Agregar método de pago</b>
      <label for="b">Tarjeta</label><select id="b"><option>Visa</option><option>Mastercard</option></select>
      <label for="l">Últimos 4 dígitos</label><input id="l" pattern="\\d{4}" maxlength="4" required inputmode="numeric">
      <button class="btn m w">Agregar</button>
    </form>
    <h2 class="sh">Cuenta</h2>
    <div class="card"><a class="li" href="alertas.html">Notificaciones <span>›</span></a><a class="li" href="#" onclick="toast('Próximamente');return false">Configuración de cuenta <span>›</span></a><a class="li" href="#" onclick="toast('Próximamente');return false">Ayuda y soporte <span>›</span></a><a class="li" href="index.html">Cerrar sesión <span>›</span></a></div>`;
  }
};

/* ---------- Eventos por página ---------- */
const H = {
  metas() {
    const dlg = $('#dlg');
    $('#nueva').onclick = () => dlg.showModal();
    $('#fm').onsubmit = e => {
      if (e.submitter && e.submitter.value === 'cancel') return;
      S.goals.push({ id: Math.max(0, ...S.goals.map(g => g.id)) + 1, name: $('#n').value.trim(), type: $('#t').value, icon: $('#i').value, target: +$('#m').value, date: $('#d').value, members: [S.user.name] });
      save(); location.reload();
    };
  },
  meta() {
    const g = goalById(param('id')); if (!g) return;
    const body = $('#tabbody');
    const show = t => {
      document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
      const cs = S.contribs.filter(c => c.goal == g.id).sort((a, b) => b.date.localeCompare(a.date));
      body.innerHTML = t === 'aportes' ? cs.map(c => contribRow(c, false)).join('') || '<p class="mu">Aún no hay aportes.</p>'
        : t === 'miembros' ? g.members.map(m => `<div class="li"><div><span class="av">${ini(m)}</span><b>${esc(m)}</b></div><span class="mu">${fmt(cs.filter(c => c.who === m).reduce((a, c) => a + c.amount, 0))} aportados</span></div>`).join('')
        : cs.map(c => `<div class="li"><span>${esc(c.who)} aportó <b>${fmt(c.amount)}</b></span><span class="mu">${ago(c.date)}</span></div>`).join('') || '<p class="mu">Sin actividad.</p>';
    };
    document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => show(b.dataset.t));
    show('aportes');
  },
  aporte() {
    const inp = $('#a');
    document.querySelectorAll('.amts button').forEach(b => b.onclick = () => {
      inp.value = b.dataset.v;
      document.querySelectorAll('.amts button').forEach(x => x.classList.toggle('on', x === b));
    });
    $('#fa').onsubmit = e => {
      e.preventDefault();
      const g = goalById($('#g').value), amount = +inp.value;
      S.contribs.push({ goal: g.id, who: S.user.name, amount, date: iso(0) });
      S.alerts.unshift({ icon: '💸', title: `Aporte en “${g.name}”`, text: `Aportaste ${fmt(amount)} · Ahora`, read: false });
      save(); toast('¡Aporte confirmado!');
      setTimeout(() => location.href = 'meta.html?id=' + g.id, 800);
    };
  },
  alertas() {
    const toggle = el => { const a = S.alerts[el.dataset.i]; a.read = !a.read; save(); render(); };
    document.querySelectorAll('.al').forEach(el => { el.onclick = () => toggle(el); el.onkeydown = e => e.key === 'Enter' && toggle(el); });
    $('#todas').onclick = () => { S.alerts.forEach(a => a.read = true); save(); render(); };
  },
  perfil() {
    $('#fc').onsubmit = e => {
      e.preventDefault();
      S.cards.push({ brand: $('#b').value, last4: $('#l').value });
      save(); render(); toast('Método de pago agregado');
    };
  }
};

/* ---------- Estructura general (menú lateral / barra inferior) ---------- */
const NAV = [['home', '🏠', 'Inicio'], ['metas', '🎯', 'Metas'], ['aporte', '💲', 'Aportar'], ['alertas', '🔔', 'Alertas'], ['perfil', '👤', 'Perfil']];
function render() {
  const page = document.body.dataset.page;
  const active = page === 'meta' ? 'metas' : page;
  const unread = S.alerts.filter(a => !a.read).length;
  const links = NAV.map(([h, i, t]) => `<a class="nl ${h === active ? 'on' : ''}" href="${h}.html"><i>${i}</i>${t}${h === 'alertas' && unread ? `<span class="bdg">${unread}</span>` : ''}</a>`).join('');
  document.body.innerHTML = `<aside class="side"><a class="logo" href="home.html">Financial<b>Group</b></a><nav>${links}</nav></aside><main id="main">${V[page]()}</main><nav class="tab" aria-label="Principal">${links}</nav>`;
  if (H[page]) H[page]();
}

/* ---------- Inicio de sesión ---------- */
function initLogin() {
  const reg = param('registro') !== null;
  if (reg) { $('#t').textContent = 'Crea tu cuenta'; $('#sub').textContent = 'Empieza a ahorrar en equipo'; $('.reg').hidden = false; $('#sw').innerHTML = '¿Ya tienes cuenta? <a class="ok" href="login.html">Inicia sesión</a>'; }
  $('#f').onsubmit = e => {
    e.preventDefault();
    S.user.email = $('#e').value;
    if (reg && $('#nm').value.trim()) S.user.name = $('#nm').value.trim();
    save(); location.href = 'home.html';
  };
}

const pg = document.body.dataset.page;
if (pg === 'login') initLogin(); else if (V[pg]) render();
