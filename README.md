# Menu Collector

Interface web mobile-first pour collecter les cartes de restaurants.
Le client remplit → tu reçois un PDF par email + une notif WhatsApp.

## Setup Resend (envoi email)

1. Va sur [resend.com](https://resend.com) → crée un compte (gratuit)
2. Dashboard → API Keys → Create API Key
3. Copie la clé
4. Dans Vercel → Settings → Environment Variables → ajoute :
   - Name: `RESEND_API_KEY`
   - Value: ta clé Resend
5. Redéploie
