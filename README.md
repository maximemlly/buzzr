# Buzzr

Application web de quiz multijoueur en temps réel (type Kahoot).

- **Backend** : Node.js, Express, Socket.io, MySQL
- **Frontend** : JavaScript vanilla, Vite

## Prérequis

- [Node.js](https://nodejs.org/) 18 ou plus
- MySQL (MAMP, XAMPP, Docker, ou installation locale)
- npm

## Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd buzzr
```

### 2. Base de données

1. Démarrer MySQL.
2. Ouvrir phpMyAdmin (ou un client MySQL).
3. Exécuter le fichier **`backend/migrations/schema.sql`** : il crée la base `buzzr` et toutes les tables.

> **MAMP** : le port MySQL est en général **8889** (pas 8888). Vérifiez dans _MAMP → Preferences → Ports_.

### 3. Backend

```bash
cd backend
cp .env.example .env
npm install
```

Renseigner le fichier `.env` :

| Variable       | Description                                      |
| -------------- | ------------------------------------------------ |
| `DB_HOST`      | Hôte MySQL (`localhost` ou `127.0.0.1`)          |
| `DB_PORT`      | Port MySQL (`3306` par défaut, `8889` sous MAMP) |
| `DB_USER`      | Utilisateur MySQL                                |
| `DB_PASSWORD`  | Mot de passe MySQL                               |
| `DB_NAME`      | `buzzr`                                          |
| `JWT_SECRET`   | Chaîne secrète longue et aléatoire               |
| `PORT`         | Port de l'API (`3000`)                           |
| `CORS_ORIGIN`  | URL du frontend (`http://localhost:5173`)        |
| `FRONTEND_URL` | Même URL, pour les liens dans les e-mails        |

Les variables SMTP sont optionnelles en local (voir la section [E-mails](#e-mails-vérification-et-mot-de-passe-oublié) ci-dessous).

```bash
npm run dev
```

L'API doit répondre sur [http://localhost:3000/api/health](http://localhost:3000/api/health) avec `{"status":"ok"}`.

### 4. Frontend

Dans un **second terminal** :

```bash
cd frontend
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

## E-mails (vérification et mot de passe oublié)

L'inscription et la réinitialisation de mot de passe envoient un e-mail contenant un lien à cliquer. Deux modes sont possibles en local.

### Mode 1 — Sans SMTP (par défaut, le plus simple)

Si `SMTP_HOST` et `SMTP_USER` ne sont **pas** renseignés dans `.env`, aucun e-mail n'est envoyé : le contenu est **affiché dans le terminal du backend** (celui où tourne `npm run dev`).

**Vérification d'e-mail après inscription :**

1. Créer un compte sur `/register`.
2. Regarder le terminal backend : un bloc `[mail:dev] SMTP non configuré — email non envoyé :` s'affiche.
3. Dans l'objet loggé, copier l'URL présente dans le champ `text` (elle ressemble à `http://localhost:5173/verify-email?token=...`).
4. Coller cette URL dans le navigateur pour valider le compte.

Pour renvoyer l'e-mail : page `/verify-email-pending` (accessible après inscription) → bouton **Renvoyer l'e-mail** → consulter à nouveau le terminal backend.

**Mot de passe oublié :**

1. Aller sur `/forgot-password`, saisir l'e-mail du compte.
2. Copier le lien `http://localhost:5173/reset-password?token=...` depuis le terminal backend.
3. Ouvrir ce lien et choisir un nouveau mot de passe.

### Mode 2 — Avec SMTP (e-mails réels)

Renseigner ces variables dans `backend/.env` :

| Variable       | Description                                      |
| -------------- | ------------------------------------------------ |
| `SMTP_HOST`    | Serveur SMTP (ex. `smtp.gmail.com`, sandbox Mailtrap…) |
| `SMTP_PORT`    | Port SMTP (`587` en général)                     |
| `SMTP_SECURE`  | `true` pour le port 465, sinon `false`           |
| `SMTP_USER`    | Identifiant SMTP                                 |
| `SMTP_PASS`    | Mot de passe ou clé d'application                |
| `MAIL_FROM`    | Expéditeur affiché (ex. `Buzzr <noreply@buzzr.local>`) |

Redémarrer le backend après modification du `.env`. Les e-mails arrivent alors dans la boîte configurée (ou dans l'inbox d'un service de test comme [Mailtrap](https://mailtrap.io/)).

### Contournement pour test rapide (sans e-mail)

Pour valider un compte manuellement en base :

```sql
UPDATE users SET email_verified = 1 WHERE email = 'votre@email.com';
```

## Utilisation rapide

1. Créer un compte sur `/register`, puis vérifier l'e-mail (voir section [E-mails](#e-mails-vérification-et-mot-de-passe-oublié) ci-dessus).
2. Se connecter, créer un quiz depuis **Mes quiz**.
3. Lancer une partie depuis le dashboard ou rejoindre avec un code à 6 caractères.

### Compte administrateur

Après inscription, promouvoir un utilisateur en admin dans MySQL :

```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

L'interface admin est accessible sur `/admin`.

## Structure du projet

```
buzzr/
├── backend/
│   ├── migrations/schema.sql   # Schéma MySQL complet
│   ├── src/
│   │   ├── config/             # Base de données, socket, mail
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── sockets/            # Logique temps réel (lobby, jeu)
│   │   └── utils/
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── services/           # API REST et Socket.io
        └── router.js
```

## Scripts utiles

| Commande        | Dossier     | Action                    |
| --------------- | ----------- | ------------------------- |
| `npm run dev`   | `backend/`  | API + Socket.io (nodemon) |
| `npm start`     | `backend/`  | API en production         |
| `npm run dev`   | `frontend/` | Frontend Vite             |
| `npm run build` | `frontend/` | Build de production       |
