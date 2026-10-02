export const DEFAULT_PRODUCTS = [
  { id: 'pc', name: 'Planta chica (maceta hasta 20cm)', pts: 1 },
  { id: 'pm', name: 'Planta mediana (maceta 20–40cm)', pts: 2 },
  { id: 'pg', name: 'Planta grande / árbol', pts: 4 },
  { id: 'tierra', name: 'Bolsa de tierra / sustrato', pts: 2 },
  { id: 'mch', name: 'Maceta chica (vacía)', pts: 1 },
  { id: 'mgr', name: 'Maceta grande / cerámica', pts: 3 },
  { id: 'otro', name: 'Otro (piedra, fertilizante, etc.)', pts: 1 },
];

export const DEFAULT_TIERS = [
  { id: 't1', name: 'Tipo 1 — Chico', maxPts: 4, kmRate: 150 },
  { id: 't2', name: 'Tipo 2 — Mediano', maxPts: 10, kmRate: 220 },
  { id: 't3', name: 'Tipo 3 — Grande', maxPts: null, kmRate: 320 },
];

export const DEFAULT_ADMINS = [
  { legajo: '0001', pin: '1234', name: 'Encargado', role: 'admin' },
  { legajo: '0002', pin: '1111', name: 'Vendedor', role: 'vendedor' },
];

export const DEFAULT_CONFIG = {
  products: DEFAULT_PRODUCTS,
  tiers: DEFAULT_TIERS,
  admins: DEFAULT_ADMINS,
  subidaMonto: 1500,
  subidaPct: 0,
};
