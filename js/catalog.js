window.DS = window.DS || {};

DS.VIEW_W = 1280;
DS.VIEW_H = 720;
DS.WORLD_W = 2920;
DS.FLOOR_Y = 548;
DS.WALL_Y = 118;

DS.rand = (a, b) => a + Math.random() * (b - a);
DS.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

DS.WEAPONS = [
  {
    id: "pistol",
    name: "Pulse Pistol",
    slot: "1",
    mag: 12,
    reserveStart: 72,
    damage: 34,
    fireRate: 0.21,
    reload: 0.92,
    speed: 1240,
    pellets: 1,
    spread: 0.022,
    color: "#00ffd5",
    recoil: 3,
    cost: 0,
  },
  {
    id: "scatter",
    name: "Scatter Blaster",
    slot: "2",
    mag: 6,
    reserveStart: 30,
    damage: 18,
    fireRate: 0.58,
    reload: 1.28,
    speed: 980,
    pellets: 6,
    spread: 0.22,
    color: "#c58aff",
    recoil: 8,
    cost: 80,
  },
  {
    id: "smg",
    name: "Needle SMG",
    slot: "3",
    mag: 24,
    reserveStart: 96,
    damage: 15,
    fireRate: 0.075,
    reload: 1.15,
    speed: 1180,
    pellets: 1,
    spread: 0.07,
    color: "#9ad7ff",
    recoil: 2,
    cost: 120,
  },
  {
    id: "rail",
    name: "Rail Lance",
    slot: "4",
    mag: 4,
    reserveStart: 16,
    damage: 118,
    fireRate: 0.82,
    reload: 1.55,
    speed: 2300,
    pellets: 1,
    spread: 0.004,
    color: "#f7f3ff",
    recoil: 11,
    cost: 180,
  },
];

DS.SHOP_ITEMS = [
  {
    id: "patch",
    name: "Field Patch",
    blurb: "Seal 40 vital points.",
    cost: 22,
    kind: "patch",
  },
  {
    id: "kit",
    name: "Trauma Kit",
    blurb: "Full vital restore.",
    cost: 48,
    kind: "patch",
  },
  {
    id: "ammo",
    name: "Mag Crate",
    blurb: "Reserve ammo for the held gun.",
    cost: 16,
    kind: "ammo",
  },
  {
    id: "scatter",
    name: "Scatter Blaster",
    blurb: "Wide pellet cone. Slot 2.",
    cost: 80,
    kind: "gun",
    weaponId: "scatter",
  },
  {
    id: "smg",
    name: "Needle SMG",
    blurb: "High cyclic fire. Slot 3.",
    cost: 120,
    kind: "gun",
    weaponId: "smg",
  },
  {
    id: "rail",
    name: "Rail Lance",
    blurb: "Armor-piercing beam. Slot 4.",
    cost: 180,
    kind: "gun",
    weaponId: "rail",
  },
];
