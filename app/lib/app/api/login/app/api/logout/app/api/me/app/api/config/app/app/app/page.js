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
