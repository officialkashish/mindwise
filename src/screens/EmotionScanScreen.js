import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, Animated } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

// ── CDN model path (same as the HTML version) ───────────────────────────────
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';

// ── Emotion config ──────────────────────────────────────────────────────────
const EMOJI  = { neutral:'😐', happy:'😄', sad:'😢', angry:'😠', fearful:'😨', disgusted:'🤢', surprised:'😲' };
const COLORS = { neutral:'#9d9ab0', happy:'#fbbf24', sad:'#60a5fa', angry:'#f87171', fearful:'#c084fc', disgusted:'#4ade80', surprised:'#fb923c' };

// ── Activity suggestions per emotion ────────────────────────────────────────
const ACTIVITIES = {
  happy:     ['Keep the vibes going — call a friend! 📞', 'Write down 3 things you\'re grateful for 📝', 'Share a meme with your bestie 😂'],
  neutral:   ['Try a 5-min breathing exercise 🧘', 'Listen to a focus playlist 🎵', 'Take a short walk outside 🚶'],
  sad:       ['Talk to Milo — your AI buddy 🌿', 'Listen to uplifting music 🎶', 'Watch a comfort show 📺', 'Journal your thoughts ✍️'],
  angry:     ['Box breathing: 4-4-4-4 🫁', 'Squeeze a stress ball or pillow 🥊', 'Go for a run or intense workout 🏃', 'Write it out then tear the paper 📄'],
  fearful:   ['Ground yourself: 5 things you see 👁️', 'Talk to someone you trust 💬', 'Play calming rain sounds 🌧️', 'Wrap yourself in a blanket 🛋️'],
  disgusted: ['Step away from the situation 🚪', 'Splash cold water on your face 💧', 'Chew mint gum 🍬'],
  surprised: ['Take a moment to process 🧠', 'Write down what surprised you 📝', 'Talk it through with someone 🗣️'],
};

// ── Alert thresholds ────────────────────────────────────────────────────────
const ALERT_EMOTIONS = ['sad', 'angry', 'fearful'];
const SUSTAINED_FRAMES = 30; // ~4 seconds at 8fps detection rate

// ── Web-only Real-time Face Detector ────────────────────────────────────────
function RealtimeDetector({ onEmotionUpdate, onStatusChange, onFpsUpdate, onAlertTrigger }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const faceapiRef = useRef(null);
  const runningRef = useRef(false);
  const timerRef   = useRef(null);
  const alertCountRef = useRef(0);

  const [cameraOn, setCameraOn] = useState(false);
  const [modelsLoaded, setModels] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load models on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        onStatusChange('loading-models');
        const faceapi = await import('face-api.js');
        faceapiRef.current = faceapi;
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        if (mounted) { setModels(true); setLoading(false); onStatusChange('ready'); }
      } catch (e) {
        console.error('Model load failed:', e);
        if (mounted) { setLoading(false); onStatusChange('error'); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const startCamera = async () => {
    onStatusChange('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }, audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(res => { videoRef.current.onloadedmetadata = res; });
        videoRef.current.play();
      }
      setCameraOn(true);
      runningRef.current = true;
      onStatusChange('detecting');
      alertCountRef.current = 0;
      startDetection();
    } catch (e) {
      onStatusChange('denied');
    }
  };

  const stopCamera = () => {
    runningRef.current = false;
    clearTimeout(timerRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setCameraOn(false);
    onStatusChange('ready');
    onEmotionUpdate(null);
    alertCountRef.current = 0;
  };

  const startDetection = () => {
    const faceapi = faceapiRef.current;
    const video   = videoRef.current;
    const canvas  = canvasRef.current;
    let fpsFrames = 0;
    let lastFpsTime = performance.now();

    async function detect() {
      if (!runningRef.current) return;

      const result = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
      ).withFaceExpressions();

      if (canvas) {
        canvas.width  = video.videoWidth  || video.offsetWidth;
        canvas.height = video.videoHeight || video.offsetHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (result) {
          const { x, y, width, height } = result.detection.box;
          const sx = canvas.width  / (video.videoWidth  || canvas.width);
          const sy = canvas.height / (video.videoHeight || canvas.height);

          // Purple bounding box
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 2;
          ctx.strokeRect(x*sx, y*sy, width*sx, height*sy);

          // Label
          ctx.fillStyle = '#a78bfa';
          ctx.fillRect(x*sx, y*sy - 22, width*sx, 22);
          ctx.fillStyle = '#0a0a0f';
          ctx.font = '600 11px sans-serif';
          ctx.fillText('face detected', x*sx + 5, y*sy - 6);
        }
      }

      if (result) {
        const expressions = result.expressions;
        const sorted = Object.entries(expressions).sort((a,b) => b[1] - a[1]);
        const dominant = sorted[0];

        onEmotionUpdate({
          dominant: { name: dominant[0], confidence: dominant[1] },
          all: expressions,
          sorted,
        });

        // ── Silent parent alert logic ──
        if (ALERT_EMOTIONS.includes(dominant[0]) && dominant[1] > 0.5) {
          alertCountRef.current++;
          if (alertCountRef.current >= SUSTAINED_FRAMES) {
            onAlertTrigger(dominant[0], dominant[1]);
            alertCountRef.current = 0; // reset after trigger
          }
        } else {
          alertCountRef.current = Math.max(0, alertCountRef.current - 1);
        }
      } else {
        onEmotionUpdate(null);
      }

      // FPS
      fpsFrames++;
      const now = performance.now();
      if (now - lastFpsTime > 1000) {
        onFpsUpdate(fpsFrames);
        fpsFrames = 0;
        lastFpsTime = now;
      }

      timerRef.current = setTimeout(detect, 120);
    }
    detect();
  };

  useEffect(() => {
    return () => {
      runningRef.current = false;
      clearTimeout(timerRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <View>
      {/* Loading overlay */}
      {loading && (
        <View style={ds.loadingOverlay}>
          <View style={ds.spinner} />
          <Text style={ds.loadingText}>loading AI models...</Text>
        </View>
      )}

      <View style={ds.videoWrapper}>
        <video
          ref={videoRef}
          autoPlay muted playsInline
          style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)', display:'block', background:'#111118' }}
        />
        <canvas
          ref={canvasRef}
          style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', transform:'scaleX(-1)', pointerEvents:'none' }}
        />
      </View>

      <TouchableOpacity
        style={[ds.startBtn, cameraOn && ds.stopBtn]}
        onPress={cameraOn ? stopCamera : startCamera}
        disabled={loading}
      >
        <Text style={[ds.startBtnText, loading && { color: '#6b6880' }]}>
          {loading ? 'LOADING MODELS...' : cameraOn ? '■  STOP CAMERA' : '▶  START CAMERA'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Native fallback ─────────────────────────────────────────────────────────
function NativeFallback() {
  return (
    <View style={ds.nativeFallback}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
      <Text style={ds.nativeFallbackTitle}>Camera Preview</Text>
      <Text style={ds.nativeFallbackSub}>Real-time detection available on web</Text>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────
export default function EmotionScanScreen({ navigation }) {
  const [emotionData, setEmotionData] = useState(null);
  const [status, setStatus]           = useState('idle');
  const [fps, setFps]                 = useState(0);
  const [alertSent, setAlertSent]     = useState(false);

  const updateStressScore = useStore(s => s.updateStressScore);
  const user              = useStore(s => s.user);
  const addXP             = useStore(s => s.addXP);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for dominant emotion
  useEffect(() => {
    if (emotionData) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [emotionData?.dominant?.name]);

  const handleAlertTrigger = useCallback((emotion, confidence) => {
    if (alertSent) return;
    setAlertSent(true);

    // Calculate stress score from emotion
    const stressMap = { sad: 75, angry: 85, fearful: 90 };
    const score = stressMap[emotion] || 70;

    // This automatically sends silent parent alert via the store
    updateStressScore(score);
    addXP(5);

    console.log(`[SILENT ALERT] Parent notified — ${emotion} (${Math.round(confidence*100)}%) sustained`);

    // Reset after 2 minutes cooldown
    setTimeout(() => setAlertSent(false), 120000);
  }, [alertSent]);

  const statusConfig = {
    'idle':           { dot: '#ef4444', text: 'camera off' },
    'loading-models': { dot: '#f59e0b', text: 'loading models...' },
    'ready':          { dot: '#4ade80', text: 'models ready' },
    'connecting':     { dot: '#f59e0b', text: 'connecting...' },
    'detecting':      { dot: '#4ade80', text: 'detecting' },
    'denied':         { dot: '#ef4444', text: 'camera denied' },
    'error':          { dot: '#ef4444', text: 'model load failed' },
  };

  const dominant = emotionData?.dominant;
  const sorted   = emotionData?.sorted || [];
  const suggestedActivities = dominant ? (ACTIVITIES[dominant.name] || []) : [];

  return (
    <SafeAreaView style={ds.container}>
      <ScrollView contentContainerStyle={ds.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={ds.header}>
          <Text style={ds.headerTitle}>emotion<Text style={ds.headerDot}>.</Text>detect</Text>
          <Text style={ds.headerSub}>real-time facial expression analysis</Text>
        </View>

        <View style={ds.mainLayout}>
          {/* Left: Video panel */}
          <View style={ds.videoPanel}>
            {Platform.OS === 'web' ? (
              <RealtimeDetector
                onEmotionUpdate={setEmotionData}
                onStatusChange={setStatus}
                onFpsUpdate={setFps}
                onAlertTrigger={handleAlertTrigger}
              />
            ) : (
              <NativeFallback />
            )}

            {/* Status bar */}
            <View style={ds.statusBar}>
              <View style={[ds.statusDot, { backgroundColor: statusConfig[status]?.dot || '#ef4444' },
                (status === 'loading-models' || status === 'connecting') && ds.statusPulse
              ]} />
              <Text style={ds.statusText}>{statusConfig[status]?.text || status}</Text>
              {status === 'detecting' && (
                <Text style={ds.fpsText}>{fps} fps</Text>
              )}
            </View>
          </View>

          {/* Right: Info panels */}
          <View style={ds.infoPanel}>
            {/* Dominant emotion card */}
            <View style={ds.card}>
              <Text style={ds.cardTitle}>DOMINANT EMOTION</Text>
              {dominant ? (
                <Animated.View style={[ds.mainEmotionBox, { transform: [{ scale: pulseAnim }] }]}>
                  <Text style={ds.emotionEmoji}>{EMOJI[dominant.name]}</Text>
                  <Text style={ds.emotionLabel}>{dominant.name}</Text>
                  <Text style={ds.emotionConf}>{Math.round(dominant.confidence * 100)}% confidence</Text>
                </Animated.View>
              ) : (
                <Text style={ds.placeholder}>
                  {status === 'detecting' ? 'no face detected' : 'start camera to begin'}
                </Text>
              )}
            </View>

            {/* All expressions bars */}
            <View style={ds.card}>
              <Text style={ds.cardTitle}>ALL EXPRESSIONS</Text>
              {sorted.length > 0 ? sorted.map(([em, val]) => (
                <View key={em} style={ds.barRow}>
                  <Text style={ds.barLabel}>{em}</Text>
                  <View style={ds.barTrack}>
                    <View style={[ds.barFill, {
                      width: `${Math.round(val * 100)}%`,
                      backgroundColor: COLORS[em]
                    }]} />
                  </View>
                  <Text style={ds.barPct}>{Math.round(val * 100)}%</Text>
                </View>
              )) : (
                <Text style={ds.noFace}>
                  {status === 'detecting' ? 'position your face\nin the camera' : 'no data yet'}
                </Text>
              )}
            </View>

            {/* Activity suggestions */}
            <View style={ds.card}>
              <Text style={ds.cardTitle}>SUGGESTED ACTIVITIES</Text>
              {suggestedActivities.length > 0 ? (
                <View style={ds.activitiesList}>
                  {suggestedActivities.map((act, i) => (
                    <TouchableOpacity key={i} style={ds.activityRow}>
                      <Text style={ds.activityText}>{act}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={ds.placeholder}>
                  activities will appear based on your emotion
                </Text>
              )}
            </View>

            {/* Silent alert banner */}
            {alertSent && (
              <View style={ds.alertBanner}>
                <Text style={ds.alertIcon}>🔕</Text>
                <View style={{ flex: 1 }}>
                  <Text style={ds.alertTitle}>Safety alert sent</Text>
                  <Text style={ds.alertSub}>
                    Emergency contacts notified automatically due to sustained distress signals
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles (matching the dark theme from HTML) ──────────────────────────────
const ds = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0a0a0f' },
  scrollContent:{ padding: 20, paddingBottom: 40 },

  // Header
  header:       { alignItems: 'center', marginBottom: 24 },
  headerTitle:  { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  headerDot:    { color: '#a78bfa' },
  headerSub:    { fontSize: 13, color: '#6b6880', marginTop: 4 },

  // Layout
  mainLayout:   { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center' },
  videoPanel:   { flex: 1, minWidth: 300, maxWidth: 480 },
  infoPanel:    { flex: 1, minWidth: 280, maxWidth: 360, gap: 14 },

  // Video
  videoWrapper: {
    borderRadius: 16, overflow: 'hidden', backgroundColor: '#111118',
    borderWidth: 1, borderColor: '#2a2840', aspectRatio: 4/3, position: 'relative',
  },
  startBtn:     {
    marginTop: 12, padding: 14, backgroundColor: '#a78bfa',
    borderRadius: 10, alignItems: 'center',
  },
  stopBtn:      { backgroundColor: '#2a2840' },
  startBtnText: { color: '#0a0a0f', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },

  // Loading
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0a0a0f', zIndex: 100,
    justifyContent: 'center', alignItems: 'center',
  },
  spinner: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: '#2a2840', borderTopColor: '#a78bfa',
  },
  loadingText: { color: '#6b6880', fontSize: 13, marginTop: 12 },

  // Status
  statusBar:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  statusPulse:  { opacity: 0.7 },
  statusText:   { fontSize: 12, color: '#6b6880' },
  fpsText:      { fontSize: 11, color: '#3a3850', marginLeft: 'auto' },

  // Cards
  card: {
    backgroundColor: '#111118', borderWidth: 1, borderColor: '#2a2840',
    borderRadius: 16, padding: 18,
  },
  cardTitle: {
    fontSize: 10, fontWeight: '700', color: '#6b6880',
    letterSpacing: 1.5, marginBottom: 14,
  },
  placeholder:  { color: '#3a3850', fontSize: 14, textAlign: 'center', paddingVertical: 20 },

  // Main emotion
  mainEmotionBox: { alignItems: 'center', paddingVertical: 10 },
  emotionEmoji:   { fontSize: 52, marginBottom: 8 },
  emotionLabel:   { fontSize: 24, fontWeight: '500', color: '#fff', textTransform: 'capitalize', letterSpacing: -0.3 },
  emotionConf:    { fontSize: 12, color: '#a78bfa', marginTop: 4 },

  // Bars
  barRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  barLabel:   { fontSize: 11, color: '#9d9ab0', width: 72, textTransform: 'capitalize' },
  barTrack:   { flex: 1, height: 6, backgroundColor: '#1e1c2e', borderRadius: 99, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 99 },
  barPct:     { fontSize: 11, color: '#6b6880', width: 32, textAlign: 'right' },
  noFace:     { color: '#3a3850', fontSize: 13, textAlign: 'center', paddingVertical: 18 },

  // Activities
  activitiesList: { gap: 8 },
  activityRow:    { backgroundColor: '#1a1928', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#2a2840' },
  activityText:   { color: '#c8c5d8', fontSize: 13, lineHeight: 18 },

  // Alert banner
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1c1015', borderWidth: 1, borderColor: '#4c1d30',
    borderRadius: 12, padding: 14,
  },
  alertIcon:  { fontSize: 24 },
  alertTitle: { color: '#f87171', fontWeight: '700', fontSize: 13, marginBottom: 3 },
  alertSub:   { color: '#9d5050', fontSize: 11, lineHeight: 16 },

  // Native fallback
  nativeFallback:      { backgroundColor: '#111118', borderRadius: 16, aspectRatio: 4/3,
                          justifyContent: 'center', alignItems: 'center',
                          borderWidth: 1, borderColor: '#2a2840' },
  nativeFallbackTitle: { color: '#9d9ab0', fontSize: 16, fontWeight: '600' },
  nativeFallbackSub:   { color: '#3a3850', fontSize: 12, marginTop: 6 },
});
