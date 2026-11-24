import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2 } from 'lucide-react';
import {
  AMBIENCE_OPTIONS,
  AmbienceId,
  MoodNote,
  MoodTag,
  NoteColorId,
  STARTER_NOTES,
} from './types/cafe';
import { cafeAudioEngine } from './utils/audioEngine';
import { FocusTimerCard, formatClock } from './components/FocusTimerCard';
import { AmbiencePanel } from './components/AmbiencePanel';
import { NoteComposer } from './components/NoteComposer';
import { MoodWall } from './components/MoodWall';
import { FullscreenFocusOverlay } from './components/FullscreenFocusOverlay';

const STORAGE_NOTES_KEY = 'cafe_focus_notes_v1';
const STORAGE_MINUTES_KEY = 'cafe_focus_total_minutes_v1';
const BASE_TITLE = '晨光咖啡讀書室 — 專注計時與心情便條牆';

function loadInitialNotes(): MoodNote[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_NOTES_KEY);
    if (raw === null) {
      return STARTER_NOTES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : STARTER_NOTES;
  } catch {
    return STARTER_NOTES;
  }
}

function loadInitialTotalMinutes(): number {
  try {
    const raw = window.localStorage.getItem(STORAGE_MINUTES_KEY);
    if (raw === null) return 95;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 95;
  } catch {
    return 95;
  }
}

function formatCurrentTimestamp(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `今天 ${hh}:${mm}`;
}

export default function App() {
  const [configuredMinutes, setConfiguredMinutes] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const [selectedAmbience, setSelectedAmbience] = useState<AmbienceId>('rain');
  const [volume, setVolume] = useState<number>(0.45);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  const [notes, setNotes] = useState<MoodNote[]>(loadInitialNotes);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(loadInitialTotalMinutes);

  const [noteText, setNoteText] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<MoodTag>('平靜');
  const [selectedColor, setSelectedColor] = useState<NoteColorId>('butter');
  const [justCompletedMinutes, setJustCompletedMinutes] = useState<number | null>(null);
  const [lastCompletedAmbience, setLastCompletedAmbience] = useState<string>('雨天窗畔');

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const enteredNativeFullscreenRef = useRef<boolean>(false);

  // Persist notes and focus total
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
    } catch {
      // Ignore storage quota errors
    }
  }, [notes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_MINUTES_KEY, String(totalFocusMinutes));
    } catch {
      // Ignore storage quota errors
    }
  }, [totalFocusMinutes]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      cafeAudioEngine.stop();
    };
  }, []);

  // Sync browser fullscreen state if user presses ESC in native fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        enteredNativeFullscreenRef.current = true;
      } else if (enteredNativeFullscreenRef.current) {
        enteredNativeFullscreenRef.current = false;
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getAmbienceLabel = useCallback((id: AmbienceId): string => {
    return AMBIENCE_OPTIONS.find((item) => item.id === id)?.label || '靜音專注';
  }, []);

  const handleCompleteSession = useCallback(
    (completedMins: number) => {
      setIsRunning(false);
      setIsCompleted(true);
      setSecondsLeft(0);
      endTimeRef.current = null;

      cafeAudioEngine.stop();
      setIsAudioPlaying(false);
      cafeAudioEngine.playCompletionChime();

      const validMins = Math.max(1, completedMins);
      setTotalFocusMinutes((prev) => prev + validMins);
      setJustCompletedMinutes(validMins);
      setLastCompletedAmbience(getAmbienceLabel(selectedAmbience));

      window.setTimeout(() => {
        composerTextareaRef.current?.focus();
      }, 120);
    },
    [getAmbienceLabel, selectedAmbience]
  );

  // Accurate countdown tick using timestamp target
  useEffect(() => {
    if (!isRunning) {
      document.title = BASE_TITLE;
      return;
    }

    endTimeRef.current = Date.now() + secondsLeft * 1000;

    const intervalId = window.setInterval(() => {
      if (endTimeRef.current === null) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      document.title = `${formatClock(remaining)} · 晨光咖啡讀書室`;

      if (remaining <= 0) {
        window.clearInterval(intervalId);
        handleCompleteSession(configuredMinutes);
      }
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, configuredMinutes, handleCompleteSession]);

  const handleSelectMinutes = (mins: number) => {
    if (isRunning) return;
    setConfiguredMinutes(mins);
    setSecondsLeft(mins * 60);
    setIsCompleted(false);
  };

  const handleToggleRun = () => {
    if (isRunning) {
      setIsRunning(false);
      cafeAudioEngine.stop();
      setIsAudioPlaying(false);
      return;
    }

    let nextSeconds = secondsLeft;
    if (isCompleted || secondsLeft <= 0) {
      nextSeconds = configuredMinutes * 60;
      setSecondsLeft(nextSeconds);
      setIsCompleted(false);
    }

    setJustCompletedMinutes(null);
    setIsRunning(true);

    if (selectedAmbience !== 'silent') {
      cafeAudioEngine.start(selectedAmbience, volume);
      setIsAudioPlaying(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setSecondsLeft(configuredMinutes * 60);
    setJustCompletedMinutes(null);
    endTimeRef.current = null;
    cafeAudioEngine.stop();
    setIsAudioPlaying(false);
    document.title = BASE_TITLE;
  };

  const handleFinishEarly = () => {
    const elapsedSeconds = configuredMinutes * 60 - secondsLeft;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    handleCompleteSession(elapsedMinutes);
  };

  const handleSelectAmbience = (id: AmbienceId) => {
    setSelectedAmbience(id);
    if (id === 'silent') {
      cafeAudioEngine.stop();
      setIsAudioPlaying(false);
    } else if (isRunning || isAudioPlaying) {
      cafeAudioEngine.start(id, volume);
      setIsAudioPlaying(true);
    }
  };

  const handleChangeVolume = (nextVolume: number) => {
    setVolume(nextVolume);
    cafeAudioEngine.setVolume(nextVolume);
  };

  const handleToggleAudioPreview = () => {
    if (selectedAmbience === 'silent') return;
    if (isAudioPlaying) {
      cafeAudioEngine.stop();
      setIsAudioPlaying(false);
    } else {
      cafeAudioEngine.start(selectedAmbience, volume);
      setIsAudioPlaying(true);
    }
  };

  const handlePostNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    const focusMins = justCompletedMinutes ?? configuredMinutes;
    const ambienceLabel =
      justCompletedMinutes !== null
        ? lastCompletedAmbience
        : getAmbienceLabel(selectedAmbience);

    const newNote: MoodNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      content: trimmed,
      mood: selectedMood,
      color: selectedColor,
      focusMinutes: focusMins,
      ambienceLabel,
      createdAt: formatCurrentTimestamp(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setNoteText('');
    setJustCompletedMinutes(null);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setNotes([]);
  };

  const handleEnterFullscreen = async () => {
    setIsFullscreen(true);
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fallback gracefully when native Fullscreen API is blocked in an iframe
    }
  };

  const handleExitFullscreen = async () => {
    enteredNativeFullscreenRef.current = false;
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore exit errors
    }
  };

  const handleFocusComposer = () => {
    composerTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      composerTextareaRef.current?.focus();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col">
      {/* 3-Zone Top Navigation Bar */}
      <header className="border-b border-[#E7E2D8] bg-[#FAF8F5]/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#timer-section"
            className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0"
          >
            晨光咖啡讀書室
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534E]">
            <a
              href="#timer-section"
              className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
            >
              專注計時
            </a>
            <a
              href="#ambience-section"
              className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
            >
              背景氛圍
            </a>
            <a
              href="#mood-wall-section"
              className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
            >
              心情便條牆
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleEnterFullscreen}
              className="h-10 px-4 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] text-[#1C1917] text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              <Maximize2 className="w-4 h-4" />
              <span>全螢幕專注</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
        {/* Top 2-Column Balanced Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6 flex flex-col">
            <FocusTimerCard
              configuredMinutes={configuredMinutes}
              secondsLeft={secondsLeft}
              isRunning={isRunning}
              isCompleted={isCompleted}
              onSelectMinutes={handleSelectMinutes}
              onToggleRun={handleToggleRun}
              onReset={handleReset}
              onFinishEarly={handleFinishEarly}
              onEnterFullscreen={handleEnterFullscreen}
            />
          </div>

          <div className="lg:col-span-6 flex flex-col gap-6">
            <AmbiencePanel
              selectedAmbience={selectedAmbience}
              volume={volume}
              isAudioPlaying={isAudioPlaying}
              onSelectAmbience={handleSelectAmbience}
              onChangeVolume={handleChangeVolume}
              onToggleAudioPreview={handleToggleAudioPreview}
            />

            <NoteComposer
              noteText={noteText}
              selectedMood={selectedMood}
              selectedColor={selectedColor}
              justCompletedMinutes={justCompletedMinutes}
              textareaRef={composerTextareaRef}
              onChangeText={setNoteText}
              onSelectMood={setSelectedMood}
              onSelectColor={setSelectedColor}
              onSubmit={handlePostNote}
              onDismissCompletionPrompt={() => setJustCompletedMinutes(null)}
            />
          </div>
        </div>

        {/* Mood Sticky Note Wall */}
        <MoodWall
          notes={notes}
          totalFocusMinutes={totalFocusMinutes}
          onDeleteNote={handleDeleteNote}
          onClearAll={handleClearAll}
          onFocusComposer={handleFocusComposer}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#E7E2D8] py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#78716C]">
          <span>晨光咖啡讀書室 · 為安靜閱讀與深度思考而設</span>
          <span>便條紀錄會自動儲存在您的瀏覽器中</span>
        </div>
      </footer>

      {/* Distraction-Free Fullscreen Mode */}
      <FullscreenFocusOverlay
        isOpen={isFullscreen}
        configuredMinutes={configuredMinutes}
        secondsLeft={secondsLeft}
        isRunning={isRunning}
        isCompleted={isCompleted}
        selectedAmbience={selectedAmbience}
        volume={volume}
        isAudioPlaying={isAudioPlaying}
        justCompletedMinutes={justCompletedMinutes}
        noteText={noteText}
        selectedMood={selectedMood}
        selectedColor={selectedColor}
        onExit={handleExitFullscreen}
        onToggleRun={handleToggleRun}
        onReset={handleReset}
        onFinishEarly={handleFinishEarly}
        onSelectAmbience={handleSelectAmbience}
        onChangeVolume={handleChangeVolume}
        onToggleAudioPreview={handleToggleAudioPreview}
        onChangeNoteText={setNoteText}
        onSelectMood={setSelectedMood}
        onSelectColor={setSelectedColor}
        onSubmitNote={handlePostNote}
      />
    </div>
  );
}
