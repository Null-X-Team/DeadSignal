export type Phase = "menu" | "combat" | "intermission" | "shop" | "dead";

export type WeaponId = "pistol" | "scatter" | "smg" | "rail";

export type WeaponDef = {
  id: WeaponId;
  name: string;
  slot: string;
  mag: number;
  reserveStart: number;
  damage: number;
  fireRate: number;
  reload: number;
  speed: number;
  pellets: number;
  spread: number;
  color: string;
  recoil: number;
  cost: number;
};

export type WeaponState = WeaponDef & {
  ammo: number;
  reserve: number;
  owned: boolean;
};

export type EnemyType = "signal" | "runner" | "brute";

export type Enemy = {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  score: number;
  color: string;
  hit: number;
  attack: number;
  knock: number;
  dead: boolean;
  doorId: number;
  facing: number;
  step: number;
};

export type Door = {
  id: number;
  x: number;
  kind: "spawn" | "shop";
  open: number;
  target: number;
  label: string;
};

export type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  color: string;
  r: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
};

export type HudSnap = {
  hp: number;
  maxHp: number;
  score: number;
  credits: number;
  wave: number;
  remaining: number;
  weaponName: string;
  slot: string;
  ammo: number;
  reserve: number;
  reloadT: number;
  kickT: number;
  message: string;
  phase: Phase;
  nearShop: boolean;
  shopOpen: boolean;
  rest: number;
  highScore: number;
  owned: Record<WeaponId, boolean>;
  weaponIndex: number;
};

export type ShopItem = {
  id: string;
  name: string;
  blurb: string;
  cost: number;
  kind: "patch" | "gun" | "ammo";
  weaponId?: WeaponId;
};
