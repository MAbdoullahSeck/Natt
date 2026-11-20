# Pages web de Natt

Pages statiques ouvertes **hors de l'application** : retour du paiement PayTech et invitation à rejoindre une tontine.

Supabase sert le HTML en texte brut sur `*.supabase.co` (Edge Functions comme Storage) : ces pages doivent être publiées
sur un hébergement statique (GitHub Pages, Netlify, Cloudflare Pages…) ou un futur domaine Natt.

Après publication, déclarer l'adresse aux Edge Functions (secret non sensible) :

```bash
npx supabase secrets set NATT_SITE_URL=https://<adresse-du-site> --project-ref vzvtuthjxyjaitesnvih
```

Sans `NATT_SITE_URL`, PayTech renvoie directement vers l'app (`natt://abonnement?paiement=…`)
et le lien d'invitation est uniquement le lien de l'app (`natt://`).
