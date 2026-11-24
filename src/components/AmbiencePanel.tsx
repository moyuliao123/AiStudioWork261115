import React, { useState } from 'react';
import { Volume2, VolumeX, Coffee } from 'lucide-react';
import { AMBIENCE_OPTIONS, AmbienceId } from '../types/cafe';
import cafeStudyWindowImg from '../assets/images/cafe_study_window_1795548733330.jpg';

interface AmbiencePanelProps {
  selectedAmbience: AmbienceId;
  volume: number;
  isAudioPlaying: boolean;
  onSelectAmbience: (id: AmbienceId) => void;
  onChangeVolume: (vol: number) => void;
  onToggleAudioPreview: () => void;
}

export const AmbiencePanel: React.FC<AmbiencePanelProps> = ({
  selectedAmbience,
  volume,
  isAudioPlaying,
  onSelectAmbience,
  onChangeVolume,
  onToggleAudioPreview,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <section
      id="ambience-section"
      className="bg-white border border-[#E7E2D8] rounded-2xl p-6 shadow-[0_2px_16px_rgba(28,25,23,0.03)]"
    >
      {/* Compact Editorial Cafe Window Banner */}
      <div className="relative h-36 sm:h-40 rounded-xl overflow-hidden mb-5 bg-[#F3EFE6]">
        {!imageError ? (
          <img
            src={cafeStudyWindowImg}
            alt="陽光灑落的咖啡館木窗與手沖咖啡桌"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F5EFE6] to-[#EAE2D3] text-[#78716C] gap-2">
            <Coffee className="w-7 h-7 text-[#D97706]" />
            <span className="text-sm font-medium">晨光咖啡讀書室</span>
          </div>
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent flex items-end justify-between p-4"
        >
          <div>
            <h2 className="font-display text-xl font-semibold text-white tracking-tight">
              背景音效氛圍
            </h2>
            <p className="text-xs text-white/85 mt-0.5">
              挑選最適合此刻的咖啡館聲音
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleAudioPreview}
            disabled={selectedAmbience === 'silent'}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isAudioPlaying && selectedAmbience !== 'silent'
                ? 'bg-[#FBBF24] hover:bg-[#F59E0B] text-[#1C1917]'
                : 'bg-white/95 hover:bg-white text-[#1C1917]'
            }`}
          >
            {isAudioPlaying && selectedAmbience !== 'silent' ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span>播放中</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>{selectedAmbience === 'silent' ? '靜音模式' : '試聽音效'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Soundscape Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {AMBIENCE_OPTIONS.map((option) => {
          const isSelected = selectedAmbience === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectAmbience(option.id)}
              className={`text-left px-4 py-3 rounded-xl border transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B] ${
                isSelected
                  ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#1C1917]'
                  : 'bg-[#FAF8F5] border-[#E7E2D8] hover:border-[#D6CFC2] text-[#44403C]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold whitespace-nowrap">{option.label}</span>
                {isSelected && (
                  <span className="text-xs font-medium text-[#B45309] whitespace-nowrap">
                    使用中
                  </span>
                )}
              </div>
              <p className="text-xs text-[#78716C] mt-1 line-clamp-1">{option.description}</p>
            </button>
          );
        })}
      </div>

      {/* Volume Slider */}
      <div className="mt-4 pt-4 border-t border-[#F0ECE1] flex items-center gap-3">
        <Volume2 className="w-4 h-4 text-[#78716C] shrink-0" />
        <label htmlFor="ambience-volume" className="text-xs font-medium text-[#57534E] whitespace-nowrap">
          氛圍音量
        </label>
        <input
          id="ambience-volume"
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => onChangeVolume(Number(e.target.value) / 100)}
          className="flex-1 accent-[#F59E0B] h-2 bg-[#F3EFE6] rounded-lg cursor-pointer"
        />
        <span className="font-mono-tabular text-xs font-medium text-[#57534E] w-10 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </section>
  );
};
