import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Animated, Dimensions, TextInput
} from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

const { width: W } = Dimensions.get('window');

// ─── All 20 questions ──────────────────────────────────────────────────────
const QUESTIONS = [
  // ── STRESS PATTERNS ─────────────────────────────────────
  {
    id: 1, category: 'Stress Patterns', emoji: '😰',
    question: 'How often do you feel stressed during a typical week?',
    type: 'single',
    options: ['Rarely (1-2 days)', 'Sometimes (3-4 days)', 'Most days (5-6 days)', 'Every day'],
    key: 'stressFrequency',
  },
  {
    id: 2, category: 'Stress Patterns', emoji: '📚',
    question: 'What is your biggest source of stress right now?',
    type: 'single',
    options: ['Exams / Academics', 'Relationships', 'Family pressure', 'Financial worries', 'Health concerns', 'Career anxiety'],
    key: 'stressTrigger',
  },
  {
    id: 3, category: 'Stress Patterns', emoji: '⚡',
    question: 'How does stress usually show up for you?',
    type: 'multi',
    options: ['Headaches', 'Trouble sleeping', 'Loss of appetite', 'Irritability', 'Difficulty concentrating', 'Chest tightness'],
    key: 'stressSymptoms',
  },
  {
    id: 4, category: 'Stress Patterns', emoji: '⏱️',
    question: 'How long does a typical stress episode last for you?',
    type: 'single',
    options: ['A few hours', 'One day', 'Several days', 'A week or more'],
    key: 'stressDuration',
  },
  {
    id: 5, category: 'Stress Patterns', emoji: '🌙',
    question: 'How does stress affect your sleep?',
    type: 'single',
    options: ["Doesn't affect sleep", 'Trouble falling asleep', 'Wake up at night', 'Sleep too much', 'Nightmares'],
    key: 'stressSleep',
  },
  {
    id: 6, category: 'Stress Patterns', emoji: '🍽️',
    question: 'How does stress affect your eating habits?',
    type: 'single',
    options: ['No change', 'Eat less than usual', 'Eat more / comfort eat', 'Skip meals entirely'],
    key: 'stressEating',
  },
  {
    id: 7, category: 'Stress Patterns', emoji: '🧠',
    question: 'Rate how much stress currently affects your ability to focus.',
    type: 'scale',
    min: 1, max: 5, labels: ['Not at all', 'Slightly', 'Moderately', 'Quite a bit', 'Severely'],
    key: 'stressFocusImpact',
  },
  {
    id: 8, category: 'Stress Patterns', emoji: '💬',
    question: 'Do you talk to someone when you feel stressed?',
    type: 'single',
    options: ['Always — I reach out immediately', 'Sometimes, if it gets bad', 'Rarely — I keep it to myself', 'Never'],
    key: 'stressTalkingHabit',
  },
  {
    id: 9, category: 'Stress Patterns', emoji: '📱',
    question: 'Do you use social media when stressed?',
    type: 'single',
    options: ['Yes — it helps me distract', 'Yes — but it makes me feel worse', 'No — I avoid it', 'I try to limit it'],
    key: 'stressSocialMedia',
  },
  {
    id: 10, category: 'Stress Patterns', emoji: '🎯',
    question: 'Rate your overall stress level right now.',
    type: 'scale',
    min: 1, max: 10, labels: ['Very calm', '', '', '', 'Moderate', '', '', '', '', 'Extremely stressed'],
    key: 'currentStressLevel',
  },

  // ── FAVOURITE ACTIVITIES ─────────────────────────────────
  {
    id: 11, category: 'Favourite Activities', emoji: '🎵',
    question: 'Which activities help you relax most? (Pick all that apply)',
    type: 'multi',
    options: ['Listening to music', 'Exercise / Sports', 'Reading', 'Gaming', 'Cooking / Baking', 'Art / Drawing', 'Meditation', 'Watching shows'],
    key: 'relaxActivities',
  },
  {
    id: 12, category: 'Favourite Activities', emoji: '🏃',
    question: 'How often do you exercise or do physical activity?',
    type: 'single',
    options: ['Daily', '3-5 times/week', '1-2 times/week', 'Rarely', 'Never'],
    key: 'exerciseFrequency',
  },
  {
    id: 13, category: 'Favourite Activities', emoji: '🧘',
    question: 'Do you practice any mindfulness or meditation?',
    type: 'single',
    options: ['Yes — regularly', 'Yes — occasionally', 'I want to start', 'No'],
    key: 'mindfulnessPractice',
  },
  {
    id: 14, category: 'Favourite Activities', emoji: '🌅',
    question: 'What time of day do you feel most energetic and clear-headed?',
    type: 'single',
    options: ['Early morning (5-9am)', 'Mid-morning (9am-12pm)', 'Afternoon (12-5pm)', 'Evening (5-9pm)', 'Late night (9pm+)'],
    key: 'peakEnergyTime',
  },
  {
    id: 15, category: 'Favourite Activities', emoji: '🤝',
    question: 'When stressed, do you prefer to be alone or with others?',
    type: 'single',
    options: ['Completely alone', 'Mostly alone with occasional check-ins', 'With close friends/family', 'In a social group'],
    key: 'stressSocialPref',
  },
  {
    id: 16, category: 'Favourite Activities', emoji: '💧',
    question: 'How much water do you drink daily?',
    type: 'single',
    options: ['Less than 1 litre', '1-2 litres', '2-3 litres', 'More than 3 litres'],
    key: 'waterIntake',
  },
  {
    id: 17, category: 'Favourite Activities', emoji: '🌿',
    question: 'Which nature-related activity resonates with you most?',
    type: 'single',
    options: ['Walking / Hiking outdoors', 'Sitting in a park', 'Gardening', 'None — I prefer indoors'],
    key: 'natureActivity',
  },
  {
    id: 18, category: 'Favourite Activities', emoji: '🎨',
    question: 'Do you have a creative outlet that helps you cope?',
    type: 'single',
    options: ['Yes — I use it regularly', 'Yes — but not often enough', 'I want to find one', 'Not really'],
    key: 'creativeOutlet',
  },
  {
    id: 19, category: 'Favourite Activities', emoji: '👥',
    question: 'How strong is your support system (friends, family, mentor)?',
    type: 'scale',
    min: 1, max: 5, labels: ['Very weak', 'Weak', 'Moderate', 'Strong', 'Very strong'],
    key: 'supportSystem',
  },
  {
    id: 20, category: 'Favourite Activities', emoji: '💡',
    question: 'What kind of support helps you most when overwhelmed?',
    type: 'single',
    options: ['Someone to listen to me', 'Practical advice / tips', 'Distraction / activities', 'Time alone', 'Professional guidance'],
    key: 'preferredSupport',
  },
];

// ─── Scale component ──────────────────────────────────────────────────────────
function ScaleSelector({ question, value, onChange }) {
  const steps = Array.from({ length: question.max - question.min + 1 }, (_, i) => i + question.min);
  return (
    <View>
      <View style={scaleStyles.row}>
        {steps.map(s => (
          <TouchableOpacity
            key={s}
            style={[scaleStyles.bubble, value === s && scaleStyles.bubbleActive]}
            onPress={() => onChange(s)}
          >
            <Text style={[scaleStyles.bubbleText, value === s && scaleStyles.bubbleTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={scaleStyles.labelsRow}>
        <Text style={scaleStyles.labelText}>{question.labels[0]}</Text>
        <Text style={scaleStyles.labelText}>{question.labels[question.labels.length - 1]}</Text>
      </View>
    </View>
  );
}
const scaleStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 },
  bubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', borderWidth: 2,
            borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  bubbleActive: { backgroundColor: theme.colors.teal, borderColor: theme.colors.teal },
  bubbleText: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textSecondary },
  bubbleTextActive: { color: 'white' },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  labelText: { fontSize: 11, color: theme.colors.textSecondary, maxWidth: 100 },
});

// ─── Main Onboarding Screen ──────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { setOnboardingAnswers, user, setUser } = useStore(s => ({
    setOnboardingAnswers: s.setOnboardingAnswers,
    user: s.user,
    setUser: s.setUser,
  }));

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers]  = useState({});
  const slideAnim = useRef(new Animated.Value(0)).current;

  const q = QUESTIONS[current];
  const progress = (current + 1) / QUESTIONS.length;
  const answer = answers[q.key];

  // Determine if this question is answered — NO SKIP allowed
  const isAnswered = () => {
    if (q.type === 'multi') return (answer || []).length > 0;
    return answer !== undefined && answer !== null;
  };

  const animateNext = (dir = 1) => {
    slideAnim.setValue(dir * W);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
  };

  const handleNext = () => {
    // All questions are compulsory — must answer before proceeding
    if (!isAnswered()) return;

    if (current < QUESTIONS.length - 1) {
      animateNext(1);
      setCurrent(c => c + 1);
    } else {
      // All done — save answers and complete onboarding
      setOnboardingAnswers(answers);
      setUser({ ...user, onboardingDone: true, stressProfile: buildStressProfile(answers) });
    }
  };

  const handleBack = () => {
    if (current > 0) {
      animateNext(-1);
      setCurrent(c => c - 1);
    }
  };

  const setAnswer = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

  const toggleMulti = (key, opt) => {
    const curr = answers[key] || [];
    const next = curr.includes(opt) ? curr.filter(o => o !== opt) : [...curr, opt];
    setAnswer(key, next);
  };

  // Build a personalized stress profile from answers
  const buildStressProfile = (ans) => ({
    baselineStress: (ans.currentStressLevel || 5) * 10,
    primaryTrigger: ans.stressTrigger || 'Unknown',
    preferredSupport: ans.preferredSupport || 'Someone to listen',
    relaxActivities: ans.relaxActivities || [],
    peakEnergyTime: ans.peakEnergyTime || 'Morning',
    socialPref: ans.stressSocialPref || 'Alone',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MindEase 🌿</Text>
        <Text style={styles.headerSub}>Building your wellness profile</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressCount}>{current + 1} / {QUESTIONS.length}</Text>
          <Text style={styles.categoryLabel}>{q.category}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        {/* Step dots for category */}
        <View style={styles.categoryDots}>
          <View style={[styles.categoryDot, current < 10 ? styles.dotTeal : styles.dotGray]}>
            <Text style={styles.categoryDotText}>Stress</Text>
          </View>
          <View style={styles.categoryLine} />
          <View style={[styles.categoryDot, current >= 10 ? styles.dotPurple : styles.dotGray]}>
            <Text style={styles.categoryDotText}>Activities</Text>
          </View>
        </View>
      </View>

      {/* Question Card */}
      <Animated.View style={[styles.card, { transform: [{ translateX: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.emojiBox}>
            <Text style={styles.emoji}>{q.emoji}</Text>
          </View>
          <Text style={styles.question}>{q.question}</Text>
          {q.type === 'multi' && (
            <Text style={styles.multiHint}>Select all that apply</Text>
          )}

          {/* Compulsory notice */}
          <View style={styles.requiredNotice}>
            <Text style={styles.requiredText}>✱ This question is required</Text>
          </View>

          {/* Single choice */}
          {q.type === 'single' && (
            <View style={styles.options}>
              {q.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.optionBtn, answer === opt && styles.optionBtnActive]}
                  onPress={() => setAnswer(q.key, opt)}
                >
                  <View style={[styles.optionRadio, answer === opt && styles.optionRadioActive]}>
                    {answer === opt && <View style={styles.optionRadioDot} />}
                  </View>
                  <Text style={[styles.optionText, answer === opt && styles.optionTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Multi select */}
          {q.type === 'multi' && (
            <View style={styles.multiGrid}>
              {q.options.map((opt, i) => {
                const selected = (answer || []).includes(opt);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => toggleMulti(q.key, opt)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Scale */}
          {q.type === 'scale' && (
            <ScaleSelector question={q} value={answer} onChange={v => setAnswer(q.key, v)} />
          )}
        </ScrollView>
      </Animated.View>

      {/* Navigation — NO SKIP option */}
      <View style={styles.navRow}>
        {current > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 80 }} />}

        <View style={{ width: 60 }} />

        <TouchableOpacity
          style={[styles.nextBtn, !isAnswered() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!isAnswered()}
        >
          <Text style={styles.nextBtnText}>
            {current === QUESTIONS.length - 1 ? '✓ Finish' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F0FDF9' },

  // Header
  header:          { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  headerTitle:     { fontSize: 26, fontWeight: 'bold', color: theme.colors.teal },
  headerSub:       { fontSize: 13, color: theme.colors.textSecondary, marginTop: 3 },

  // Progress
  progressSection: { paddingHorizontal: 20, marginBottom: 10 },
  progressRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressCount:   { fontSize: 13, fontWeight: 'bold', color: theme.colors.teal },
  categoryLabel:   { fontSize: 12, color: theme.colors.textSecondary,
                     backgroundColor: '#E6F4EF', paddingHorizontal: 10, paddingVertical: 3,
                     borderRadius: 10, overflow: 'hidden' },
  progressTrack:   { height: 6, backgroundColor: '#D1FAE5', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill:    { height: '100%', backgroundColor: theme.colors.teal, borderRadius: 3 },
  categoryDots:    { flexDirection: 'row', alignItems: 'center' },
  categoryDot:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  dotTeal:         { backgroundColor: theme.colors.teal },
  dotPurple:       { backgroundColor: theme.colors.purple },
  dotGray:         { backgroundColor: '#E5E7EB' },
  categoryDotText: { fontSize: 11, fontWeight: 'bold', color: 'white' },
  categoryLine:    { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 8 },

  // Card
  card:            { flex: 1, marginHorizontal: 16, backgroundColor: 'white',
                     borderRadius: 24, padding: 24, elevation: 3,
                     shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  emojiBox:        { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0FDF9',
                     justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emoji:           { fontSize: 28 },
  question:        { fontSize: 19, fontWeight: 'bold', color: theme.colors.text,
                     lineHeight: 28, marginBottom: 8 },
  multiHint:       { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8, fontStyle: 'italic' },
  requiredNotice:  { marginBottom: 12 },
  requiredText:    { fontSize: 11, color: theme.colors.error, fontWeight: '600' },

  // Single select options
  options:         { gap: 10, marginTop: 8 },
  optionBtn:       { flexDirection: 'row', alignItems: 'center', padding: 14,
                     borderRadius: 14, borderWidth: 2, borderColor: theme.colors.border,
                     backgroundColor: '#FAFAFA' },
  optionBtnActive: { borderColor: theme.colors.teal, backgroundColor: '#E6F4EF' },
  optionRadio:     { width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                     borderColor: theme.colors.border, marginRight: 14,
                     justifyContent: 'center', alignItems: 'center' },
  optionRadioActive: { borderColor: theme.colors.teal },
  optionRadioDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.teal },
  optionText:      { fontSize: 15, color: theme.colors.text, flex: 1 },
  optionTextActive:{ color: theme.colors.teal, fontWeight: '600' },

  // Multi-select chips
  multiGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  chip:            { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                     borderWidth: 2, borderColor: theme.colors.border, backgroundColor: '#FAFAFA' },
  chipActive:      { borderColor: theme.colors.teal, backgroundColor: '#E6F4EF' },
  chipText:        { fontSize: 14, color: theme.colors.textSecondary },
  chipTextActive:  { color: theme.colors.teal, fontWeight: 'bold' },

  // Nav — NO SKIP
  navRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     padding: 20, paddingBottom: 30 },
  backBtn:         { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
                     backgroundColor: '#F3F4F6' },
  backBtnText:     { color: theme.colors.textSecondary, fontWeight: 'bold', fontSize: 15 },
  nextBtn:         { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14,
                     backgroundColor: theme.colors.teal,
                     shadowColor: theme.colors.teal, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  nextBtnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  nextBtnText:     { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
