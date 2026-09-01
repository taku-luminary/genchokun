// app/admin/dashboard/BarChart.tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  values: number[];
  dates: string[];
  color?: "green" | "grey";
  height?: number;
};

export function BarChart({ values, dates, color = "green", height = 120 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0); // 実際の描画幅（px）
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  // コンテナの幅を測る（リサイズにも追従）→ 引き伸ばしを防ぐ
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const labelBand = 16;
  const plotH = height - labelBand;
  const n = Math.max(values.length, 1);
  const max = Math.max(1, ...values);
  const padX = 4;
  const fill = color === "green" ? "#34b38a" : "#a2aca8";
  const fmt = (s?: string) => (s ? `${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}` : "");

  let svg = null;
  if (w > 0) {
    const slot = (w - padX * 2) / n;
    const gap = Math.min(2, slot * 0.35);
    const bw = Math.max(1, slot - gap);
    // 幅に応じて日付ラベルの本数を決める（重ならないように）
    const tickCount = Math.max(2, Math.min(7, Math.floor(w / 110)));
    const ticks = Array.from({ length: tickCount }, (_, t) =>
      Math.round((t * (n - 1)) / Math.max(tickCount - 1, 1))
    );
    const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      let i = Math.floor((e.clientX - rect.left - padX) / slot);
      i = Math.max(0, Math.min(n - 1, i));
      setTip({ x: e.clientX, y: rect.top, text: `${values[i]}　${fmt(dates[i])}` });
    };
    svg = (
      <svg
        width={w}
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        className="block"
        onPointerMove={onMove}
        onPointerLeave={() => setTip(null)}
      >
        <line x1={padX} y1={plotH - 2} x2={w - padX} y2={plotH - 2} stroke="#c4cfd1" strokeWidth={1} />
        {values.map((v, i) =>
          v <= 0 ? null : (
            <rect
              key={i}
              x={padX + i * slot + gap / 2}
              y={plotH - 2 - (v / max) * (plotH - 4)}
              width={bw}
              height={(v / max) * (plotH - 4)}
              rx={Math.min(2, bw / 2)}
              fill={fill}
            />
          )
        )}
        {ticks.map((i, t) => (
          <text
            key={t}
            x={padX + i * slot + slot / 2}
            y={height - 3}
            textAnchor={t === 0 ? "start" : t === ticks.length - 1 ? "end" : "middle"}
            fontSize="10"
            fill="#879290"
          >
            {fmt(dates[i])}
          </text>
        ))}
      </svg>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height }}>
      {svg}
      {tip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-white tabular-nums"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.text}
        </div>
      )}
    </div>
  );
}
