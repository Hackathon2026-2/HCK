"use client";

import { useEffect, useRef } from "react";

// ゲーム描画キャンバス（spec §16 のゲームループ担当=にゃんこ2）。
// S2: playerX に追従するキャッチャーとキャッチ帯のみ描画。
// S3 で落下アイテム・当たり判定を載せる。
// 毎フレーム ref を読んで描くだけ（React state を介さない / spec §7）。

const CATCHER_W = 120; // キャッチャー幅(px)（spec §8）
const BAND_H = 90; // キャッチ帯の高さ(px)

export function GameCanvas({
  playerXRef,
}: {
  playerXRef: React.RefObject<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 親要素のサイズにキャンバス解像度を合わせる。
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // キャッチ帯（最下部）。
      const bandTop = h - BAND_H;
      ctx.fillStyle = "rgba(244, 63, 94, 0.10)"; // rose 薄め
      ctx.fillRect(0, bandTop, w, BAND_H);

      // キャッチャー（playerX 中心の矩形）。
      const cx = playerXRef.current * w;
      const x = Math.max(0, Math.min(w - CATCHER_W, cx - CATCHER_W / 2));
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(x, bandTop + 20, CATCHER_W, BAND_H - 40);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [playerXRef]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
