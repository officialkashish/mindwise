import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Animated, Vibration, Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

// Generate math problem
function genMath(level) {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  const max = 10 + level * 5;
  if (op === '+') { a = Math.floor(Math.random() * max) + 1; b = Math.floor(Math.random() * max) + 1; answer = a + b; }
  else if (op === '-') { a = Math.floor(Math.random() * max) + 10; b = Math.floor(Math.random() * a) + 1; answer = a - b; }
  else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; answer = a * b; }
  return { question: `${a} ${op} ${b} = ?`, answer: answer.toString() };
}

// Word scrambles
const WORDS = [
  { word: 'BREATHE', hint: 'What you do to calm down' },
  { word: 'PEACE', hint: 'Inner calm and tranquility' },
  { word: 'HAPPY', hint: 'Feeling of joy' },
  { word: 'RELAX', hint: 'To let go of tension' },
  { word: 'SMILE', hint: 'A facial expression of joy' },
  { word: 'FOCUS', hint: 'Concentrate your attention' },
  { word: 'CALM', hint: 'Free from disturbance' },
  { word: 'HOPE', hint: 'Feeling of expectation' },
];

function scramble(word) {
  return word.split('').sort(() => Math.random() - 0.5).join('');
}

const ACTIVITIES = ['math', 'breathing', 'word'];

export default function StressBusterScreen({ navigation, route }) {
  const completeStressBuster = useStore(s => s.completeStressBuster);
  const totalCompleted = useStore(s => s.totalActivitiesCompleted);
  const coupons = useStore(s => s.coupons);

  const reason = route?.params?.reason || 'Time for a stress-busting break!';
  const activityType = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];

  const [phase, setPhase] = useState('alarm'); // alarm -> activity -> complete
  const [activity, setActivity] = useState(activityType);
  const [earnedCoupon, setEarnedCoupon] = useState(null);

  // Math state
  const [mathProblem, setMathProblem] = useState(genMath(1));
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathLevel, setMathLevel] = useState(1);
  const [mathSolved, setMathSolved] = useState(0);
  const [mathWrong, setMathWrong] = useState(false);
  const MATH_TARGET = 3;

  // Breathing state
  const [breathPhase, setBreathPhase] = useState('ready');
  const [breathCount, setBreathCount] = useState(0);
  const [breathTimer, setBreathTimer] = useState(4);
  const [breathLabel, setBreathLabel] = useState('');
  const BREATH_TARGET = 4;
  const breathInterval = useRef(null);

  // Word state
  const [wordData, setWordData] = useState(() => { const w = WORDS[Math.floor(Math.random() * WORDS.length)]; return { ...w, scrambled: scramble(w.word) }; });
  const [wordGuess, setWordGuess] = useState('');
  const [wordsSolved, setWordsSolved] = useState(0);
  const [wordWrong, setWordWrong] = useState(false);
  const WORD_TARGET = 2;

  // Alarm animation
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'alarm') {
      // Shake + pulse animation
      const shakeLoop = Animated.loop(Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]));
      const pulseLoop = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]));
      shakeLoop.start(); pulseLoop.start();
      // Vibrate on mobile
      if (Platform.OS !== 'web') Vibration.vibrate([500, 300, 500, 300], true);
      return () => { shakeLoop.stop(); pulseLoop.stop(); Vibration.cancel?.(); };
    }
  }, [phase]);

  // Breathing exercise timer
  const startBreathing = () => {
    setBreathPhase('inhale');
    setBreathLabel('Breathe In');
    setBreathTimer(4);
    let step = 0;
    const phases = [
      { label: 'Breathe In', duration: 4 },
      { label: 'Hold', duration: 4 },
      { label: 'Breathe Out', duration: 4 },
      { label: 'Hold', duration: 4 },
    ];
    let currentPhase = 0;
    let t = phases[0].duration;

    breathInterval.current = setInterval(() => {
      t--;
      setBreathTimer(t);
      if (t <= 0) {
        currentPhase++;
        if (currentPhase >= phases.length) {
          currentPhase = 0;
          setBreathCount(prev => {
            const next = prev + 1;
            if (next >= BREATH_TARGET) {
              clearInterval(breathInterval.current);
              setTimeout(() => handleComplete(), 500);
            }
            return next;
          });
        }
        setBreathLabel(phases[currentPhase].label);
        t = phases[currentPhase].duration;
        setBreathTimer(t);
      }
    }, 1000);
  };

  useEffect(() => () => clearInterval(breathInterval.current), []);

  const checkMath = () => {
    if (mathAnswer.trim() === mathProblem.answer) {
      const next = mathSolved + 1;
      setMathSolved(next);
      setMathWrong(false);
      if (next >= MATH_TARGET) { handleComplete(); }
      else { setMathProblem(genMath(mathLevel + 1)); setMathLevel(l => l + 1); setMathAnswer(''); }
    } else {
      setMathWrong(true); setMathAnswer('');
      if (Platform.OS !== 'web') Vibration.vibrate(200);
    }
  };

  const checkWord = () => {
    if (wordGuess.trim().toUpperCase() === wordData.word) {
      const next = wordsSolved + 1;
      setWordsSolved(next);
      setWordWrong(false);
      if (next >= WORD_TARGET) { handleComplete(); }
      else { const w = WORDS[Math.floor(Math.random() * WORDS.length)]; setWordData({ ...w, scrambled: scramble(w.word) }); setWordGuess(''); }
    } else {
      setWordWrong(true); setWordGuess('');
    }
  };

  const handleComplete = () => {
    const prevCoupons = coupons.length;
    completeStressBuster();
    const newCoupons = useStore.getState().coupons;
    if (newCoupons.length > prevCoupons) {
      setEarnedCoupon(newCoupons[newCoupons.length - 1]);
    }
    setPhase('complete');
  };

  // --- ALARM PHASE ---
  if (phase === 'alarm') {
    return (
      <SafeAreaView style={[st.container, { backgroundColor: '#1A1A2E' }]}>
        <View style={st.alarmCenter}>
          <Animated.View style={[st.alarmCircle, { transform: [{ translateX: shakeAnim }, { scale: pulseAnim }] }]}>
            <Text style={st.alarmEmoji}>🚨</Text>
          </Animated.View>
          <Text style={st.alarmTitle}>STRESS ALERT!</Text>
          <Text style={st.alarmSub}>{reason}</Text>
          <Text style={st.alarmDesc}>Complete a quick activity to dismiss this alert.{'\n'}You can't skip this — it's for your wellbeing! 💙</Text>
          <TouchableOpacity style={st.startBtn} onPress={() => setPhase('activity')}>
            <Text style={st.startBtnText}>🎯 Start Activity</Text>
          </TouchableOpacity>
          <Text style={st.alarmHint}>Earn XP + Coupons for completing!</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- COMPLETE PHASE ---
  if (phase === 'complete') {
    return (
      <SafeAreaView style={[st.container, { backgroundColor: '#F0FDF9' }]}>
        <View style={st.completeCenter}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>🎉</Text>
          <Text style={st.completeTitle}>Activity Complete!</Text>
          <Text style={st.completeSub}>+30 XP earned</Text>

          {earnedCoupon && (
            <View style={[st.couponCard, { backgroundColor: earnedCoupon.color }]}>
              <Text style={{ fontSize: 36 }}>{earnedCoupon.emoji}</Text>
              <Text style={[st.couponTitle, { color: earnedCoupon.textColor }]}>🎁 You earned a coupon!</Text>
              <Text style={[st.couponName, { color: earnedCoupon.textColor }]}>{earnedCoupon.title}</Text>
              <Text style={st.couponDesc}>{earnedCoupon.desc}</Text>
              <View style={st.couponCodeBox}>
                <Text style={st.couponCode}>{earnedCoupon.code}</Text>
              </View>
              <Text style={st.couponExpiry}>Valid for 7 days</Text>
            </View>
          )}

          {!earnedCoupon && (
            <View style={st.progressCard}>
              <Text style={st.progressText}>
                {3 - ((totalCompleted + 1) % 3 || 3)} more {3 - ((totalCompleted + 1) % 3 || 3) === 1 ? 'activity' : 'activities'} until your next coupon! 🎁
              </Text>
            </View>
          )}

          <TouchableOpacity style={st.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={st.doneBtnText}>Back to App</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- ACTIVITY PHASE ---
  return (
    <SafeAreaView style={st.container}>
      <View style={st.activityHeader}>
        <Text style={st.activityHeaderTitle}>
          {activity === 'math' ? '🧮 Math Challenge' : activity === 'breathing' ? '🫁 Box Breathing' : '🔤 Word Scramble'}
        </Text>
        <Text style={st.activityHeaderSub}>Complete to dismiss • Can't skip</Text>
      </View>

      <View style={st.activityBody}>
        {/* MATH */}
        {activity === 'math' && (
          <View style={st.activityCard}>
            <Text style={st.progressLabel}>Solve {MATH_TARGET} problems</Text>
            <View style={st.progressDots}>
              {Array.from({ length: MATH_TARGET }).map((_, i) => (
                <View key={i} style={[st.dot, i < mathSolved && st.dotDone]} />
              ))}
            </View>
            <Text style={st.mathQuestion}>{mathProblem.question}</Text>
            <TextInput style={st.mathInput} keyboardType="number-pad" placeholder="Your answer"
              placeholderTextColor="#9CA3AF" value={mathAnswer} onChangeText={setMathAnswer}
              onSubmitEditing={checkMath} autoFocus />
            {mathWrong && <Text style={st.wrongText}>❌ Wrong! Try again — alarm continues!</Text>}
            <TouchableOpacity style={st.submitBtn} onPress={checkMath} disabled={!mathAnswer.trim()}>
              <Text style={st.submitBtnText}>Submit Answer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* BREATHING */}
        {activity === 'breathing' && (
          <View style={st.activityCard}>
            <Text style={st.progressLabel}>Complete {BREATH_TARGET} breathing cycles</Text>
            <View style={st.progressDots}>
              {Array.from({ length: BREATH_TARGET }).map((_, i) => (
                <View key={i} style={[st.dot, i < breathCount && st.dotDone]} />
              ))}
            </View>
            {breathPhase === 'ready' ? (
              <TouchableOpacity style={st.breathStartBtn} onPress={startBreathing}>
                <Text style={{ fontSize: 50 }}>🫁</Text>
                <Text style={st.breathStartText}>Tap to Start Breathing</Text>
              </TouchableOpacity>
            ) : (
              <View style={st.breathActive}>
                <View style={st.breathCircle}>
                  <Text style={st.breathTimer}>{breathTimer}</Text>
                </View>
                <Text style={st.breathLabel}>{breathLabel}</Text>
                <Text style={st.breathHint}>Follow the rhythm — in through nose, out through mouth</Text>
              </View>
            )}
          </View>
        )}

        {/* WORD SCRAMBLE */}
        {activity === 'word' && (
          <View style={st.activityCard}>
            <Text style={st.progressLabel}>Unscramble {WORD_TARGET} words</Text>
            <View style={st.progressDots}>
              {Array.from({ length: WORD_TARGET }).map((_, i) => (
                <View key={i} style={[st.dot, i < wordsSolved && st.dotDone]} />
              ))}
            </View>
            <View style={st.scrambleBox}>
              {wordData.scrambled.split('').map((ch, i) => (
                <View key={i} style={st.letterBox}><Text style={st.letterText}>{ch}</Text></View>
              ))}
            </View>
            <Text style={st.wordHint}>💡 Hint: {wordData.hint}</Text>
            <TextInput style={st.mathInput} placeholder="Type the word" autoCapitalize="characters"
              placeholderTextColor="#9CA3AF" value={wordGuess} onChangeText={setWordGuess}
              onSubmitEditing={checkWord} autoFocus />
            {wordWrong && <Text style={st.wrongText}>❌ Not quite! Try again!</Text>}
            <TouchableOpacity style={st.submitBtn} onPress={checkWord} disabled={!wordGuess.trim()}>
              <Text style={st.submitBtnText}>Submit Word</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Switch activity */}
        <View style={st.switchRow}>
          {ACTIVITIES.filter(a => a !== activity).map(a => (
            <TouchableOpacity key={a} style={st.switchBtn} onPress={() => setActivity(a)}>
              <Text style={st.switchText}>
                {a === 'math' ? '🧮 Math' : a === 'breathing' ? '🫁 Breathe' : '🔤 Words'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },

  // Alarm
  alarmCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  alarmCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#EF4444', shadowOpacity: 0.5, shadowRadius: 30, elevation: 10 },
  alarmEmoji: { fontSize: 50 },
  alarmTitle: { fontSize: 28, fontWeight: '900', color: '#EF4444', marginBottom: 8 },
  alarmSub: { fontSize: 15, color: '#9CA3AF', marginBottom: 20, textAlign: 'center' },
  alarmDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  startBtn: { backgroundColor: '#EF4444', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 20 },
  startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  alarmHint: { color: '#4ADE80', fontSize: 13, marginTop: 16, fontWeight: '600' },

  // Activity
  activityHeader: { backgroundColor: '#7F77DD', paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  activityHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  activityHeaderSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  activityBody: { flex: 1, padding: 16 },
  activityCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, elevation: 3, alignItems: 'center' },

  progressLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 12 },
  progressDots: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#E5E7EB' },
  dotDone: { backgroundColor: '#10B981' },

  // Math
  mathQuestion: { fontSize: 36, fontWeight: '900', color: '#1A1A1A', marginBottom: 20 },
  mathInput: { width: '100%', backgroundColor: '#F3F4F6', padding: 16, borderRadius: 14, fontSize: 20, textAlign: 'center', borderWidth: 2, borderColor: '#E5E7EB', marginBottom: 12 },
  wrongText: { color: '#EF4444', fontWeight: 'bold', fontSize: 14, marginBottom: 12 },
  submitBtn: { backgroundColor: '#7F77DD', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, width: '100%', alignItems: 'center' },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Breathing
  breathStartBtn: { alignItems: 'center', paddingVertical: 30 },
  breathStartText: { fontSize: 16, fontWeight: 'bold', color: '#7F77DD', marginTop: 12 },
  breathActive: { alignItems: 'center', paddingVertical: 20 },
  breathCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EBF5FF', borderWidth: 4, borderColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  breathTimer: { fontSize: 48, fontWeight: '900', color: '#3B82F6' },
  breathLabel: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  breathHint: { fontSize: 13, color: '#6B7280', textAlign: 'center' },

  // Word
  scrambleBox: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' },
  letterBox: { width: 44, height: 48, borderRadius: 10, backgroundColor: '#7F77DD', justifyContent: 'center', alignItems: 'center' },
  letterText: { color: 'white', fontSize: 22, fontWeight: '900' },
  wordHint: { fontSize: 13, color: '#6B7280', marginBottom: 16, textAlign: 'center' },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 20 },
  switchBtn: { backgroundColor: 'white', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, elevation: 1 },
  switchText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

  // Complete
  completeCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  completeTitle: { fontSize: 28, fontWeight: '900', color: '#1D9E75', marginBottom: 6 },
  completeSub: { fontSize: 16, color: '#6B7280', marginBottom: 24 },
  couponCard: { width: '100%', padding: 24, borderRadius: 20, alignItems: 'center', marginBottom: 24 },
  couponTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 10 },
  couponName: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  couponDesc: { fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  couponCodeBox: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 14, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)', borderStyle: 'dashed' },
  couponCode: { fontSize: 18, fontWeight: '900', letterSpacing: 2, color: '#1A1A1A' },
  couponExpiry: { fontSize: 11, color: '#9CA3AF', marginTop: 8 },
  progressCard: { backgroundColor: '#FEF3C7', padding: 16, borderRadius: 14, marginBottom: 24 },
  progressText: { fontSize: 14, color: '#B45309', textAlign: 'center', fontWeight: '600' },
  doneBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 },
  doneBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
