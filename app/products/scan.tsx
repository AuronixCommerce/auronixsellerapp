import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Screen } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import type { AppColors } from '@/src/theme';

export default function ProductBarcodeScanner() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  function onScan(result: BarcodeScanningResult) {
    if (scanned || !result.data?.trim()) return;
    setScanned(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    router.replace({ pathname: '/products/new', params: { barcode: result.data.trim(), barcodeType: result.type } });
  }

  if (!permission) return <Screen><View style={styles.center}><Text style={styles.body}>Checking camera permission…</Text></View></Screen>;
  if (!permission.granted) return <Screen><View style={styles.center}><View style={styles.permissionIcon}><Ionicons name="camera-outline" size={34} color={colors.accent} /></View><Text style={styles.title}>Camera access required</Text><Text style={styles.body}>Auronix Seller uses the camera only to scan product barcodes for UPC/EAN entry.</Text><PrimaryButton onPress={() => void requestPermission()}>Allow Camera</PrimaryButton><PrimaryButton tone="quiet" onPress={() => router.back()}>Cancel</PrimaryButton></View></Screen>;

  return <View style={styles.root}><CameraView style={StyleSheet.absoluteFill} facing="back" enableTorch={torch} onBarcodeScanned={scanned ? undefined : onScan} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14'] }} /><View style={styles.overlay}><View style={styles.top}><Pressable onPress={() => router.back()} style={styles.control}><Ionicons name="close" size={23} color="#fff" /></Pressable><Text style={styles.topTitle}>Scan product barcode</Text><Pressable onPress={() => setTorch(value => !value)} style={styles.control}><Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color="#fff" /></Pressable></View><View style={styles.scanArea}><View style={styles.frame}><View style={[styles.corner, styles.tl]} /><View style={[styles.corner, styles.tr]} /><View style={[styles.corner, styles.bl]} /><View style={[styles.corner, styles.br]} /></View><Text style={styles.hint}>Align UPC or EAN inside the frame</Text></View><View style={styles.bottom}><Text style={styles.bottomText}>Barcode data is used only to prefill the product record.</Text></View></View></View>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 12 }, permissionIcon: { width: 70, height: 70, borderRadius: 24, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center' }, body: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 320 }, overlay: { ...StyleSheet.absoluteFill, justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,.18)' }, top: { paddingTop: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, topTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '900', textAlign: 'center' }, control: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.46)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center' }, scanArea: { alignItems: 'center', gap: 18 }, frame: { width: '82%', aspectRatio: 1.7, borderRadius: 24, backgroundColor: 'rgba(0,0,0,.08)' }, corner: { position: 'absolute', width: 34, height: 34, borderColor: '#fff' }, tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 }, tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 }, bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 }, br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 }, hint: { color: '#fff', fontSize: 12, fontWeight: '800', backgroundColor: 'rgba(0,0,0,.42)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }, bottom: { paddingHorizontal: 28, paddingBottom: 46 }, bottomText: { color: 'rgba(255,255,255,.74)', fontSize: 10, lineHeight: 15, textAlign: 'center' },
}); }
