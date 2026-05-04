import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Heart, MessageCircle, Shield, Users, BookOpen } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useStore } from '../store/useStore';

// College-specific community data
const COLLEGE_COMMUNITIES = {
  'IIT Delhi': {
    mentors: [
      { name: 'Prof. Aarav Sharma', role: 'Psychology Counselor', online: true, emoji: '👨‍🏫' },
      { name: 'Dr. Priya Kapoor', role: 'Student Wellness Head', online: false, emoji: '👩‍⚕️' },
      { name: 'Ms. Ria Verma', role: 'Peer Mentor', online: true, emoji: '🧑‍🎓' },
    ],
    posts: [
      { id: '1', tag: 'Exam Stress', author: 'Anonymous Student', content: 'JEE prep flashbacks during endsems are real. Anyone else feeling this?', likes: 42, replies: 15, mentorReply: "Remember: your worth isn't defined by a grade. Come talk to us at the counseling center, Room 302. — Prof. Sharma" },
      { id: '2', tag: 'Burnout', author: 'Anonymous', content: "Haven't slept properly in 3 days because of lab submissions. Is this normal?", likes: 89, replies: 22, mentorReply: 'This is NOT healthy. Please prioritize sleep over grades. Visit our wellness hour (Mon-Fri 4-6pm). — Dr. Kapoor' },
    ],
  },
  'IIT Bombay': {
    mentors: [
      { name: 'Dr. Meera Nair', role: 'Mental Health Coordinator', online: true, emoji: '👩‍⚕️' },
      { name: 'Prof. Raj Deshmukh', role: 'Student Mentor', online: true, emoji: '👨‍🏫' },
    ],
    posts: [
      { id: '1', tag: 'Motivation', author: 'Anonymous', content: "Feeling like everyone else has it figured out except me. Imposter syndrome is real here.", likes: 134, replies: 28, mentorReply: 'You belong here. Every single one of you earned your spot. DM me anytime. — Dr. Nair' },
    ],
  },
  'default': {
    mentors: [
      { name: 'Campus Counselor', role: 'General Wellness', online: true, emoji: '👨‍⚕️' },
      { name: 'Peer Mentor', role: 'Student Support', online: false, emoji: '🧑‍🎓' },
      { name: 'Dr. Wellness', role: 'Mental Health', online: true, emoji: '👩‍⚕️' },
    ],
    posts: [
      { id: '1', tag: 'General', author: 'Anonymous Student', content: "Anyone else feeling completely overwhelmed by the upcoming midterms? How are you coping?", likes: 24, replies: 8, mentorReply: null },
      { id: '2', tag: 'Motivation', author: 'Anonymous', content: "Just a reminder that your grades don't define your worth. Take a break if you need it today! 🌟", likes: 156, replies: 12, mentorReply: null },
      { id: '3', tag: 'Burnout', author: 'Anonymous', content: 'I slept for 12 hours straight this weekend and still feel tired. Is this burnout?', likes: 89, replies: 34, mentorReply: 'It could be. Persistent fatigue despite sleep is a sign of mental exhaustion. Consider speaking with a counselor. — Campus Counselor' },
    ],
  },
};

function getCollegeData(collegeName) {
  if (!collegeName) return COLLEGE_COMMUNITIES['default'];
  for (const key of Object.keys(COLLEGE_COMMUNITIES)) {
    if (key === 'default') continue;
    if (collegeName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(collegeName.toLowerCase())) {
      return COLLEGE_COMMUNITIES[key];
    }
  }
  return COLLEGE_COMMUNITIES['default'];
}

export default function CommunityScreen({ navigation }) {
  const user = useStore(state => state.user);
  const addXP = useStore(state => state.addXP);

  const collegeName = user?.college || 'University';
  const collegeData = getCollegeData(collegeName);

  const [activeTopic, setActiveTopic] = useState('All');
  const [newPostText, setNewPostText] = useState('');
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [localPosts, setLocalPosts] = useState(collegeData.posts);

  const topics = ['All', 'Exam Stress', 'Burnout', 'Motivation', 'General', 'Mentor Advice'];

  const topicColors = {
    'Exam Stress': { bg: '#FEE2E2', text: '#B91C1C' },
    'Burnout': { bg: '#FEF3C7', text: '#B45309' },
    'Motivation': { bg: '#D1FAE5', text: '#065F46' },
    'General': { bg: '#DBEAFE', text: '#1D4ED8' },
    'Mentor Advice': { bg: '#E0E7FF', text: '#4338CA' },
  };

  const filteredPosts = activeTopic === 'All'
    ? localPosts
    : activeTopic === 'Mentor Advice'
      ? localPosts.filter(p => p.mentorReply)
      : localPosts.filter(p => p.tag === activeTopic);

  const handlePost = () => {
    if (!newPostText.trim()) return;
    if (user?.isGuest) {
      alert('Sign up to post in the community. Guest mode has limited features.');
      return;
    }
    const newPost = {
      id: Date.now().toString(),
      tag: activeTopic === 'All' || activeTopic === 'Mentor Advice' ? 'General' : activeTopic,
      author: 'You (Anonymous)',
      content: newPostText.trim(),
      likes: 0,
      replies: 0,
      mentorReply: null,
    };
    setLocalPosts(prev => [newPost, ...prev]);
    setNewPostText('');
    addXP(15);
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>College Community</Text>
            <Text style={s.headerCollege}>🎓 {collegeName}</Text>
          </View>
          <View style={s.verifiedBadge}>
            <Shield color="white" size={14} />
            <Text style={s.verifiedText}>Verified</Text>
          </View>
        </View>
        <Text style={s.headerDesc}>Anonymous · Safe · College-specific support</Text>
      </View>

      {/* Online Mentors Bar */}
      <View style={s.mentorBar}>
        <Text style={s.mentorBarTitle}>Available Mentors</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
          {collegeData.mentors.map((mentor, i) => (
            <TouchableOpacity key={i} style={s.mentorChip} onPress={() => { setSelectedMentor(mentor); setShowMentorModal(true); }}>
              <View style={s.mentorAvatarWrap}>
                <Text style={{ fontSize: 22 }}>{mentor.emoji}</Text>
                {mentor.online && <View style={s.onlineDot} />}
              </View>
              <View style={{ maxWidth: 100 }}>
                <Text style={s.mentorName} numberOfLines={1}>{mentor.name}</Text>
                <Text style={s.mentorRole}>{mentor.role}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Topics */}
      <View style={s.topicRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {topics.map((topic, i) => (
            <TouchableOpacity key={i}
              style={[s.topicChip, activeTopic === topic && s.activeTopicChip]}
              onPress={() => setActiveTopic(topic)}>
              <Text style={[s.topicText, activeTopic === topic && s.activeTopicText]}>{topic}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={s.postList} showsVerticalScrollIndicator={false}>
        {/* Create Post */}
        <View style={s.createCard}>
          <TextInput
            style={s.postInput}
            placeholder={`Share what's on your mind... (Anonymous to ${collegeName})`}
            placeholderTextColor="#9CA3AF"
            multiline
            value={newPostText}
            onChangeText={setNewPostText}
          />
          <View style={s.createFooter}>
            <Text style={s.privacyNote}>🔒 Posts are anonymous & visible only to your college</Text>
            <TouchableOpacity style={[s.postBtn, !newPostText.trim() && s.postBtnDisabled]} onPress={handlePost} disabled={!newPostText.trim()}>
              <Text style={s.postBtnText}>Post (+15 XP)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts */}
        {filteredPosts.map(post => {
          const tc = topicColors[post.tag] || topicColors['General'];
          return (
            <View key={post.id} style={s.postCard}>
              <View style={s.postHeader}>
                <View style={[s.postTag, { backgroundColor: tc.bg }]}>
                  <Text style={[s.postTagText, { color: tc.text }]}>{post.tag}</Text>
                </View>
                <Text style={s.postAuthor}>{post.author}</Text>
              </View>
              <Text style={s.postContent}>{post.content}</Text>

              {post.mentorReply && (
                <View style={s.mentorReplyBox}>
                  <View style={s.mentorReplyHeader}>
                    <BookOpen color="#1D9E75" size={14} />
                    <Text style={s.mentorReplyLabel}>Mentor Response</Text>
                  </View>
                  <Text style={s.mentorReplyText}>{post.mentorReply}</Text>
                </View>
              )}

              <View style={s.postActions}>
                <TouchableOpacity style={s.actionBtn}>
                  <Text style={{ fontSize: 16 }}>❤️</Text>
                  <Text style={s.actionCount}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn}>
                  <Text style={{ fontSize: 16 }}>💬</Text>
                  <Text style={s.actionCount}>{post.replies}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn}>
                  <Text style={{ fontSize: 16 }}>📤</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filteredPosts.length === 0 && (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={s.emptyTitle}>No posts in this category yet</Text>
            <Text style={s.emptyHint}>Be the first to share!</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Mentor Modal */}
      <Modal visible={showMentorModal} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContent}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>{selectedMentor?.emoji}</Text>
            <Text style={s.modalTitle}>{selectedMentor?.name}</Text>
            <Text style={s.modalRole}>{selectedMentor?.role} · {collegeName}</Text>

            {selectedMentor?.online ? (
              <>
                <View style={s.modalOnlineBadge}>
                  <View style={s.onlineDot2} />
                  <Text style={s.modalOnlineText}>Online now</Text>
                </View>
                <Text style={s.modalDesc}>This mentor is available for a confidential chat. Your privacy is protected.</Text>
                <TouchableOpacity style={s.modalPrimaryBtn} onPress={() => {
                  setShowMentorModal(false);
                  addXP(10);
                  navigation?.navigate?.('Main', { screen: 'Chat' });
                }}>
                  <Text style={s.modalPrimaryText}>💬 Start Confidential Chat</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={s.modalDesc}>This mentor is currently offline. You can leave a message and they'll respond when available.</Text>
            )}

            <TouchableOpacity onPress={() => setShowMentorModal(false)}>
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

  // Header
  header: { backgroundColor: '#7F77DD', paddingTop: 18, paddingBottom: 22, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  headerCollege: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  verifiedText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  headerDesc: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  // Mentors
  mentorBar: { backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  mentorBarTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 10, letterSpacing: 0.5 },
  mentorChip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  mentorAvatarWrap: { position: 'relative' },
  onlineDot: { position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', borderWidth: 2, borderColor: 'white' },
  mentorName: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  mentorRole: { fontSize: 10, color: '#6B7280' },

  // Topics
  topicRow: { backgroundColor: 'white', paddingVertical: 10, paddingHorizontal: 12 },
  topicChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  activeTopicChip: { backgroundColor: '#7F77DD' },
  topicText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  activeTopicText: { color: 'white' },

  // Posts
  postList: { padding: 16 },
  createCard: { backgroundColor: 'white', padding: 16, borderRadius: 18, marginBottom: 16, elevation: 2 },
  postInput: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, minHeight: 80, textAlignVertical: 'top', fontSize: 15, color: '#1A1A1A' },
  createFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  privacyNote: { fontSize: 10, color: '#9CA3AF', flex: 1, marginRight: 10 },
  postBtn: { backgroundColor: '#7F77DD', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  postBtnDisabled: { backgroundColor: '#D1D5DB' },
  postBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },

  postCard: { backgroundColor: 'white', padding: 18, borderRadius: 18, marginBottom: 14, elevation: 1 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  postTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  postTagText: { fontSize: 11, fontWeight: 'bold' },
  postAuthor: { color: '#9CA3AF', fontSize: 11 },
  postContent: { fontSize: 15, lineHeight: 22, color: '#1A1A1A', marginBottom: 12 },

  // Mentor Reply
  mentorReplyBox: { backgroundColor: '#F0FDF9', padding: 14, borderRadius: 14, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#1D9E75' },
  mentorReplyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  mentorReplyLabel: { fontSize: 11, fontWeight: 'bold', color: '#1D9E75' },
  mentorReplyText: { fontSize: 13, lineHeight: 19, color: '#374151', fontStyle: 'italic' },

  postActions: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { color: '#6B7280', fontWeight: '600', fontSize: 13 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#6B7280' },
  emptyHint: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 28, borderRadius: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  modalRole: { fontSize: 13, color: '#7F77DD', fontWeight: '600', marginBottom: 12 },
  modalOnlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D1FAE5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, marginBottom: 14 },
  onlineDot2: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  modalOnlineText: { fontSize: 12, fontWeight: 'bold', color: '#065F46' },
  modalDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  modalPrimaryBtn: { backgroundColor: '#7F77DD', width: '100%', padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  modalPrimaryText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  modalClose: { color: '#6B7280', fontWeight: 'bold', fontSize: 15, padding: 10 },
});
