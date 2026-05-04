import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Users, Calendar, Star } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

export default function LiveSessionsScreen({ navigation }) {
  const addXP = useStore(state => state.addXP);
  const xp = useStore(state => state.xp);
  const user = useStore(state => state.user);
  const [activeTab, setActiveTab] = useState('live');

  const handleJoin = () => {
    addXP(25);
    alert('+25 XP! Joining session...');
  };

  const sessions = [
    { id: '1', title: 'Managing Pre-Exam Anxiety', host: 'Dr. Sarah Jenkins', attendees: 124, isLive: true, emoji: '😰', color: '#FEE2E2' },
    { id: '2', title: 'Meditation for Better Sleep', host: 'Mark T.', attendees: 89, isLive: true, emoji: '🧘', color: '#D1FAE5' },
    { id: '3', title: 'Building Healthy Study Habits', host: 'Prof. Davis', attendees: 45, time: 'Today, 6:00 PM', isLive: false, emoji: '📚', color: '#DBEAFE' },
    { id: '4', title: 'Dealing with Loneliness', host: 'Dr. Ananya Rao', attendees: 67, time: 'Tomorrow, 4:00 PM', isLive: false, emoji: '💙', color: '#E0E7FF' },
    { id: '5', title: 'Stress-Free Exam Prep', host: 'Prof. Mehta', attendees: 200, time: 'Fri, 5:00 PM', isLive: false, emoji: '🎯', color: '#FEF3C7' },
  ];

  const leaderboard = [
    { rank: 1, name: 'Alex M.', xp: 450, emoji: '🥇' },
    { rank: 2, name: 'Priya S.', xp: 380, emoji: '🥈' },
    { rank: 3, name: 'Rahul K.', xp: 310, emoji: '🥉' },
    { rank: 4, name: 'Sara L.', xp: 260, emoji: '4' },
    { rank: 5, name: 'Dev P.', xp: 220, emoji: '5' },
  ];

  const filteredSessions = activeTab === 'live' 
    ? sessions.filter(s => s.isLive) 
    : sessions.filter(s => !s.isLive);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Live Mentorship & Leaderboard</Text>
        <Text style={s.headerSub}>Connect with experts and earn XP</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Leaderboard */}
        <View style={s.leaderCard}>
          <View style={s.leaderHeader}>
            <Star color="#F59E0B" size={22} fill="#F59E0B" />
            <Text style={s.leaderTitle}>Weekly Leaderboard</Text>
          </View>
          
          {leaderboard.map((p) => (
            <View key={p.rank} style={[s.rankRow, p.rank <= 3 && s.topRankRow]}>
              <Text style={s.rankEmoji}>{p.emoji}</Text>
              <Text style={s.rankName}>{p.name}</Text>
              <View style={s.rankXpBadge}>
                <Text style={s.rankXpText}>{p.xp} XP</Text>
              </View>
            </View>
          ))}

          {/* Your position */}
          <View style={s.yourRank}>
            <Text style={s.yourRankNum}>#{Math.max(1, 15 - Math.floor(xp / 50))}</Text>
            <Text style={s.yourRankName}>You ({user?.name || 'Student'})</Text>
            <View style={[s.rankXpBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[s.rankXpText, { color: '#B45309' }]}>{xp} XP</Text>
            </View>
          </View>

          <Text style={s.xpHint}>Attend sessions (+25), post (+15), scan (+10), chat (+5) to earn XP!</Text>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, activeTab === 'live' && s.activeTab]} onPress={() => setActiveTab('live')}>
            <View style={s.liveIndicator}><View style={s.liveDot} /></View>
            <Text style={[s.tabText, activeTab === 'live' && s.activeTabText]}>Live Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, activeTab === 'upcoming' && s.activeTab]} onPress={() => setActiveTab('upcoming')}>
            <Calendar color={activeTab === 'upcoming' ? '#1D9E75' : '#9CA3AF'} size={16} />
            <Text style={[s.tabText, activeTab === 'upcoming' && s.activeTabText]}>Upcoming</Text>
          </TouchableOpacity>
        </View>

        {/* Sessions */}
        {filteredSessions.map(session => (
          <View key={session.id} style={s.sessionCard}>
            <View style={[s.sessionIcon, { backgroundColor: session.color }]}>
              <Text style={{ fontSize: 28 }}>{session.emoji}</Text>
              {session.isLive && (
                <View style={s.liveBadge}>
                  <View style={s.liveBadgeDot} />
                  <Text style={s.liveBadgeText}>LIVE</Text>
                </View>
              )}
            </View>
            <View style={s.sessionInfo}>
              <Text style={s.sessionTitle}>{session.title}</Text>
              <Text style={s.sessionHost}>by {session.host}</Text>
              <View style={s.sessionMeta}>
                {session.isLive ? (
                  <View style={s.metaItem}>
                    <Users color="#6B7280" size={14} />
                    <Text style={s.metaText}>{session.attendees} watching</Text>
                  </View>
                ) : (
                  <View style={s.metaItem}>
                    <Calendar color="#6B7280" size={14} />
                    <Text style={s.metaText}>{session.time}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[s.joinBtn, !session.isLive && s.reminderBtn]}
                onPress={session.isLive ? handleJoin : () => alert('Reminder Set!')}
              >
                <Text style={[s.joinText, !session.isLive && s.reminderText]}>
                  {session.isLive ? '▶ Join Session (+25 XP)' : '🔔 Set Reminder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredSessions.length === 0 && (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={s.emptyText}>No {activeTab} sessions right now</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },

  header: { backgroundColor: '#7F77DD', paddingTop: 16, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  backText: { color: 'white', fontSize: 20, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  scroll: { padding: 16, paddingBottom: 30 },

  // Leaderboard
  leaderCard: { backgroundColor: 'white', padding: 18, borderRadius: 20, marginBottom: 20, elevation: 2, borderWidth: 1, borderColor: '#FEF3C7' },
  leaderHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  leaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#B45309' },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  topRankRow: { borderBottomColor: '#FEF3C7' },
  rankEmoji: { width: 32, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  rankName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  rankXpBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  rankXpText: { fontSize: 13, fontWeight: 'bold', color: '#1D9E75' },
  yourRank: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12, marginTop: 10 },
  yourRankNum: { width: 32, fontWeight: 'bold', color: '#B45309', fontSize: 14, textAlign: 'center' },
  yourRankName: { flex: 1, fontWeight: 'bold', color: '#B45309', fontSize: 14 },
  xpHint: { fontSize: 11, color: '#9CA3AF', marginTop: 14, textAlign: 'center', fontStyle: 'italic' },

  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 14, padding: 4, marginBottom: 16, elevation: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  activeTab: { backgroundColor: '#F0FDF9' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: '#1D9E75' },
  liveIndicator: { position: 'relative' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },

  // Sessions
  sessionCard: { backgroundColor: 'white', borderRadius: 18, overflow: 'hidden', marginBottom: 14, elevation: 1 },
  sessionIcon: { height: 100, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  liveBadge: { position: 'absolute', top: 10, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 5 },
  liveBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  sessionInfo: { padding: 16 },
  sessionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  sessionHost: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  sessionMeta: { marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#6B7280' },
  joinBtn: { backgroundColor: '#1D9E75', padding: 14, borderRadius: 12, alignItems: 'center' },
  joinText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  reminderBtn: { backgroundColor: '#F3F4F6' },
  reminderText: { color: '#1A1A1A' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
});
