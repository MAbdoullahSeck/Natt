# Natt — Journal des décisions

Choix faits pendant le développement quand le cahier des charges, l'architecture ou le Figma ne tranchaient pas.
Chaque ligne indique l'étape, la décision et où la changer si besoin.

## Contexte général

- **Figma inaccessible** : le serveur MCP Figma a atteint la limite du forfait Starter dès l'étape 0. Seuls les composants Bouton principal, Bouton secondaire, Clavier numérique et Navigation ont été lus. Tous les écrans et leurs textes ont été écrits d'après le cahier des charges : **à comparer au Figma**.
- **Marathon des étapes 2 à 11** : réalisées d'une traite à la demande de la propriétaire du projet, sans validation intermédiaire.

## Étape 2 — Inscription

- **SMS** : pas de fournisseur. En local, `supabase/config.toml` active un fournisseur Twilio factice et 20 numéros de test à code fixe `123456` : `221770000001` à `221770000020` (les 9 premiers sont les personnes du seed). Aucun SMS n'est envoyé.
- **Numéro valide** : 9 chiffres commençant par 7 (mobiles sénégalais). Règle dans `src/domain/telephone.ts`.
- **Création du profil** : par la fonction `creer_profil(prenom, version)` plutôt que par un insert direct, pour que le téléphone vienne toujours du compte Auth et que la date du consentement soit celle du serveur.
- **Version du consentement** : `v1`, constante dans `src/domain/consentement.ts`.
- **Textes des écrans 01 à 04 et de « Mes droits »** : rédigés d'après le cahier des charges (Figma inaccessible).
- **Après le code SMS** : si le profil existe déjà (reconnexion), on va directement à l'accueil, sinon à l'écran Prénom.
