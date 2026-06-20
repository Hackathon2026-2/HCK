"use client";

import { useCallback, useEffect, useRef } from "react";

// BGM 再生フック。自動再生はブラウザにブロックされるため、必ずユーザー操作（ボタン）から
// play() を呼んで解錠する（spec §12-3）。プレイ中ループ再生し、終了で停止。
export function useBgm(src: string) {
  const ref = useRef<HTMLAudioElement | null>(null);

  // クライアントでのみ Audio を生成（SSR回避）。
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";
    ref.current = audio;
    return () => {
      audio.pause();
      ref.current = null;
    };
  }, [src]);

  // ユーザー操作起点で呼ぶ（先頭から再生）。失敗（自動再生ポリシー等）は握りつぶす。
  const play = useCallback(() => {
    const audio = ref.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  const stop = useCallback(() => {
    const audio = ref.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  return { play, stop };
}
