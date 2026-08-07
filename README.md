# PASOLA — Site web (`pasola-web`)

Site institutionnel de **PASOLA Signature Estate** (Sumba, Indonésie) et de **Maison Pasola** (Cognac), avec un espace **Capital Partners** (accès investisseurs sur signature d'un NDA) et un **back-office / CRM** interne.

Production : **https://pasola.fr**

> Ce README décrit l'état **réel** du dépôt (mis à jour août 2026). Aucune étape de build : les fichiers sont servis tels quels.

---

## 1. Stack technique

| Élément | Techno |
|---|---|
| Front | HTML / CSS / JavaScript **statiques** (pas de framework, pas de build) |
| Hébergement | **Cloudflare Pages** — déploiement auto à chaque `git push` sur `main` |
| Routage langue | **Cloudflare Pages Function** (`functions/_middleware.js`) |
| API / back-end | **Cloudflare Worker** `pasola-api` — **dépôt séparé** `pasola-backend` |
| Base de données | Cloudflare **D1** (`pasola-users`) |
| Stockage documents | Cloudflare **R2** (`pasola-dossier-prive`) |
| Emails | **Brevo** (transactionnel, `noreply@pasola.fr`) |
| Vidéo hero | **Cloudinary** (CDN) |

---

## 2. Structure du dépôt

```
/                     Home FR (index.html) + pages FR
/en/                  Miroir anglais (mêmes pages, contenu traduit)
/assets/              Images + polices (assets/fonts/pasola-fonts.css)
/capital-partners/    Espace investisseurs (FR)
   access/            Page de signature du NDA (formulaire)
   dossier/           Data room (accès par token JWT)
/maison-cognac/       Projet Cognac (FR) — Cercle des fondateurs
/admin/               Back-office / CRM interne (connexion mot de passe)
/functions/
   _middleware.js     Redirection de langue par géo-IP
main.js               JS global (formulaires, tracking, sélecteur de langue)
main.css              CSS global
PASOLA_NDA_FINAL.html Texte intégral du NDA — EN, lecture seule
PASOLA_NDA_FR.html    Texte intégral du NDA — FR allégé, lecture seule
404.html              Page « introuvable » brandée
og-image.jpg          Image de partage (Open Graph, 1200×630)
```

**Bilingue** : chaque page FR a son miroir sous `/en/`, reliés par les balises `hreflang`.

---

## 3. Mécanismes clés

### Routage de langue — `functions/_middleware.js`
- Ne s'applique qu'à la racine `/`.
- Cookie `pasola-lang` présent → on respecte le choix manuel (posé par `main.js` au clic sur le sélecteur de langue).
- Sinon, selon `CF-IPCountry` : **FR → home française**, tout autre pays → redirection `302` vers `/en/`.

### Formulaires → Worker `pasola-api`
Gérés dans `main.js`, tous en `POST` :
| Formulaire | Page | Endpoint |
|---|---|---|
| Contact | Home | `/api/contact` |
| Newsletter | Home, Maison Cognac | `/api/register` |
| Affiliation (Cercle des fondateurs) | Maison Cognac | `/api/affiliate/track` |
| Signature NDA | `/capital-partners/access/` | `/api/cp-request` |

### Parcours Capital Partners (NDA → data room)
1. Signature du NDA sur `/capital-partners/access/` → `POST /api/cp-request` (signature « click-wrap » eIDAS : nom + horodatage + IP).
2. Email à l'admin avec boutons **Approuver / Refuser**.
3. À l'approbation → **lien magique** (JWT, 7 jours) envoyé au prospect.
4. `/capital-partners/dossier/` valide le token et sert les documents depuis R2.

### Tracking
`main.js` envoie un pageview **anonyme** à `/api/pageview` (ni IP ni email stockés). L'activité de l'admin est exclue via `localStorage` (`pasola_is_owner`).

---

## 4. Back-office / CRM — `/admin/`
- Connexion **email + mot de passe** (multi-utilisateurs : rôles Owner / Éditeur / Lecture seule).
- Vue orientée contacts (type CRM) : entonnoir Capital Partners, activité data room, affiliés, gestion d'équipe.
- Alimenté par les endpoints admin du Worker (`/api/admin-*`, `/api/cp-requests-list`…), protégés côté serveur.

---

## 5. Déploiement

**Front (ce dépôt)** — automatique :
```bash
git push origin main        # Cloudflare Pages déploie
```

**Back-end** (dépôt `pasola-backend`) :
```bash
cd pasola-backend && npx wrangler deploy
```

**Dev local** :
```bash
python3 -m http.server 8000   # front statique
```

Réglages Cloudflare Pages : Framework = None · Build command = vide · Output = `/`.

---

## 6. Discipline de marque (brand-book)
- Pas de « villa » → utiliser « résidence ».
- Pas de prix public.
- Pas de « Marapu » (interdiction culturelle).
- Registre tonal : Aman / Mareterra / Singita.

---

## 7. Notes reprise / IT
- **Aucune dépendance** à installer côté front (statique).
- Les **secrets** (JWT, clés Brevo, mot de passe admin) sont côté **Worker** (`pasola-backend`), jamais dans ce dépôt.
- ⚠️ Ce dépôt est **public** : ne jamais y committer de secret.

_All rights reserved · PASOLA · 2026._
