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
