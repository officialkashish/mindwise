import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

const MOODS = [
  { emoji: '😄', label: 'Great', color: '#fbbf24' },
  { emoji: '😊', label: 'Good', color: '#4ade80' },
  { emoji: '😐', label: 'Okay', color: '#9d9ab0' },
  { emoji: '🥺', label: 'Low', color: '#60a5fa' },
  { emoji: '😢', label: 'Sad', color: '#818cf8' },
  { emoji: '😠', label: 'Angry', color: '#f87171' },
];

const BADGES = [
  { emoji: '🌟', label: 'First Scan', earned: true },
  { emoji: '🔥', label: '3-Day Streak', earned: true },
  { emoji: '💬', label: 'Chat Star', earned: true },
  { emoji: '🧘', label: 'Zen Master', earned: true },
  { emoji: '🏆', label: 'Top Helper', earned: false },
  { emoji: '❓', label: 'Locked', earned: false },
];

export default function ProfileScreen({ navigation }) {
  const user = useStore(state => state.user);
  const xp = useStore(state => state.xp);
  const setUser = useStore(state => state.setUser);
  const coupons = useStore(state => state.coupons);

  const [selectedMood, setSelectedMood] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    familyName: user?.sosContacts?.family?.name || '',
    familyPhone: user?.sosContacts?.family?.phone || '',
    mentorName: user?.sosContacts?.mentor?.name || '',
    mentorPhone: user?.sosContacts?.mentor?.phone || '',
  });
  const [toggles, setToggles] = useState({
    highStress: true,
    elevatedHR: true,
    sleepDeficit: false,
    manualSOS: true,
    lowActivityHighStress: true,
  });

  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const xpToNext = 100;
  const levelTitle = level <= 2 ? 'Newcomer' : level <= 4 ? 'Supporter' : level <= 6 ? 'Champion' : 'Wellness Hero';

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const toggleSwitch = (key) => {
    if (key === 'manualSOS') return;
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveContacts = () => {
    const updatedUser = {
      ...user,
      sosContacts: {
        family: { name: editData.familyName, phone: editData.familyPhone },
        mentor: { name: editData.mentorName, phone: editData.mentorPhone },
      },
      contacts: [editData.familyPhone, editData.mentorPhone].filter(Boolean),
    };
    setUser(updatedUser);
    setShowEditModal(false);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Gradient Header */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.greetText}>{greeting} 🌤</Text>
              <Text style={s.nameText}>Hey, {user?.name || 'Student'} 👋</Text>
            </View>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
            </View>
          </View>

          {/* Mood Check-in */}
          <View style={s.moodRow}>
            <Text style={s.moodLabel}>How are you feeling?</Text>
            <View style={s.moodPicker}>
              {MOODS.map((m, i) => (
                <TouchableOpacity key={i}
                  style={[s.moodBtn, selectedMood === i && { backgroundColor: 'rgba(255,255,255,0.35)', transform: [{ scale: 1.15 }] }]}
                  onPress={() => setSelectedMood(i)}>
                  <Text style={s.moodEmoji}>{m.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Instant Help Banner */}
        <TouchableOpacity style={s.sosCard} onPress={() => navigation.navigate('Emergency')} activeOpacity={0.85}>
          <View style={s.sosBadge}><Text style={s.sosBadgeText}>SOS</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.sosTitle}>Instant Help</Text>
            <Text style={s.sosSub}>Connect with a mentor right now</Text>
          </View>
          <Text style={s.sosArrow}>›</Text>
        </TouchableOpacity>

        {/* XP Progress */}
        <View style={s.xpCard}>
          <View style={s.xpHeader}>
            <Text style={s.xpTitle}>Your Progress</Text>
            <View style={s.xpBadge}><Text style={s.xpBadgeText}>⭐ {xp} XP</Text></View>
          </View>
          <Text style={s.xpLevel}>Level {level} — {levelTitle} · {xpInLevel} XP to Level {level + 1}</Text>
          <View style={s.xpTrack}>
            <View style={[s.xpFill, { width: `${(xpInLevel / xpToNext) * 100}%` }]} />
          </View>

          {/* Badges */}
          <View style={s.badgeRow}>
            {BADGES.map((b, i) => (
              <View key={i} style={[s.badgeItem, !b.earned && s.badgeLocked]}>
                <Text style={s.badgeEmoji}>{b.emoji}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Access Grid */}
        <Text style={s.sectionTitle}>QUICK ACCESS</Text>
        <View style={s.quickGrid}>
          <TouchableOpacity style={[s.quickCard, { borderLeftColor: '#1D9E75' }]}
            onPress={() => navigation.navigate('Chat')}>
            <Text style={s.quickIcon}>🤖</Text>
            <Text style={s.quickLabel}>AI Chatbot</Text>
            <Text style={s.quickSub}>Talk to Milo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.quickCard, { borderLeftColor: '#7F77DD' }]}
            onPress={() => navigation.navigate('Main', { screen: 'Community' })}>
            <Text style={s.quickIcon}>👥</Text>
            <Text style={s.quickLabel}>Community</Text>
            <Text style={s.quickSub}>12 new posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.quickCard, { borderLeftColor: '#BA7517' }]}
            onPress={() => navigation.navigate('LiveSessions')}>
            <Text style={s.quickIcon}>🎓</Text>
            <Text style={s.quickLabel}>Live Sessions</Text>
            <Text style={s.quickSub}>1 live now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.quickCard, { borderLeftColor: '#D85A30' }]}
            onPress={() => navigation.navigate('LiveSessions')}>
            <Text style={s.quickIcon}>🏆</Text>
            <Text style={s.quickLabel}>Leaderboard</Text>
            <Text style={s.quickSub}>Rank #{Math.max(1, 15 - level)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.quickCard, { borderLeftColor: '#EF4444' }]}
            onPress={() => navigation.navigate('StressBuster', { reason: 'Self-initiated stress buster 💪' })}>
            <Text style={s.quickIcon}>🎯</Text>
            <Text style={s.quickLabel}>Stress Buster</Text>
            <Text style={s.quickSub}>Earn XP + Coupons</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.quickCard, { borderLeftColor: '#B45309' }]}
            onPress={() => navigation.navigate('Rewards')}>
            <Text style={s.quickIcon}>🎁</Text>
            <Text style={s.quickLabel}>Rewards</Text>
            <Text style={s.quickSub}>{coupons.length} coupons</Text>
          </TouchableOpacity>
        </View>

        {/* SOS Contacts */}
        <View style={s.contactsCard}>
          <View style={s.contactsHeader}>
            <Text style={s.contactsTitle}>🛡️ Safety Network</Text>
            <TouchableOpacity onPress={() => setShowEditModal(true)}>
              <Text style={s.editLink}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>

          {user?.sosContacts?.family?.phone ? (
            <View style={s.contactRow}>
              <View style={[s.contactDot, { backgroundColor: '#EF4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.contactName}>{user.sosContacts.family.name}</Text>
                <Text style={s.contactPhone}>{user.sosContacts.family.phone}</Text>
              </View>
              <Text style={s.contactTag}>Family</Text>
            </View>
          ) : null}

          {user?.sosContacts?.mentor?.phone ? (
            <View style={s.contactRow}>
              <View style={[s.contactDot, { backgroundColor: '#3B82F6' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.contactName}>{user.sosContacts.mentor.name}</Text>
                <Text style={s.contactPhone}>{user.sosContacts.mentor.phone}</Text>
              </View>
              <Text style={s.contactTag}>Mentor</Text>
            </View>
          ) : null}

          {!user?.sosContacts?.family?.phone && !user?.sosContacts?.mentor?.phone && (
            <Text style={s.noContacts}>No SOS contacts set. Tap Edit to add.</Text>
          )}
        </View>

        {/* Alert Settings */}
        <Text style={s.sectionTitle}>ALERT SETTINGS</Text>
        <View style={s.settingsCard}>
          {[
            { key: 'highStress', label: 'High Stress (>70)', emoji: '🧠' },
            { key: 'elevatedHR', label: 'Heart Rate > 110 BPM', emoji: '❤️' },
            { key: 'sleepDeficit', label: 'Sleep Deficit (<5hrs)', emoji: '🌙' },
            { key: 'manualSOS', label: 'Manual SOS Press', emoji: '🚨' },
            { key: 'lowActivityHighStress', label: 'Low Activity + Stress', emoji: '⚡' },
          ].map((item) => (
            <View key={item.key} style={s.toggleRow}>
              <Text style={s.toggleEmoji}>{item.emoji}</Text>
              <Text style={s.toggleLabel}>{item.label}</Text>
              <Switch
                value={toggles[item.key]}
                onValueChange={() => toggleSwitch(item.key)}
                trackColor={{ true: theme.colors.teal, false: '#E5E7EB' }}
                thumbColor="white"
                disabled={item.key === 'manualSOS'}
              />
            </View>
          ))}
        </View>

        {/* College Info */}
        <View style={s.collegeCard}>
          <Text style={s.collegeEmoji}>🎓</Text>
          <View>
            <Text style={s.collegeName}>{user?.college || 'University'}</Text>
            <Text style={s.collegeEmail}>{user?.email || 'student@test.com'}</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Edit Contacts Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Edit SOS Contacts</Text>

            <Text style={s.modalLabel}>👨‍👩‍👧 Trusted Family Member</Text>
            <TextInput style={s.modalInput} placeholder="Name" value={editData.familyName}
              onChangeText={t => setEditData(p => ({ ...p, familyName: t }))} />
            <TextInput style={s.modalInput} placeholder="Phone Number" keyboardType="phone-pad"
              value={editData.familyPhone} onChangeText={t => setEditData(p => ({ ...p, familyPhone: t }))} />

            <Text style={[s.modalLabel, { marginTop: 14 }]}>🎓 Trusted Mentor</Text>
            <TextInput style={s.modalInput} placeholder="Name" value={editData.mentorName}
              onChangeText={t => setEditData(p => ({ ...p, mentorName: t }))} />
            <TextInput style={s.modalInput} placeholder="Phone Number" keyboardType="phone-pad"
              value={editData.mentorPhone} onChangeText={t => setEditData(p => ({ ...p, mentorPhone: t }))} />

            <View style={s.modalActions}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={s.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtn} onPress={handleSaveContacts}>
                <Text style={s.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { paddingBottom: 20 },

  // Header
  header: { backgroundColor: '#1D9E75', paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  greetText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  nameText: { fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  moodRow: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 14 },
  moodLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  moodPicker: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: { padding: 6, borderRadius: 12 },
  moodEmoji: { fontSize: 28 },

  // SOS Card
  sosCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', marginHorizontal: 16, marginTop: -14, borderRadius: 16, padding: 16, gap: 14, elevation: 4, shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  sosBadge: { backgroundColor: 'rgba(255,255,255,0.25)', width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sosBadgeText: { color: 'white', fontWeight: '900', fontSize: 12 },
  sosTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sosSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  sosArrow: { color: 'white', fontSize: 28, fontWeight: '300' },

  // XP Card
  xpCard: { backgroundColor: 'white', marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 18, elevation: 2 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  xpTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  xpBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  xpBadgeText: { fontSize: 13, fontWeight: 'bold', color: '#B45309' },
  xpLevel: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  xpTrack: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  xpFill: { height: '100%', backgroundColor: '#1D9E75', borderRadius: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badgeItem: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  badgeLocked: { backgroundColor: '#F3F4F6' },
  badgeEmoji: { fontSize: 20 },

  // Quick Access
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 1, marginHorizontal: 20, marginTop: 22, marginBottom: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  quickCard: { width: '47%', backgroundColor: 'white', borderRadius: 16, padding: 16, borderLeftWidth: 4, elevation: 1 },
  quickIcon: { fontSize: 28, marginBottom: 6 },
  quickLabel: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  quickSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  // Contacts
  contactsCard: { backgroundColor: 'white', marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 18, elevation: 1 },
  contactsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  contactsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  editLink: { fontSize: 13, color: theme.colors.teal, fontWeight: 'bold' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  contactDot: { width: 10, height: 10, borderRadius: 5 },
  contactName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  contactPhone: { fontSize: 12, color: '#6B7280' },
  contactTag: { fontSize: 11, fontWeight: '700', color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  noContacts: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 12 },

  // Settings
  settingsCard: { backgroundColor: 'white', marginHorizontal: 16, borderRadius: 18, padding: 14, elevation: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  toggleEmoji: { fontSize: 18, marginRight: 12 },
  toggleLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1A1A' },

  // College
  collegeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'white', marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 18, elevation: 1 },
  collegeEmoji: { fontSize: 32 },
  collegeName: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  collegeEmail: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 24, borderRadius: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 18 },
  modalLabel: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  modalInput: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10, fontSize: 15 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14, marginTop: 16 },
  modalCancel: { color: '#6B7280', fontWeight: 'bold', fontSize: 15, padding: 10 },
  modalSaveBtn: { backgroundColor: theme.colors.teal, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  modalSaveText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
