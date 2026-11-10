// =========================================================================
// 🏛️ MONOPOLY BOARD CONFIG — Patrón: Flyweight & Factory
// Define las 28 casillas del tablero perimetral (8x8), mazos y fichas
// =========================================================================
(function() {
  const TOKENS = [
    { id: 'mototaxi', icon: '🛺', name: 'Torito 3D', color: '#00f3ff' },
    { id: 'michi',    icon: '🐾', name: 'Super Michi', color: '#ffd700' },
    { id: 'llama',    icon: '🦙', name: 'Mecha Llama', color: '#ff007f' },
    { id: 'cyber',    icon: '💻', name: 'Cyber Deck', color: '#00ff88' },
    { id: 'rocket',   icon: '🚀', name: 'Starship', color: '#ff7b00' },
    { id: 'crown',    icon: '👑', name: 'Inca Gold', color: '#b86bff' }
  ];

  const GROUPS = {
    BROWN:   { color: '#8d5524', name: 'Centro Histórico', houseCost: 50 },
    CYAN:    { color: '#00d2ff', name: 'Norte Chico',      houseCost: 50 },
    PINK:    { color: '#ff2a85', name: 'Ruta Andina',      houseCost: 100 },
    ORANGE:  { color: '#ff8c00', name: 'Hub Industrial',   houseCost: 100 },
    RED:     { color: '#ff2e4c', name: 'Sur Imperial',     houseCost: 150 },
    YELLOW:  { color: '#ffd700', name: 'Distrito Tech',    houseCost: 150 },
    GREEN:   { color: '#00e676', name: 'Finanzas Prime',   houseCost: 200 },
    BLUE:    { color: '#4d79ff', name: 'Silicon Lima',     houseCost: 200 },
    RAIL:    { color: '#9ea7b8', name: 'Transporte',       houseCost: 0 },
    UTILITY: { color: '#c084fc', name: 'Cloud & SAP',      houseCost: 0 }
  };

  // 28 casillas alrededor del perímetro (7 por lado: índices 0 a 27)
  const TILES = [
    { id: 0,  type: 'GO',        name: 'SALIDA GO',      sub: '+$200 AL PASAR', icon: '🚀' },
    { id: 1,  type: 'PROP',      name: 'TUMÁN CENTRO',   group: 'BROWN',   price: 60,  rent: [4, 20, 60, 180, 320, 450] },
    { id: 2,  type: 'CHEST',     name: 'ARCA COMUNAL',   sub: 'CARTA TESORO',   icon: '📦' },
    { id: 3,  type: 'PROP',      name: 'CHICLAYO PLAZA', group: 'BROWN',   price: 60,  rent: [6, 30, 90, 270, 400, 550] },
    { id: 4,  type: 'TAX',       name: 'SUNAT IGV',      sub: 'PAGA $150',      amount: 150, icon: '🏛️' },
    { id: 5,  type: 'RAIL',      name: 'LÍNEA 1 METRO',  group: 'RAIL',    price: 200, rent: [25, 50, 100, 200], icon: '🚝' },
    { id: 6,  type: 'PROP',      name: 'TRUJILLO TECH',  group: 'CYAN',    price: 100, rent: [8, 40, 100, 300, 450, 600] },

    { id: 7,  type: 'JAIL',      name: 'CÁRCEL / VISITA',sub: 'SOLO DE PASO',   icon: '⛓️' },
    { id: 8,  type: 'PROP',      name: 'PIURA SOLAR',    group: 'CYAN',    price: 120, rent: [10, 50, 150, 450, 625, 750] },
    { id: 9,  type: 'PROP',      name: 'CAJAMARCA GOLD', group: 'PINK',    price: 140, rent: [12, 60, 180, 500, 700, 900] },
    { id: 10, type: 'UTILITY',   name: 'SAP HANA CLOUD', group: 'UTILITY', price: 150, rent: [4, 10], icon: '☁️' },
    { id: 11, type: 'PROP',      name: 'HUANCAYO HUB',   group: 'PINK',    price: 160, rent: [14, 70, 200, 550, 750, 950] },
    { id: 12, type: 'RAIL',      name: 'TREN ANDINO',    group: 'RAIL',    price: 200, rent: [25, 50, 100, 200], icon: '🚂' },
    { id: 13, type: 'PROP',      name: 'IQUITOS FIBER',  group: 'ORANGE',  price: 180, rent: [16, 80, 220, 600, 800, 1000] },

    { id: 14, type: 'PARKING',   name: 'PARADA LIBRE',   sub: 'JACKPOT RELAX',  icon: '🎰' },
    { id: 15, type: 'PROP',      name: 'PARACAS PORT',   group: 'ORANGE',  price: 200, rent: [18, 90, 250, 700, 875, 1050] },
    { id: 16, type: 'CHANCE',    name: 'CASUALIDAD',     sub: 'CARTA SUERTE',   icon: '❓' },
    { id: 17, type: 'PROP',      name: 'AREQUIPA WHITE', group: 'RED',     price: 220, rent: [20, 100, 300, 750, 925, 1100] },
    { id: 18, type: 'PROP',      name: 'CUSCO IMPERIAL', group: 'RED',     price: 240, rent: [22, 110, 330, 800, 975, 1150] },
    { id: 19, type: 'RAIL',      name: 'PUERTO CHANCAY', group: 'RAIL',    price: 200, rent: [25, 50, 100, 200], icon: '🚢' },
    { id: 20, type: 'PROP',      name: 'BARRANCO ARTS',  group: 'YELLOW',  price: 260, rent: [24, 120, 360, 850, 1025, 1200] },

    { id: 21, type: 'GOTO_JAIL', name: 'IR A LA CÁRCEL', sub: 'ARRESTO DIRECTO',icon: '🚨' },
    { id: 22, type: 'PROP',      name: 'SURCO CYBER',    group: 'YELLOW',  price: 280, rent: [26, 130, 390, 900, 1100, 1275] },
    { id: 23, type: 'UTILITY',   name: 'RED 5G QUANTUM', group: 'UTILITY', price: 150, rent: [4, 10], icon: '⚡' },
    { id: 24, type: 'PROP',      name: 'MIRAFLORES BAY', group: 'GREEN',   price: 300, rent: [28, 150, 450, 1000, 1200, 1400] },
    { id: 25, type: 'CHEST',     name: 'ARCA COMUNAL',   sub: 'CARTA TESORO',   icon: '📦' },
    { id: 26, type: 'PROP',      name: 'SAN ISIDRO HQ',  group: 'BLUE',    price: 350, rent: [35, 175, 500, 1100, 1300, 1500] },
    { id: 27, type: 'PROP',      name: 'TORRE J_ABEL',   group: 'BLUE',    price: 400, rent: [50, 200, 600, 1400, 1700, 2000] }
  ];

  const CARDS = {
    CHANCE: [
      { title: 'Dividendo SAP HANA', text: 'Tu integración empresarial fue un éxito. Cobras $150.', money: 150 },
      { title: 'Viaje Express a Salida', text: 'Avanzas hasta SALIDA GO y cobras $200.', moveTo: 0, collectGo: true },
      { title: 'Multa de Tráfico en Mototaxi', text: 'Exceso de velocidad en Av. Micaela Bastidas. Pagas $75.', money: -75 },
      { title: 'Hackathon Ganada', text: 'Primer puesto en desarrollo WebGL. Recibes $120.', money: 120 },
      { title: 'Auditoría de Seguridad', text: 'Mantenimiento de servidores de emergencia. Pagas $100.', money: -100 }
    ],
    CHEST: [
      { title: 'Devolución Tributaria SUNAT', text: 'Saldo a favor en tu declaración anual. Cobras $100.', money: 100 },
      { title: 'Bono de Consultoría Full-Stack', text: 'Cliente internacional liquida factura. Recibes $200.', money: 200 },
      { title: 'Renovación de Licencias Cloud', text: 'Pago de clúster Docker y PostgreSQL. Pagas $80.', money: -80 },
      { title: 'Premio Super Michi', text: 'Michi te trajo una moneda dorada de la suerte. Cobras $100.', money: 100 },
      { title: 'Fallo en Servidor Principal', text: 'Vas directo a la Cárcel por caída de producción.', gotoJail: true }
    ]
  };

  window.MonopolyConfig = { TOKENS, GROUPS, TILES, CARDS };
})();
