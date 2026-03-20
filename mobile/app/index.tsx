import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href={'/(tabs)/terminal' as any} />;
  }
  return <Redirect href={'/login' as any} />;
}
