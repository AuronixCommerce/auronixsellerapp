import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { GlassCard, PrimaryButton } from '@/components/ui';
import { useAppTheme } from '@/src/context/theme';
import { appConfigService, compareVersions, type SellerMobileConfig } from '@/src/services/app-config-service';
import type { AppColors } from '@/src/theme';

const DISMISSED_KEY = 'auronix.seller.optional-update-dismissed';

function storeUrl(config: SellerMobileConfig) {
  return Platform.OS === 'ios' ? config.iosStoreUrl : config.androidStoreUrl;
}

export function UpdateGate({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [blocking, setBlocking] = useState<SellerMobileConfig | null>(null);
  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const config = await appConfigService.load();
        if (!mounted || !config.configured || !config.latestVersion) return;
        const belowMinimum = Boolean(config.minimumVersion && compareVersions(currentVersion, config.minimumVersion) < 0);
        const newerAvailable = compareVersions(currentVersion, config.latestVersion) < 0;
        if (newerAvailable && (config.forceUpdate || belowMinimum)) {
          setBlocking(config);
          return;
        }
        if (!newerAvailable) return;
        const dismissed = await AsyncStorage.getItem(DISMISSED_KEY).catch(() => null);
        if (dismissed === config.latestVersion) return;
        Alert.alert(
          'Auronix Seller update available',
          config.message || `Version ${config.latestVersion} is available.`,
          [
            { text: 'Later', style: 'cancel', onPress: () => void AsyncStorage.setItem(DISMISSED_KEY, config.latestVersion || '') },
            ...(storeUrl(config) ? [{ text: 'Update', onPress: () => void Linking.openURL(storeUrl(config) as string) }] : []),
          ],
        );
      } catch {
        // Release checks must never block normal startup when the config endpoint is unreachable.
      }
    })();
    return () => { mounted = false; };
  }, [currentVersion]);

  if (!blocking) return children;

  const url = storeUrl(blocking);
  return <LinearGradient colors={[...colors.gradient]} style={styles.root}>
    <GlassCard style={styles.card}>
      <View style={styles.mark}><Text style={styles.markText}>A</Text></View>
      <Text style={styles.eyebrow}>AURONIX SELLER UPDATE</Text>
      <Text style={styles.title}>Update required</Text>
      <Text style={styles.body}>{blocking.message || `Version ${blocking.latestVersion} is required to continue using Auronix Seller.`}</Text>
      <View style={styles.versionBox}><Text style={styles.versionLabel}>INSTALLED</Text><Text style={styles.versionValue}>{currentVersion}</Text><Text style={styles.arrow}>→</Text><Text style={styles.versionLabel}>REQUIRED</Text><Text style={styles.versionValue}>{blocking.latestVersion}</Text></View>
      {url ? <PrimaryButton onPress={() => void Linking.openURL(url)}>Update Auronix Seller</PrimaryButton> : <Text style={styles.noStore}>A newer build is required, but no store URL is configured yet. Contact Auronix Support.</Text>}
    </GlassCard>
  </LinearGradient>;
}

function createStyles(colors: AppColors) { return StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 }, card: { width: '100%', maxWidth: 430, padding: 24, gap: 13, alignItems: 'center' }, mark: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.accentStrong, alignItems: 'center', justifyContent: 'center' }, markText: { color: colors.inverse, fontSize: 29, fontWeight: '900' }, eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, title: { color: colors.ink, fontSize: 27, fontWeight: '900', letterSpacing: -0.8 }, body: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' }, versionBox: { alignSelf: 'stretch', minHeight: 58, borderRadius: 16, backgroundColor: colors.surfaceSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10 }, versionLabel: { color: colors.muted, fontSize: 7, fontWeight: '900' }, versionValue: { color: colors.ink, fontSize: 12, fontWeight: '900' }, arrow: { color: colors.accent, fontSize: 16 }, noStore: { color: colors.warning, fontSize: 10, lineHeight: 15, textAlign: 'center' },
}); }
