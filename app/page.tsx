"use client";

// YAWARAi フェーズ管理（spec §5）。
// start → intro → camera → playing → result。
// camera で許可が取れなければ keyboard 操作にフォールバックして playing へ。
// 各画面の見た目・AIキャラ・HUD演出は Codex が差し替える前提（暫定UI）。
// GameCanvas/ゲームループ/検出/スコア計算は spec §16 によりにゃんこ2 の担当。

import { useEffect, useState } from "react";
import type { GameResult, HudState, InputMode, Phase } from "@/lib/types";
import { useCamera } from "@/lib/useCamera";
import { usePlayerX } from "@/lib/usePlayerX";
import { GameCanvas } from "@/components/GameCanvas";
import { ANGER_START, TIME_LIMIT } from "@/lib/score";

const INITIAL_HUD: HudState = {
  score: 0,
  anger: ANGER_START,
  shinayaka: 100,
  timeLeft: TIME_LIMIT,
  combo: 0,
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>("start");
  const [hud, setHud] = useState<HudState>(INITIAL_HUD);
  const [result, setResult] = useState<GameResult | null>(null);
  const { videoRef, status, start, stop } = useCamera();

  // カメラ拒否時は keyboard へフォールバック（spec §5, §12-5）。
  const inputMode: InputMode = status === "denied" ? "keyboard" : "camera";

  // playerX(0..1) を毎フレーム更新（playing のときだけ稼働）。
  const playerXRef = usePlayerX(phase === "playing", inputMode, videoRef);

  useEffect(() => {
    if (phase === "camera") start();
    if (phase === "start" || phase === "result") stop();
  }, [phase, start, stop]);

  const showVideo = phase === "camera" || phase === "playing";

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden bg-black p-8 text-center text-zinc-100">
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

      {phase === "playing" && (
        <>
          <GameCanvas
            playerXRef={playerXRef}
            onHud={setHud}
            onEnd={(r) => {
              setResult(r);
              setPhase("result");
            }}
          />
          {/* 暫定HUD（spec §6 / 見た目は Codex 差し替え前提） */}
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between gap-4 p-4 text-sm">
            <div className="font-mono">SCORE {hud.score}</div>
            <div className="flex-1">
              <div className="mx-auto h-3 max-w-xs overflow-hidden rounded-full bg-zinc-700">
                <div
                  className="h-full bg-rose-500 transition-all"
                  style={{ width: `${hud.anger}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-zinc-400">怒り {hud.anger}</div>
            </div>
            <div className="font-mono">
              {hud.timeLeft}s{hud.combo >= 2 ? ` / ${hud.combo}combo` : ""}
            </div>
          </div>
        </>
      )}

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

      {phase === "result" && result && (
        <div className="relative z-10 flex flex-col items-center gap-4">
          <h2 className="text-3xl font-bold">
            {result.cleared ? "AIは穏やかになった" : "時間切れ"}
          </h2>
          <div className="text-5xl">{result.cleared ? "😌" : "😠"}</div>
          <p className="text-lg">スコア {result.score}</p>
          <p className="text-lg">しなやか度 {result.shinayaka}%</p>
          <p className="text-sm text-zinc-400">
            回収 {result.soft} / 被弾 {result.hard}
          </p>
          <p className="max-w-sm text-sm text-zinc-500">
            AIにもやさしくしよう。（AIの一言は S6 で実装）
          </p>
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
