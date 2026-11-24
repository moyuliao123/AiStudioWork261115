import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Coffee,
  Edit3,
  Lock,
  LogIn,
  LogOut,
  MessageSquare,
  Send,
  Users,
} from 'lucide-react';
import {
  FLAVOR_UNLOCKS,
  ITEM_UNLOCKS,
  PORTION_UNLOCKS,
  formatFullUserTitle,
  formatRecipeTitle,
  getLevelInfo,
} from '../data/cafeUnlocks';
import { CafeProfile, ChatMessage } from '../types/cafe';

interface CafeLoungePanelProps {
  isAuthReady: boolean;
  currentUid: string | null;
  authError: string | null;
  isSigningIn: boolean;
  myProfile: CafeProfile | null;
  patrons: CafeProfile[];
  chatMessages: ChatMessage[];
  onSignIn: () => void;
  onSignOut: () => void;
  onSaveProfile: (next: {
    nickname: string;
    portion: string;
    flavor: string;
    item: string;
  }) => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
}

export const CafeLoungePanel: React.FC<CafeLoungePanelProps> = ({
  isAuthReady,
  currentUid,
  authError,
  isSigningIn,
  myProfile,
  patrons,
  chatMessages,
  onSignIn,
  onSignOut,
  onSaveProfile,
  onSendMessage,
}) => {
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [draftNickname, setDraftNickname] = useState('');
  const [draftPortion, setDraftPortion] = useState('一杯');
  const [draftFlavor, setDraftFlavor] = useState('微苦');
  const [draftItem, setDraftItem] = useState('卡布奇諾');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (myProfile) {
      setDraftNickname(myProfile.nickname);
      setDraftPortion(myProfile.portion);
      setDraftFlavor(myProfile.flavor);
      setDraftItem(myProfile.item);
    }
  }, [myProfile]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draftNickname.trim();
    if (!trimmed) return;
    setIsSavingProfile(true);
    try {
      await onSaveProfile({
        nickname: trimmed,
        portion: draftPortion,
        flavor: draftFlavor,
        item: draftItem,
      });
      setIsEditingRecipe(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSubmitChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || isSendingChat) return;
    setIsSendingChat(true);
    try {
      await onSendMessage(trimmed);
      setChatInput('');
    } finally {
      setIsSendingChat(false);
    }
  };

  const totalMinutes = myProfile?.totalFocusMinutes ?? 0;
  const levelInfo = getLevelInfo(totalMinutes);

  return (
    <section
      id="lounge-section"
      className="bg-white border border-[#E7E2D8] rounded-2xl p-6 sm:p-8 shadow-[0_2px_16px_rgba(28,25,23,0.03)]"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0ECE1]">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917] tracking-tight">
            多人咖啡廳大廳與聊天室
          </h2>
          <p className="text-sm text-[#78716C] mt-1">
            和線上的咖啡友一起專注、聊天，累積專注分鐘數即可解鎖更多特調與甜點稱號。
          </p>
        </div>

        {currentUid && myProfile && (
          <button
            type="button"
            onClick={onSignOut}
            className="h-10 px-4 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-[#44403C] text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>登出大廳</span>
          </button>
        )}
      </div>

      {!isAuthReady ? (
        <div className="py-12 text-center text-sm text-[#78716C]">
          正在連線咖啡廳大廳...
        </div>
      ) : !currentUid ? (
        /* Signed-Out Welcome & Preview */
        <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-display text-xl font-semibold text-[#1C1917]">
              登入即可加入即時文字聊天與收集特調圖鑑
            </h3>
            <p className="text-sm text-[#57534E] leading-relaxed">
              每位咖啡友都擁有獨一無二的三段式組合名片，例如{' '}
              <span className="font-semibold text-[#1C1917]">
                喵喵王子/[一杯][微苦]的[卡布奇諾]
              </span>
              。每完成一段專注計時，累積的總時長就會自動解鎖新的份量、風味與甜點品項。
            </p>
            {authError && (
              <p className="text-sm text-[#BE123C] bg-[#FFF1F2] border border-[#FECDD3] rounded-xl px-4 py-2.5">
                {authError}
              </p>
            )}
            <div className="pt-1">
              <button
                type="button"
                disabled={isSigningIn}
                onClick={onSignIn}
                className="h-12 px-6 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] disabled:opacity-60 text-[#1C1917] font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSigningIn ? '登入中...' : '使用 Google 帳號加入多人咖啡廳'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#FAF8F5] border border-[#E7E2D8] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1917]">
              <Award className="w-4 h-4 text-[#D97706]" />
              <span>專注時長解鎖範例</span>
            </div>
            <div className="space-y-2 text-xs text-[#57534E]">
              <div className="flex items-center justify-between py-1.5 border-b border-[#E7E2D8]">
                <span>Lv.1 · 0 分鐘</span>
                <span className="font-medium text-[#1C1917]">[一杯][微苦]的[卡布奇諾]</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E7E2D8]">
                <span>Lv.2 · 25 分鐘</span>
                <span className="font-medium text-[#1C1917]">[手沖][香醇]的[肉桂捲]</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E7E2D8]">
                <span>Lv.3 · 60 分鐘</span>
                <span className="font-medium text-[#1C1917]">[精緻][焦糖香氣]的[抹茶巴斯克]</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>Lv.5 · 240 分鐘</span>
                <span className="font-medium text-[#1C1917]">[午夜限定][雲朵奶蓋]的[松露可頌]</span>
              </div>
            </div>
          </div>
        </div>
      ) : !myProfile ? (
        <div className="py-12 text-center text-sm text-[#78716C]">
          正在準備您的咖啡廳名片...
        </div>
      ) : (
        /* Signed-In Multiplayer Workspace */
        <div className="pt-6 space-y-6">
          {/* My Profile Card & Specialty Unlocks */}
          <div className="bg-[#FAF8F5] border border-[#E7E2D8] rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C] font-mono-tabular">
                  <span className="font-semibold text-[#B45309]">
                    Lv.{levelInfo.level} {levelInfo.rankTitle}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>雲端累計專注 {totalMinutes} 分鐘</span>
                  {levelInfo.nextLevelMinutes !== null && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>再 {levelInfo.remainingToNext} 分鐘升等</span>
                    </>
                  )}
                </div>
                <div className="mt-1.5 font-display text-xl sm:text-2xl font-semibold text-[#1C1917] break-all">
                  {formatFullUserTitle(
                    myProfile.nickname,
                    myProfile.portion,
                    myProfile.flavor,
                    myProfile.item
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingRecipe((prev) => !prev)}
                className="h-10 px-4 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] text-[#1C1917] text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditingRecipe ? '收合特調圖鑑' : '更換暱稱與特調'}</span>
              </button>
            </div>

            {/* Level Progress Bar */}
            <div className="mt-4 w-full h-2 bg-[#E7E2D8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F59E0B] rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>

            {/* Specialty Customizer & Unlock Catalog */}
            {isEditingRecipe && (
              <form
                onSubmit={handleSave}
                className="mt-5 pt-5 border-t border-[#E7E2D8] space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex-1 max-w-xs">
                    <label
                      htmlFor="cafe-nickname-input"
                      className="block text-xs font-semibold text-[#44403C] mb-1.5"
                    >
                      我的暱稱（最多 20 字）
                    </label>
                    <input
                      id="cafe-nickname-input"
                      type="text"
                      maxLength={20}
                      required
                      value={draftNickname}
                      onChange={(e) => setDraftNickname(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-[#D6CFC2] bg-white text-sm text-[#1C1917] focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  <div className="text-sm text-[#57534E]">
                    預覽：
                    <span className="font-semibold text-[#1C1917]">
                      {formatFullUserTitle(
                        draftNickname.trim() || '咖啡友',
                        draftPortion,
                        draftFlavor,
                        draftItem
                      )}
                    </span>
                  </div>
                </div>

                {/* 3 Unlock Buckets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Portion */}
                  <div className="bg-white border border-[#E7E2D8] rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-[#44403C] mb-2.5">
                      1. 份量／容器 [ ]
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {PORTION_UNLOCKS.map((token) => {
                        const unlocked = totalMinutes >= token.requiredMinutes;
                        const active = draftPortion === token.label;
                        return (
                          <button
                            key={token.label}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => setDraftPortion(token.label)}
                            title={
                              unlocked
                                ? `已解鎖：${token.label}`
                                : `累積 ${token.requiredMinutes} 分鐘解鎖`
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                              active
                                ? 'bg-[#FBBF24] text-[#1C1917] font-semibold cursor-pointer'
                                : unlocked
                                  ? 'bg-[#F5F2EB] hover:bg-[#EAE5DA] text-[#1C1917] cursor-pointer'
                                  : 'bg-[#FAF8F5] text-[#A8A29E] border border-dashed border-[#E7E2D8] cursor-not-allowed'
                            }`}
                          >
                            {!unlocked && <Lock className="w-3 h-3" />}
                            <span>{token.label}</span>
                            {!unlocked && (
                              <span className="font-mono-tabular">
                                {token.requiredMinutes}m
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Flavor */}
                  <div className="bg-white border border-[#E7E2D8] rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-[#44403C] mb-2.5">
                      2. 風味／口感 [ ]
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {FLAVOR_UNLOCKS.map((token) => {
                        const unlocked = totalMinutes >= token.requiredMinutes;
                        const active = draftFlavor === token.label;
                        return (
                          <button
                            key={token.label}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => setDraftFlavor(token.label)}
                            title={
                              unlocked
                                ? `已解鎖：${token.label}`
                                : `累積 ${token.requiredMinutes} 分鐘解鎖`
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                              active
                                ? 'bg-[#FBBF24] text-[#1C1917] font-semibold cursor-pointer'
                                : unlocked
                                  ? 'bg-[#F5F2EB] hover:bg-[#EAE5DA] text-[#1C1917] cursor-pointer'
                                  : 'bg-[#FAF8F5] text-[#A8A29E] border border-dashed border-[#E7E2D8] cursor-not-allowed'
                            }`}
                          >
                            {!unlocked && <Lock className="w-3 h-3" />}
                            <span>{token.label}</span>
                            {!unlocked && (
                              <span className="font-mono-tabular">
                                {token.requiredMinutes}m
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Drink / Treat Item */}
                  <div className="bg-white border border-[#E7E2D8] rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-[#44403C] mb-2.5">
                      3. 咖啡特調／點心 [ ]
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {ITEM_UNLOCKS.map((token) => {
                        const unlocked = totalMinutes >= token.requiredMinutes;
                        const active = draftItem === token.label;
                        return (
                          <button
                            key={token.label}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => setDraftItem(token.label)}
                            title={
                              unlocked
                                ? `已解鎖（${token.categoryKind}）：${token.label}`
                                : `累積 ${token.requiredMinutes} 分鐘解鎖`
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                              active
                                ? 'bg-[#FBBF24] text-[#1C1917] font-semibold cursor-pointer'
                                : unlocked
                                  ? 'bg-[#F5F2EB] hover:bg-[#EAE5DA] text-[#1C1917] cursor-pointer'
                                  : 'bg-[#FAF8F5] text-[#A8A29E] border border-dashed border-[#E7E2D8] cursor-not-allowed'
                            }`}
                          >
                            {!unlocked && <Lock className="w-3 h-3" />}
                            <span>{token.label}</span>
                            {!unlocked && (
                              <span className="font-mono-tabular">
                                {token.requiredMinutes}m
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingRecipe(false)}
                    className="h-10 px-4 rounded-xl border border-[#E7E2D8] bg-white hover:bg-[#F5F2EB] text-[#44403C] text-sm font-medium cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile || !draftNickname.trim()}
                    className="h-10 px-5 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] disabled:opacity-50 text-[#1C1917] text-sm font-semibold cursor-pointer"
                  >
                    {isSavingProfile ? '儲存中...' : '儲存名片組合'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 2-Column Patrons + Live Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Patrons List */}
            <div className="lg:col-span-5 bg-[#FAF8F5] border border-[#E7E2D8] rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E7E2D8]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D97706]" />
                  <h3 className="font-semibold text-sm text-[#1C1917]">咖啡廳內的夥伴</h3>
                </div>
                <span className="text-xs font-mono-tabular text-[#78716C]">
                  {patrons.length} 位咖啡友
                </span>
              </div>

              <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {patrons.map((patron) => {
                  const patronLevel = getLevelInfo(patron.totalFocusMinutes).level;
                  const isMe = patron.uid === currentUid;
                  return (
                    <div
                      key={patron.uid}
                      className={`p-3 rounded-xl border ${
                        isMe
                          ? 'bg-[#FFFBEB] border-[#FDE68A]'
                          : 'bg-white border-[#E7E2D8]'
                      }`}
                    >
                      <div className="text-sm font-semibold text-[#1C1917] break-all">
                        {formatFullUserTitle(
                          patron.nickname,
                          patron.portion,
                          patron.flavor,
                          patron.item
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#78716C] font-mono-tabular">
                        <span>Lv.{patronLevel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{patron.totalFocusMinutes} 分鐘</span>
                        <span aria-hidden="true">·</span>
                        <span className={patron.isFocusing ? 'text-[#B45309] font-medium' : ''}>
                          {patron.isFocusing
                            ? `專注中（${patron.ambienceLabel}）`
                            : '大廳小憩中'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Café Chat */}
            <div className="lg:col-span-7 bg-[#FAF8F5] border border-[#E7E2D8] rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E7E2D8]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#D97706]" />
                  <h3 className="font-semibold text-sm text-[#1C1917]">咖啡廳即時聊天</h3>
                </div>
                <span className="text-xs text-[#78716C]">
                  發話即會顯示你的特調稱號
                </span>
              </div>

              <div
                ref={chatScrollRef}
                className="mt-3 flex-1 min-h-[240px] max-h-80 overflow-y-auto space-y-2.5 pr-1"
              >
                {chatMessages.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center text-xs text-[#78716C] gap-2">
                    <Coffee className="w-5 h-5 text-[#D97706]" />
                    <span>目前還沒有對話，跟大家打聲招呼、聊聊正在讀什麼吧！</span>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMine = msg.uid === currentUid;
                    return (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl border ${
                          msg.messageType === 'unlock'
                            ? 'bg-[#FFFBEB] border-[#FDE68A]'
                            : isMine
                              ? 'bg-white border-[#FDE68A]'
                              : 'bg-white border-[#E7E2D8]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#1C1917] break-all">
                            {msg.authorName}/{msg.authorRecipe}
                          </span>
                          <span className="text-[#78716C] font-mono-tabular shrink-0">
                            {msg.createdAtLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#292524] leading-relaxed break-words">
                          {msg.text}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSubmitChat} className="mt-3 pt-3 border-t border-[#E7E2D8] flex gap-2">
                <label htmlFor="cafe-chat-input" className="sr-only">
                  輸入聊天訊息
                </label>
                <input
                  id="cafe-chat-input"
                  type="text"
                  maxLength={200}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`以「${myProfile.nickname}/${formatRecipeTitle(
                    myProfile.portion,
                    myProfile.flavor,
                    myProfile.item
                  )}」身分打字聊天...`}
                  className="flex-1 h-11 px-4 rounded-xl border border-[#D6CFC2] bg-white text-sm text-[#1C1917] placeholder:text-[#78716C]/80 focus:outline-none focus:border-[#F59E0B]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isSendingChat}
                  className="h-11 px-5 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] disabled:bg-[#EAE5DA] disabled:text-[#A8A29E] disabled:cursor-not-allowed text-[#1C1917] text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>送出</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
