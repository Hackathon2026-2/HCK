"use client";

import { useEffect, useRef } from "react";
import type { GameResult, HudState, Item } from "@/lib/types";
import {
  ANGER_START,
  aiMoodFromAnger,
  applyHard,
  applySoft,
  depthSpeed,
  shinayaka,
  spawnInterval,
  TIME_LIMIT,
  type ScoreState,
} from "@/lib/score";
import { spawnItem, OBJECT_SIZE } from "@/lib/spawn";
import { CATCHER_W, hasArrived, isCaught } from "@/lib/collision";

// ゲーム本体（spec §16 ゲームループ=にゃんこ2担当）。
// 奥のAIが手前へ物体を投げる疑似3D。z=0(AI)→1(プレイヤー)で迫り、大きくなる。
// HUD は間引いて親へ通知（spec §7）。終了: anger<=0（沈静）/ timeLeft<=0（時間切れ）。

const HUD_INTERVAL_MS = 100;

// 投影パラメータ（画面比率）。
const HORIZON_Y = 0.2; // AI(奥)の高さ
const PLAYER_Y = 0.82; // プレイヤー面(手前)の高さ
const FAR_SCALE = 0.25; // 奥での縮小率
const AI_SIZE = 96; // AIの基準サイズ(px)

interface GameInternal extends ScoreState {
  items: Item[];
  timeLeft: number;
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

    // 効果音（クライアントのみ生成）。柔回収/硬被弾の瞬間に鳴らす。
    const softSfx = new Audio("/audio/soft.mp3");
    const hardSfx = new Audio("/audio/hard.mp3");
    softSfx.volume = 0.8;
    hardSfx.volume = 0.8;
    const playSfx = (a: HTMLAudioElement) => {
      a.currentTime = 0;
      a.play().catch(() => {});
    };

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

      g.timeLeft -= dt;
      if (g.timeLeft <= 0) {
        pushHud(now);
        finish(false);
        return;
      }

      // 投げる間隔（怒り由来 / spec §9）。
      if (now - g.lastSpawnMs >= spawnInterval(g.anger)) {
        g.lastSpawnMs = now;
        g.items.push(spawnItem(g.anger, g.items));
      }

      // 接近（怒りが高いほど速く迫る）。
      const dz = depthSpeed(g.anger) * dt;
      const playerXpx = playerXRef.current * w;
      const survivors: Item[] = [];
      for (const it of g.items) {
        it.z += dz;
        if (hasArrived(it)) {
          if (isCaught(it, playerXpx, w)) {
            const soft = it.kind === "soft";
            playSfx(soft ? softSfx : hardSfx); // 効果音
            const next = soft ? applySoft(g) : applyHard(g);
            g.score = next.score;
            g.anger = next.anger;
            g.combo = next.combo;
            g.soft = next.soft;
            g.hard = next.hard;
          }
          continue; // 到達した物体は（取れても外しても）消える
        }
        survivors.push(it);
      }
      g.items = survivors;

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
    // 1マウント=1ゲーム。playerXRef/onHud/onEnd は安定参照前提。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

// 奥行き z(0..1) と着地点 targetX から画面座標・拡大率を求める。
function project(targetX: number, z: number, w: number, h: number) {
  const horizonY = h * HORIZON_Y;
  const playerY = h * PLAYER_Y;
  const originX = w * 0.5; // AIは中央から投げる
  // 手前ほど加速して見えるよう z を少しイージング。
  const e = z * z;
  return {
    x: originX + (targetX * w - originX) * e,
    y: horizonY + (playerY - horizonY) * z,
    scale: FAR_SCALE + (1 - FAR_SCALE) * z,
  };
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  g: GameInternal,
  playerXpx: number,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 奥のAI（怒り表情）。
  const mood = aiMoodFromAnger(g.anger);
  const aiFace =
    mood === "angry" ? "😡" : mood === "irritated" ? "😠" : mood === "neutral" ? "😐" : "😌";
  ctx.font = `${AI_SIZE}px sans-serif`;
  ctx.fillText(aiFace, w * 0.5, h * HORIZON_Y);

  // 物体（奥→手前。z 昇順で描いて手前を後に＝重なり自然）。
  const ordered = [...g.items].sort((a, b) => a.z - b.z);
  for (const it of ordered) {
    const p = project(it.targetX, it.z, w, h);
    const size = OBJECT_SIZE * p.scale;
    // 硬い物にはうっすら赤いオーラ、柔は緑のオーラ（視認性）。
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 0.62, 0, Math.PI * 2);
    // 色は最大濃度（不透明）。soft=エメラルド / hard=赤。
    ctx.fillStyle = it.kind === "soft" ? "rgb(16,185,129)" : "rgb(239,68,68)";
    ctx.fill();
    ctx.font = `${size}px sans-serif`;
    ctx.fillText(it.glyph, p.x, p.y);
  }

  // キャッチャー（プレイヤー面）。沈静で水色に。
  const py = h * PLAYER_Y;
  const x = Math.max(0, Math.min(w - CATCHER_W, playerXpx - CATCHER_W / 2));
  ctx.fillStyle = mood === "calm" ? "#22d3ee" : "#f43f5e";
  roundRect(ctx, x, py - 14, CATCHER_W, 28, 14);
  ctx.fill();
  // 手のひら表現。
  ctx.font = "30px sans-serif";
  ctx.fillText("🤲", playerXpx, py);
}

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
