import { Redirect } from 'expo-router';

/** Étape 0 : l'accueil redirige vers la démonstration des composants (remplacé à l'étape 2). */
export default function Index() {
  return <Redirect href="/demo" />;
}
