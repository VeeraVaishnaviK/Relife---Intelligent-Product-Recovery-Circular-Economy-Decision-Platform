'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Flame } from 'lucide-react';

interface AuctionCountdownTimerProps {
  initialSeconds: number;
  isEndingSoon: boolean;
  antiSnipeCount: number;
  onExpire?: () => void;
}

export function AuctionCountdownTimer({
  initialSeconds,
  isEndingSoon,
  antiSnipeCount,
  onExpire,
}: AuctionCountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onExpire]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const isCritical = secondsLeft > 0 && secondsLeft <= 300; // < 5 mins

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-colors ${
          secondsLeft === 0
            ? 'bg-zinc-900/80 text-zinc-400 border-zinc-700'
            : isCritical
            ? 'bg-rose-950/60 text-rose-400 border-rose-500/50 animate-pulse'
            : isEndingSoon
            ? 'bg-amber-950/50 text-amber-400 border-amber-500/40'
            : 'bg-[#181926] text-slate-300 border-[#252836]'
        }`}
      >
        {isCritical ? (
          <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-[#FFC21A]" />
        )}

        <span>
          {secondsLeft === 0
            ? 'EXPIRED'
            : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
        </span>
      </div>

      {antiSnipeCount > 0 && (
        <span className="flex items-center gap-1 text-[10px] text-amber-400/90 font-medium tracking-tight">
          <ShieldAlert className="w-3 h-3 text-amber-400" />
          <span>Anti-snipe: +{antiSnipeCount * 5}m</span>
        </span>
      )}
    </div>
  );
}
