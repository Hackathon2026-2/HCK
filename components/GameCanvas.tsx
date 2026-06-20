"use client";

import { useEffect, useRef } from "react";
import type { GameResult, HudState, Item } from "@/lib/types";
import {
  ANGER_START,
  aiMoodFromAnger,
  applyHard,
  applySoft,
  fallSpeed,
  shinayaka,
  spawnInterval,
  TIME_LIMIT,
  type ScoreState,
} from "@/lib/score";
import { spawnItem, ITEM_W } from "@/lib/spawn";
import { BAND_H, CATCHER_W, isCaught, isOffscreen } from "@/lib/collision";

// ゲーム本体（spec §16 ゲームループ=にゃんこ2担当）。
// 毎フレーム ref を更新して canvas に描画し、HUD は間引いて親へ通知（spec §7）。
// 終了条件: anger<=0（沈静クリア）/ timeLeft<=0（時間切れ）。

const HUD_INTERVAL_MS = 100; // HUD通知は10回/秒に間引き（spec §7）

interface GameInternal extends ScoreState {
  items: Item[];
  timeLeft: number; // 秒
  lastSpawnMs: number;
  lastHudMs: number;
  ended: boolean;
}

export function GameCanvas({
  playerXRef,
  onHud,
  onEnd,
}: {
  playerXRef: React.RefObject<number>;
  onHud: (hud: HudState) => void;
  onEnd: (result: GameResult) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    // 初期状態。
    const g: GameInternal = {
      score: 0,
      anger: ANGER_START,
      combo: 0,
      soft: 0,
      hard: 0,
      items: [],
      timeLeft: TIME_LIMIT,
      lastSpawnMs: 0,
      lastHudMs: 0,
      ended: false,
    };

    let raf = 0;
    let last = performance.now();

    const pushHud = (now: number) => {
      if (now - g.lastHudMs < HUD_INTERVAL_MS) return;
      g.lastHudMs = now;
      onHud({
        score: g.score,
        anger: g.anger,
        shinayaka: shinayaka(g.soft, g.hard),
        timeLeft: Math.max(0, Math.ceil(g.timeLeft)),
        combo: g.combo,
      });
    };

    const finish = (cleared: boolean) => {
      if (g.ended) return;
      g.ended = true;
      cancelAnimationFrame(raf);
      onEnd({
        score: g.score,
        shinayaka: shinayaka(g.soft, g.hard),
        soft: g.soft,
        hard: g.hard,
        cleared,
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = canvas.width;
      const h = canvas.height;

      // 残り時間。
      g.timeLeft -= dt;
      if (g.timeLeft <= 0) {
        pushHud(now);
        finish(false);
        return;
      }

      // スポーン（怒り由来の間隔 / spec §9）。
      if (now - g.lastSpawnMs >= spawnInterval(g.anger)) {
        g.lastSpawnMs = now;
        g.items.push(spawnItem(w, g.anger, g.items));
      }

      // 落下（現在の怒りに応じた速度で全体を動かす＝難易度ランプが見える）。
      const speed = fallSpeed(g.anger);
      const playerXpx = playerXRef.current * w;
      const survivors: Item[] = [];
      for (const it of g.items) {
        it.y += speed * dt;
        if (isCaught(it, playerXpx, h)) {
          // 回収/被弾を反映（spec §9）。
          const next = it.kind === "soft" ? applySoft(g) : applyHard(g);
          g.score = next.score;
          g.anger = next.anger;
          g.combo = next.combo;
          g.soft = next.soft;
          g.hard = next.hard;
          continue; // 接触したアイテムは消す
        }
        if (isOffscreen(it, h)) continue; // 取り逃しは消すだけ（ペナルティ無し）
        survivors.push(it);
      }
      g.items = survivors;

      // 沈静クリア。
      if (g.anger <= 0) {
        pushHud(now);
        finish(true);
        return;
      }

      draw(ctx, w, h, g, playerXpx);
      pushHud(now);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
    // playerXRef/onHud/onEnd は安定参照前提（マウント毎に1ゲーム）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

// 1フレーム描画。
function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  g: GameInternal,
  playerXpx: number,
) {
  ctx.clearRect(0, 0, w, h);

  // キャッチ帯。
  const bandTop = h - BAND_H;
  ctx.fillStyle = "rgba(244, 63, 94, 0.10)";
  ctx.fillRect(0, bandTop, w, BAND_H);

  // アイテム（soft=エメラルド / hard=赤、言葉付き）。
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 15px sans-serif";
  for (const it of g.items) {
    const soft = it.kind === "soft";
    ctx.fillStyle = soft ? "#10b981" : "#ef4444";
    roundRect(ctx, it.x - ITEM_W / 2, it.y - 18, ITEM_W, 36, 18);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(it.label, it.x, it.y, ITEM_W - 12);
  }

  // キャッチャー（aiMood に応じて色相を少し変える程度）。
  const mood = aiMoodFromAnger(g.anger);
  const x = Math.max(0, Math.min(w - CATCHER_W, playerXpx - CATCHER_W / 2));
  ctx.fillStyle = mood === "calm" ? "#22d3ee" : "#f43f5e";
  roundRect(ctx, x, bandTop + 24, CATCHER_W, BAND_H - 44, 12);
  ctx.fill();
}

// 角丸矩形ヘルパー。
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
