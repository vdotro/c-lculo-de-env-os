'use client';
import { useEffect, useState } from 'react';
import './globals.css';

export default function Page() {
  const [user, setUser] = useState(null); // {name, role} o null
  const [legajo, setLegajo] = useState('');
  const [pin, setPin] = useState('');
  const [loginErr, setLoginErr] = useState(false);
  const [config, setConfig] = useState(null);
  const [qtys, setQtys] = useState({});
  const [km, setKm] = useState(0);
  const [subidaCheck, setSubidaCheck] = useState(false);
  const [loading, setLoading] = useState(true);

  // Al cargar: ver si hay sesión activa
  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      if (d.ok) { setUser({ name: d.name, role: d.role }); loadConfig(); }
      else setLoading(false);
    });
  }, []);

  function loadConfig() {
    setLoading(true);
    fetch('/api/config').then(r => r.json()).then(c => {
      setConfig(c);
      const q = {};
      c.products.forEach(p => q[p.id] = 0);
      setQtys(q);
      setLoading(false);
    });
  }

  async function saveConfig(next) {
    setConfig(next);
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legajo, pin }),
    });
    const data = await res.json();
    if (data.ok) {
      setUser({ name: data.name, role: data.role });
      setLoginErr(false);
      setLegajo(''); setPin('');
      loadConfig();
    } else {
      setLoginErr(true);
    }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
    setConfig(null);
  }

  if (!user) {
    return (
      <div id="loginGate">
        <form className="gate-card" onSubmit={handleLogin}>
          <h1>Calculadora de envíos</h1>
          <p className="sub">Ingresá tu legajo y PIN para continuar.</p>
          <label>Legajo</label>
          <input value={legajo} onChange={e => setLegajo(e.target.value)} placeholder="Ej: 0001" />
          <label>PIN</label>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" />
          {loginErr && <div className="login-err">Legajo o PIN incorrecto.</div>}
          <button type="submit">Ingresar</button>
        </form>
      </div>
    );
  }

  if (loading || !config) {
    return <div className="wrap"><p>Cargando…</p></div>;
  }

  const isAdmin = user.role === 'admin';
  const totalPts = config.products.reduce((s, p) => s + p.pts * (qtys[p.id] || 0), 0);
  const sorted = [...config.tiers].sort((a, b) => (a.maxPts ?? Infinity) - (b.maxPts ?? Infinity));
  const matched = totalPts > 0 ? (sorted.find(t => t.maxPts === null || totalPts <= t.maxPts) || sorted[sorted.length - 1]) : null;
  const colors = ['#6E8F5C', '#C98A34', '#B44B2C', '#4F6D8C', '#8E5B3F', '#7A4F8C', '#4A8C7A'];
  const tierColor = matched ? colors[sorted.indexOf(matched) % colors.length] : 'var(--ink-soft)';
  const kmCost = matched ? matched.kmRate * km : 0;
  const subidaFija = subidaCheck && matched ? config.subidaMonto : 0;
  const subidaPctCost = subidaCheck && matched ? (kmCost * config.subidaPct / 100) : 0;
  const total = kmCost + subidaFija + subidaPctCost;

  function setQty(id, delta) {
    setQtys(q => ({ ...q, [id]: Math.max(0, (q[id] || 0) + delta) }));
  }

  function updateProductPts(id, pts) {
    const next = { ...config, products: config.products.map(p => p.id === id ? { ...p, pts } : p) };
    saveConfig(next);
  }
  function deleteProduct(id) {
    const next = { ...config, products: config.products.filter(p => p.id !== id) };
    saveConfig(next);
  }
  function addProduct(name, pts) {
    const id = 'custom_' + Date.now();
    const next = { ...config, products: [...config.products, { id, name, pts }] };
    saveConfig(next);
    setQtys(q => ({ ...q, [id]: 0 }));
  }

  function updateTier(id, field, value) {
    const next = { ...config, tiers: config.tiers.map(t => t.id === id ? { ...t, [field]: value } : t) };
    saveConfig(next);
  }
  function deleteTier(id) {
    if (config.tiers.length <= 1) { alert('Debe quedar al menos un tipo de envío.'); return; }
    const next = { ...config, tiers: config.tiers.filter(t => t.id !== id) };
    saveConfig(next);
  }
  function addTier(name, maxPts, kmRate) {
    const id = 'tier_' + Date.now();
    const next = { ...config, tiers: [...config.tiers, { id, name, maxPts, kmRate }] };
    saveConfig(next);
  }

  function updateAdmin(legajoKey, field, value) {
    const next = { ...config, admins: config.admins.map(a => a.legajo === legajoKey ? { ...a, [field]: value } : a) };
    saveConfig(next);
  }
  function deleteAdmin(legajoKey) {
    if (config.admins.length <= 1) { alert('Debe quedar al menos un usuario.'); return; }
    const next = { ...config, admins: config.admins.filter(a => a.legajo !== legajoKey) };
    saveConfig(next);
  }
  function addAdmin(name, legajoVal, pinVal, role) {
    if (config.admins.some(a => a.legajo === legajoVal)) { alert('Ese legajo ya existe.'); return; }
    const next = { ...config, admins: [...config.admins, { name, legajo: legajoVal, pin: pinVal, role }] };
    saveConfig(next);
  }

  function updateSubida(field, value) {
    saveConfig({ ...config, [field]: value });
  }

  return (
    <div className="wrap">
      <div className="top-bar">
        <span>Hola, <b style={{ color: 'var(--ink)' }}>{user.name}</b>{isAdmin ? ' (administrador)' : ''}</span>
        <button onClick={handleLogout}>Salir</button>
      </div>

      <h1>Calculadora de envíos</h1>
      <p className="sub">Sumá los productos del pedido, cargá la distancia y obtené el tipo de envío y el precio.</p>

      <div className="grid">
        <div className="card">
          <h2>Productos del pedido</h2>
          <div>
            {config.products.map(p => (
              <div className="item-row" key={p.id}>
                <div>{p.name}</div>
                <div>
                  {isAdmin
                    ? <input className="pts-input" type="number" min="0" value={p.pts}
                        onChange={e => updateProductPts(p.id, parseFloat(e.target.value) || 0)} />
                    : <div style={{ textAlign: 'center' }}>{p.pts}</div>}
                </div>
                <div className="qty">
                  <button onClick={() => setQty(p.id, -1)}>−</button>
                  <span>{qtys[p.id] || 0}</span>
                  <button onClick={() => setQty(p.id, 1)}>+</button>
                </div>
                {isAdmin ? <button className="del-btn" onClick={() => deleteProduct(p.id)}>×</button> : <span />}
              </div>
            ))}
          </div>

          {isAdmin && <AddProductRow onAdd={addProduct} />}

          <div style={{ marginTop: 20 }}>
            <h2 style={{ marginBottom: 6 }}>Distancia</h2>
            <div className="km-row">
              <input type="number" min="0" step="0.5" value={km === 0 ? '' : km} onChange={e => setKm(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} placeholder="0" />
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>km</span>
            </div>
          </div>

          <div className="subida-row">
            <label>
              <input type="checkbox" checked={subidaCheck} onChange={e => setSubidaCheck(e.target.checked)} />
              Incluye subida a domicilio (escalera / piso alto)
              <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                {(config.subidaMonto > 0 || config.subidaPct > 0) &&
                  '(' + [config.subidaMonto > 0 ? '+$' + config.subidaMonto.toLocaleString('es-AR') : null,
                         config.subidaPct > 0 ? '+' + config.subidaPct + '% del km' : null]
                        .filter(Boolean).join(' y ') + ')'}
              </span>
            </label>
          </div>
        </div>

        <div className="card result-card">
          <h2>Resultado</h2>
          <span className="tier-badge" style={{ background: tierColor }}>{matched ? matched.name : 'Sin productos'}</span>
          <div className="price">${total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
          {matched && (
            <div className="breakdown">
              <div><span>Tarifa {matched.name}</span><span>${matched.kmRate.toLocaleString('es-AR')}/km</span></div>
              <div><span>{km} km × ${matched.kmRate}/km</span><span>${kmCost.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span></div>
              {subidaFija > 0 && <div><span>Subida a domicilio (fijo)</span><span>${subidaFija.toLocaleString('es-AR')}</span></div>}
              {subidaCheck && config.subidaPct > 0 && <div><span>Subida a domicilio ({config.subidaPct}% del km)</span><span>${subidaPctCost.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span></div>}
            </div>
          )}
          <div className="points-total">{totalPts} punto{totalPts === 1 ? '' : 's'} de bulto</div>

          {!isAdmin && <div className="locked-note">🔒 Pedile a un administrador que ingrese para configurar tipos de envío, subida y usuarios.</div>}

          {isAdmin && (
            <>
              <details>
                <summary>Costo extra por subida a domicilio</summary>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <span>$</span>
                  <input type="number" min="0" style={{ width: 100 }} value={config.subidaMonto}
                    onChange={e => updateSubida('subidaMonto', parseFloat(e.target.value) || 0)} />
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>monto fijo</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <input type="number" min="0" step="0.5" style={{ width: 100 }} value={config.subidaPct}
                    onChange={e => updateSubida('subidaPct', parseFloat(e.target.value) || 0)} />
                  <span>%</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>extra sobre el costo por km</span>
                </div>
              </details>

              <details>
                <summary>Configurar tipos de envío</summary>
                {sorted.map(t => (
                  <div className="tier-row" key={t.id}>
                    <input value={t.name} onChange={e => updateTier(t.id, 'name', e.target.value)} />
                    <input type="number" placeholder="sin límite" value={t.maxPts ?? ''}
                      onChange={e => updateTier(t.id, 'maxPts', e.target.value === '' ? null : parseFloat(e.target.value))} />
                    <input type="number" value={t.kmRate} onChange={e => updateTier(t.id, 'kmRate', parseFloat(e.target.value) || 0)} />
                    <button className="del-btn" onClick={() => deleteTier(t.id)}>×</button>
                  </div>
                ))}
                <AddTierRow onAdd={addTier} />
              </details>

              <details>
                <summary>Usuarios (legajo, PIN y rol)</summary>
                {config.admins.map(a => (
                  <div className="admin-list-row" key={a.legajo}>
                    <input value={a.name} onChange={e => updateAdmin(a.legajo, 'name', e.target.value)} />
                    <input value={a.legajo} onChange={e => updateAdmin(a.legajo, 'legajo', e.target.value)} />
                    <input value={a.pin} onChange={e => updateAdmin(a.legajo, 'pin', e.target.value)} />
                    <select value={a.role} onChange={e => updateAdmin(a.legajo, 'role', e.target.value)}>
                      <option value="vendedor">Vendedor</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <button className="del-btn" onClick={() => deleteAdmin(a.legajo)}>×</button>
                  </div>
                ))}
                <AddAdminRow onAdd={addAdmin} />
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddProductRow({ onAdd }) {
  const [name, setName] = useState('');
  const [pts, setPts] = useState(1);
  return (
    <div className="add-row">
      <input placeholder="Nombre del producto" value={name} onChange={e => setName(e.target.value)} />
      <input type="number" min="1" style={{ width: 60 }} value={pts} onChange={e => setPts(parseFloat(e.target.value) || 1)} />
      <button onClick={() => { if (!name.trim()) return; onAdd(name.trim(), pts); setName(''); setPts(1); }}>+ Agregar</button>
    </div>
  );
}

function AddTierRow({ onAdd }) {
  const [name, setName] = useState('');
  const [maxPts, setMaxPts] = useState('');
  const [kmRate, setKmRate] = useState('');
  return (
    <div className="add-row">
      <input placeholder="Nombre (ej: Tipo 4)" value={name} onChange={e => setName(e.target.value)} />
      <input type="number" placeholder="Hasta pts" style={{ width: 80 }} value={maxPts} onChange={e => setMaxPts(e.target.value)} />
      <input type="number" placeholder="$/km" style={{ width: 70 }} value={kmRate} onChange={e => setKmRate(e.target.value)} />
      <button onClick={() => {
        onAdd(name.trim() || 'Tipo nuevo', maxPts === '' ? null : parseFloat(maxPts), parseFloat(kmRate) || 0);
        setName(''); setMaxPts(''); setKmRate('');
      }}>+ Agregar tipo</button>
    </div>
  );
}

function AddAdminRow({ onAdd }) {
  const [name, setName] = useState('');
  const [legajoVal, setLegajoVal] = useState('');
  const [pinVal, setPinVal] = useState('');
  const [role, setRole] = useState('vendedor');
  return (
    <div className="add-row">
      <input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Legajo" style={{ width: 70 }} value={legajoVal} onChange={e => setLegajoVal(e.target.value)} />
      <input placeholder="PIN" style={{ width: 60 }} value={pinVal} onChange={e => setPinVal(e.target.value)} />
      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="vendedor">Vendedor</option>
        <option value="admin">Administrador</option>
      </select>
      <button onClick={() => {
        if (!name.trim() || !legajoVal.trim() || !pinVal.trim()) return;
        onAdd(name.trim(), legajoVal.trim(), pinVal.trim(), role);
        setName(''); setLegajoVal(''); setPinVal(''); setRole('vendedor');
      }}>+ Agregar</button>
    </div>
  );
}
