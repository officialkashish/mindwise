import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../theme/theme';

export default function AuthScreen() {
  const setUser = useStore(state => state.setUser);
  const setOnboardingAnswers = useStore(state => state.setOnboardingAnswers);
  const [isLogin, setIsLogin] = useState(true);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '', college: '', email: '', password: '',
    familyName: '', familyPhone: '',
    mentorName: '', mentorPhone: ''
  });

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!formData.password.trim()) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Min 6 characters';

    if (!isLogin) {
      if (!formData.name.trim()) errs.name = 'Full name is required';
      if (!formData.college.trim()) errs.college = 'College name is required';
      if (!formData.familyName.trim()) errs.familyName = 'Family member name is required';
      if (!formData.familyPhone.trim()) errs.familyPhone = 'Family phone is required';
      else if (!/^\d{10,15}$/.test(formData.familyPhone.replace(/\D/g, '')))
        errs.familyPhone = 'Enter a valid phone number';
      if (!formData.mentorName.trim()) errs.mentorName = 'Mentor name is required';
      if (!formData.mentorPhone.trim()) errs.mentorPhone = 'Mentor phone is required';
      else if (!/^\d{10,15}$/.test(formData.mentorPhone.replace(/\D/g, '')))
        errs.mentorPhone = 'Enter a valid phone number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setUser({
      name: formData.name || 'Student',
      college: formData.college || 'University',
      email: formData.email,
      isGuest: false,
      sosContacts: {
        family: { name: formData.familyName, phone: formData.familyPhone },
        mentor: { name: formData.mentorName, phone: formData.mentorPhone },
      },
      contacts: [formData.familyPhone, formData.mentorPhone].filter(Boolean),
    });
  };

  const handleGuest = () => {
    setUser({
      name: 'Guest',
      college: 'Explorer',
      email: 'guest@mindease.app',
      isGuest: true,
      sosContacts: { family: { name: '', phone: '' }, mentor: { name: '', phone: '' } },
      contacts: [],
    });
    // Skip onboarding for guest
    setOnboardingAnswers({ guest: true });
  };

  const updateField = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const renderInput = (key, placeholder, options = {}) => (
    <View style={st.fieldWrap}>
      <TextInput
        style={[st.input, errors[key] && st.inputError]}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={formData[key]}
        onChangeText={(t) => updateField(key, t)}
        {...options}
      />
      {errors[key] && <Text style={st.errorText}>{errors[key]}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={st.container}>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <Text style={st.title}>MindEase 🌿</Text>
        <Text style={st.subtitle}>Your student mental wellness platform</Text>

        <View style={st.features}>
          <Text style={st.featureItem}>🧠 Emotion AI</Text>
          <Text style={st.featureItem}>❤️ Health Sync</Text>
          <Text style={st.featureItem}>🚨 SOS Safety</Text>
        </View>

        {/* Tabs */}
        <View style={st.tabs}>
          <TouchableOpacity onPress={() => setIsLogin(true)} style={[st.tab, isLogin && st.activeTab]}>
            <Text style={[st.tabText, isLogin && st.activeTabText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsLogin(false)} style={[st.tab, !isLogin && st.activeTab]}>
            <Text style={[st.tabText, !isLogin && st.activeTabText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={st.form}>
          {!isLogin && (
            <>
              <Text style={st.sectionLabel}>📋 Personal Info</Text>
              {renderInput('name', 'Full Name *')}
              {renderInput('college', 'College / University *')}
            </>
          )}

          {renderInput('email', 'Email *', { keyboardType: 'email-address', autoCapitalize: 'none' })}
          {renderInput('password', 'Password *', { secureTextEntry: true })}

          {!isLogin && (
            <>
              <Text style={st.sectionLabel}>🚨 SOS Emergency Contacts (Required)</Text>
              <Text style={st.sectionHint}>These contacts will be notified in emergencies — they cannot be skipped.</Text>

              <View style={st.contactCard}>
                <Text style={st.contactCardTitle}>👨‍👩‍👧 Trusted Family Member</Text>
                {renderInput('familyName', 'Family Member Name *')}
                {renderInput('familyPhone', 'Phone Number *', { keyboardType: 'phone-pad' })}
              </View>

              <View style={st.contactCard}>
                <Text style={st.contactCardTitle}>🎓 Trusted Mentor / Counselor</Text>
                {renderInput('mentorName', 'Mentor Name *')}
                {renderInput('mentorPhone', 'Phone Number *', { keyboardType: 'phone-pad' })}
              </View>
            </>
          )}

          <TouchableOpacity style={st.button} onPress={handleSubmit}>
            <Text style={st.buttonText}>{isLogin ? 'Login' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={st.divider}>
          <View style={st.dividerLine} />
          <Text style={st.dividerText}>OR</Text>
          <View style={st.dividerLine} />
        </View>

        {/* Guest */}
        <TouchableOpacity style={st.guestButton} onPress={handleGuest}>
          <Text style={st.guestButtonText}>👤 Continue as Guest</Text>
        </TouchableOpacity>
        <Text style={st.guestHint}>
          Guest mode has limited features. SOS, community, and personalized support require sign-up.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 20, alignItems: 'center', paddingTop: 50, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: theme.colors.teal, marginBottom: 8 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 24 },
  features: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  featureItem: {
    backgroundColor: '#E6F4EF', padding: 8, paddingHorizontal: 12,
    borderRadius: 12, color: theme.colors.teal, fontSize: 12, overflow: 'hidden', fontWeight: '600'
  },
  tabs: { flexDirection: 'row', width: '100%', marginBottom: 20, backgroundColor: '#eee', borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: 'white', elevation: 2 },
  tabText: { color: 'gray', fontWeight: 'bold', fontSize: 15 },
  activeTabText: { color: theme.colors.teal },
  form: { width: '100%', gap: 12 },
  sectionLabel: { fontSize: 15, fontWeight: 'bold', color: theme.colors.text, marginTop: 12, marginBottom: 2 },
  sectionHint: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8, lineHeight: 17 },
  fieldWrap: { width: '100%' },
  input: {
    backgroundColor: 'white', padding: 15, borderRadius: 10,
    borderWidth: 1.5, borderColor: theme.colors.border, fontSize: 15
  },
  inputError: { borderColor: theme.colors.error, backgroundColor: '#FEF2F2' },
  errorText: { color: theme.colors.error, fontSize: 12, marginTop: 4, marginLeft: 4 },
  contactCard: {
    backgroundColor: '#F0FDF9', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#BBF7D0', gap: 10, marginBottom: 4
  },
  contactCardTitle: { fontSize: 14, fontWeight: 'bold', color: theme.colors.teal, marginBottom: 2 },
  button: { backgroundColor: theme.colors.teal, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { paddingHorizontal: 16, color: theme.colors.textSecondary, fontWeight: 'bold', fontSize: 13 },
  guestButton: {
    width: '100%', padding: 16, borderRadius: 12, alignItems: 'center',
    borderWidth: 2, borderColor: theme.colors.teal, backgroundColor: 'white'
  },
  guestButtonText: { color: theme.colors.teal, fontWeight: 'bold', fontSize: 16 },
  guestHint: {
    fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center',
    marginTop: 10, lineHeight: 17, paddingHorizontal: 20
  },
});
