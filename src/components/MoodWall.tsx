import React, { useState } from 'react';
import { Trash2, X, Coffee } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  MOOD_TAGS,
  MoodNote,
  MoodTag,
  NOTE_COLOR_THEMES,
} from '../types/cafe';

interface MoodWallProps {
  notes: MoodNote[];
  totalFocusMinutes: number;
  onDeleteNote: (id: string) => void;
  onClearAll: () => void;
  onFocusComposer: () => void;
}

export const MoodWall: React.FC<MoodWallProps> = ({
  notes,
  totalFocusMinutes,
  onDeleteNote,
  onClearAll,
  onFocusComposer,
}) => {
  const [activeFilter, setActiveFilter] = useState<MoodTag | '全部'>('全部');
  const [confirmClear, setConfirmClear] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const filteredNotes =
    activeFilter === '全部'
      ? notes
      : notes.filter((note) => note.mood === activeFilter);

  const handleConfirmClear = () => {
    onClearAll();
    setConfirmClear(false);
  };

  return (
    <section
      id="mood-wall-section"
      className="bg-white border border-[#E7E2D8] rounded-2xl p-6 sm:p-8 shadow-[0_2px_16px_rgba(28,25,23,0.03)]"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#F0ECE1]">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917] tracking-tight">
            心情便條牆
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#78716C] mt-1.5 font-mono-tabular">
            <span>共 {notes.length} 張心情便條</span>
            <span aria-hidden="true">·</span>
            <span>累計專注 {totalFocusMinutes} 分鐘</span>
          </div>
        </div>

        {/* One-Click Clear All with Safe Inline Confirmation */}
        {notes.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="h-10 px-4 rounded-xl bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3] text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>一鍵清空</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl p-1.5">
                <span className="text-xs font-medium text-[#9F1239] pl-2 whitespace-nowrap">
                  確定清空全部？
                </span>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="px-3 py-1.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  確認清空
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF8F5] text-[#44403C] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mood Filter Segmented Tabs */}
      {notes.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {(['全部', ...MOOD_TAGS] as const).map((tab) => {
            const active = activeFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-[#F5F2EB] text-[#57534E] hover:bg-[#EAE5DA] hover:text-[#1C1917]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      )}

      {/* Notes Grid or Empty State */}
      {notes.length === 0 ? (
        <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#D97706] mb-4">
            <Coffee className="w-7 h-7" />
          </div>
          <h3 className="font-display text-xl font-semibold text-[#1C1917]">
            便條牆目前靜悄悄的
          </h3>
          <p className="text-sm text-[#78716C] max-w-md mt-2 leading-relaxed">
            完成一段專注計時後，寫下一句當下的讀書心得或心情小語，把它貼在咖啡廳的牆上留念吧。
          </p>
          <button
            type="button"
            onClick={onFocusComposer}
            className="mt-6 h-11 px-5 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] text-[#1C1917] text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            寫下第一張便條
          </button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[#78716C]">
            目前沒有「{activeFilter}」分類的心情便條。
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter('全部')}
            className="mt-3 text-sm font-semibold text-[#B45309] hover:text-[#78350F] underline underline-offset-4 cursor-pointer"
          >
            顯示全部便條
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note, index) => {
              const theme =
                NOTE_COLOR_THEMES.find((t) => t.id === note.color) ||
                NOTE_COLOR_THEMES[0];
              const slightTilt =
                index % 3 === 0
                  ? 'hover:-rotate-1'
                  : index % 3 === 1
                    ? 'hover:rotate-1'
                    : 'hover:-rotate-0.5';

              return (
                <motion.article
                  key={note.id}
                  layout={!prefersReducedMotion}
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative rounded-xl border p-5 pt-6 flex flex-col justify-between min-h-[176px] shadow-[0_4px_14px_rgba(28,25,23,0.05)] transition-transform duration-200 ${theme.cardBg} ${theme.cardBorder} ${slightTilt}`}
                >
                  {/* Decorative Washi Tape Strip */}
                  <div
                    aria-hidden="true"
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 rounded-sm ${theme.tapeBg}`}
                  />

                  {/* Top Line: Unboxed Mood Text + Delete Button */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold text-[#44403C]">
                      {note.mood}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      aria-label="刪除這張便條"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#78716C] hover:text-[#1C1917] hover:bg-black/5 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Handwritten-feel Quote Body */}
                  <p className="text-[#1C1917] text-base leading-relaxed font-medium break-words flex-1">
                    {note.content}
                  </p>

                  {/* Clean Unboxed Metadata Footer */}
                  <div className="mt-4 pt-3 border-t border-black/10 flex flex-wrap items-center gap-1.5 text-xs text-[#57534E] font-mono-tabular">
                    <span>專注 {note.focusMinutes} 分鐘</span>
                    <span aria-hidden="true">·</span>
                    <span>{note.ambienceLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{note.createdAt}</span>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
};
