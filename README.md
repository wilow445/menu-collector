# Menu Collector

Interface web mobile-first pour collecter les cartes de restaurants.
Le client remplit → tu reçois un message WhatsApp structuré.

## Setup

### 1. Configure ton numéro WhatsApp

Ouvre `app/page.js` et modifie la ligne :

```js
const WHATSAPP_NUMBER = "33612345678"
```

Remplace par ton numéro au format international sans le `+`.

### 2. Deploy sur Vercel

**Option A — Via GitHub :**

```bash
git init
git add .
git commit -m "init"
# Push sur un repo GitHub puis connecte-le dans vercel.com
```

**Option B — Via Vercel CLI :**

```bash
npm i -g vercel
vercel
```

### 3. (Optionnel) Domaine custom

Dans Vercel → Settings → Domains, ajoute ton domaine.
Exemple : `carte.tondomaine.com`

## Comment ça marche

1. Tu envoies le lien au client (WhatsApp, SMS, email)
2. Le client remplit sa carte sur son téléphone
3. Ses données sont sauvegardées automatiquement (localStorage)
4. Il clique "Envoyer via WhatsApp" → tu reçois tout, structuré

## Stack

- Next.js 14
- React 18
- Zéro dépendance externe
- localStorage pour l'autosave
- WhatsApp Web API pour l'envoi
