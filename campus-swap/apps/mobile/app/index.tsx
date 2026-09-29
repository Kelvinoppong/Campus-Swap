import { Redirect } from 'expo-router';

import { useAuth } from '@/state/auth';

/** Entry point: straight to the feed if the keychain still has a session. */
export default function Index() {
  const ready = useAuth((state) => state.ready);
  const accessToken = useAuth((state) => state.accessToken);

  if (!ready) return null;
  return <Redirect href={accessToken ? '/(tabs)' : '/sign-in'} />;
}
