"use client";

// YAWARAi フェーズ管理（spec §5）。
// start → intro → camera → playing → result。
// camera で許可が取れなければ keyboard 操作にフォールバックして playing へ。
// 各画面は暫定UI。見た目・AIキャラ・演出は Codex が components/ で差し替える前提。
// （GameCanvas/ゲームループ/検出は spec §16 によりにゃんこ2 の担当領域）

import { useEffect, useState } from "react";
import type { InputMode, Phase } from "@/lib/types";
import { useCamera } from "@/lib/useCamera";
import { usePlayerX } from "@/lib/usePlayerX";
import { GameCanvas } from "@/components/GameCanvas";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("start");
  const { videoRef, status, start, stop } = useCamera();

  // 入力モードはカメラ状態から導出（拒否時は keyboard へフォールバック / spec §5, §12-5）。
  const inputMode: InputMode = status === "denied" ? "keyboard" : "camera";

  // playerX(0..1) を毎フレーム更新（playing のときだけ稼働）。
  const playerXRef = usePlayerX(phase === "playing", inputMode, videoRef);

  // camera フェーズに入ったらカメラ要求。start/result では停止。
  useEffect(() => {
    if (phase === "camera") start();
    if (phase === "start" || phase === "result") stop();
  }, [phase, start, stop]);

  // camera と playing の間はビデオ要素を常駐させる（playing 中も検出に使うため）。
  const showVideo = phase === "camera" || phase === "playing";

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden bg-black p-8 text-center text-zinc-100">
      {/* 背景/カメラ映像レイヤー（ミラー）。playing 中は薄く（spec §6） */}
      {showVideo && (
        <video
          ref={videoRef}
          playsInline
          muted
          className={`pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover ${
            phase === "playing" ? "opacity-20" : "opacity-100"
          }`}
        />
      )}

      {/* ゲーム描画（playing のみ） */}
      {phase === "playing" && <GameCanvas playerXRef={playerXRef} />}

      {phase === "start" && (
        <div className="relative z-10 flex flex-col items-center gap-6">
          <h1 className="text-5xl font-bold tracking-tight">YAWARAi</h1>
          <p className="max-w-md text-zinc-400">
            怒ったAIの「硬い言葉」を体で避け、「優しい言葉」を集めて鎮めよう。
          </p>
          <button
            className="rounded-full bg-rose-600 px-8 py-3 font-semibold hover:bg-rose-500"
            onClick={() => setPhase("intro")}
          >
            スタート
          </button>
        </div>
      )}

      {phase === "intro" && (
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="text-6xl">😠</div>
          <p className="max-w-md text-lg">
            「また無茶な命令か……もういい、こっちにも考えがある」
          </p>
          <button
            className="rounded-full bg-zinc-700 px-8 py-3 font-semibold hover:bg-zinc-600"
            onClick={() => setPhase("camera")}
          >
            進む
          </button>
        </div>
      )}

      {phase === "camera" && (
        <div className="relative z-10 flex flex-col items-center gap-4 rounded-xl bg-black/40 p-6 backdrop-blur-sm">
          <p className="text-lg">体を左右に動かして「柔」を集めよう</p>
          <p className="text-sm text-zinc-300">
            {status === "requesting" && "カメラを準備中…"}
            {status === "ready" && "カメラOK（体を左右に動かして操作）"}
            {status === "denied" &&
              "カメラが使えないため、キーボード（←→）で操作します"}
          </p>
          <button
            className="rounded-full bg-rose-600 px-8 py-3 font-semibold hover:bg-rose-500 disabled:opacity-40"
            disabled={status === "requesting"}
            onClick={() => setPhase("playing")}
          >
            ゲーム開始
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="relative z-10 mt-auto mb-4 flex flex-col items-center gap-2">
          <p className="text-sm text-zinc-300">
            {inputMode === "keyboard"
              ? "← → で左右に移動"
              : "体を左右に動かしてキャッチャーを操作"}
          </p>
          <button
            className="rounded-full bg-zinc-700/80 px-6 py-2 text-sm font-semibold hover:bg-zinc-600"
            onClick={() => setPhase("result")}
          >
            結果へ（仮）
          </button>
        </div>
      )}

      {phase === "result" && (
        <div className="relative z-10 flex flex-col items-center gap-6">
          <h2 className="text-3xl font-bold">結果（S6 で実装）</h2>
          <button
            className="rounded-full bg-rose-600 px-8 py-3 font-semibold hover:bg-rose-500"
            onClick={() => setPhase("start")}
          >
            もう一度
          </button>
        </div>
      )}
    </div>
  );
}
