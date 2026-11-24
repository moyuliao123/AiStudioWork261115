import React, { useEffect } from 'react';
import {
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  StickyNote,
  Check,
} from 'lucide-react';
import {
  AMBIENCE_OPTIONS,
  AmbienceId,
  MOOD_TAGS,
  MoodTag,
  NOTE_COLOR_THEMES,
  NoteColorId,
} from '../types/cafe';
import { formatClock } from './FocusTimerCard';

interface FullscreenFocusOverlayProps {
  isOpen: boolean;
  configuredMinutes: number;
  secondsLeft: number;
  isRunning: boolean;
  isCompleted: boolean;
  selectedAmbience: AmbienceId;
  volume: number;
  isAudioPlaying: boolean;
  justCompletedMinutes: number | null;
  noteText: string;
  selectedMood: MoodTag;
  selectedColor: NoteColorId;
  onExit: () => void;
  onToggleRun: () => void;
  onReset: () => void;
  onFinishEarly: () => void;
  onSelectAmbience: (id: AmbienceId) => void;
  onChangeVolume: (vol: number) => void;
  onToggleAudioPreview: () => void;
  onChangeNoteText: (text: string) => void;
  onSelectMood: (mood: MoodTag) => void;
  onSelectColor: (color: NoteColorId) => void;
  onSubmitNote: () => void;
}

export const FullscreenFocusOverlay: React.FC<FullscreenFocusOverlayProps> = ({
  isOpen,
  configuredMinutes,
  secondsLeft,
  isRunning,
  isCompleted,
  selectedAmbience,
  volume,
  isAudioPlaying,
  justCompletedMinutes,
  noteText,
  selectedMood,
  selectedColor,
  onExit,
  onToggleRun,
  onReset,
  onFinishEarly,
  onSelectAmbience,
  onChangeVolume,
  onToggleAudioPreview,
  onChangeNoteText,
  onSelectMood,
  onSelectColor,
  onSubmitNote,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onExit]);

  if (!isOpen) return null;

  const totalSeconds = configuredMinutes * 60;
  const elapsed = Math.max(0, totalSeconds - secondsLeft);
  const progressPercent = totalSeconds > 0 ? Math.min(100, (elapsed / totalSeconds) * 100) : 0;
  const hasStarted = secondsLeft < totalSeconds && secondsLeft > 0;
  const activeTheme =
    NOTE_COLOR_THEMES.find((t) => t.id === selectedColor) || NOTE_COLOR_THEMES[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#FAF8F5] text-[#1C1917] flex flex-col justify-between overflow-y-auto px-6 py-6 sm:px-10 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-label="全螢幕專注模式"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3 text-sm text-[#57534E]">
          <span className="font-display font-semibold text-base text-[#1C1917] whitespace-nowrap">
            晨光咖啡讀書室
          </span>
          <span aria-hidden="true">·</span>
          <span className="whitespace-nowrap">全螢幕專注</span>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="h-10 px-4 rounded-xl bg-white hover:bg-[#F3EFE6] border border-[#E7E2D8] text-[#1C1917] text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Minimize2 className="w-4 h-4" />
          <span>退出全螢幕</span>
        </button>
      </div>

      {/* Center Giant Timer & Controls */}
      <div className="my-auto py-8 flex flex-col items-center justify-center max-w-3xl w-full mx-auto text-center">
        <span className="text-sm font-medium text-[#78716C] mb-3">
          {isCompleted
            ? '本輪專注完成 · 寫下心情留念吧'
            : isRunning
              ? '沉浸專注中'
              : hasStarted
                ? '已暫停計時'
                : '準備開始專注'}
        </span>

        <div
          className="font-mono-tabular font-semibold text-[#1C1917] leading-none tracking-tight select-none"
          style={{ fontSize: 'clamp(4.25rem, 12vw, 8.5rem)' }}
          aria-live="polite"
        >
          {formatClock(secondsLeft)}
        </div>

        {/* Clean Progress Track */}
        <div className="w-full max-w-md h-2 bg-[#ECE6DA] rounded-full overflow-hidden mt-8">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isCompleted ? 'bg-[#16A34A]' : 'bg-[#F59E0B]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onToggleRun}
            className={`h-12 px-8 rounded-xl font-semibold text-base inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm ${
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
            className="h-12 px-5 rounded-xl bg-white hover:bg-[#F3EFE6] border border-[#E7E2D8] text-[#44403C] text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重設</span>
          </button>

          {(isRunning || hasStarted) && !isCompleted && (
            <button
              type="button"
              onClick={onFinishEarly}
              className="h-12 px-5 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>完成並寫便條</span>
            </button>
          )}
        </div>

        {/* Inline Mood Note Box when session completes inside Fullscreen */}
        {justCompletedMinutes !== null && (
          <div className="mt-10 w-full max-w-xl bg-white border border-[#F59E0B] rounded-2xl p-5 text-left shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-display text-lg font-semibold text-[#1C1917]">
                剛完成 {justCompletedMinutes} 分鐘專注！寫下此刻心情
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {MOOD_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectMood(tag)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedMood === tag
                      ? 'bg-[#FBBF24] text-[#1C1917] font-semibold'
                      : 'bg-[#F5F2EB] text-[#57534E] hover:bg-[#EAE5DA]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className={`rounded-xl border p-3 ${activeTheme.cardBg} ${activeTheme.cardBorder}`}>
              <textarea
                rows={2}
                maxLength={120}
                value={noteText}
                onChange={(e) => onChangeNoteText(e.target.value)}
                placeholder="寫下一句當下的心情或讀書心得..."
                className="w-full bg-transparent resize-none text-sm text-[#1C1917] placeholder:text-[#78716C]/80 focus:outline-none"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {NOTE_COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    aria-label={theme.label}
                    onClick={() => onSelectColor(theme.id)}
                    className={`w-6 h-6 rounded-full border cursor-pointer ${theme.swatchBg} ${
                      selectedColor === theme.id
                        ? 'border-[#1C1917] scale-110'
                        : 'border-black/15'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                disabled={!noteText.trim()}
                onClick={onSubmitNote}
                className="h-10 px-4 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] disabled:bg-[#F3EFE6] disabled:text-[#A8A29E] text-[#1C1917] text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <StickyNote className="w-4 h-4" />
                <span>貼上便條牆</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Ambience Strip */}
      <div className="max-w-4xl w-full mx-auto bg-white border border-[#E7E2D8] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {AMBIENCE_OPTIONS.map((option) => {
            const active = selectedAmbience === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectAmbience(option.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#FFFBEB] border border-[#F59E0B] text-[#92400E] font-semibold'
                    : 'bg-[#FAF8F5] border border-transparent text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={selectedAmbience === 'silent'}
            onClick={onToggleAudioPreview}
            className="h-9 px-3 rounded-lg bg-[#F5F2EB] hover:bg-[#EAE5DA] disabled:opacity-50 text-[#1C1917] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            {isAudioPlaying && selectedAmbience !== 'silent' ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>播放中</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>開啟音效</span>
              </>
            )}
          </button>
          <input
            type="range"
            aria-label="全螢幕背景音效音量"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => onChangeVolume(Number(e.target.value) / 100)}
            className="w-24 accent-[#F59E0B] h-1.5 bg-[#F3EFE6] rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
