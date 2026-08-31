# OPERATOR-HANDOFF — Buzzr

Document de passation pour qu'une autre IA (ou un développeur) reprenne le projet **sans contexte de conversation préalable**.

**Dernière mise à jour :** août 2026  
**Auteur du projet :** Maxim Maillary — Bachelor Développeur Fullstack, Coda School (PFE, rendu fin juin 2026)

---

## 1. Résumé exécutif

**Buzzr** est une application web de quiz multijoueur en temps réel (type Kahoot).

| Couche | Stack |
|--------|-------|
| Backend | Node.js, Express 5, Socket.io 4, MySQL (`mysql2`) |
| Frontend | JavaScript vanilla (ES modules), Vite 8, **pas de framework React/Vue** |
| Auth | JWT (`jsonwebtoken`) + bcrypt, vérification e-mail, reset password |
| Temps réel | Socket.io (lobby, questions, scores) |
| Déploiement prévu | Railway (backend) + Vercel (frontend) — **pas encore configuré en prod** |

Monorepo à la racine :

```
buzzr/
├── backend/          # API REST + WebSocket
├── frontend/         # SPA Vite
├── docs/             # Schéma ER (database-schema.svg)
├── README.md         # Guide d'installation pour correcteur
└── OPERATOR-HANDOFF.md  # Ce fichier
```

---

## 2. Démarrage local (checklist)

### Prérequis

- Node.js 18+
- MySQL (souvent **MAMP** sur Mac → port MySQL **8889**, pas 8888)

### Étapes

```bash
# 1. Base de données
# Exécuter backend/migrations/schema.sql dans phpMyAdmin ou CLI MySQL

# 2. Backend
cd backend
cp .env.example .env   # Remplir JWT_SECRET, DB_*, etc.
npm install
npm run dev            # → http://localhost:3000

# 3. Frontend (autre terminal)
cd frontend
npm install
npm run dev            # → http://localhost:5173
```

### Variables d'environnement (`backend/.env`)

Voir `backend/.env.example`. **Ne jamais committer `.env`.**

| Variable | Rôle |
|----------|------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL |
| `JWT_SECRET` | Signature des tokens (obligatoire) |
| `PORT` | API (défaut 3000) |
| `CORS_ORIGIN` | URL frontend (`http://localhost:5173`) |
| `FRONTEND_URL` | Liens dans les e-mails (vérif, reset mdp) |
| `SMTP_*`, `MAIL_FROM` | Optionnel — sans SMTP, les e-mails sont loggés en console |

### E-mails en dev (sans SMTP)

Quand `SMTP_HOST` et `SMTP_USER` sont vides, `backend/src/config/mailer.js` affiche le contenu dans le terminal :

```
[mail:dev] SMTP non configuré — email non envoyé :
{ to, subject, text, html }
```

Copier l'URL de vérification / reset depuis le champ `text`.

Contournement SQL :

```sql
UPDATE users SET email_verified = 1 WHERE email = '...';
```

### Compte admin

```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

Puis accéder à `/admin`.

### Health check

`GET http://localhost:3000/api/health` → `{"status":"ok"}`

---

## 3. Git & dépôt

- **Remote actuel :** `https://github.com/maximemlly/buzzr.git` (branche `main`)
- Le projet peut aussi être hébergé sur **GitLab privé** (école) — le correcteur est invité en Guest si le dépôt ne peut pas être public
- **Ne pas committer :** `backend/.env`, `node_modules/`, `.DS_Store`
- **Commits récents (ordre chronologique inverse) :**
  - README + schéma SQL consolidé
  - Stats joueur + Elo
  - Profil utilisateur (username, password)
  - Admin + pagination
  - Admin + RGPD (audit logs, anonymisation)

---

## 4. Architecture

```
┌─────────────────┐     REST (fetch)      ┌──────────────────────────┐
│  Frontend Vite  │◄────────────────────►│  Express (server.js)      │
│  localhost:5173 │                       │  /api/auth|quizzes|...   │
└────────┬────────┘                       └────────────┬─────────────┘
         │                                             │
         │ WebSocket (Socket.io)                       │ mysql2 pool
         └────────────────────────────────────────────►│
                                                       ▼
                                              ┌─────────────────┐
                                              │  MySQL (buzzr)  │
                                              └─────────────────┘
```

- **REST** : CRUD quiz, auth, sessions (création), historique, admin
- **WebSocket** : tout le jeu en direct (lobby → questions → scores)
- **État en mémoire** : les salles actives vivent dans `roomManager.js` (`Map` par code de session). Perdu au redémarrage du serveur.

---

## 5. Base de données

**Fichier unique :** `backend/migrations/schema.sql`  
**Schéma visuel :** `docs/database-schema.svg`

### Tables

| Table | Rôle |
|-------|------|
| `users` | Comptes, auth, `elo_rating`, tokens vérif/reset |
| `quizzes` | Quiz créés par un user |
| `questions` | Questions d'un quiz (`timer_seconds`, `order_index`) |
| `answers` | Réponses (`is_correct`) |
| `game_sessions` | Partie lancée (`code` 6 car., `status`: waiting/playing/finished) |
| `participants` | Joueur dans une session (`score`, `correct_answers`, `total_questions`) |
| `admin_audit_logs` | Traçabilité actions admin (RGPD) |

### Relations clés

- `quizzes.user_id` → `users.id` (CASCADE)
- `game_sessions.quiz_id` → `quizzes.id`, `host_id` → `users.id`
- `participants.session_id` → `game_sessions.id`, `user_id` → `users.id` (SET NULL)

---

## 6. API REST

Base URL dev : `http://localhost:3000`  
Auth : header `Authorization: Bearer <token>` (sauf routes publiques)

### Auth — `/api/auth`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/register` | Non | Inscription + envoi e-mail vérif |
| POST | `/login` | Non | Connexion (bloqué si `email_verified = 0`) |
| GET | `/verify-email/:token` | Non | Confirme l'e-mail |
| POST | `/resend-verification` | Non | Renvoie le lien |
| POST | `/forgot-password` | Non | Envoie lien reset |
| POST | `/reset-password` | Non | Nouveau mot de passe |
| GET | `/me` | Oui | Profil courant |
| PATCH | `/profile` | Oui | Change `username` |
| PATCH | `/password` | Oui | Change mot de passe |

Codes d'erreur utiles côté frontend : `EMAIL_NOT_VERIFIED`, `QUIZ_OWNER_CANNOT_PLAY`

### Quiz — `/api/quizzes` (toutes authentifiées)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Mes quiz |
| GET | `/public?limit&offset&search` | Quiz publiés (explore) |
| POST | `/` | Créer quiz |
| GET | `/:id` | Détail complet (owner only) |
| PUT | `/:id` | Modifier (title, description, is_published) |
| DELETE | `/:id` | Supprimer |
| POST | `/:id/questions` | Ajouter question + réponses |
| DELETE | `/:id/questions/:questionId` | Supprimer question |

Body question : `{ label, timer_seconds, answers: [{ label, is_correct }] }` (min 2 réponses, 1 correcte)

### Sessions — `/api/sessions`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/history?limit=5` | Oui | Historique + stats dashboard |
| POST | `/` | Oui | Créer session `{ quiz_id }` → code 6 car. |
| GET | `/:code` | Non* | Infos session (bloque créateur du quiz) |

\* Si Bearer token présent et user = créateur original du quiz → 403 `QUIZ_OWNER_CANNOT_PLAY`

### Admin — `/api/admin` (auth + role `admin`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/users?limit&offset` | Liste paginée |
| GET | `/users/:id` | Détail user |
| PATCH | `/users/:id/status` | Activer/désactiver |
| DELETE | `/users/:id` | Anonymiser (RGPD) |
| GET | `/quizzes?limit&offset` | Tous les quiz |
| PATCH | `/quizzes/:id/unpublish` | Dépublier |
| DELETE | `/quizzes/:id` | Supprimer |

---

## 7. Socket.io — événements

Connexion : `frontend/src/services/socket.js`  
Auth socket : `auth: { token: getToken() }` dans le handshake  
URL hardcodée : `http://localhost:3000` (**à externaliser pour la prod**)

### Client → Serveur

| Event | Payload | Description |
|-------|---------|-------------|
| `join_session` | `{ code, role: "host" \| "player" }` | Rejoindre lobby |
| `host_start_game` | — | Hôte démarre (vérifie `hostSocketId`) |
| `submit_answer` | `{ answerId }` | Répondre à la question en cours |
| `leave_lobby` | — | Quitter proprement |

### Serveur → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `session_joined` | `{ isHost }` | Confirmé dans la room |
| `join_denied` | `{ code, message }` | Ex. créateur quiz bloqué |
| `error_message` | `{ message, code? }` | Erreur générique |
| `session_update` | `{ code, status, hostCanPlay, host, participants }` | Lobby waiting |
| `game_started` | `{ quizTitle, questionCount, hostCanPlay }` | Partie lancée |
| `question_started` | `{ index, total, question }` | Question sans `is_correct` |
| `answer_scored` | `{ points, totalScore }` | Feedback au joueur |
| `question_result` | `{ questionId, correctAnswerId, leaderboard }` | Fin de question |
| `game_finished` | `{ leaderboard }` | Fin de partie |
| `session_closed` | `{ message }` | Hôte a quitté |

Logique principale : `backend/src/sockets/gameHandler.js`  
Rooms : `backend/src/sockets/roomManager.js`

---

## 8. Règles métier importantes

### Rôles en partie

- **Hôte** : celui qui a créé la session (`POST /api/sessions`). Rejoint avec `role: "host"`.
- **Joueur** : rejoint avec `role: "player"` (défaut).
- Le bouton « Démarrer » n'est visible que si `session_joined.isHost === true` (autorité serveur).

### Anti-triche — créateur du quiz

Le **créateur original** d'un quiz (`quizzes.user_id`) **ne peut pas jouer** une partie lancée par quelqu'un d'autre sur ce quiz (REST + socket `join_denied`).

Exception : s'il **anime** sa propre partie (lance depuis « Mes quiz »), il est hôte mais **n'est pas dans `players`** sauf cas `hostCanPlay`.

### `hostCanPlay`

Hôte peut aussi jouer et marquer des points si :

```js
quiz.is_published && userId === hostId && userId !== quizOwnerId
```

Cas typique : quiz public lancé depuis `/explore` par un user qui n'est **pas** l'auteur original.

### Scoring (`backend/src/utils/scoring.js`)

- Bonne réponse : **100 à 1000 pts** selon le temps restant sur la question
- `tieBreaker` : favorise réponses plus rapides en cas d'égalité
- Le créateur du quiz (`quizOwnerId`) ne gagne **pas** de points même s'il joue (`canUserEarnPoints`)

### Fin de partie (`finalizeGame.js`)

1. Persiste `correct_answers` / `total_questions` sur chaque `participant`
2. Met à jour l'**Elo** (`backend/src/utils/elo.js`)
   - **Solo (1 joueur)** : Elo **inchangé**
   - **Multi (2+)** : delta selon classement (K=24)
3. `resolvePlayerRating(elo, gamesPlayed)` : si 0 partie → affichage `—` + rang F (`is_unranked: true`)

### Rangs Elo

| Elo | Rang |
|-----|------|
| < 800 | F |
| < 900 | E |
| < 1000 | D |
| < 1100 | C |
| < 1200 | B |
| < 1300 | A |
| ≥ 1300 | S |

### Session / lobby frontend

- `sessionStorage.activeLobby` : code de la partie en cours (guard router)
- `sessionStorage.lobbyRole` : `"host"` si l'utilisateur a lancé la partie
- Accès `/lobby/:code` refusé si `activeLobby !== code` → redirect dashboard

### Hôte quitte

Si l'hôte se déconnecte → `session_closed` pour tous, room détruite, session DB → `finished`.

---

## 9. Frontend — routes & pages

Router : `frontend/src/router.js` (History API, pas de hash routing)

| Route | Fichier | Auth |
|-------|---------|------|
| `/login`, `/register` | `pages/login.js`, `register.js` | Public |
| `/verify-email`, `/verify-email-pending` | | Public |
| `/forgot-password`, `/reset-password` | | Public |
| `/privacy` | `pages/privacy.js` | Public |
| `/dashboard` | `pages/dashboard.js` | Oui |
| `/quizzes` | `pages/myQuizzes.js` | Oui |
| `/quiz/new` | `pages/quizNew.js` | Oui |
| `/quiz/:id/edit` | `pages/quizEditor.js` | Oui |
| `/explore` | `pages/explore.js` | Oui |
| `/join` | `pages/join.js` | Oui |
| `/lobby/:code` | `pages/lobby.js` | Oui + activeLobby |
| `/admin` | `pages/admin.js` | Oui + role admin |
| `/account` | `pages/accountSettings.js` | Oui |

### Composants layout réutilisables

| Fichier | Rôle |
|---------|------|
| `components/appLayout.js` | Shell app (topbar, nav, slot profil) |
| `components/authLayout.js` | Layout pages auth |
| `components/brandLogo.js` | Logo **Buzz** + **r** (r violet) |
| `components/accentTitle.js` | Titres avec dernière lettre violette |
| `components/authField.js` | Champs auth (évite bug `sr-only`) |
| `components/gameResults.js` | Écran classement final + `fillPodiumList()` |
| `components/accountMenu.js` | Menu profil rond |

### API client

`frontend/src/services/api.js` — **URL hardcodée** `http://localhost:3000`  
Token JWT : `localStorage` clé `"token"`

---

## 10. Design system (CSS)

Fichier unique : `frontend/src/style.css`

### Tokens principaux (`:root`)

```css
--bg: #0d0b1e;
--primary: #863bff;
--primary-deep: #7e14ff;
--accent-lime: #a3e635;
--answer-1: #7c3aed;  /* tuiles réponse Q1 */
--answer-2: #a3e635;  /* Q2 */
--answer-3: #f43f5e;  /* Q3 */
--answer-4: #fb923c;  /* Q4 */
```

Police : **Inter** (Google Fonts)

Classes utiles : `.btn-primary`, `.btn-launch`, `.btn-edit`, `.btn-danger`, `.app-main--centered`, `.results-page`, `.rating-card`, `.answers-grid` / `.answer-btn:nth-child(n)`

---

## 11. Carte des fichiers backend

```
backend/
├── server.js                    # Point d'entrée Express + HTTP server
├── migrations/schema.sql        # Schéma MySQL complet
└── src/
    ├── config/
    │   ├── db.js                # Pool mysql2
    │   ├── socket.js            # Init Socket.io
    │   └── mailer.js            # Nodemailer (fallback console)
    ├── middleware/
    │   ├── auth.js              # JWT Bearer
    │   └── isAdmin.js
    ├── models/
    │   ├── userModel.js
    │   ├── quizModel.js
    │   ├── sessionModel.js      # Sessions, participants, stats dashboard
    │   └── adminModel.js
    ├── controllers/
    │   ├── authController.js
    │   ├── quizController.js
    │   ├── sessionController.js
    │   └── adminController.js
    ├── routes/
    │   ├── auth.js
    │   ├── quizzes.js
    │   ├── sessions.js
    │   └── admin.js
    ├── sockets/
    │   ├── gameHandler.js       # ★ Logique jeu temps réel
    │   ├── roomManager.js       # ★ État rooms en mémoire
    │   └── finalizeGame.js      # Stats + Elo fin de partie
    └── utils/
        ├── elo.js
        ├── scoring.js
        ├── tokens.js            # generateToken, expiresInHours
        └── privacy.js
```

---

## 12. Bugs corrigés récemment (ne pas réintroduire)

| Problème | Fix |
|----------|-----|
| Bouton « Démarrer » visible pour tous | `session_joined.isHost` côté serveur, bouton hidden par défaut |
| Elo affiché 1000 / rang C avec 0 partie | `resolvePlayerRating()` → `—` + `is_unranked` |
| Elo ne bougeait pas après parties | Normalisation `Number()` des clés Map dans `getEloRatings` |
| Champs login invisibles | Inputs hors `<label class="sr-only">`, helper `authField.js` |
| Classement hôte non centré | `setScoresLayout()` + `lobby-scores-view` dans lobby |
| Classement final hôte | `renderGameResults` avant disconnect socket |
| MySQL MAMP | Port **8889** dans `.env.example` |

---

## 13. Limitations connues / axes d'amélioration

À traiter si tu continues le projet :

1. **URLs hardcodées** — `frontend/src/services/api.js` et `socket.js` pointent vers `localhost:3000`. Pour prod : variables d'environnement Vite (`import.meta.env.VITE_API_URL`).
2. **Pas de tests automatisés** — tout est testé manuellement (2 navigateurs pour multijoueur).
3. **Rooms en mémoire** — redémarrage serveur = parties en cours perdues.
4. **Elo solo** — une partie à 1 joueur ne modifie pas l'Elo (by design, mais discutable).
5. **Pas de reconnexion** — déconnexion socket = expulsion du lobby.
6. **Déploiement** — Railway + Vercel prévus, non finalisés.
7. **GitLab privé** — correcteur invité en Guest ; README sur GitHub/GitLab.
8. **Pas de CI/CD**.
9. **Éditeur quiz** — pas d'édition inline des questions existantes (ajout/suppression seulement).
10. **Accessibilité / mobile** — UI desktop-first, pas auditée.

---

## 14. Scénarios de test manuel

### Parcours complet

1. Register → copier lien vérif depuis console backend → login
2. Créer quiz (2+ questions) → lancer partie → noter code
3. 2e navigateur (autre compte) → `/join` → code → rejoindre
4. Hôte démarre → répondre → vérifier scores → fin de partie → dashboard stats

### Cas limites à vérifier

- Créateur quiz essaie de rejoindre partie d'un autre sur **son** quiz → bloqué
- Hôte non-joueur voit « Vous animez la partie » pendant les questions
- Login sans email vérifié → redirect `/verify-email-pending`
- Admin : désactiver user, anonymiser, unpublish quiz

---

## 15. Conventions de code

- **Backend** : CommonJS (`require`), pas de TypeScript
- **Frontend** : ES modules (`import/export`), pas de bundler config complexe
- **Langue UI** : français
- **Langue code** : mix FR (messages, commentaires) / EN (noms de fichiers, certains identifiants)
- **Style** : minimiser la portée des diffs, réutiliser composants existants, pas de sur-abstraction
- **Commits** : messages en anglais sur le repo actuel (style des commits existants)
- **Ne pas committer** sans demande explicite de l'utilisateur

---

## 16. Utilisation de l'IA sur ce projet

*(Section laissée volontairement courte — l'auteur complète à l'oral / dans son rapport.)*

L'IA (Cursor) a été utilisée pour : refonte UI, debug socket/auth, stats/Elo, README, schéma SQL, corrections CSS lobby/résultats.  
L'auteur valide et comprend les changements ; ne pas supposer que tout le code est généré sans relecture.

---

## 17. Documents associés

| Fichier | Contenu |
|---------|---------|
| `README.md` | Installation pas-à-pas pour correcteur |
| `docs/database-schema.svg` | Diagramme ER pour soutenance |
| `backend/migrations/schema.sql` | DDL MySQL |
| `backend/.env.example` | Template configuration |

---

## 18. Commandes utiles

```bash
# Backend dev (nodemon)
cd backend && npm run dev

# Frontend dev
cd frontend && npm run dev

# Build frontend prod
cd frontend && npm run build

# Vérifier connexion MySQL (depuis backend/)
node -e "require('dotenv').config(); require('./src/config/db').query('SELECT 1').then(()=>console.log('OK')).catch(console.error)"
```

---

## 19. Contact & contexte académique

- **École :** Coda School — Bachelor Dev Fullstack
- **Échéance :** dernière semaine de juin 2026
- **Soutenance :** 15 min présentation + 10 min Q&R + 5 min délibération
- **Thème :** application web interactive temps réel (quiz multijoueur)

---

*Fin du handoff. En cas de doute, commencer par lire `README.md`, lancer backend + frontend, puis parcourir `gameHandler.js` et `lobby.js` pour comprendre le flux jeu.*
