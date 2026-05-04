import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

export default function RewardsScreen({ navigation }) {
  const { coupons, redeemCoupon, xp, dailyStreak, totalActivitiesCompleted, moodEntries, gratitudeMessages, addGratitude, likeGratitude, addMoodEntry, addXP } = useStore();
  const [tab, setTab] = useState('coupons');
  const [showCoupon, setShowCoupon] = useState(null);
  const [gratText, setGratText] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [journalText, setJournalText] = useState('');

  const activeCoupons = coupons.filter(c => !c.redeemed && c.expiresAt > Date.now());
  const redeemedCoupons = coupons.filter(c => c.redeemed);
  const level = Math.floor(xp / 100) + 1;

  const moods = [
    { emoji: '😄', label: 'Great', color: '#10B981' },
    { emoji: '😊', label: 'Good', color: '#4ADE80' },
    { emoji: '😐', label: 'Okay', color: '#F59E0B' },
    { emoji: '😔', label: 'Low', color: '#3B82F6' },
    { emoji: '😢', label: 'Sad', color: '#8B5CF6' },
    { emoji: '😠', label: 'Angry', color: '#EF4444' },
  ];

  const handleMoodLog = () => {
    if (selectedMood === null) return;
    addMoodEntry({ mood: moods[selectedMood].label, emoji: moods[selectedMood].emoji, note: journalText });
    addXP(5);
    setSelectedMood(null);
    setJournalText('');
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Rewards & Wellness</Text>
        <Text style={s.headerSub}>Activities: {totalActivitiesCompleted} · Streak: {dailyStreak}🔥 · Level {level}</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {['coupons', 'journal', 'gratitude'].map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.activeTab]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.activeTabText]}>
              {t === 'coupons' ? '🎁 Coupons' : t === 'journal' ? '📓 Journal' : '🙏 Gratitude'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* COUPONS TAB */}
        {tab === 'coupons' && (
          <>
            {/* Stats */}
            <View style={s.statsRow}>
              <View style={s.statCard}><Text style={s.statNum}>{totalActivitiesCompleted}</Text><Text style={s.statLabel}>Activities</Text></View>
              <View style={s.statCard}><Text style={s.statNum}>{activeCoupons.length}</Text><Text style={s.statLabel}>Active Coupons</Text></View>
              <View style={s.statCard}><Text style={s.statNum}>{3 - (totalActivitiesCompleted % 3 || 3)}</Text><Text style={s.statLabel}>Until Next</Text></View>
            </View>

            {/* Trigger Stress Buster */}
            <TouchableOpacity style={s.triggerBtn} onPress={() => navigation.navigate('StressBuster', { reason: 'Self-initiated stress buster 💪' })}>
              <Text style={{ fontSize: 28 }}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.triggerTitle}>Start Stress Buster</Text>
                <Text style={s.triggerSub}>Earn +30 XP + coupon every 3 activities</Text>
              </View>
              <Text style={s.triggerArrow}>›</Text>
            </TouchableOpacity>

            {/* Active Coupons */}
            <Text style={s.sectionTitle}>ACTIVE COUPONS</Text>
            {activeCoupons.length === 0 ? (
              <View style={s.emptyCard}><Text style={s.emptyEmoji}>🎁</Text><Text style={s.emptyText}>Complete 3 stress buster activities to earn your first coupon!</Text></View>
            ) : activeCoupons.map(c => (
              <TouchableOpacity key={c.id} style={[s.couponCard, { borderLeftColor: c.textColor }]} onPress={() => setShowCoupon(c)}>
                <Text style={{ fontSize: 28 }}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.couponTitle}>{c.title}</Text>
                  <Text style={s.couponDesc}>{c.desc}</Text>
                  <Text style={s.couponExpiry}>Expires: {new Date(c.expiresAt).toLocaleDateString()}</Text>
                </View>
                <View style={[s.couponCodeBadge, { backgroundColor: c.color }]}>
                  <Text style={[s.couponCodeText, { color: c.textColor }]}>{c.code}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {redeemedCoupons.length > 0 && (
              <>
                <Text style={s.sectionTitle}>REDEEMED</Text>
                {redeemedCoupons.map(c => (
                  <View key={c.id} style={[s.couponCard, { opacity: 0.5 }]}>
                    <Text style={{ fontSize: 28 }}>{c.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.couponTitle}>{c.title}</Text>
                      <Text style={s.couponDesc}>Used on {new Date(c.redeemedAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={s.redeemedBadge}>✓ Used</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* JOURNAL TAB */}
        {tab === 'journal' && (
          <>
            <View style={s.journalEntry}>
              <Text style={s.journalTitle}>How are you feeling right now?</Text>
              <View style={s.moodRow}>
                {moods.map((m, i) => (
                  <TouchableOpacity key={i} style={[s.moodBtn, selectedMood === i && { backgroundColor: m.color + '25', borderColor: m.color }]} onPress={() => setSelectedMood(i)}>
                    <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
                    <Text style={[s.moodLabel, selectedMood === i && { color: m.color }]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedMood !== null && (
                <>
                  <Text style={s.journalPrompt}>Want to add a note? (Optional)</Text>
                  <View style={s.journalInputWrap}>
                    <Text style={s.journalInputPlaceholder}>{journalText ? '' : 'Write about your day...'}</Text>
                    <View style={s.journalInput}>
                      <Text style={{ fontSize: 15, color: '#1A1A1A', minHeight: 60 }}
                        onPress={() => {/* TextInput needed */}}>{journalText || ''}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={s.logBtn} onPress={handleMoodLog}>
                    <Text style={s.logBtnText}>Log Mood (+5 XP)</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <Text style={s.sectionTitle}>MOOD HISTORY</Text>
            {moodEntries.length === 0 ? (
              <View style={s.emptyCard}><Text style={s.emptyEmoji}>📓</Text><Text style={s.emptyText}>Log your first mood to start tracking!</Text></View>
            ) : moodEntries.slice(0, 10).map(entry => (
              <View key={entry.id} style={s.moodHistoryCard}>
                <Text style={{ fontSize: 24 }}>{entry.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.moodHistoryLabel}>{entry.mood}</Text>
                  <Text style={s.moodHistoryTime}>{new Date(entry.timestamp).toLocaleString()}</Text>
                  {entry.note ? <Text style={s.moodHistoryNote}>{entry.note}</Text> : null}
                </View>
              </View>
            ))}
          </>
        )}

        {/* GRATITUDE TAB */}
        {tab === 'gratitude' && (
          <>
            <View style={s.gratInput}>
              <Text style={s.gratPrompt}>What are you grateful for today? 🌿</Text>
              <View style={s.gratInputBox}>
                <Text style={{ fontSize: 15, color: gratText ? '#1A1A1A' : '#9CA3AF', minHeight: 40 }}
                  onPress={() => {}}>{gratText || 'Share something positive...'}</Text>
              </View>
              <TouchableOpacity style={[s.logBtn, !gratText.trim() && { backgroundColor: '#D1D5DB' }]}
                onPress={() => { if (gratText.trim()) { addGratitude(gratText.trim()); setGratText(''); addXP(10); } }}
                disabled={!gratText.trim()}>
                <Text style={s.logBtnText}>Share (+10 XP)</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.sectionTitle}>GRATITUDE WALL 🙏</Text>
            {gratitudeMessages.map(msg => (
              <View key={msg.id} style={s.gratCard}>
                <Text style={s.gratText}>{msg.text}</Text>
                <View style={s.gratFooter}>
                  <Text style={s.gratAuthor}>{msg.author}</Text>
                  <TouchableOpacity style={s.likeBtn} onPress={() => likeGratitude(msg.id)}>
                    <Text style={s.likeText}>❤️ {msg.likes}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Coupon Detail Modal */}
      <Modal visible={!!showCoupon} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={s.modalContent}>
            <Text style={{ fontSize: 50, marginBottom: 12 }}>{showCoupon?.emoji}</Text>
            <Text style={s.modalTitle}>{showCoupon?.title}</Text>
            <Text style={s.modalDesc}>{showCoupon?.desc}</Text>
            <View style={[s.modalCodeBox, { backgroundColor: showCoupon?.color }]}>
              <Text style={[s.modalCode, { color: showCoupon?.textColor }]}>{showCoupon?.code}</Text>
            </View>
            <Text style={s.modalExpiry}>Valid until {showCoupon ? new Date(showCoupon.expiresAt).toLocaleDateString() : ''}</Text>
            <TouchableOpacity style={s.redeemBtn} onPress={() => { redeemCoupon(showCoupon.id); setShowCoupon(null); }}>
              <Text style={s.redeemBtnText}>✓ Mark as Redeemed</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCoupon(null)}>
              <Text style={s.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  header: { backgroundColor: '#B45309', paddingTop: 16, paddingBottom: 22, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  backText: { color: 'white', fontSize: 20, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  tabs: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 16, marginTop: -14, borderRadius: 14, padding: 4, elevation: 3 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FEF3C7' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: '#B45309' },

  scroll: { padding: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 1, marginTop: 20, marginBottom: 10 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },

  triggerBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#7F77DD', padding: 18, borderRadius: 18, marginBottom: 10, elevation: 2 },
  triggerTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  triggerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  triggerArrow: { color: 'white', fontSize: 28 },

  couponCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 10, elevation: 1, borderLeftWidth: 4 },
  couponTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },
  couponDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  couponExpiry: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  couponCodeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  couponCodeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  redeemedBadge: { fontSize: 12, fontWeight: 'bold', color: '#10B981' },

  emptyCard: { backgroundColor: 'white', padding: 30, borderRadius: 18, alignItems: 'center', elevation: 1 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

  // Journal
  journalEntry: { backgroundColor: 'white', padding: 20, borderRadius: 18, elevation: 2, marginBottom: 10 },
  journalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 14 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  moodBtn: { alignItems: 'center', padding: 8, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB', flex: 1 },
  moodLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280', marginTop: 4 },
  journalPrompt: { fontSize: 13, color: '#6B7280', marginTop: 16, marginBottom: 8 },
  journalInputWrap: { position: 'relative' },
  journalInputPlaceholder: { position: 'absolute', top: 14, left: 14, color: '#9CA3AF', fontSize: 15 },
  journalInput: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  logBtn: { backgroundColor: '#1D9E75', padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  logBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  moodHistoryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 14, borderRadius: 14, marginBottom: 8, elevation: 1 },
  moodHistoryLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  moodHistoryTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  moodHistoryNote: { fontSize: 13, color: '#374151', marginTop: 4, fontStyle: 'italic' },

  // Gratitude
  gratInput: { backgroundColor: 'white', padding: 20, borderRadius: 18, elevation: 2, marginBottom: 10 },
  gratPrompt: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 12 },
  gratInputBox: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  gratCard: { backgroundColor: 'white', padding: 18, borderRadius: 16, marginBottom: 10, elevation: 1, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  gratText: { fontSize: 15, lineHeight: 22, color: '#1A1A1A', marginBottom: 10 },
  gratFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gratAuthor: { fontSize: 12, color: '#9CA3AF' },
  likeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#FEE2E2' },
  likeText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 28, borderRadius: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 6 },
  modalDesc: { fontSize: 14, color: '#6B7280', marginBottom: 18, textAlign: 'center' },
  modalCodeBox: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginBottom: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(0,0,0,0.1)' },
  modalCode: { fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  modalExpiry: { fontSize: 12, color: '#9CA3AF', marginBottom: 20 },
  redeemBtn: { backgroundColor: '#1D9E75', width: '100%', padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  redeemBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalClose: { color: '#6B7280', fontWeight: 'bold', fontSize: 15, padding: 10 },
});
