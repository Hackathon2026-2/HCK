"use client";

import { useEffect, useRef } from "react";
import type { InputMode } from "@/lib/types";
import {
  clamp01,
  computeMotionX,
  DETECT_H,
  DETECT_W,
  ema,
} from "@/lib/detection";

// キーボード移動速度（横幅に対する割合 / 秒）。約0.8秒で端から端へ。
const KEY_SPEED = 1.25;

// playerX(0..1) を inputMode に応じて毎フレーム更新し、ref に書き込むフック。
// 再描画しないので state ではなく ref（spec §7）。ゲームループ(S3)はこの ref を読む。
// enabled=true のときだけ動く（playing フェーズ）。
export function usePlayerX(
  enabled: boolean,
  inputMode: InputMode,
  videoRef: React.RefObject<HTMLVideoElement | null>,
) {
  const playerXRef = useRef(0.5);

  // キー押下状態（ref で保持＝再描画しない）。
  const keysRef = useRef({ left: false, right: false });
  // カメラ検出用オフスクリーンと直前フレーム。
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // --- キーボード入力（←→） ---
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = true;
      if (e.key === "ArrowRight") keysRef.current.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = false;
      if (e.key === "ArrowRight") keysRef.current.right = false;
    };
    // --- マウス入力（X位置） ---
    const onMouseMove = (e: MouseEvent) => {
      if (inputMode !== "mouse") return;
      playerXRef.current = clamp01(e.clientX / window.innerWidth);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);

    // カメラ用オフスクリーン準備。
    if (!offscreenRef.current) {
      const c = document.createElement("canvas");
      c.width = DETECT_W;
      c.height = DETECT_H;
      offscreenRef.current = c;
    }
    prevFrameRef.current = null;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // 秒（スパイク抑制）
      last = now;

      if (inputMode === "keyboard") {
        const k = keysRef.current;
        if (k.left) playerXRef.current = clamp01(playerXRef.current - KEY_SPEED * dt);
        if (k.right) playerXRef.current = clamp01(playerXRef.current + KEY_SPEED * dt);
      } else if (inputMode === "camera") {
        sampleCamera();
      }
      // mouse は onMouseMove で直接更新済み。

      raf = requestAnimationFrame(tick);
    };

    // カメラ1フレーム分の動き検出（ミラー描画→差分→重心→EMA）。
    const sampleCamera = () => {
      const video = videoRef.current;
      const canvas = offscreenRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      // 表示と合わせて左右反転して描画（spec §8-1）。
      ctx.save();
      ctx.translate(DETECT_W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, DETECT_W, DETECT_H);
      ctx.restore();
      const curr = ctx.getImageData(0, 0, DETECT_W, DETECT_H);
      const prev = prevFrameRef.current;
      if (prev) {
        const mx = computeMotionX(prev, curr);
        if (mx !== null) {
          playerXRef.current = clamp01(ema(playerXRef.current, mx));
        }
      }
      prevFrameRef.current = curr;
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [enabled, inputMode, videoRef]);

  return playerXRef;
}
