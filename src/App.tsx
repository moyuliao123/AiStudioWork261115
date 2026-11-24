import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2 } from 'lucide-react';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  formatFullUserTitle,
  formatRecipeTitle,
  getNewlyUnlockedLabels,
} from './data/cafeUnlocks';
import {
  AMBIENCE_OPTIONS,
  AmbienceId,
  CafeProfile,
  ChatMessage,
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
import { CafeLoungePanel } from './components/CafeLoungePanel';
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
    if (raw === null) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function formatTimestampLabel(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
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

  // Local fallback states (used before Google login)
  const [localNotes, setLocalNotes] = useState<MoodNote[]>(loadInitialNotes);
  const [localFocusMinutes, setLocalFocusMinutes] = useState<number>(loadInitialTotalMinutes);

  // Firebase Auth & Multiplayer states
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [patrons, setPatrons] = useState<CafeProfile[]>([]);
  const [sharedNotes, setSharedNotes] = useState<MoodNote[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [noteText, setNoteText] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<MoodTag>('平靜');
  const [selectedColor, setSelectedColor] = useState<NoteColorId>('butter');
  const [justCompletedMinutes, setJustCompletedMinutes] = useState<number | null>(null);
  const [lastCompletedAmbience, setLastCompletedAmbience] = useState<string>('雨天窗畔');
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const enteredNativeFullscreenRef = useRef<boolean>(false);
  const selectedAmbienceRef = useRef<AmbienceId>(selectedAmbience);

  useEffect(() => {
    selectedAmbienceRef.current = selectedAmbience;
  }, [selectedAmbience]);

  const myProfile = currentUser
    ? patrons.find((p) => p.uid === currentUser.uid) ?? null
    : null;

  const getAmbienceLabel = useCallback((id: AmbienceId): string => {
    return AMBIENCE_OPTIONS.find((item) => item.id === id)?.label || '靜音專注';
  }, []);

  // Persist local notes and minutes
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(localNotes));
    } catch {
      // Ignore storage quota errors
    }
  }, [localNotes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_MINUTES_KEY, String(localFocusMinutes));
    } catch {
      // Ignore storage quota errors
    }
  }, [localFocusMinutes]);

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

  // Firebase Auth listener & automatic profile bootstrap
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);

      if (user) {
        const profilePath = `cafeProfiles/${user.uid}`;
        const profileRef = doc(db, 'cafeProfiles', user.uid);
        try {
          const snap = await getDoc(profileRef);
          if (!snap.exists()) {
            const rawName = (user.displayName || '咖啡旅人').trim().slice(0, 20) || '咖啡旅人';
            await setDoc(profileRef, {
              uid: user.uid,
              roomId: 'main-cafe',
              nickname: rawName,
              portion: '一杯',
              flavor: '微苦',
              item: '卡布奇諾',
              totalFocusMinutes: 0,
              isFocusing: false,
              ambienceLabel: getAmbienceLabel(selectedAmbienceRef.current),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, profilePath);
        }
      } else {
        setPatrons([]);
        setSharedNotes([]);
        setChatMessages([]);
      }
    });

    return () => unsubscribe();
  }, [getAmbienceLabel]);

  // Firestore real-time listeners (strictly gated on auth readiness + signed-in user)
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    const profilesQuery = query(
      collection(db, 'cafeProfiles'),
      where('roomId', '==', 'main-cafe'),
      limit(50)
    );
    const unsubProfiles = onSnapshot(
      profilesQuery,
      (snapshot) => {
        const list: CafeProfile[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const updatedAt = d.updatedAt as Timestamp | undefined;
          return {
            uid: String(d.uid || docSnap.id),
            roomId: 'main-cafe',
            nickname: String(d.nickname || '咖啡旅人'),
            portion: String(d.portion || '一杯'),
            flavor: String(d.flavor || '微苦'),
            item: String(d.item || '卡布奇諾'),
            totalFocusMinutes: Number(d.totalFocusMinutes || 0),
            isFocusing: Boolean(d.isFocusing),
            ambienceLabel: String(d.ambienceLabel || '雨天窗畔'),
            updatedAtMs: updatedAt ? updatedAt.toMillis() : 0,
          };
        });
        list.sort((a, b) => (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0));
        setPatrons(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'cafeProfiles');
      }
    );

    const notesQuery = query(
      collection(db, 'moodNotes'),
      where('roomId', '==', 'main-cafe'),
      limit(100)
    );
    const unsubNotes = onSnapshot(
      notesQuery,
      (snapshot) => {
        const list: MoodNote[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const createdAt = d.createdAt as Timestamp | undefined;
          const dateObj = createdAt ? createdAt.toDate() : new Date();
          return {
            id: docSnap.id,
            uid: String(d.uid || ''),
            authorDisplay: String(d.authorDisplay || ''),
            content: String(d.content || ''),
            mood: (d.mood as MoodTag) || '平靜',
            color: (d.color as NoteColorId) || 'butter',
            focusMinutes: Number(d.focusMinutes || 25),
            ambienceLabel: String(d.ambienceLabel || '雨天窗畔'),
            createdAt: formatTimestampLabel(dateObj),
            createdAtMs: createdAt ? createdAt.toMillis() : Date.now(),
          };
        });
        list.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
        setSharedNotes(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'moodNotes');
      }
    );

    const chatQuery = query(
      collection(db, 'chatMessages'),
      where('roomId', '==', 'main-cafe'),
      limit(100)
    );
    const unsubChat = onSnapshot(
      chatQuery,
      (snapshot) => {
        const list: ChatMessage[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const createdAt = d.createdAt as Timestamp | undefined;
          const dateObj = createdAt ? createdAt.toDate() : new Date();
          const hh = String(dateObj.getHours()).padStart(2, '0');
          const mm = String(dateObj.getMinutes()).padStart(2, '0');
          return {
            id: docSnap.id,
            uid: String(d.uid || ''),
            roomId: 'main-cafe',
            authorName: String(d.authorName || '咖啡友'),
            authorRecipe: String(d.authorRecipe || '[一杯][微苦]的[卡布奇諾]'),
            text: String(d.text || ''),
            messageType: d.messageType === 'unlock' ? 'unlock' : 'chat',
            createdAtLabel: `${hh}:${mm}`,
            createdAtMs: createdAt ? createdAt.toMillis() : Date.now(),
          };
        });
        list.sort((a, b) => a.createdAtMs - b.createdAtMs);
        setChatMessages(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'chatMessages');
      }
    );

    return () => {
      unsubProfiles();
      unsubNotes();
      unsubChat();
    };
  }, [isAuthReady, currentUser]);

  const syncFocusStatus = useCallback(
    async (focusing: boolean, ambienceId: AmbienceId) => {
      if (!currentUser || !myProfile) return;
      const path = `cafeProfiles/${currentUser.uid}`;
      try {
        await updateDoc(doc(db, 'cafeProfiles', currentUser.uid), {
          isFocusing: focusing,
          ambienceLabel: getAmbienceLabel(ambienceId),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [currentUser, myProfile, getAmbienceLabel]
  );

  const handleCompleteSession = useCallback(
    async (completedMins: number) => {
      setIsRunning(false);
      setIsCompleted(true);
      setSecondsLeft(0);
      endTimeRef.current = null;

      cafeAudioEngine.stop();
      setIsAudioPlaying(false);
      cafeAudioEngine.playCompletionChime();

      const validMins = Math.min(120, Math.max(1, completedMins));
      const ambienceLabel = getAmbienceLabel(selectedAmbience);

      setJustCompletedMinutes(validMins);
      setLastCompletedAmbience(ambienceLabel);

      if (currentUser && myProfile) {
        const prevMins = myProfile.totalFocusMinutes;
        const nextMins = prevMins + validMins;
        const profilePath = `cafeProfiles/${currentUser.uid}`;

        try {
          await updateDoc(doc(db, 'cafeProfiles', currentUser.uid), {
            totalFocusMinutes: nextMins,
            isFocusing: false,
            ambienceLabel,
            updatedAt: serverTimestamp(),
          });

          const unlocked = getNewlyUnlockedLabels(prevMins, nextMins);
          if (unlocked.length > 0) {
            const unlockText = `專注累積達 ${nextMins} 分鐘，解鎖了新元素：${unlocked.join('、')}！`;
            setUnlockNotice(unlockText);
            const recipe = formatRecipeTitle(
              myProfile.portion,
              myProfile.flavor,
              myProfile.item
            );
            await addDoc(collection(db, 'chatMessages'), {
              uid: currentUser.uid,
              roomId: 'main-cafe',
              authorName: myProfile.nickname,
              authorRecipe: recipe,
              text: unlockText,
              messageType: 'unlock',
              createdAt: serverTimestamp(),
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, profilePath);
        }
      } else {
        setLocalFocusMinutes((prev) => prev + validMins);
      }

      window.setTimeout(() => {
        composerTextareaRef.current?.focus();
      }, 120);
    },
    [currentUser, myProfile, getAmbienceLabel, selectedAmbience]
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
        void handleCompleteSession(configuredMinutes);
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
      void syncFocusStatus(false, selectedAmbience);
      return;
    }

    let nextSeconds = secondsLeft;
    if (isCompleted || secondsLeft <= 0) {
      nextSeconds = configuredMinutes * 60;
      setSecondsLeft(nextSeconds);
      setIsCompleted(false);
    }

    setJustCompletedMinutes(null);
    setUnlockNotice(null);
    setIsRunning(true);

    if (selectedAmbience !== 'silent') {
      cafeAudioEngine.start(selectedAmbience, volume);
      setIsAudioPlaying(true);
    }
    void syncFocusStatus(true, selectedAmbience);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setSecondsLeft(configuredMinutes * 60);
    setJustCompletedMinutes(null);
    setUnlockNotice(null);
    endTimeRef.current = null;
    cafeAudioEngine.stop();
    setIsAudioPlaying(false);
    document.title = BASE_TITLE;
    void syncFocusStatus(false, selectedAmbience);
  };

  const handleFinishEarly = () => {
    const elapsedSeconds = configuredMinutes * 60 - secondsLeft;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    void handleCompleteSession(elapsedMinutes);
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
    if (isRunning) {
      void syncFocusStatus(true, id);
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

  const handlePostNote = async () => {
    const trimmed = noteText.trim().slice(0, 120);
    if (!trimmed) return;

    const focusMins = Math.min(120, Math.max(1, justCompletedMinutes ?? configuredMinutes));
    const ambienceLabel =
      justCompletedMinutes !== null
        ? lastCompletedAmbience
        : getAmbienceLabel(selectedAmbience);

    if (currentUser && myProfile) {
      const authorDisplay = formatFullUserTitle(
        myProfile.nickname,
        myProfile.portion,
        myProfile.flavor,
        myProfile.item
      ).slice(0, 80);

      try {
        await addDoc(collection(db, 'moodNotes'), {
          uid: currentUser.uid,
          roomId: 'main-cafe',
          authorDisplay,
          content: trimmed,
          mood: selectedMood,
          color: selectedColor,
          focusMinutes: focusMins,
          ambienceLabel,
          createdAt: serverTimestamp(),
        });
        setNoteText('');
        setJustCompletedMinutes(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'moodNotes');
      }
      return;
    }

    const newNote: MoodNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      content: trimmed,
      mood: selectedMood,
      color: selectedColor,
      focusMinutes: focusMins,
      ambienceLabel,
      createdAt: formatTimestampLabel(new Date()),
    };

    setLocalNotes((prev) => [newNote, ...prev]);
    setNoteText('');
    setJustCompletedMinutes(null);
  };

  const handleDeleteNote = async (id: string) => {
    if (currentUser) {
      const path = `moodNotes/${id}`;
      try {
        await deleteDoc(doc(db, 'moodNotes', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
      return;
    }

    setLocalNotes((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = async () => {
    if (currentUser) {
      const mine = sharedNotes.filter((n) => n.uid === currentUser.uid);
      if (mine.length === 0) return;
      try {
        const batch = writeBatch(db);
        mine.forEach((n) => {
          batch.delete(doc(db, 'moodNotes', n.id));
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'moodNotes');
      }
      return;
    }

    setLocalNotes([]);
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('unauthorized-domain')) {
        setAuthError('此網域尚未加入 Firebase 授權網域，請在 Firebase Console 加入目前網域。');
      } else if (!msg.includes('popup-closed-by-user')) {
        setAuthError('登入未完成，請允許彈出視窗後再試一次。');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSaveProfile = async (next: {
    nickname: string;
    portion: string;
    flavor: string;
    item: string;
  }) => {
    if (!currentUser) return;
    const path = `cafeProfiles/${currentUser.uid}`;
    try {
      await updateDoc(doc(db, 'cafeProfiles', currentUser.uid), {
        nickname: next.nickname.trim().slice(0, 20),
        portion: next.portion.slice(0, 16),
        flavor: next.flavor.slice(0, 16),
        item: next.item.slice(0, 24),
        isFocusing: isRunning,
        ambienceLabel: getAmbienceLabel(selectedAmbience),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser || !myProfile) return;
    const trimmed = text.trim().slice(0, 200);
    if (!trimmed) return;
    const recipe = formatRecipeTitle(myProfile.portion, myProfile.flavor, myProfile.item).slice(
      0,
      64
    );

    try {
      await addDoc(collection(db, 'chatMessages'), {
        uid: currentUser.uid,
        roomId: 'main-cafe',
        authorName: myProfile.nickname.slice(0, 20),
        authorRecipe: recipe,
        text: trimmed,
        messageType: 'chat',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chatMessages');
    }
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

  const displayedNotes = currentUser ? sharedNotes : localNotes;
  const displayedTotalMinutes = myProfile ? myProfile.totalFocusMinutes : localFocusMinutes;

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
              href="#lounge-section"
              className="hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
            >
              咖啡廳聊天
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
        {/* Unlock Toast Banner when completing a session and unlocking new items */}
        {unlockNotice && (
          <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#78350F]">{unlockNotice}</p>
            <button
              type="button"
              onClick={() => setUnlockNotice(null)}
              className="text-xs font-semibold text-[#92400E] hover:text-[#1C1917] underline underline-offset-4 cursor-pointer"
            >
              知道了
            </button>
          </div>
        )}

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

        {/* Multiplayer Lounge: Live Chat, Patrons & Specialty Unlocks */}
        <CafeLoungePanel
          isAuthReady={isAuthReady}
          currentUid={currentUser?.uid ?? null}
          authError={authError}
          isSigningIn={isSigningIn}
          myProfile={myProfile}
          patrons={patrons}
          chatMessages={chatMessages}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onSaveProfile={handleSaveProfile}
          onSendMessage={handleSendMessage}
        />

        {/* Mood Sticky Note Wall */}
        <MoodWall
          notes={displayedNotes}
          totalFocusMinutes={displayedTotalMinutes}
          currentUid={currentUser?.uid ?? null}
          onDeleteNote={handleDeleteNote}
          onClearAll={handleClearAll}
          onFocusComposer={handleFocusComposer}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#E7E2D8] py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#78716C]">
          <span>晨光咖啡讀書室 · 為安靜閱讀與深度思考而設</span>
          <span>
            {currentUser
              ? '已連線至雲端咖啡廳，專注紀錄與心情便條即時同步中'
              : '未登入時便條會保存在您的瀏覽器中'}
          </span>
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
