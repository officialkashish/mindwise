import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Modal, Platform, Linking } from 'react-native';
import { Phone, AlertTriangle, Heart, Shield } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

const MENTORS = [
  { name: 'Dr. Sarah Jenkins', role: 'Psychologist', phone: '9876543210', online: true, emoji: '👩‍⚕️' },
  { name: 'Prof. Aarav Sharma', role: 'Counselor', phone: '9876543211', online: true, emoji: '👨‍🏫' },
  { name: 'Ms. Ria Verma', role: 'Peer Mentor', phone: '9876543212', online: true, emoji: '🧑‍🎓' },
  { name: 'Dr. Priya Kapoor', role: 'Wellness Head', phone: '9876543213', online: false, emoji: '👩‍⚕️' },
  { name: 'Mark T.', role: 'Meditation Coach', phone: '9876543214', online: false, emoji: '🧘' },
];

export default function EmergencyScreen({ navigation }) {
  const user = useStore(state => state.user);
  const triggerSOS = useStore(state => state.triggerSOS);
  const resolveSOS = useStore(state => state.resolveSOS);

  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showMentors, setShowMentors] = useState(false);

  const sosContacts = user?.sosContacts || { family: {}, mentor: {} };
  const hasFamilyContact = sosContacts.family?.phone;
  const hasMentorContact = sosContacts.mentor?.phone;
  const onlineMentors = MENTORS.filter(m => m.online);

  const makeCall = (phone) => {
    if (!phone) return;
    if (Platform.OS === 'web') {
      window.open(`tel:${phone}`, '_self');
    } else {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleSOS = () => {
    triggerSOS();
    setShowSOSModal(true);
    if (hasFamilyContact) {
      setTimeout(() => makeCall(sosContacts.family.phone), 3000);
    }
  };

  const handleResolved = () => {
    resolveSOS();
    setShowSOSModal(false);
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Red header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>You're not alone 💙</Text>
        <Text style={s.headerSub}>Help is here. Choose how you'd like support right now.</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Connect with Mentor — shows mentor list inline */}
        <TouchableOpacity style={s.actionCard} onPress={() => setShowMentors(!showMentors)} activeOpacity={0.85}>
          <View style={[s.actionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Text style={{ fontSize: 24 }}>📞</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.actionTitle}>Connect with Mentor Now</Text>
            <Text style={s.actionSub}>Available mentors · {onlineMentors.length} online</Text>
          </View>
          <Text style={{ fontSize: 18, color: '#6B7280' }}>{showMentors ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {/* Mentor List (expanded) */}
        {showMentors && (
          <View style={s.mentorList}>
            {MENTORS.map((mentor, i) => (
              <View key={i} style={s.mentorCard}>
                <View style={s.mentorInfo}>
                  <View style={s.mentorAvatarWrap}>
                    <Text style={{ fontSize: 26 }}>{mentor.emoji}</Text>
                    {mentor.online && <View style={s.onlineDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.mentorName}>{mentor.name}</Text>
                    <Text style={s.mentorRole}>{mentor.role}</Text>
                    <View style={[s.statusBadge, { backgroundColor: mentor.online ? '#D1FAE5' : '#F3F4F6' }]}>
                      <View style={[s.statusDot, { backgroundColor: mentor.online ? '#10B981' : '#9CA3AF' }]} />
                      <Text style={[s.statusText, { color: mentor.online ? '#065F46' : '#6B7280' }]}>
                        {mentor.online ? 'Online now' : 'Offline'}
                      </Text>
                    </View>
                  </View>
                </View>
                {mentor.online ? (
                  <TouchableOpacity style={s.callBtn} onPress={() => makeCall(mentor.phone)}>
                    <Phone color="white" size={18} />
                    <Text style={s.callBtnText}>Call</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={s.offlineBtn}>
                    <Text style={s.offlineBtnText}>Unavailable</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Alert Emergency Contacts */}
        <TouchableOpacity style={s.actionCard} onPress={handleSOS} activeOpacity={0.85}>
          <View style={[s.actionIcon, { backgroundColor: '#FEE2E2' }]}>
            <Text style={s.sosBadge}>SOS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.actionTitle}>Alert Emergency Contacts</Text>
            <Text style={s.actionSub}>Notify your {(user?.contacts?.length || 0)} saved contacts</Text>
          </View>
        </TouchableOpacity>

        {/* Talk to Milo */}
        <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Chat')} activeOpacity={0.85}>
          <View style={[s.actionIcon, { backgroundColor: '#E6F4EF' }]}>
            <Text style={{ fontSize: 24 }}>🌿</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.actionTitle}>Talk to Milo (AI)</Text>
            <Text style={s.actionSub}>Instant, private, always available</Text>
          </View>
        </TouchableOpacity>

        {/* Direct Call — Trusted Contacts */}
        {(hasFamilyContact || hasMentorContact) && (
          <View style={s.callSection}>
            <Text style={s.callSectionTitle}>YOUR TRUSTED CONTACTS</Text>
            {hasFamilyContact && (
              <TouchableOpacity style={s.contactCallCard} onPress={() => makeCall(sosContacts.family.phone)}>
                <View style={s.contactCallInfo}>
                  <Heart color="#EF4444" size={18} />
                  <View>
                    <Text style={s.contactCallName}>{sosContacts.family.name}</Text>
                    <Text style={s.contactCallRole}>Trusted Family</Text>
                  </View>
                </View>
                <View style={s.contactCallBtn}>
                  <Phone color="white" size={18} />
                </View>
              </TouchableOpacity>
            )}
            {hasMentorContact && (
              <TouchableOpacity style={s.contactCallCard} onPress={() => makeCall(sosContacts.mentor.phone)}>
                <View style={s.contactCallInfo}>
                  <Shield color="#3B82F6" size={18} />
                  <View>
                    <Text style={s.contactCallName}>{sosContacts.mentor.name}</Text>
                    <Text style={s.contactCallRole}>Trusted Mentor</Text>
                  </View>
                </View>
                <View style={[s.contactCallBtn, { backgroundColor: '#3B82F6' }]}>
                  <Phone color="white" size={18} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* National Helplines */}
        <View style={s.helplineSection}>
          <Text style={s.helplineTitle}>NATIONAL HELPLINES (INDIA)</Text>
          {[
            { name: 'iCall (TISS)', desc: 'Mental health counselling', number: '9152987821' },
            { name: 'Vandrevala Foundation', desc: '24/7 Crisis support', number: '1860-2662-345' },
            { name: 'NIMHANS', desc: 'Psychiatric helpline', number: '080-4611-0007' },
          ].map((h, i) => (
            <TouchableOpacity key={i} style={s.helplineCard} onPress={() => makeCall(h.number.replace(/-/g, ''))}>
              <View>
                <Text style={s.helplineName}>{h.name}</Text>
                <Text style={s.helplineDesc}>{h.desc}</Text>
              </View>
              <Text style={s.helplineNumber}>{h.number}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* SOS Modal */}
      <Modal visible={showSOSModal} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={s.modalContent}>
            <View style={s.modalIcon}>
              <AlertTriangle color="#EF4444" size={36} />
            </View>
            <Text style={s.modalTitle}>🚨 SOS Activated</Text>
            <Text style={s.modalDesc}>Emergency alerts sent to your safety network.</Text>

            <View style={s.modalContacts}>
              {hasFamilyContact && (
                <View style={s.modalContactRow}>
                  <Heart color="#EF4444" size={16} />
                  <Text style={s.modalContactText}>{sosContacts.family.name} — 📞 Auto-calling...</Text>
                </View>
              )}
              {hasMentorContact && (
                <View style={s.modalContactRow}>
                  <Shield color="#3B82F6" size={16} />
                  <Text style={s.modalContactText}>{sosContacts.mentor.name} — 📩 Alert sent</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={s.modalPrimaryBtn} onPress={() => {
              setShowSOSModal(false);
              if (hasFamilyContact) makeCall(sosContacts.family.phone);
            }}>
              <Phone color="white" size={18} />
              <Text style={s.modalPrimaryText}>Call Family Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.modalMiloBtn} onPress={() => {
              setShowSOSModal(false);
              navigation.navigate('Chat');
            }}>
              <Text style={s.modalMiloText}>🌿 Talk to Milo instead</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResolved}>
              <Text style={s.modalResolve}>I'm okay now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  header: { backgroundColor: '#EF4444', paddingTop: 16, paddingBottom: 28, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  backText: { color: 'white', fontSize: 20, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  scroll: { padding: 16, paddingBottom: 30 },

  // Action Cards
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'white', padding: 18, borderRadius: 18, marginBottom: 12, elevation: 2 },
  actionIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sosBadge: { color: '#EF4444', fontWeight: '900', fontSize: 14 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  actionSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Mentor list
  mentorList: { marginBottom: 12 },
  mentorCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 8, elevation: 1, borderLeftWidth: 3, borderLeftColor: '#10B981' },
  mentorInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  mentorAvatarWrap: { position: 'relative' },
  onlineDot: { position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: 'white' },
  mentorName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  mentorRole: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  callBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  offlineBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  offlineBtnText: { color: '#9CA3AF', fontWeight: '600', fontSize: 12 },

  // Direct call section
  callSection: { marginTop: 8, marginBottom: 8 },
  callSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 1, marginBottom: 10 },
  contactCallCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 10, elevation: 1 },
  contactCallInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactCallName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  contactCallRole: { fontSize: 11, color: '#6B7280' },
  contactCallBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },

  // Helplines
  helplineSection: { marginTop: 10 },
  helplineTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 1, marginBottom: 12 },
  helplineCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 14, marginBottom: 10, elevation: 1 },
  helplineName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  helplineDesc: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  helplineNumber: { fontSize: 15, fontWeight: 'bold', color: '#EF4444' },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 28, borderRadius: 24, alignItems: 'center' },
  modalIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#EF4444', marginBottom: 6 },
  modalDesc: { fontSize: 14, color: '#6B7280', marginBottom: 18 },
  modalContacts: { width: '100%', backgroundColor: '#F9FAFB', padding: 14, borderRadius: 14, marginBottom: 18, gap: 10 },
  modalContactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalContactText: { fontSize: 14, fontWeight: '500', flex: 1 },
  modalPrimaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EF4444', width: '100%', padding: 16, borderRadius: 14, justifyContent: 'center', marginBottom: 10 },
  modalPrimaryText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalMiloBtn: { backgroundColor: '#1D9E75', width: '100%', padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  modalMiloText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  modalResolve: { color: '#6B7280', fontWeight: 'bold', fontSize: 15, padding: 10 },
});
