import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { Send } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useStore } from '../store/useStore';

const MILO_RESPONSES = {
  'exam stress': "I totally understand exam stress — it's one of the most common things I help with! 📚 Let's try this: close your eyes, take 3 deep breaths, and then tell me specifically what part is worrying you most. Breaking it down makes it manageable. 🌿",
  'feeling overwhelmed': "When everything feels too much, your brain needs a reset. 🧠 Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. This brings you back to the present. 💙",
  "i'm doing okay": "That's wonderful to hear! 😊 Even when things are okay, it's great that you're checking in with yourself. Want to do a quick gratitude exercise? Tell me 3 small things that made you smile today. ✨",
  'need help': "I'm here for you, completely. 💙 You're not alone in this. Can you tell me a bit more about what you're going through? Whether it's stress, anxiety, loneliness, or anything else — I'm listening without judgment. 🌿",
  'lonely': "Feeling lonely is more common than people think, especially in college. 💙 You're brave for saying it. Have you tried the Community tab? There are students going through similar things. Sometimes just knowing you're not the only one helps. 🤝",
  'anxiety': "Anxiety can feel so overwhelming, but remember — it's your body trying to protect you. 🧘 Let's do box breathing together: Breathe in for 4 seconds → Hold 4 seconds → Breathe out 4 seconds → Hold 4 seconds. Repeat 3 times. How do you feel? 🌬️",
  'can\'t sleep': "Sleep troubles are tough. 🌙 Try this tonight: no screens 30 min before bed, write down 3 worries on paper (gets them out of your head), and do a body scan relaxation from toes to head. Your body knows how to rest — we just need to let it. 😴",
  'default': "I hear you, and I'm grateful you shared that with me. 🌿 Whatever you're feeling is valid. Would you like to try a breathing exercise, talk more about what's on your mind, or maybe do a quick mood check? I'm here for whatever you need. 💙",
};

function getMiloResponse(text) {
  const lower = text.toLowerCase();
  for (const [key, response] of Object.entries(MILO_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) return response;
  }
  if (lower.includes('stress') || lower.includes('pressure')) return MILO_RESPONSES['exam stress'];
  if (lower.includes('help') || lower.includes('sad') || lower.includes('cry')) return MILO_RESPONSES['need help'];
  if (lower.includes('anxious') || lower.includes('worry') || lower.includes('panic')) return MILO_RESPONSES['anxiety'];
  if (lower.includes('alone') || lower.includes('lonely') || lower.includes('no friends')) return MILO_RESPONSES['lonely'];
  if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('tired')) return MILO_RESPONSES["can't sleep"];
  if (lower.includes('good') || lower.includes('fine') || lower.includes('okay') || lower.includes('great')) return MILO_RESPONSES["i'm doing okay"];
  return MILO_RESPONSES['default'];
}

export default function ChatScreen({ route, navigation }) {
  const user = useStore(s => s.user);
  const addXP = useStore(s => s.addXP);

  const [messages, setMessages] = useState([
    { id: '0', text: `Hey ${user?.name || 'there'}! I'm Milo, your AI wellness buddy. 🌿\n\nI'm here to listen, support, and help you through anything. No judgment, ever.\n\nHow are you feeling right now?`, sender: 'milo', time: formatTime() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const msgCount = useRef(0);

  const quickReplies = [
    { label: "😰 Exam stress", text: "exam stress" },
    { label: "😞 Feeling overwhelmed", text: "feeling overwhelmed" },
    { label: "😊 I'm doing okay", text: "I'm doing okay" },
    { label: "🆘 Need help", text: "need help" },
    { label: "😔 Lonely", text: "lonely" },
    { label: "😟 Anxiety", text: "anxiety" },
  ];

  useEffect(() => {
    if (route?.params?.initialMessage) {
      handleSend(route.params.initialMessage);
    }
  }, [route?.params]);

  function formatTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const handleSend = (text) => {
    const t = text || inputText;
    if (!t.trim()) return;

    const userMsg = { id: Date.now().toString(), text: t.trim(), sender: 'user', time: formatTime() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate Milo typing delay
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
      const reply = getMiloResponse(t);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: reply, sender: 'milo', time: formatTime() }]);
      setIsTyping(false);
      msgCount.current++;
      if (msgCount.current % 3 === 0) addXP(5);
    }, delay);

    setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 100);
  };

  const renderMessage = ({ item }) => (
    <View style={[st.msgRow, item.sender === 'user' ? st.msgRowUser : st.msgRowMilo]}>
      {item.sender === 'milo' && (
        <View style={st.miloAvatar}><Text style={{ fontSize: 16 }}>🌿</Text></View>
      )}
      <View style={{ maxWidth: '78%' }}>
        <View style={[st.bubble, item.sender === 'user' ? st.bubbleUser : st.bubbleMilo]}>
          <Text style={[st.msgText, item.sender === 'user' ? st.textUser : st.textMilo]}>{item.text}</Text>
        </View>
        <Text style={[st.timeText, item.sender === 'user' && { textAlign: 'right' }]}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <View style={st.miloHeaderAvatar}><Text style={{ fontSize: 22 }}>🌿</Text></View>
          <View>
            <Text style={st.headerTitle}>Milo</Text>
            <View style={st.onlineRow}>
              <View style={st.onlineDot} />
              <Text style={st.headerSub}>Online · AI Wellness Buddy</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={st.sosQuick} onPress={() => navigation.navigate('Emergency')}>
          <Text style={st.sosQuickText}>🚨 SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={st.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd?.({ animated: true })}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={st.typingRow}>
          <View style={st.miloAvatar}><Text style={{ fontSize: 14 }}>🌿</Text></View>
          <View style={st.typingBubble}>
            <Text style={st.typingDots}>● ● ●</Text>
          </View>
        </View>
      )}

      {/* Quick Replies */}
      <View style={st.quickRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          {quickReplies.map((q, i) => (
            <TouchableOpacity key={i} style={st.quickChip} onPress={() => handleSend(q.text)}>
              <Text style={st.quickText}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={st.inputRow}>
          <TextInput
            style={st.textInput}
            placeholder="Message Milo..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={[st.sendBtn, !inputText.trim() && st.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}>
            <Send color="white" size={18} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miloHeaderAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E6F4EF', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  headerSub: { fontSize: 12, color: '#6B7280' },
  sosQuick: { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  sosQuickText: { color: '#EF4444', fontWeight: 'bold', fontSize: 13 },

  // Chat
  chatList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start', gap: 8 },
  msgRowMilo: { alignSelf: 'flex-start' },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  miloAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E6F4EF', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, maxWidth: '100%' },
  bubbleMilo: { backgroundColor: 'white', borderBottomLeftRadius: 6, elevation: 1 },
  bubbleUser: { backgroundColor: '#1D9E75', borderBottomRightRadius: 6 },
  msgText: { fontSize: 15, lineHeight: 22 },
  textMilo: { color: '#1A1A1A' },
  textUser: { color: 'white' },
  timeText: { fontSize: 10, color: '#9CA3AF', marginTop: 4, paddingHorizontal: 4 },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  typingBubble: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderBottomLeftRadius: 6 },
  typingDots: { color: '#9CA3AF', fontSize: 12, letterSpacing: 2 },

  // Quick Replies
  quickRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingVertical: 10 },
  quickChip: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  quickText: { color: '#1A1A1A', fontSize: 13, fontWeight: '600' },

  // Input
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  textInput: { flex: 1, backgroundColor: '#F3F4F6', color: '#1A1A1A', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1D9E75', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
});
