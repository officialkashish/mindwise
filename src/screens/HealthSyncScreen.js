import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Activity, Moon, Zap, AlertTriangle } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useStore } from '../store/useStore';

export default function HealthSyncScreen({ navigation }) {
  const [connectedApp, setConnectedApp] = useState(null);
  const [showConsent, setShowConsent] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const stressScore = useStore(s => s.stressScore);

  const healthApps = [
    { id: 'apple', name: 'Apple Health', icon: '🍎', color: '#FECDD3' },
    { id: 'google', name: 'Google Fit', icon: '💚', color: '#D1FAE5' },
    { id: 'fitbit', name: 'Fitbit', icon: '⌚', color: '#DBEAFE' },
    { id: 'samsung', name: 'Samsung Health', icon: '📱', color: '#E0E7FF' },
  ];

  const healthData = { hr: 82, steps: 2800, sleep: 5.5, hrv: 28, restingHr: 65, recovery: 45, calories: 1840, water: 4 };
  const hasHighRisk = healthData.hrv < 30 && healthData.steps < 3000 && healthData.sleep < 6;

  const handleConnect = (app) => { setSelectedApp(app); setShowConsent(true); };
  const confirmConnect = () => { setConnectedApp(selectedApp.id); setShowConsent(false); };

  // Chart bars data
  const chartData = [
    { day: 'M', val: 40, color: '#10B981' },
    { day: 'T', val: 60, color: '#F59E0B' },
    { day: 'W', val: 30, color: '#10B981' },
    { day: 'T', val: 80, color: '#EF4444' },
    { day: 'F', val: 50, color: '#F59E0B' },
    { day: 'S', val: 70, color: '#F59E0B' },
    { day: 'S', val: 90, color: '#EF4444' },
  ];

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Health & Fitness</Text>
        <Text style={s.headerSub}>Track your physical and mental wellness</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {!connectedApp ? (
          /* Connect Section */
          <View>
            <View style={s.connectHeader}>
              <Text style={{ fontSize: 40 }}>⌚</Text>
              <Text style={s.connectTitle}>Connect Your Device</Text>
              <Text style={s.connectDesc}>Link a fitness tracker to get personalized stress insights based on your body signals.</Text>
            </View>

            {healthApps.map(app => (
              <TouchableOpacity key={app.id} style={s.appCard} onPress={() => handleConnect(app)} activeOpacity={0.85}>
                <View style={[s.appIcon, { backgroundColor: app.color }]}>
                  <Text style={{ fontSize: 22 }}>{app.icon}</Text>
                </View>
                <Text style={s.appName}>{app.name}</Text>
                <View style={s.connectBtn}>
                  <Text style={s.connectBtnText}>Connect</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* Dashboard */
          <View>
            {/* Warning */}
            {hasHighRisk && (
              <View style={s.warningCard}>
                <AlertTriangle color="white" size={22} />
                <View style={{ flex: 1 }}>
                  <Text style={s.warningTitle}>Elevated Stress Risk</Text>
                  <Text style={s.warningSub}>Low HRV, poor sleep, and low activity detected.</Text>
                </View>
              </View>
            )}

            {/* Stress Score */}
            <View style={s.stressCard}>
              <View style={s.stressCircle}>
                <Text style={s.stressValue}>{stressScore || 42}</Text>
                <Text style={s.stressUnit}>/ 100</Text>
              </View>
              <View>
                <Text style={s.stressLabel}>Stress Index</Text>
                <Text style={s.stressStatus}>{stressScore > 70 ? '🔴 High' : stressScore > 40 ? '🟡 Moderate' : '🟢 Low'}</Text>
              </View>
            </View>

            {/* Metrics Grid */}
            <View style={s.metricsGrid}>
              {[
                { emoji: '❤️', val: `${healthData.hr}`, unit: 'BPM', label: 'Heart Rate', color: '#FEE2E2' },
                { emoji: '👟', val: healthData.steps.toLocaleString(), unit: '', label: 'Steps', color: '#D1FAE5' },
                { emoji: '🌙', val: `${healthData.sleep}`, unit: 'hrs', label: 'Sleep', color: '#E0E7FF' },
                { emoji: '⚡', val: `${healthData.hrv}`, unit: 'ms', label: 'HRV', color: '#FEF3C7' },
                { emoji: '🔥', val: healthData.calories.toLocaleString(), unit: 'cal', label: 'Calories', color: '#FECDD3' },
                { emoji: '💧', val: `${healthData.water}`, unit: 'cups', label: 'Water', color: '#DBEAFE' },
              ].map((m, i) => (
                <View key={i} style={s.metricCard}>
                  <View style={[s.metricIconBg, { backgroundColor: m.color }]}>
                    <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                  </View>
                  <Text style={s.metricVal}>{m.val}<Text style={s.metricUnit}> {m.unit}</Text></Text>
                  <Text style={s.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>

            {/* Chart */}
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>7-Day Stress Trends</Text>
              <View style={s.chartArea}>
                {chartData.map((d, i) => (
                  <View key={i} style={s.chartCol}>
                    <View style={[s.chartBar, { height: `${d.val}%`, backgroundColor: d.color }]} />
                    <Text style={s.chartDay}>{d.day}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Insights */}
            <View style={s.insightsCard}>
              <Text style={s.insightsTitle}>💡 AI Insights</Text>
              <View style={s.insightRow}>
                <Text style={s.insightDot}>🔴</Text>
                <Text style={s.insightText}>Your sleep dropped below 6 hours — this correlates with your higher stress on Thursday.</Text>
              </View>
              <View style={s.insightRow}>
                <Text style={s.insightDot}>🟡</Text>
                <Text style={s.insightText}>Step count is below target. A 20-min walk could reduce stress by ~15%.</Text>
              </View>
              <View style={s.insightRow}>
                <Text style={s.insightDot}>🟢</Text>
                <Text style={s.insightText}>HRV improving on rest days — keep scheduling downtime!</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={s.actionBtnText}>📸 View Live Emotion Detection</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#7F77DD', marginTop: 10 }]} onPress={() => navigation.navigate('Main', { screen: 'Chat' })}>
              <Text style={s.actionBtnText}>🌿 Talk to Milo About Your Health</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Consent Modal */}
        <Modal visible={showConsent} transparent animationType="slide">
          <View style={s.modalBg}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>Connect {selectedApp?.name}</Text>
              <Text style={s.modalDesc}>MindEase needs access to health data to calculate your stress index:</Text>
              <View style={s.consentList}>
                <Text style={s.consentItem}>❤️ Heart Rate & HRV</Text>
                <Text style={s.consentItem}>👟 Step Count & Activity</Text>
                <Text style={s.consentItem}>🌙 Sleep Analysis</Text>
              </View>
              <View style={s.modalActions}>
                <TouchableOpacity onPress={() => setShowConsent(false)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.allowBtn} onPress={confirmConnect}>
                  <Text style={s.allowText}>Allow Access</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },

  header: { backgroundColor: '#1D9E75', paddingTop: 18, paddingBottom: 22, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  scroll: { padding: 16, paddingBottom: 30 },

  // Connect
  connectHeader: { alignItems: 'center', paddingVertical: 30, backgroundColor: 'white', borderRadius: 20, marginBottom: 16, padding: 24 },
  connectTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginTop: 12 },
  connectDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 10 },

  appCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 10, elevation: 1 },
  appIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  appName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  connectBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  connectBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },

  // Warning
  warningCard: { backgroundColor: '#EF4444', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  warningTitle: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  warningSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },

  // Stress Score
  stressCard: { flexDirection: 'row', alignItems: 'center', gap: 18, backgroundColor: 'white', padding: 20, borderRadius: 18, marginBottom: 16, elevation: 2 },
  stressCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#1D9E75', justifyContent: 'center', alignItems: 'center' },
  stressValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  stressUnit: { fontSize: 11, color: '#9CA3AF' },
  stressLabel: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  stressStatus: { fontSize: 14, marginTop: 4 },

  // Metrics
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metricCard: { width: '31%', backgroundColor: 'white', padding: 14, borderRadius: 16, alignItems: 'center', elevation: 1 },
  metricIconBg: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  metricVal: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  metricUnit: { fontSize: 12, fontWeight: '400', color: '#6B7280' },
  metricLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },

  // Chart
  chartCard: { backgroundColor: 'white', padding: 20, borderRadius: 18, marginBottom: 16, elevation: 1 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },
  chartArea: { height: 140, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  chartCol: { alignItems: 'center', flex: 1, gap: 6 },
  chartBar: { width: 24, borderRadius: 6 },
  chartDay: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },

  // Insights
  insightsCard: { backgroundColor: 'white', padding: 18, borderRadius: 18, marginBottom: 16, elevation: 1 },
  insightsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 12 },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  insightDot: { fontSize: 14, marginTop: 2 },
  insightText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },

  // Actions
  actionBtn: { backgroundColor: '#1D9E75', padding: 16, borderRadius: 14, alignItems: 'center' },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 24, borderRadius: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalDesc: { fontSize: 14, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  consentList: { marginBottom: 20, gap: 10 },
  consentItem: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14 },
  cancelText: { color: '#6B7280', fontWeight: 'bold', fontSize: 15, padding: 10 },
  allowBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  allowText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
