import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';
import { useIsFocused } from '@react-navigation/native';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';
const CDN_SCRIPT = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
const EMOJI = { neutral: '😐', happy: '😄', sad: '😢', angry: '😠', fearful: '😨', disgusted: '🤢', surprised: '😲' };
const COLORS = { neutral: '#9d9ab0', happy: '#fbbf24', sad: '#60a5fa', angry: '#f87171', fearful: '#c084fc', disgusted: '#4ade80', surprised: '#fb923c' };

// SOS auto-trigger thresholds
const SOS_EMOTIONS = ['sad', 'angry', 'fearful'];
const SOS_SUSTAINED_FRAMES = 25; // ~3.5s of sustained critical emotion
const SOS_CONFIDENCE_THRESHOLD = 0.7;

// Load face-api from CDN script tag (not Metro bundle)
function loadFaceApiFromCDN() {
  return new Promise((resolve, reject) => {
    if (window.faceapi) { resolve(window.faceapi); return; }
    const script = document.createElement('script');
    script.src = CDN_SCRIPT;
    script.onload = () => resolve(window.faceapi);
    script.onerror = () => reject(new Error('CDN script failed'));
    document.head.appendChild(script);
  });
}

// Generate Milo responses
function miloReply(emotion, conf, userMsg) {
  const pct = Math.round(conf * 100);
  if (userMsg) {
    const ctx = {
      happy: `You look cheerful! 😊`, sad: `I notice you seem down 💙`, angry: `I see some tension 😤`,
      fearful: `I sense anxiety 😰`, neutral: `You seem calm 😌`, disgusted: `Something bothering you? 🤔`, surprised: `You look surprised! 😮`
    };
    return `${ctx[emotion] || ''} About "${userMsg.slice(0, 30)}..." — I hear you. Want to talk more or try a breathing exercise?`;
  }
  const init = {
    happy: [`Love that smile! 😄 Happiness at ${pct}%. What's making you feel good?`],
    sad: [`Hey, you look a bit down. 💙 I'm here. Want to talk about it?`, `Sometimes just saying it helps. I'm listening, no judgment. 🌿`],
    angry: [`I see some tension. 😤 Let's try box breathing: in 4s, hold 4s, out 4s. 🫁`],
    fearful: [`I sense some worry. 😰 Ground yourself: name 5 things you can see. 👁️`],
    neutral: [`Hey! 😊 You look calm. How's your day going?`, `Everything steady. Want to chat or do a mood check? 💬`],
    disgusted: [`Something seems off. Want to talk? 🤔`], surprised: [`Whoa! 😲 Something unexpected happen?`]
  };
  const opts = init[emotion] || init.neutral;
  return opts[Math.floor(Math.random() * opts.length)];
}

// Speak text aloud — only if screen is focused
function speak(text, isFocusedRef) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  if (isFocusedRef && !isFocusedRef.current) return; // Don't speak if not focused
  const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}]/gu, ''));
  u.rate = 0.95; u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

// Stop all speech
function stopSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export default function DashboardScreen({ navigation }) {
  const user = useStore(s => s.user);
  const updateStress = useStore(s => s.updateStressScore);
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);

  const [status, setStatus] = useState('init');
  const [emotion, setEmotion] = useState(null);
  const [bars, setBars] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [sosWarning, setSosWarning] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceapiRef = useRef(null);
  const runRef = useRef(false);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);
  const initChat = useRef(false);
  const lastEmo = useRef(null);
  const sosCountRef = useRef(0);

  // Keep isFocusedRef in sync
  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  // *** CRITICAL: Stop speech and scanning when page loses focus ***
  useEffect(() => {
    if (!isFocused) {
      stopSpeech();
      runRef.current = false;
      clearTimeout(timerRef.current);
    } else {
      // Resume scanning when page regains focus (if camera is on)
      if (faceapiRef.current && videoRef.current?.srcObject && status === 'detecting') {
        runRef.current = true;
        detectLoop();
      }
    }
  }, [isFocused]);

  // Cleanup on unmount — stop everything
  useEffect(() => {
    return () => {
      stopSpeech();
      runRef.current = false;
      clearTimeout(timerRef.current);
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // 1. Load CDN + Models + Camera — all auto on mount
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let mounted = true;
    (async () => {
      try {
        setStatus('Loading AI...');
        const faceapi = await loadFaceApiFromCDN();
        faceapiRef.current = faceapi;
        setStatus('Loading models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        if (!mounted) return;
        setStatus('Starting camera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 480, height: 360 }, audio: false
        });
        if (!mounted) return;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await new Promise(r => { video.onloadedmetadata = r; });
          video.play();
        }
        runRef.current = true;
        setStatus('detecting');
        detectLoop();
      } catch (e) {
        if (mounted) setStatus('Error: ' + e.message);
      }
    })();
    return () => {
      mounted = false; runRef.current = false; clearTimeout(timerRef.current);
      stopSpeech();
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const detectLoop = async () => {
    if (!runRef.current || !isFocusedRef.current) return;
    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    try {
      const result = await faceapi.detectSingleFace(video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
      ).withFaceExpressions();

      if (canvas && video) {
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (result) {
          const b = result.detection.box;
          ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y, b.width, b.height);
          ctx.fillStyle = '#a78bfa';
          ctx.fillRect(b.x, b.y - 20, b.width, 20);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
          ctx.fillText('face detected', b.x + 4, b.y - 5);
        }
      }

      if (result) {
        const sorted = Object.entries(result.expressions).sort((a, b) => b[1] - a[1]);
        const dom = { name: sorted[0][0], conf: sorted[0][1] };
        setEmotion(dom);
        setBars(sorted);

        // --- SOS Auto-Detection ---
        if (SOS_EMOTIONS.includes(dom.name) && dom.conf > SOS_CONFIDENCE_THRESHOLD) {
          sosCountRef.current++;
          if (sosCountRef.current >= SOS_SUSTAINED_FRAMES) {
            handleAutoSOS(dom.name, dom.conf);
            sosCountRef.current = 0;
          }
        } else {
          sosCountRef.current = Math.max(0, sosCountRef.current - 1);
        }

        // Auto Milo initiation
        if (!initChat.current) {
          initChat.current = true;
          setTimeout(() => addMilo(miloReply(dom.name, dom.conf, null)), 1500);
          lastEmo.current = dom.name;
        } else if (dom.name !== lastEmo.current && ['sad', 'angry', 'fearful'].includes(dom.name) && dom.conf > 0.5) {
          lastEmo.current = dom.name;
          setTimeout(() => addMilo(miloReply(dom.name, dom.conf, null)), 1000);
          updateStress({ sad: 75, angry: 85, fearful: 90 }[dom.name] || 70);
        }
        lastEmo.current = dom.name;
      } else {
        setEmotion(null); setBars([]);
      }
    } catch (e) { /* skip frame */ }
    if (isFocusedRef.current) {
      timerRef.current = setTimeout(detectLoop, 130);
    }
  };

  // Auto SOS when bot detects critical distress
  const handleAutoSOS = (emotionName, confidence) => {
    setSosWarning(true);
    const sosContacts = user?.sosContacts;
    const contacts = user?.contacts || [];

    // Log SOS event
    console.log(`[AUTO-SOS] Critical distress detected: ${emotionName} at ${Math.round(confidence * 100)}%`);

    // Auto-trigger call (via tel: link on web)
    if (sosContacts?.family?.phone) {
      addMilo(`🚨 I'm very concerned about you. You've been showing intense ${emotionName} for a while. I'm alerting your trusted family member (${sosContacts.family.name}) now. You're not alone. 💙`);
      setTimeout(() => {
        if (Platform.OS === 'web' && window.confirm(
          `MindEase Safety Alert\n\nI've detected sustained severe distress.\nWould you like me to call ${sosContacts.family.name} (${sosContacts.family.phone}) now?`
        )) {
          window.open(`tel:${sosContacts.family.phone}`, '_self');
        }
      }, 2000);
    }

    updateStress(95);

    // Reset after 3 minutes
    setTimeout(() => setSosWarning(false), 180000);
  };

  const addMilo = (text) => {
    setTyping(true);
    setTimeout(() => {
      setMessages(p => [...p, { id: Date.now(), from: 'milo', text }]);
      setTyping(false);
      if (voiceOn && isFocusedRef.current) speak(text, isFocusedRef);
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100);
    }, 700);
  };

  const sendMsg = (txt) => {
    const t = txt || input;
    if (!t.trim()) return;
    setMessages(p => [...p, { id: Date.now(), from: 'user', text: t.trim() }]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 50);
    const emo = emotion?.name || 'neutral';
    const conf = emotion?.conf || 0;
    setTimeout(() => addMilo(miloReply(emo, conf, t.trim())), 800);
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR(); rec.lang = 'en-US'; rec.continuous = false;
    rec.onresult = (e) => { sendMsg(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start(); setListening(true);
  };

  const handleManualSOS = () => {
    const sosContacts = user?.sosContacts;
    if (!sosContacts?.family?.phone && !sosContacts?.mentor?.phone) {
      addMilo("🚨 No SOS contacts found. Please update your emergency contacts in Profile to enable SOS calling.");
      return;
    }
    navigation.navigate('Emergency');
  };

  const isDetecting = status === 'detecting';

  return (
    <SafeAreaView style={st.container}>
      {/* SOS Auto-Warning Banner */}
      {sosWarning && (
        <View style={st.sosBanner}>
          <Text style={st.sosBannerText}>🚨 AUTO-SOS TRIGGERED — Sustained distress detected. Contacting your safety network...</Text>
        </View>
      )}

      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.greet}>{new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}</Text>
          <Text style={st.name}>{user?.name || 'Student'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {emotion && (
            <View style={[st.emoPill, { borderColor: COLORS[emotion.name] }]}>
              <Text style={st.emoPillE}>{EMOJI[emotion.name]}</Text>
              <Text style={[st.emoPillT, { color: COLORS[emotion.name] }]}>{emotion.name} {Math.round(emotion.conf * 100)}%</Text>
            </View>
          )}
          {/* SOS Button */}
          <TouchableOpacity style={st.sosBtn} onPress={handleManualSOS}>
            <Text style={st.sosBtnText}>🚨 SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera + Bars */}
      <View style={st.camRow}>
        <View style={st.camCol}>
          <View style={st.camBox}>
            {Platform.OS === 'web' ? (
              <>
                <video ref={videoRef} autoPlay muted playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block', background: '#111' }} />
                <canvas ref={canvasRef}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }} />
              </>
            ) : (
              <Text style={{ color: '#666', textAlign: 'center', paddingTop: 60 }}>Camera on device</Text>
            )}
            {!isDetecting && <View style={st.camOverlay}><Text style={st.camOverlayT}>{status}</Text></View>}
          </View>
          <View style={st.statusRow}>
            <View style={[st.dot, { backgroundColor: isDetecting ? '#4ade80' : '#f59e0b' }]} />
            <Text style={st.statusT}>{isDetecting ? 'Live analyzing' : status}</Text>
          </View>
        </View>

        <View style={st.barsCol}>
          <Text style={st.barsTitle}>EXPRESSIONS</Text>
          {bars.length > 0 ? bars.map(([em, val]) => (
            <View key={em} style={st.barRow}>
              <Text style={st.barE}>{EMOJI[em]}</Text>
              <View style={st.barTrack}>
                <View style={[st.barFill, { width: `${Math.round(val * 100)}%`, backgroundColor: COLORS[em] }]} />
              </View>
              <Text style={st.barP}>{Math.round(val * 100)}%</Text>
            </View>
          )) : <Text style={st.noFace}>{isDetecting ? 'No face detected' : 'Waiting...'}</Text>}
        </View>
      </View>

      {/* Chat */}
      <View style={st.chatBox}>
        <View style={st.chatHead}>
          <Text style={st.chatTitle}>🌿 Milo</Text>
          <Text style={st.chatSub}>{emotion ? `seeing: ${emotion.name}` : 'emotion-aware AI'}</Text>
          <TouchableOpacity onPress={() => setVoiceOn(v => !v)}><Text style={{ fontSize: 18 }}>{voiceOn ? '🔊' : '🔇'}</Text></TouchableOpacity>
        </View>

        <ScrollView ref={scrollRef} style={st.chatScroll} contentContainerStyle={{ padding: 12 }}>
          {messages.length === 0 && !typing && (
            <Text style={st.chatEmpty}>{isDetecting ? 'Milo is watching your expression...' : 'Camera loading — Milo will chat soon'}</Text>
          )}
          {messages.map(m => (
            <View key={m.id} style={[st.msg, m.from === 'user' ? st.msgUser : st.msgMilo]}>
              {m.from === 'milo' && <Text style={st.miloAv}>🌿</Text>}
              <View style={[st.msgBubble, m.from === 'user' ? st.bubbleUser : st.bubbleMilo]}>
                <Text style={[st.msgText, m.from === 'user' ? st.textUser : st.textMilo]}>{m.text}</Text>
              </View>
            </View>
          ))}
          {typing && (
            <View style={[st.msg, st.msgMilo]}>
              <Text style={st.miloAv}>🌿</Text>
              <View style={st.bubbleMilo}><Text style={st.textMilo}>typing...</Text></View>
            </View>
          )}
        </ScrollView>

        <View style={st.inputRow}>
          <TouchableOpacity style={[st.micBtn, listening && { backgroundColor: '#ef4444' }]}
            onPress={startVoice}>
            <Text style={{ fontSize: 18 }}>{listening ? '⏹️' : '🎤'}</Text>
          </TouchableOpacity>
          <TextInput style={st.textIn} placeholder={listening ? 'Listening...' : 'Talk to Milo...'}
            placeholderTextColor="#555" value={input} onChangeText={setInput}
            onSubmitEditing={() => sendMsg()} returnKeyType="send" />
          <TouchableOpacity style={[st.sendBtn, !input.trim() && { backgroundColor: '#222' }]}
            onPress={() => sendMsg()} disabled={!input.trim()}>
            <Text style={{ fontSize: 16, color: '#0a0a0f' }}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  sosBanner: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 16 },
  sosBannerText: { color: 'white', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  greet: { fontSize: 11, color: '#6b6880' },
  name: { fontSize: 17, fontWeight: '700', color: '#fff' },
  emoPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(167,139,250,0.08)' },
  emoPillE: { fontSize: 14 },
  emoPillT: { fontSize: 11, fontWeight: '700' },
  sosBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  sosBtnText: { color: 'white', fontSize: 12, fontWeight: '800' },

  camRow: { flexDirection: 'row', paddingHorizontal: 10, gap: 8, marginBottom: 6 },
  camCol: { flex: 1, maxWidth: 200 },
  camBox: { aspectRatio: 4 / 3, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', borderWidth: 1, borderColor: '#2a2840', position: 'relative' },
  camOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  camOverlayT: { color: '#a78bfa', fontSize: 12, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusT: { fontSize: 10, color: '#6b6880' },

  barsCol: { flex: 1, backgroundColor: '#111118', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#2a2840' },
  barsTitle: { fontSize: 9, fontWeight: '700', color: '#6b6880', letterSpacing: 1, marginBottom: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  barE: { fontSize: 11, width: 16 },
  barTrack: { flex: 1, height: 5, backgroundColor: '#1e1c2e', borderRadius: 99, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  barP: { fontSize: 9, color: '#6b6880', width: 26, textAlign: 'right' },
  noFace: { color: '#3a3850', fontSize: 11, textAlign: 'center', paddingVertical: 20 },

  chatBox: { flex: 1, marginHorizontal: 10, backgroundColor: '#111118', borderRadius: 14, borderWidth: 1, borderColor: '#2a2840', overflow: 'hidden' },
  chatHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2840' },
  chatTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  chatSub: { fontSize: 10, color: '#6b6880', flex: 1 },
  chatScroll: { flex: 1 },
  chatEmpty: { color: '#3a3850', fontSize: 13, textAlign: 'center', paddingVertical: 30 },

  msg: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start', gap: 6 },
  msgMilo: { alignSelf: 'flex-start', maxWidth: '85%' },
  msgUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse', maxWidth: '85%' },
  miloAv: { fontSize: 16, marginTop: 4 },
  msgBubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  bubbleMilo: { backgroundColor: '#1e1c2e', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleUser: { backgroundColor: '#a78bfa' },
  msgText: { fontSize: 13, lineHeight: 19 },
  textMilo: { color: '#e8e6f0' },
  textUser: { color: '#0a0a0f' },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#2a2840' },
  micBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e1c2e', justifyContent: 'center', alignItems: 'center' },
  textIn: { flex: 1, backgroundColor: '#1e1c2e', color: '#e8e6f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, fontSize: 13 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#a78bfa', justifyContent: 'center', alignItems: 'center' },
});
