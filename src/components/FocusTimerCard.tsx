import React from 'react';
import { Play, Pause, RotateCcw, Check, Minus, Plus, Maximize2 } from 'lucide-react';
import { PRESET_MINUTES } from '../types/cafe';

interface FocusTimerCardProps {
  configuredMinutes: number;
  secondsLeft: number;
  isRunning: boolean;
  isCompleted: boolean;
  onSelectMinutes: (minutes: number) => void;
  onToggleRun: () => void;
  onReset: () => void;
  onFinishEarly: () => void;
  onEnterFullscreen: () => void;
}

export function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const FocusTimerCard: React.FC<FocusTimerCardProps> = ({
  configuredMinutes,
  secondsLeft,
  isRunning,
  isCompleted,
  onSelectMinutes,
  onToggleRun,
  onReset,
  onFinishEarly,
  onEnterFullscreen,
}) => {
  const totalSeconds = configuredMinutes * 60;
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft);
  const progress = totalSeconds > 0 ? Math.min(1, elapsedSeconds / totalSeconds) : 0;

  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const hasStarted = secondsLeft < totalSeconds && secondsLeft > 0;

  const handleStepMinutes = (delta: number) => {
    const next = Math.max(1, Math.min(120, configuredMinutes + delta));
    onSelectMinutes(next);
  };

  const handleInputMinutes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!Number.isNaN(parsed)) {
      onSelectMinutes(Math.max(1, Math.min(120, parsed)));
    }
  };

  return (
    <section
      id="timer-section"
      className="flex-1 bg-white border border-[#E7E2D8] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-[0_2px_16px_rgba(28,25,23,0.03)]"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#1C1917] tracking-tight">
            專注計時器
          </h2>
          <p className="text-sm text-[#78716C] mt-1">
            設定閱讀或工作時間，讓咖啡館陪伴你完成這段專注。
          </p>
        </div>
        <button
          type="button"
          onClick={onEnterFullscreen}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B]"
          title="進入全螢幕專注模式"
        >
          <Maximize2 className="w-4 h-4" />
          <span>全螢幕</span>
        </button>
      </div>

      {/* Circular Countdown Dial */}
      <div className="my-8 flex flex-col items-center justify-center">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox="0 0 260 260"
            aria-hidden="true"
          >
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke="#F3EFE6"
              strokeWidth="10"
            />
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke={isCompleted ? '#16A34A' : '#F59E0B'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <span className="text-xs font-medium tracking-wide text-[#78716C] mb-1">
              {isCompleted
                ? '本輪專注已完成'
                : isRunning
                  ? '專注進行中'
                  : hasStarted
                    ? '已暫停計時'
                    : '準備開始專注'}
            </span>
            <div
              className="font-mono-tabular text-5xl sm:text-6xl font-semibold text-[#1C1917] tracking-tight leading-none"
              aria-live="polite"
            >
              {formatClock(secondsLeft)}
            </div>
            <span className="text-xs text-[#78716C] mt-2 font-mono-tabular">
              目標 {configuredMinutes} 分鐘
            </span>
          </div>
        </div>
      </div>

      {/* Duration Settings */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-[#44403C]">時間設定（分鐘）</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStepMinutes(-5)}
              disabled={isRunning || configuredMinutes <= 1}
              aria-label="減少 5 分鐘"
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] hover:bg-[#F3EFE6] disabled:opacity-40 disabled:cursor-not-allowed text-[#44403C] transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <label className="sr-only" htmlFor="custom-minutes-input">
              自訂專注分鐘數
            </label>
            <input
              id="custom-minutes-input"
              type="number"
              min={1}
              max={120}
              disabled={isRunning}
              value={configuredMinutes}
              onChange={handleInputMinutes}
              className="w-16 h-10 text-center font-mono-tabular text-sm font-semibold rounded-xl border border-[#E7E2D8] bg-white text-[#1C1917] focus:outline-none focus:border-[#F59E0B] disabled:bg-[#FAF8F5] disabled:text-[#78716C]"
            />
            <button
              type="button"
              onClick={() => handleStepMinutes(5)}
              disabled={isRunning || configuredMinutes >= 120}
              aria-label="增加 5 分鐘"
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] hover:bg-[#F3EFE6] disabled:opacity-40 disabled:cursor-not-allowed text-[#44403C] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preset Duration Tabs */}
        <div className="grid grid-cols-4 gap-2 p-1.5 bg-[#F5F2EB] rounded-xl">
          {PRESET_MINUTES.map((mins) => {
            const active = configuredMinutes === mins;
            return (
              <button
                key={mins}
                type="button"
                disabled={isRunning}
                onClick={() => onSelectMinutes(mins)}
                className={`py-2 px-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                  active
                    ? 'bg-white text-[#1C1917] shadow-sm font-semibold'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {mins} 分
              </button>
            );
          })}
        </div>

        {/* Primary Action Controls */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onToggleRun}
            className={`flex-1 min-w-[160px] h-12 px-6 rounded-xl font-semibold text-base inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B] shadow-sm ${
              isRunning
                ? 'bg-[#FB923C] hover:bg-[#F97316] text-[#1C1917]'
                : 'bg-[#FBBF24] hover:bg-[#F59E0B] text-[#1C1917]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>暫停計時</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{hasStarted ? '繼續專注' : isCompleted ? '再來一輪' : '開始專注'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="h-12 px-4 rounded-xl border border-[#E7E2D8] bg-white hover:bg-[#F5F2EB] text-[#44403C] font-medium text-sm inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重設</span>
          </button>

          {(isRunning || hasStarted) && !isCompleted && (
            <button
              type="button"
              onClick={onFinishEarly}
              className="w-full sm:w-auto h-12 px-4 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] font-medium text-sm inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>完成並寫便條</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
