"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// カメラの取得状態。idle=未要求, requesting=要求中, ready=取得成功, denied=拒否/失敗。
export type CameraStatus = "idle" | "requesting" | "ready" | "denied";

// getUserMedia を管理するフック。
// - video 要素に attach するための ref を返す。
// - 取得失敗（拒否・非対応・他端末）時は status="denied" になり、呼び出し側が
//   keyboard/mouse フォールバックへ切り替える（spec §5, §12-5）。
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");

  const start = useCallback(async () => {
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus("ready");
    } catch {
      // 拒否・非対応・デバイス無しはすべてフォールバック行き。
      setStatus("denied");
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // アンマウント時にトラックを解放。
  useEffect(() => stop, [stop]);

  return { videoRef, status, start, stop };
}
