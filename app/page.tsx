"use client";

// YAWARAi フェーズ管理（spec §5）。
// start → intro → camera → playing → result。
// camera で許可が取れなければ keyboard/mouse 操作にフォールバックして playing へ。
// 各画面は暫定UI。見た目・AIキャラ・演出は Codex が components/ で差し替える前提。

import { useEffect, useState } from "react";
import type { InputMode, Phase } from "@/lib/types";
import { useCamera } from "@/lib/useCamera";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("start");
  const { videoRef, status, start, stop } = useCamera();

  // 入力モードはカメラ状態から導出（拒否時は keyboard へフォールバック / spec §5, §12-5）。
  // S2 で keyboard/mouse の実入力を組み込む際に本格的な input マネージャへ差し替える。
  const inputMode: InputMode = status === "denied" ? "keyboard" : "camera";

  // camera フェーズに入ったらカメラ要求。離れたら停止。
  useEffect(() => {
    if (phase === "camera") start();
    if (phase === "start" || phase === "result") stop();
  }, [phase, start, stop]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-black p-8 text-center text-zinc-100">
      {phase === "start" && (
        <>
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
        </>
      )}

      {phase === "intro" && (
        <>
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
        </>
      )}

      {phase === "camera" && (
        <>
          <p className="text-lg">体を左右に動かして「柔」を集めよう</p>
          {/* ミラー表示（spec §6 camera）。-scale-x-100 で左右反転。 */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-video w-full max-w-xl -scale-x-100 rounded-lg bg-zinc-900 object-cover"
          />
          <p className="text-sm text-zinc-500">
            {status === "requesting" && "カメラを準備中…"}
            {status === "ready" && "カメラOK"}
            {status === "denied" &&
              "カメラが使えないため、キーボード（←→）操作で遊べます"}
          </p>
          <button
            className="rounded-full bg-rose-600 px-8 py-3 font-semibold hover:bg-rose-500 disabled:opacity-40"
            disabled={status === "requesting"}
            onClick={() => setPhase("playing")}
          >
            ゲーム開始
          </button>
        </>
      )}

      {phase === "playing" && (
        <>
          <p className="text-lg">プレイ中（ゲームループは S3 で実装）</p>
          <p className="text-sm text-zinc-500">入力モード: {inputMode}</p>
          <button
            className="rounded-full bg-zinc-700 px-8 py-3 font-semibold hover:bg-zinc-600"
            onClick={() => setPhase("result")}
          >
            結果へ（仮）
          </button>
        </>
      )}

      {phase === "result" && (
        <>
          <h2 className="text-3xl font-bold">結果（S6 で実装）</h2>
          <button
            className="rounded-full bg-rose-600 px-8 py-3 font-semibold hover:bg-rose-500"
            onClick={() => setPhase("start")}
          >
            もう一度
          </button>
        </>
      )}
    </div>
  );
}
