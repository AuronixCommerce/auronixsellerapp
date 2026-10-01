import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard, PrimaryButton } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import type { AppColors } from '@/src/theme';

export function BarcodeScanner({ visible, onClose, onScanned }: { visible: boolean; onClose: () => void; onScanned: (value: string) => void }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);

  function scanned(result: BarcodeScanningResult) {
    if (locked || !result.data) return;
    setLocked(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    onScanned(result.data.trim());
    onClose();
    setTimeout(() => setLocked(false), 400);
  }

  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    <View style={styles.root}>
      <View style={styles.header}><Pressable onPress={onClose} style={styles.close}><Ionicons name="close" size={24} color={colors.ink} /></Pressable><View><Text style={styles.kicker}>PRODUCT SCANNER</Text><Text style={styles.title}>Scan barcode</Text></View></View>
      {!permission ? <View style={styles.center}><Text style={styles.body}>Checking camera permission…</Text></View> : !permission.granted ? <View style={styles.center}><GlassCard style={styles.permission}><Ionicons name="camera-outline" size={34} color={colors.accent} /><Text style={styles.permissionTitle}>Camera access required</Text><Text style={styles.body}>Auronix Seller uses the camera only while this scanner is open.</Text><PrimaryButton onPress={() => void requestPermission()}>Allow Camera</PrimaryButton></GlassCard></View> : <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={locked ? undefined : scanned}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14'] }}
        />
        <View pointerEvents="none" style={styles.overlay}><View style={styles.frame}><View style={[styles.corner, styles.tl]} /><View style={[styles.corner, styles.tr]} /><View style={[styles.corner, styles.bl]} /><View style={[styles.corner, styles.br]} /></View><Text style={styles.hint}>Center the UPC, EAN or product barcode inside the frame</Text></View>
      </View>}
    </View>
  </Modal>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14 }, close: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border }, kicker: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 }, title: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: 2 }, center: { flex: 1, justifyContent: 'center', padding: 24 }, permission: { padding: 24, gap: 12, alignItems: 'center' }, permissionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' }, body: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' }, cameraWrap: { flex: 1, overflow: 'hidden', margin: 14, borderRadius: 28, backgroundColor: '#000' }, overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.18)' }, frame: { width: '82%', height: 190, position: 'relative' }, corner: { position: 'absolute', width: 42, height: 42, borderColor: '#fff' }, tl: { left: 0, top: 0, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 16 }, tr: { right: 0, top: 0, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 16 }, bl: { left: 0, bottom: 0, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 16 }, br: { right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 16 }, hint: { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 22, paddingHorizontal: 28 },
}); }
