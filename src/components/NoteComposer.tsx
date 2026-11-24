import React from 'react';
import { StickyNote, Sparkles } from 'lucide-react';
import {
  MOOD_TAGS,
  MoodTag,
  NOTE_COLOR_THEMES,
  NoteColorId,
} from '../types/cafe';

interface NoteComposerProps {
  noteText: string;
  selectedMood: MoodTag;
  selectedColor: NoteColorId;
  justCompletedMinutes: number | null;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onChangeText: (text: string) => void;
  onSelectMood: (mood: MoodTag) => void;
  onSelectColor: (color: NoteColorId) => void;
  onSubmit: () => void;
  onDismissCompletionPrompt?: () => void;
}

export const NoteComposer: React.FC<NoteComposerProps> = ({
  noteText,
  selectedMood,
  selectedColor,
  justCompletedMinutes,
  textareaRef,
  onChangeText,
  onSelectMood,
  onSelectColor,
  onSubmit,
  onDismissCompletionPrompt,
}) => {
  const activeTheme =
    NOTE_COLOR_THEMES.find((t) => t.id === selectedColor) || NOTE_COLOR_THEMES[0];
  const maxLength = 120;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && noteText.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <section
      className={`bg-white border rounded-2xl p-6 transition-all shadow-[0_2px_16px_rgba(28,25,23,0.03)] ${
        justCompletedMinutes !== null
          ? 'border-[#F59E0B] ring-2 ring-[#FDE68A]'
          : 'border-[#E7E2D8]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#1C1917] tracking-tight">
            留下一張心情便條
          </h2>
          <p className="text-xs text-[#78716C] mt-1">
            {justCompletedMinutes !== null
              ? `恭喜完成 ${justCompletedMinutes} 分鐘專注！寫下一句當下心情貼到牆上吧。`
              : '專注結束後或隨時記下一句此刻的心境與小確幸。'}
          </p>
        </div>

        {justCompletedMinutes !== null && onDismissCompletionPrompt && (
          <button
            type="button"
            onClick={onDismissCompletionPrompt}
            className="text-xs font-medium text-[#B45309] hover:text-[#78350F] inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>專注達成</span>
          </button>
        )}
      </div>

      {/* Mood Selector */}
      <div className="mb-3">
        <span className="block text-xs font-medium text-[#57534E] mb-2">此刻感受</span>
        <div className="flex flex-wrap gap-1.5">
          {MOOD_TAGS.map((tag) => {
            const active = selectedMood === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectMood(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#FBBF24] text-[#1C1917] font-semibold'
                    : 'bg-[#F5F2EB] text-[#57534E] hover:bg-[#EAE5DA] hover:text-[#1C1917]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Note Input Box */}
      <div className={`rounded-xl border p-3.5 transition-colors ${activeTheme.cardBg} ${activeTheme.cardBorder}`}>
        <label htmlFor="mood-note-input" className="sr-only">
          心情便條內容
        </label>
        <textarea
          ref={textareaRef}
          id="mood-note-input"
          rows={3}
          maxLength={maxLength}
          value={noteText}
          onChange={(e) => onChangeText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="寫下一句當下心情，例如：剛讀完一章好書，窗邊陽光正好..."
          className="w-full bg-transparent resize-none text-sm sm:text-base text-[#1C1917] placeholder:text-[#78716C]/80 focus:outline-none leading-relaxed"
        />
        <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs text-[#57534E]">
          <span>Ctrl + Enter 快速張貼</span>
          <span className="font-mono-tabular">
            {noteText.length} / {maxLength}
          </span>
        </div>
      </div>

      {/* Paper Color Swatches & Submit Button */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="radiogroup" aria-label="選擇便條紙顏色">
          <span className="text-xs font-medium text-[#57534E] mr-1">紙張顏色</span>
          {NOTE_COLOR_THEMES.map((theme) => {
            const selected = selectedColor === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={theme.label}
                title={theme.label}
                onClick={() => onSelectColor(theme.id)}
                className={`w-7 h-7 rounded-full border transition-transform cursor-pointer ${
                  theme.swatchBg
                } ${
                  selected
                    ? 'border-[#1C1917] scale-110 ring-2 ring-[#1C1917]/15'
                    : 'border-black/15 hover:scale-105'
                }`}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!noteText.trim()}
          className="h-11 px-5 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] disabled:bg-[#F3EFE6] disabled:text-[#A8A29E] disabled:cursor-not-allowed text-[#1C1917] font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
        >
          <StickyNote className="w-4 h-4" />
          <span>貼上心情便條</span>
        </button>
      </div>
    </section>
  );
};
