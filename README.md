# Hoodly

A collaborative neighbourhood platform that lets residents exchange services, sign digital documents, join local events and communicate through a secure multimedia messaging system.

---

## Tech Stack

| Category | Technology |
|---|---|
| Back-end | Node.js + NestJS |
| Language | TypeScript |
| Main database | MongoDB, Mysql |
| Social graph | Neo4j |
| Local database (Java) | SQLite |
| Auth | JWT + MFA (TOTP) + SSO |
| Front-end | React, Leaflet |
| Desktop client | Java + JavaFX |
| Real-time | Socket.io (WebSocket) |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Observabilty | Prometheus / Grafana |


## Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [Docker](https://docker.com) + Docker Compose
- [Java](https://adoptium.net) >= 17 (desktop client only)
- [Maven](https://maven.apache.org) >= 3.9 (desktop client only)

---

## Getting started (development)

```bash
git clone https://github.com/lennyblk/hoodly.git
cd hoodly

cp .env.example .env

docker compose -f docker-compose.dev.yml up -d

cd api && npm install
npm run dev
```

| Service | URL |
|---|---|
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/api-docs` |
| React (client) | `http://localhost:5173` |
| React (admin) | `http://localhost:5174` |
| Neo4j Browser | `http://localhost:7474` |

---

## Production

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## Environment variables

Copy `.env.example` and fill in the values:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/hoodly

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# MFA
MFA_APP_NAME=Hoodly

# App
PORT=3000
NODE_ENV=development
```

---

## Project structure

```
hoodly/
├── api/                          # Node.js + Express back-end
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── neighborhoods/
│   │   ├── announcements/        # Neighbour services
│   │   ├── documents/
│   │   ├── events/
│   │   ├── messages/
│   │   ├── votes/
│   │   ├── stats/
│   │   ├── query-lang/           # Custom Lex/Yacc parser (Jison)
│   │   └── index.ts
│   └── Dockerfile
├── web-client/                   # React — resident interface
├── web-admin/                    # React — admin back-office
├── desktop/                      # Java JavaFX desktop app
│   └── src/main/java/
│       ├── controllers/
│       ├── services/
│       ├── sync/
│       └── plugins/
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## Database models

### MongoDB — main collections

| Collection | Content |
|---|---|
| `users` | User accounts, roles, preferences |
| `documents` | Contracts, PDFs, signature zones, statuses |
| `events` | Neighbourhood events, participants |
| `messages` | Chat messages (text, photo, voice) |
| `announcements` | Service listings |
| `votes` | Votes and results |

### Neo4j — social graph

| Node | Description |
|---|---|
| `User` | Neighbourhood resident |
| `Event` | Community event |
| `Service` | Rendered service |

| Relationship | Description |
|---|---|
| `HELPED` | A resident helped another |
| `ATTENDED` | A resident attended an event |
| `INTERESTED_IN` | A resident swiped an event |

---

## API Routes

> Full documentation available at `/api-docs` (Swagger).

### Auth
| Method | Route | Description | Access |
|---|---|---|---|
| POST | `/auth/register` | Create an account | Public |
| POST | `/auth/login` | Sign in | Public |
| POST | `/auth/logout` | Sign out | Authenticated |
| POST | `/auth/mfa/verify` | Verify MFA code | Authenticated |
| GET | `/me/export` | GDPR data export | Authenticated |

### Neighborhoods
| Method | Route | Description | Access |
|---|---|---|---|
| GET | `/neighborhoods` | List all neighborhoods | Authenticated |
| POST | `/neighborhoods` | Create a neighborhood (GeoJSON) | Admin |
| PATCH | `/neighborhoods/:id` | Update boundaries | Admin |

### Announcements
| Method | Route | Description | Access |
|---|---|---|---|
| GET | `/announcements` | List all announcements | Authenticated |
| POST | `/announcements` | Create an announcement | Authenticated |
| POST | `/announcements/:id/accept` | Accept a service request | Authenticated |

### Documents
| Method | Route | Description | Access |
|---|---|---|---|
| POST | `/documents/upload` | Upload a PDF | Authenticated |
| POST | `/documents/:id/sign` | Sign a document (MFA required) | Authenticated |
| GET | `/documents/:id` | View a document | Authenticated |
| POST | `/documents/query` | Query using custom language | Authenticated |

### Events
| Method | Route | Description | Access |
|---|---|---|---|
| GET | `/events` | List all events | Authenticated |
| POST | `/events` | Create an event | Authenticated |
| POST | `/events/:id/join` | Join an event | Authenticated |
| POST | `/events/:id/swipe` | Swipe interest | Authenticated |
| GET | `/events/recommendations` | Neo4j-powered suggestions | Authenticated |

### Messaging
| Method | Route | Description | Access |
|---|---|---|---|
| GET | `/conversations` | My conversations | Authenticated |
| WS | `/chat` | WebSocket connection | Authenticated |

### Votes
| Method | Route | Description | Access |
|---|---|---|---|
| GET | `/votes` | List active votes | Authenticated |
| POST | `/votes` | Create a vote | Moderator |
| POST | `/votes/:id/cast` | Cast a vote | Authenticated |
| GET | `/votes/:id/results` | View results | Authenticated |

---

## Scripts

```bash
# API
npm run dev            # Development with hot reload
npm run build          # Compile TypeScript to JavaScript
npm run start          # Run the compiled build
npm run lint           # ESLint
npm run test           # Unit tests (Jest)
npm run test:e2e       # End-to-end tests (Playwright)

# Java desktop client
mvn clean package      # Build and generate the .jar
mvn test               # Unit tests (JUnit)
```

---

## Authors

Lenny BLACKETT
Sarah GARCIA
Malo LAVAL

Project built as part of the **ESGI** curriculum — Annual Project.
