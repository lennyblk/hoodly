# Hoodly

Plateforme de quartier collaborative permettant aux résidents d'échanger des services, signer des documents numériques, rejoindre des événements locaux et communiquer via une messagerie multimédia sécurisée.

---

## Stack technique

| Catégorie | Technologie |
|---|---|
| Back-end | Node.js + NestJS |
| Langage | TypeScript |
| Base principale | MongoDB |
| Graphe social | Neo4j |
| Base locale (Java) | SQLite |
| Auth | JWT (access + refresh) + OTP email |
| Front-end | React + Vite + Tailwind CSS |
| Client desktop | Java 17 + JavaFX 21 |
| Temps réel | Socket.io (WebSocket) |
| Containerisation | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Reverse proxy | Caddy |

---

## Prérequis

- [Node.js](https://nodejs.org) >= 20
- [Docker](https://docker.com) + Docker Compose
- [Java](https://adoptium.net) >= 17 (client desktop uniquement)
- [Maven](https://maven.apache.org) >= 3.9 (client desktop uniquement)

---

## Démarrage (développement)

```bash
git clone https://github.com/lennyblk/hoodly.git
cd hoodly

cp .env.example .env
# Remplir les variables d'environnement

docker compose -f docker-compose.dev.yaml up -d
```

| Service | URL |
|---|---|
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/api-docs` |
| React | `http://localhost:5173` |
| Neo4j Browser | `http://localhost:7474` |

### Seed (données de test)

```bash
docker exec hoodly_api_dev node dist/seed.js
```

Les emails de seed (`admin@hoodly.com`, `alice@hoodly.com`, etc.) passent l'OTP automatiquement — pas besoin de code réel.

---

## Production

Le déploiement est automatisé via GitHub Actions à chaque push sur `main` :

1. Lancement des tests Jest
2. SSH sur le serveur → `git pull`
3. Build et restart des containers Docker
4. Exécution de la seed si la base est vide

```bash
# Rebuild manuel avec la bonne VITE_API_URL
VITE_API_URL=https://api-hoodly.lennyblk.dev docker compose -f docker-compose.prod.yaml up -d --build
```

---

## Variables d'environnement

```env
# MongoDB
MONGODB_URI=mongodb://root:root@mongo:27017/hoodly?authSource=admin

# Neo4j
NEO4J_URI=neo4j://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=
REFRESH_TOKEN_EXPIRES_IN=7d

# OTP (signature de documents, modification email/mot de passe)
OTP_SECRET=

# Email (OTP)
GMAIL_USER=
GMAIL_APP_PASSWORD=

# App
PORT=3000
NODE_ENV=development
VITE_API_URL=http://localhost:3000
```

---

## Structure du projet

```
hoodly/
├── api/                          # Back-end NestJS
│   └── src/
│       ├── mongodb/
│       │   ├── auth/             # Signup, signin, JWT, OTP
│       │   ├── users/            # Profils, points, RGPD
│       │   ├── announcements/    # Annonces de services
│       │   ├── documents/        # Contrats PDF, signatures
│       │   ├── events/           # Événements, RSVP, recommandations
│       │   ├── messages/         # Messagerie, conversations
│       │   ├── votes/            # Sondages de quartier
│       │   ├── neighbourhoods/   # Quartiers (polygones GeoJSON)
│       │   └── otp/              # Service OTP email
│       ├── neo4j/                # Service graphe social
│       ├── sqlite/
│       │   └── incidents/        # Signalements (base SQLite)
│       ├── emails/               # Templates React Email
│       └── seed.ts               # Données de test
├── web/                          # Front-end React
│   └── src/
│       ├── api/                  # Clients axios + types générés
│       ├── components/           # Composants réutilisables
│       ├── contexts/             # UserContext, SocketContext
│       └── pages/                # Pages par feature
├── java/                         # Client desktop JavaFX
│   ├── src/main/java/org/example/
│   ├── hoodly-plugin-api/        # Interface Plugin (système de plugins)
│   ├── hoodly-plugins/           # Plugins embarqués
│   └── pom.xml
└── .github/workflows/
    └── deploy.yml                # CI/CD GitHub Actions
```

---

## Modèles de données

### MongoDB — collections principales

| Collection | Contenu |
|---|---|
| `users` | Comptes, rôles (`admin` / `moderateur` / `habitant`), points |
| `neighbourhoods` | Quartiers avec polygones GeoJSON |
| `events` | Événements, participants, RSVP |
| `announcements` | Annonces de services (offres / demandes) |
| `documents` | Contrats PDF, signataires, signatures |
| `conversations` | Conversations de messagerie |
| `messages` | Messages (texte, image, audio, fichier) |
| `votes` | Sondages et résultats |
| `pointstransactions` | Historique des mouvements de points |

### Neo4j — graphe social

| Nœud | Description |
|---|---|
| `User` | Résident du quartier |
| `Event` | Événement communautaire |

| Relation | Déclenchée par |
|---|---|
| `ATTENDED` | RSVP à un événement (`POST /events/:id/rsvp`) |
| `INTERESTED_IN` | Intérêt swipé sur un événement (`POST /events/:id/interest`) |
| `HELPED` | Annonce acceptée (`PATCH /announcements/:id` avec `acceptedBy`) |

### SQLite — base locale

| Table | Contenu |
|---|---|
| `incidents` | Signalements de problèmes de quartier |

---

## Routes API

> Documentation complète disponible sur `/api-docs` (Swagger).

### Auth

| Méthode | Route | Description | Accès |
|---|---|---|---|
| POST | `/auth/signup` | Créer un compte | Public |
| POST | `/auth/signin` | Se connecter | Public |
| POST | `/auth/logout` | Se déconnecter | Authentifié |
| POST | `/auth/refresh` | Rafraîchir les tokens | Authentifié |
| GET | `/auth/me` | Profil courant | Authentifié |
| POST | `/auth/otp/send` | Envoyer un code OTP par email | Public |
| POST | `/auth/otp/verify` | Vérifier un code OTP → retourne `otpToken` | Public |

### Utilisateurs

| Méthode | Route | Description | Accès |
|---|---|---|---|
| GET | `/users` | Lister tous les utilisateurs | Admin |
| GET | `/users/count` | Nombre d'utilisateurs d'un quartier | Authentifié |
| GET | `/users/neighbourhood` | Utilisateurs d'un quartier | Authentifié |
| GET | `/users/admins` | Liste des admins | Authentifié |
| GET | `/users/me/export` | Export RGPD | Authentifié |
| GET | `/users/me/points/history` | Historique des points | Authentifié |
| PATCH | `/users/me` | Modifier son profil (OTP requis si email/mdp) | Authentifié |
| DELETE | `/users/me` | Supprimer son compte (RGPD) | Authentifié |
| GET | `/users/:id` | Voir un utilisateur | Authentifié |
| POST | `/users` | Créer un utilisateur | Admin |
| POST | `/users/:id/points` | Ajuster les points | Admin |
| PATCH | `/users/:id` | Modifier un utilisateur | Admin |
| DELETE | `/users/:id` | Supprimer un utilisateur | Admin |

### Quartiers

| Méthode | Route | Description | Accès |
|---|---|---|---|
| GET | `/neighbourhoods` | Lister les quartiers | Authentifié |
| POST | `/neighbourhoods` | Créer un quartier (GeoJSON) | Admin |
| PATCH | `/neighbourhoods/:id` | Modifier les limites | Admin |
| DELETE | `/neighbourhoods/:id` | Supprimer un quartier | Admin |

### Annonces de services

| Méthode | Route | Description | Accès |
|---|---|---|---|
| GET | `/announcements` | Lister les annonces | Authentifié |
| POST | `/announcements` | Créer une annonce | Authentifié |
| GET | `/announcements/:id` | Voir une annonce | Authentifié |
| PATCH | `/announcements/:id` | Modifier / accepter → alimente `HELPED` | Authentifié |
| DELETE | `/announcements/:id` | Supprimer | Admin |

### Documents

| Méthode | Route | Description | Accès |
|---|---|---|---|
| GET | `/documents` | Mes documents | Authentifié |
| POST | `/documents` | Uploader un PDF | Authentifié |
| GET | `/documents/:id` | Voir un document | Authentifié |
| GET | `/documents/:id/file` | Télécharger le PDF | Authentifié |
| POST | `/documents/:id/sign` | Signer (OTP requis) | Authentifié |
| POST | `/documents/:id/refuse` | Refuser un contrat | Authentifié |

### Événements

| Méthode | Route | Description | Accès |
|---|---|---|---|
| GET | `/events` | Lister les événements | Authentifié |
| POST | `/events` | Créer un événement | Authentifié |
| GET | `/events/recommendations` | Suggestions Neo4j (INTERESTED_IN + ATTENDED) | Authentifié |
| GET | `/events/:id` | Voir un événement | Authentifié |
| PATCH | `/events/:id` | Modifier un événement | Modérateur+ |
| POST | `/events/:id/cancel` | Annuler un événement | Modérateur+ |
| DELETE | `/events/:id` | Supprimer | Admin |
| POST | `/events/:id/rsvp` | Participer / se désinscrire (toggle) → `ATTENDED` | Authentifié |
| POST | `/events/:id/interest` | Marquer un intérêt (toggle) → `INTERESTED_IN` | Authentifié |

### Messagerie

| Méthode | Route | Description | Accès |
|---|---|---|---|
| GET | `/conversations` | Mes conversations | Authentifié |
| POST | `/conversations` | Démarrer une conversation | Authentifié |
| GET | `/messages/:conversationId` | Messages d'une conversation | Authentifié |
| POST | `/messages` | Envoyer un message (texte / fichier) | Authentifié |

**WebSocket (Socket.io)**

| Événement | Direction | Description |
|---|---|---|
| `register` | Client → Serveur | Déclarer sa présence en ligne |
| `joinConversation` | Client → Serveur | Rejoindre une room de conversation |
| `leaveConversation` | Client → Serveur | Quitter une room |
| `sendMessage` | Client → Serveur | Envoyer un message |
| `newMessage` | Serveur → Client | Nouveau message reçu |
| `onlineUsers` | Serveur → Client | Liste initiale des utilisateurs en ligne |
| `userOnline` | Serveur → Client | Un utilisateur vient de se connecter |
| `userOffline` | Serveur → Client | Un utilisateur s'est déconnecté |

### Votes

| Méthode | Route | Description | Accès |
|---|---|---|---|
| GET | `/votes` | Lister les sondages | Authentifié |
| POST | `/votes` | Créer un sondage | Modérateur |
| GET | `/votes/:id` | Voir un sondage | Authentifié |
| PATCH | `/votes/:id` | Modifier un sondage | Modérateur |
| DELETE | `/votes/:id` | Supprimer | Admin |
| POST | `/votes/:id/cast` | Voter | Authentifié |

### Signalements (SQLite)

| Méthode | Route | Description | Accès |
|---|---|---|---|
| GET | `/incidents` | Mes signalements / par quartier / tous | Habitant / Modérateur / Admin |
| POST | `/incidents` | Créer un signalement | Authentifié |
| GET | `/incidents/:id` | Voir un signalement | Authentifié |
| PATCH | `/incidents/:id` | Modifier / résoudre | Modérateur+ |
| DELETE | `/incidents/:id` | Supprimer | Admin |

---

## Rôles

| Rôle | Description |
|---|---|
| `habitant` | Accès à son quartier uniquement |
| `moderateur` | Gestion du quartier assigné (événements, votes, signalements) |
| `admin` | Accès global à tous les quartiers et toutes les fonctionnalités |

---

## Client desktop (Java)

```bash
cd java

# Installer la dépendance locale
cd hoodly-plugin-api && mvn install && cd ..

# Compiler et lancer
mvn javafx:run

# Générer le fat JAR (Windows / Linux)
mvn package -DskipTests

# Générer l'app macOS (double-clic)
jpackage \
  --type app-image \
  --name "Hoodly" \
  --input target \
  --main-jar hoodly-desktop.jar \
  --main-class org.example.Launcher \
  --dest target/app \
  --java-options "--enable-native-access=ALL-UNNAMED"
```

---

## Scripts

```bash
# API
npm run dev        # Développement avec hot reload
npm run build      # Compilation TypeScript
npm run start      # Lancer le build compilé
npm run test       # Tests unitaires (Jest)

# Java
mvn javafx:run     # Lancer l'app JavaFX
mvn package        # Build fat JAR
mvn test           # Tests unitaires (JUnit 5)
```

---

## Auteurs

Lenny BLACKETT — Sarah GARCIA — Malo LAVAL

Projet réalisé dans le cadre du cursus **ESGI** — Projet Annuel.
