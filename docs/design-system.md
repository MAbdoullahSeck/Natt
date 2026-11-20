# Natt — Design system

Source : page « Natt · Composants » du fichier Figma. En cas d'écart, Figma fait foi.

## Couleurs

| Jeton | Valeur | Usage |
|---|---|---|
| `fond` | `#FFFFFF` | Fond de tous les écrans |
| `terracotta` | `#C65D3B` | Boutons principaux, liens, statut « En retard », onglet actif |
| `terracottaClair` | `#FAF4F0` | Cartes d'information, option sélectionnée |
| `terracottaPuce` | `#FAEEE8` | Fond de la puce « En retard » |
| `vert` | `#1F6B4F` | Statut « Payé », confirmations **uniquement** |
| `vertPuce` | `#EAF3EE` | Fond de la puce « Payé », cercle de confirmation |
| `texte` | `#1C1C1C` | Texte principal |
| `texteSecondaire` | `#68645F` | Texte secondaire, statut « En attente » |
| `grisPuce` | `#F1F0ED` | Fond de la puce « En attente » |
| `surface` | `#F6F5F2` | Touches du pavé, cartes grises, cases du code |
| `bordure` | `#DCD8D2` | Bordure des options et cartes |
| `bordureChamp` | `#A5A09A` | Bordure des champs de saisie |
| `separateur` | `#E8E5DF` | Lignes de liste, étapes non atteintes |
| `desactive` | `#E5E2DD` | Bouton principal désactivé |

### Palette sombre (mode sombre)

L'app suit le réglage du téléphone par défaut ; Profil → Apparence permet de choisir Automatique / Clair / Sombre (choix mémorisé). Mêmes jetons que la palette claire :

| Jeton | Sombre | Remarque |
|---|---|---|
| `fond` | `#121110` | |
| `surface` | `#1F1D1B` | Touches du pavé, cartes grises |
| `texte` | `#F2EFEA` | |
| `texteSecondaire` | `#B5AFA7` | Statut « En attente » |
| `terracotta` | `#E8896A` | Texte, liens, icônes, « En retard » (éclairci) |
| `fondAccent` | `#B5532F` | Fond des boutons principaux (texte blanc) — en clair : `#C65D3B` |
| `terracottaClair` | `#2A201B` | Cartes d'information |
| `terracottaPuce` | `#3D241B` | Puce « En retard » |
| `vert` | `#6BCB9B` | « Payé » (éclairci) |
| `vertPuce` | `#17332A` | Puce « Payé » |
| `grisPuce` | `#2E2B28` | Puce « En attente » |
| `bordure` / `bordureBoutonSecondaire` / `bordureChamp` | `#3A3633` / `#5A5550` / `#7A746D` | |
| `separateur` / `desactive` | `#2E2B28` / `#2E2B28` | |

Contrastes (WCAG 2.1, vérifiés par `src/theme/contraste.test.ts`) : en sombre, tous les statuts et textes sont ≥ 4,5:1 (AA). En clair (couleurs du Figma), deux écarts restent à arbitrer : « En retard » (terracotta sur sa puce) 3,67:1 et terracotta sur blanc 4,17:1 ; proposition : `#B24E2C` pour le texte terracotta (4,59:1 sur la puce, 5,23:1 sur blanc).

Le PDF du rapport reste toujours en clair. Les pages web (paiement, invitation) suivent `prefers-color-scheme`.

## Typographie (Nunito, interligne 125 %)

| Style | Taille | Graisse | Usage |
|---|---|---|---|
| `montantGeant` | 44 | Bold | Cagnotte, total du rapport |
| `titre` | 30 | Bold | Titre d'écran |
| `montant` | 28 | Bold | Montants des cartes, chiffres du pavé |
| `sousTitre` | 22–24 | Bold | Titres de cartes, options |
| `bouton` | 20 | Bold | Libellé du bouton principal |
| `corpsFort` | 18 | Bold | Libellés |
| `corps` | 16–18 | Regular | Textes secondaires |
| minimum | 16 | — | Aucun texte en dessous de 16 (14 toléré pour « Capture ») |

## Espacements et formes

- Marges latérales : 24. Grille de 8.
- Rayons : boutons et champs 16, cartes 16–20, touches 12, puces 8.
- Bouton principal : hauteur 56, plein terracotta, icône chevron blanche + libellé.
- Bouton secondaire : hauteur 56, fond blanc, bordure `#BDB8B1`.
- Champ : hauteur 64–80, bordure `bordureChamp`.
- Zones tactiles : 48 minimum.

## Composants

`EnTete` (Retour + fil d'Ariane + titre), `BarreEtapes` (6 segments), `BoutonPrincipal`, `BoutonSecondaire`, `ClavierNumerique`, `CaseCode` (6 chiffres), `ChampSaisie`, `OptionSelection` (icône, titre, sous-titre, rond de sélection), `PuceStatut` (Payé / En attente / En retard), `CarteTontine`, `LigneMembre` (prénom, statut, bouton « Marquer payé »), `LigneTour`, `Interrupteur`, `CarteInfo` (fond terracotta clair), `Notification`, `NavigationBas` (Accueil, Notifications, Profil).

Icônes : style trait (type Lucide), épaisseur 2, 24 px.
