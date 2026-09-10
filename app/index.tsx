import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { IOSSpinner, Screen } from '@/components/ui';
import { useAuth } from '@/src/context/auth';

export default function Index() {
  const { ready, user } = useAuth();
  if (!ready) return <Screen><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><IOSSpinner size={34} /></View></Screen>;
  return <Redirect href={user ? '/(tabs)/dashboard' : '/login'} />;
}
