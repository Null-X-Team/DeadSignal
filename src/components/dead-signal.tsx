import { useEffect, useRef, useState, type ReactNode } from "react";
import { SHOP_ITEMS } from "@/game/catalog";
import { Engine } from "@/game/engine";
import type { HudSnap, ShopItem } from "@/game/types";
import { IconChevron, IconGun, IconKick, IconPatch, IconReload, IconShop } from "./icons";

const empty: HudSnap = {
  hp: 100,
  maxHp: 100,
  score: 0,
  credits: 0,
  wave: 0,
  remaining: 0,
  weaponName: "Pulse Pistol",
  slot: "1",
  ammo: 12,
  reserve: 72,
  reloadT: 0,
  kickT: 0,
  message: "",
  phase: "menu",
  nearShop: false,
  shopOpen: false,
  rest: 0,
  highScore: 0,
  owned: { pistol: true, scatter: false, smg: false, rail: false },
  weaponIndex: 0,
};

export function DeadSignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [hud, setHud] = useState<HudSnap>(empty);
  const [note, setNote] = useState("");
  const hudRef = useRef(hud);
  hudRef.current = hud;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let lastPush = 0;
    const engine = new Engine(
      canvas,
      (snap) => {
        const now = performance.now();
        if (now - lastPush < 80 && snap.phase === hudRef.current.phase && snap.shopOpen === hudRef.current.shopOpen) {
          return;
        }
        lastPush = now;
        setHud({ ...snap });
      },
      () => {},
    );
    engineRef.current = engine;
    return () => engine.destroy();
  }, []);

  const start = () => engineRef.current?.startRun();
  const buy = (item: ShopItem) => {
    const e = engineRef.current;
    if (!e) return;
    setNote(e.buy(item));
    e.pushHud();
  };

  const playing = hud.phase === "combat" || hud.phase === "intermission";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg p-0 sm:p-4">
      <div className="relative aspect-video w-full max-w-[1100px] overflow-hidden rounded-none border-0 border-border bg-[#21113a] shadow-none sm:rounded-lg sm:border">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 block h-full w-full touch-none bg-[#21113a]"
          style={{ cursor: playing ? "crosshair" : "default" }}
        />

        {playing ? (
          <div className="pointer-events-none absolute inset-0 font-mono text-fg">
            <div className="absolute top-3 left-3 min-w-52 rounded-md border border-border bg-bg/80 p-3">
              <div className="text-[10px] font-semibold tracking-widest text-muted uppercase">Vitals</div>
              <div className="mt-1 flex items-end gap-3 text-lg font-semibold tabular-nums">
                <span className="text-danger">{Math.ceil(hud.hp)}</span>
                <span className="text-xs text-muted">HP</span>
                <span className="text-xs text-muted">Score</span>
                <span className="text-accent">{hud.score}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full bg-danger"
                  style={{ width: `${(hud.hp / hud.maxHp) * 100}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] tracking-widest text-muted uppercase">
                Credits <span className="text-accent">{hud.credits}</span>
              </div>
            </div>

            <div className="absolute top-3 right-3 min-w-40 rounded-md border border-border bg-bg/80 p-3 text-right">
              <div className="text-[10px] font-semibold tracking-widest text-muted uppercase">Wave</div>
              <div className="text-lg font-semibold tabular-nums">
                {hud.wave} <span className="text-xs text-muted">/ inf</span>
              </div>
              <div className="text-[10px] text-muted">{hud.remaining} signals</div>
            </div>

            <div className="absolute right-3 bottom-3 min-w-48 rounded-md border border-border bg-bg/80 p-3 text-right">
              <div className="text-[10px] tracking-widest text-muted uppercase">
                {hud.weaponName} [{hud.slot}]
              </div>
              <div className="text-3xl font-semibold tabular-nums leading-none">
                {hud.ammo}
                <span className="text-sm text-muted"> / {hud.reserve}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded bg-elevated">
                <div className="h-full bg-accent" style={{ width: `${hud.reloadT * 100}%` }} />
              </div>
              <div className="mt-2 text-[10px] text-muted">
                Kick {hud.kickT > 0 ? `${hud.kickT.toFixed(1)}s` : "READY"}
              </div>
            </div>

            <div className="absolute bottom-3 left-3 hidden max-w-sm rounded-md border border-border bg-bg/80 p-3 text-[11px] leading-relaxed text-muted md:block">
              A/D walk the hall · Mouse aim/fire · R reload · Space kick · E armory · 1-4 guns
            </div>

            {hud.message ? (
              <div className="absolute top-[16%] left-1/2 w-[90%] -translate-x-1/2 text-center text-2xl font-semibold tracking-[0.18em] text-fg">
                {hud.message}
              </div>
            ) : null}

            {hud.phase === "intermission" ? (
              <div className="absolute top-[28%] left-1/2 -translate-x-1/2 rounded-md border border-accent/40 bg-bg/85 px-4 py-2 text-center text-xs tracking-widest text-accent uppercase">
                Armory open · {Math.max(0, Math.ceil(hud.rest))}s until next wave
              </div>
            ) : null}
          </div>
        ) : null}

        {hud.phase === "intermission" && !hud.shopOpen ? (
          <button
            type="button"
            onClick={() => engineRef.current?.toggleShop()}
            className="absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 translate-y-10 items-center gap-2 rounded-md border border-border bg-elevated px-4 py-3 text-sm font-medium text-fg"
          >
            <IconShop /> Open armory
          </button>
        ) : null}

        {hud.shopOpen ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-bg/80 p-4">
            <div className="max-h-[90%] w-full max-w-lg overflow-auto rounded-lg border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-accent uppercase">Facility armory</p>
                  <h2 className="font-sans text-2xl font-semibold tracking-tight">Supply rack</h2>
                  <p className="mt-1 text-sm text-muted">
                    Credits {hud.credits}. Guns unlock to slots 2-4. Patch-ups seal vitals.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-sm border border-border px-3 py-2 text-sm text-muted"
                  onClick={() => engineRef.current?.closeShop()}
                >
                  Close
                </button>
              </div>
              <ul className="mt-4 grid gap-2">
                {SHOP_ITEMS.map((item) => {
                  const owned =
                    item.kind === "gun" && item.weaponId
                      ? hud.owned[item.weaponId]
                      : false;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-elevated px-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-accent">
                          {item.kind === "gun" ? <IconGun /> : item.kind === "patch" ? <IconPatch /> : <IconReload />}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-muted">{item.blurb}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={owned || hud.credits < item.cost}
                        onClick={() => buy(item)}
                        className="min-w-20 rounded-sm bg-fg px-3 py-2 text-sm font-medium text-bg disabled:opacity-40"
                      >
                        {owned ? "Owned" : `${item.cost} cr`}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {note ? <p className="mt-3 text-sm text-accent">{note}</p> : null}
              <button
                type="button"
                onClick={() => engineRef.current?.continueWaves()}
                className="mt-4 w-full rounded-md bg-accent py-3 text-sm font-semibold text-accent-fg"
              >
                Next wave
              </button>
            </div>
          </div>
        ) : null}

        {hud.phase === "menu" || hud.phase === "dead" ? (
          <div className="absolute inset-0 z-30 grid place-items-center bg-bg/75 p-5">
            <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center">
              <p className="text-[10px] font-semibold tracking-[0.22em] text-accent uppercase">
                {hud.phase === "dead" ? "Containment failed" : "Null X Interactive"}
              </p>
              <h1 className="mt-2 font-sans text-5xl leading-[0.9] font-semibold tracking-tight sm:text-6xl">
                {hud.phase === "dead" ? (
                  <>
                    Signal
                    <br />
                    <span className="text-accent">lost</span>
                  </>
                ) : (
                  <>
                    Dead
                    <br />
                    <span className="text-accent">Signal</span>
                  </>
                )}
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
                {hud.phase === "dead"
                  ? `You held ${hud.wave} wave${hud.wave === 1 ? "" : "s"} for ${hud.score} points. Best ${hud.highScore}.`
                  : "A 2D facility hallway. Signals come through the bay doors. Between waves, spend credits on guns and patch-ups at the armory."}
              </p>
              {hud.phase === "menu" ? (
                <ul className="mt-5 grid grid-cols-1 gap-2 text-left text-xs text-muted sm:grid-cols-2">
                  <li className="rounded-sm border border-border bg-elevated p-2.5">A / D walk the hall</li>
                  <li className="rounded-sm border border-border bg-elevated p-2.5">Mouse aim and fire</li>
                  <li className="rounded-sm border border-border bg-elevated p-2.5">E open armory after a wave</li>
                  <li className="rounded-sm border border-border bg-elevated p-2.5">Space pulse kick</li>
                </ul>
              ) : null}
              <button
                type="button"
                onClick={start}
                className="mt-6 w-full rounded-md bg-fg py-3.5 text-sm font-semibold text-bg"
              >
                {hud.phase === "dead" ? "Restart containment" : "Start containment"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-0 z-10 md:hidden">
          <Hold
            className="bottom-24 left-4"
            onHold={(v) => engineRef.current?.holdKey("KeyA", v)}
          >
            <IconChevron dir="left" />
          </Hold>
          <Hold
            className="bottom-24 left-20"
            onHold={(v) => engineRef.current?.holdKey("KeyD", v)}
          >
            <IconChevron dir="right" />
          </Hold>
          <button
            type="button"
            className="pointer-events-auto absolute right-4 bottom-40 grid size-14 place-items-center rounded-full border border-border bg-elevated/80 text-fg"
            onPointerDown={(e) => {
              e.preventDefault();
              engineRef.current?.pulseKick();
            }}
            aria-label="Pulse kick"
          >
            <IconKick />
          </button>
          <button
            type="button"
            className="pointer-events-auto absolute right-20 bottom-24 grid size-14 place-items-center rounded-full border border-border bg-elevated/80 text-fg"
            onPointerDown={(e) => {
              e.preventDefault();
              engineRef.current?.beginReload();
            }}
            aria-label="Reload"
          >
            <IconReload />
          </button>
          <button
            type="button"
            className="pointer-events-auto absolute right-4 bottom-24 grid size-14 place-items-center rounded-full border border-border bg-elevated/80 text-fg"
            onPointerDown={(e) => {
              e.preventDefault();
              engineRef.current?.toggleShop();
            }}
            aria-label="Armory"
          >
            <IconShop />
          </button>
        </div>
      </div>
    </main>
  );
}

function Hold({
  className,
  onHold,
  children,
}: {
  className: string;
  onHold: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`pointer-events-auto absolute grid size-14 place-items-center rounded-full border border-border bg-elevated/80 text-fg ${className}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerLeave={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
    >
      {children}
    </button>
  );
}
