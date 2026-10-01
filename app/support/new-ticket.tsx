import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard, Header, PrimaryButton, Screen, useUIStyles } from '@/components/ui';
import { useAuth } from '@/src/context/auth';
import { useAppTheme } from '@/src/context/theme';
import { createPublicTicket } from '@/src/lib/api';
import { supportService } from '@/src/services/support-service';
import type { AppColors } from '@/src/theme';

const categories = ['General Support', 'Seller Account', 'Application', 'Verification', 'Catalogs & Products', 'Marketplace Operations', 'Security Concern'];
const priorities = ['normal', 'high', 'urgent'] as const;

export default function NewTicket() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const ui = useUIStyles();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [form, setForm] = useState({ name: '', email: user?.email || '', category: '', subject: '', message: '', priority: 'normal' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  const update = (key: keyof typeof form, value: string) => setForm(old => ({ ...old, [key]: value }));

  async function submit() {
    if ((!user && (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email))) || !form.category || form.subject.trim().length < 3 || form.message.trim().length < 10) {
      setError('Complete each required field and provide enough detail.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (user) {
        const result = await supportService.create({ subject: form.subject, category: form.category, message: form.message, priority: form.priority });
        setReference(result.ticket.id);
      } else {
        setReference(await createPublicTicket(form));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create your ticket.');
    } finally {
      setBusy(false);
    }
  }

  if (reference) {
    return <Screen><View style={styles.successWrap}><GlassCard style={styles.success}><View style={styles.check}><Ionicons name="checkmark" size={31} color={colors.inverse} /></View><Text style={styles.successTitle}>Ticket created</Text><Text style={ui.body}>Your request is now connected to Auronix Support.</Text><View style={styles.reference}><Text style={ui.label}>REFERENCE</Text><Text selectable style={styles.referenceText}>{reference}</Text></View>{user ? <PrimaryButton onPress={() => router.replace({ pathname: '/support/[id]', params: { id: reference } })}>Open ticket</PrimaryButton> : <PrimaryButton onPress={() => router.back()}>Done</PrimaryButton>}</GlassCard></View></Screen>;
  }

  return <Screen><Header eyebrow="SECURE SUPPORT REQUEST" title="Create a ticket" action={<Pressable onPress={() => router.back()}><Ionicons name="close-circle" size={30} color={colors.muted} /></Pressable>} /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}><GlassCard style={styles.form}>
    {!user ? <><Text style={ui.label}>Full name</Text><TextInput style={ui.input} value={form.name} onChangeText={value => update('name', value)} placeholder="Your name" placeholderTextColor={colors.muted} /><Text style={ui.label}>Email</Text><TextInput autoCapitalize="none" keyboardType="email-address" style={ui.input} value={form.email} onChangeText={value => update('email', value)} placeholder="name@company.com" placeholderTextColor={colors.muted} /></> : null}
    <Text style={ui.label}>Category</Text><View style={styles.categories}>{categories.map(item => <Pressable key={item} onPress={() => update('category', item)} style={[styles.category, form.category === item && styles.categoryActive]}><Text style={[styles.categoryText, form.category === item && styles.categoryTextActive]}>{item}</Text></Pressable>)}</View>
    {user ? <><Text style={ui.label}>Priority</Text><View style={styles.categories}>{priorities.map(item => <Pressable key={item} onPress={() => update('priority', item)} style={[styles.category, form.priority === item && styles.categoryActive]}><Text style={[styles.categoryText, form.priority === item && styles.categoryTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}</View></> : null}
    <Text style={ui.label}>Subject</Text><TextInput style={ui.input} value={form.subject} onChangeText={value => update('subject', value)} placeholder="Short summary" placeholderTextColor={colors.muted} />
    <Text style={ui.label}>What happened?</Text><TextInput multiline maxLength={5000} style={[ui.input, ui.textarea]} value={form.message} onChangeText={value => update('message', value)} placeholder="Describe the issue and what you need help with…" placeholderTextColor={colors.muted} />
    {error ? <Text style={styles.error}>{error}</Text> : null}<PrimaryButton loading={busy} onPress={submit}>Create support ticket</PrimaryButton><Text style={styles.fine}>Do not include passwords, codes, payment details, or secure links.</Text>
  </GlassCard></ScrollView></KeyboardAvoidingView></Screen>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({ form: { padding: 18, gap: 10 }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 4 }, category: { minHeight: 37, justifyContent: 'center', borderRadius: 999, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.chip }, categoryActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft }, categoryText: { color: colors.muted, fontSize: 11, fontWeight: '600' }, categoryTextActive: { color: colors.accent }, error: { color: colors.danger, fontSize: 12, lineHeight: 18 }, fine: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' }, successWrap: { flex: 1, justifyContent: 'center', padding: 22 }, success: { padding: 24, alignItems: 'center', gap: 14 }, check: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }, successTitle: { color: colors.ink, fontSize: 27, fontWeight: '900' }, reference: { alignSelf: 'stretch', padding: 15, borderRadius: 15, backgroundColor: colors.surfaceSoft, gap: 7 }, referenceText: { color: colors.ink, fontSize: 14, fontWeight: '700' } }); }
