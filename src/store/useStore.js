import { create } from 'zustand';
import { sendSilentParentAlert, shouldTriggerSilentAlert, canSendSilentAlert, markSilentAlertSent } from '../services/alertService';

export const useStore = create((set, get) => ({
  // --- Onboarding ---
  onboardingAnswers: null,
  stressProfile: null,
  setOnboardingAnswers: (answers) => set({ onboardingAnswers: answers }),
  // --- User ---
  user: null,
  setUser: (user) => set({ user }),

  // --- Stress ---
  stressScore: 0,
  scanHistory: [],
  updateStressScore: (score) => {
    const state = get();
    const newHistory = [...state.scanHistory, score].slice(-10);
    set({ stressScore: score, scanHistory: newHistory });

    const { trigger, reason } = shouldTriggerSilentAlert(score, state.scanHistory);
    if (trigger && canSendSilentAlert() && state.user?.contacts?.length > 0) {
      markSilentAlertSent();
      sendSilentParentAlert({
        studentName: state.user.name || 'Student',
        contacts: state.user.contacts,
        triggerReason: reason,
        stressScore: score,
        timestamp: Date.now(),
      }).then((results) => {
        set((s) => ({
          silentAlertHistory: [
            ...s.silentAlertHistory,
            { id: Date.now().toString(), timestamp: Date.now(), stressScore: score, reason, results, silent: true },
          ],
        }));
      });
    }

    if (score >= 95 && state.user?.sosContacts) {
      const sosContacts = state.user.sosContacts;
      if (sosContacts.family?.phone || sosContacts.mentor?.phone) {
        set({ isSOSActive: true });
      }
    }

    // Auto-trigger stress buster when score >= 60
    if (score >= 60 && !state.stressBusterActive) {
      set({ stressBusterActive: true, stressBusterReason: `Stress detected at ${score}%` });
    }
  },

  // --- SOS ---
  isSOSActive: false,
  triggerSOS: () => set({ isSOSActive: true }),
  resolveSOS: () => set({ isSOSActive: false }),

  silentAlertHistory: [],

  // --- XP / Gamification ---
  xp: 0,
  addXP: (amount) => set((state) => ({ xp: state.xp + amount })),

  // --- Streaks ---
  dailyStreak: 0,
  lastActivityDate: null,
  updateStreak: () => {
    const state = get();
    const today = new Date().toDateString();
    if (state.lastActivityDate === today) return; // already counted
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = state.lastActivityDate === yesterday ? state.dailyStreak + 1 : 1;
    set({ dailyStreak: newStreak, lastActivityDate: today });
  },

  // --- Stress Buster System ---
  stressBusterActive: false,
  stressBusterReason: '',
  activitiesCompleted: 0,
  totalActivitiesCompleted: 0,

  triggerStressBuster: (reason) => set({ stressBusterActive: true, stressBusterReason: reason || 'Time for a stress break!' }),
  completeStressBuster: () => {
    const state = get();
    const newTotal = state.totalActivitiesCompleted + 1;
    set({
      stressBusterActive: false,
      stressBusterReason: '',
      activitiesCompleted: state.activitiesCompleted + 1,
      totalActivitiesCompleted: newTotal,
    });
    // Award XP
    state.addXP(30);
    // Update streak
    state.updateStreak();
    // Award coupon every 3 activities
    if (newTotal % 3 === 0) {
      const coupons = get().coupons;
      const newCoupon = generateCoupon(newTotal);
      set({ coupons: [...coupons, newCoupon] });
    }
  },

  // --- Coupon / Rewards System ---
  coupons: [],
  addCoupon: (coupon) => set((state) => ({ coupons: [...state.coupons, coupon] })),
  redeemCoupon: (couponId) => set((state) => ({
    coupons: state.coupons.map(c => c.id === couponId ? { ...c, redeemed: true, redeemedAt: Date.now() } : c),
  })),

  // --- Mood Journal ---
  moodEntries: [],
  addMoodEntry: (entry) => set((state) => ({
    moodEntries: [{ id: Date.now().toString(), timestamp: Date.now(), ...entry }, ...state.moodEntries].slice(0, 50),
  })),

  // --- Gratitude Wall ---
  gratitudeMessages: [
    { id: '1', text: 'Grateful for friends who check in on me 💙', author: 'Anonymous', likes: 23, timestamp: Date.now() - 3600000 },
    { id: '2', text: 'The sunset today reminded me that beauty exists even on hard days 🌅', author: 'Anonymous', likes: 45, timestamp: Date.now() - 7200000 },
    { id: '3', text: 'My professor extended the deadline — small acts of kindness matter ✨', author: 'Anonymous', likes: 67, timestamp: Date.now() - 14400000 },
    { id: '4', text: 'I finally asked for help and it felt amazing 🌿', author: 'Anonymous', likes: 89, timestamp: Date.now() - 28800000 },
  ],
  addGratitude: (text) => set((state) => ({
    gratitudeMessages: [
      { id: Date.now().toString(), text, author: 'You', likes: 0, timestamp: Date.now() },
      ...state.gratitudeMessages,
    ],
  })),
  likeGratitude: (id) => set((state) => ({
    gratitudeMessages: state.gratitudeMessages.map(m =>
      m.id === id ? { ...m, likes: m.likes + 1 } : m
    ),
  })),

  // --- Emotion detection ---
  currentEmotion: { emotion: "neutral", confidence: 0 },
  setCurrentEmotion: ({ emotion, confidence }) => {
    set({ currentEmotion: { emotion, confidence } });
    const dangerous = ["sad", "angry", "fearful"].includes(emotion);
    if (dangerous && confidence > 0.6) {
      const now = Date.now();
      const last = get()._lastAlertTime ?? 0;
      if (now - last > 10000) {
        sendSilentParentAlert({ emotion, confidence, timestamp: now, userId: get().user?.id }).then(() => {});
        set({ _lastAlertTime: now });
      }
    }
  },
  _lastAlertTime: 0,
}));

// --- Coupon Generator ---
function generateCoupon(activityCount) {
  const COUPON_TYPES = [
    { type: 'canteen', emoji: '🍽️', title: 'Canteen Food Coupon', desc: '₹50 off on any canteen meal', color: '#FEE2E2', textColor: '#B91C1C' },
    { type: 'coffee', emoji: '☕', title: 'Free Coffee Coupon', desc: 'One free coffee/tea at college café', color: '#FEF3C7', textColor: '#B45309' },
    { type: 'stationery', emoji: '📝', title: 'Stationery Coupon', desc: '₹30 off on pens, notebooks, etc.', color: '#DBEAFE', textColor: '#1D4ED8' },
    { type: 'bookstore', emoji: '📚', title: 'Bookstore Coupon', desc: '₹100 off on any book purchase', color: '#D1FAE5', textColor: '#065F46' },
    { type: 'print', emoji: '🖨️', title: 'Free Printing Coupon', desc: '20 free pages at print center', color: '#E0E7FF', textColor: '#4338CA' },
    { type: 'snack', emoji: '🍫', title: 'Snack Pack Coupon', desc: 'Free snack combo at canteen', color: '#FECDD3', textColor: '#9F1239' },
  ];

  const coupon = COUPON_TYPES[activityCount % COUPON_TYPES.length];
  const code = `ME-${coupon.type.toUpperCase().slice(0, 3)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return {
    id: Date.now().toString(),
    ...coupon,
    code,
    redeemed: false,
    redeemedAt: null,
    earnedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}
