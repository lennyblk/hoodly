/**
 * Seed script — run once inside the container:
 *   docker exec -it hoodly_api_dev npx ts-node src/seed.ts
 */
import { MongoClient, ObjectId } from "mongodb";
import * as bcrypt from "bcryptjs";
import neo4j from "neo4j-driver";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";

const SQLITE_PATH = process.env.SQLITE_PATH || "./data/hoodly_local.db";

const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb://root:root@localhost:27017/hoodly?authSource=admin";
const NEO4J_URI = process.env.NEO4J_URI || "neo4j://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "password";

const hash = (p: string) => bcrypt.hash(p, 10);
const future = (days: number) => new Date(Date.now() + days * 86400000);
const past = (days: number) => new Date(Date.now() - days * 86400000);

async function seed() {
  // ── MongoDB ──────────────────────────────────────────────────────────────
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db("hoodly");

  const existingUsers = await db.collection("users").countDocuments();
  if (existingUsers > 0) {
    console.log(`DB already seeded (${existingUsers} users found), skipping.`);
    await client.close();
    return;
  }

  console.log("✓ Collections MongoDB vides, début du seed...");

  // ── Neighbourhoods ───────────────────────────────────────────────────────
  const nids = {
    montmartre: new ObjectId(),
    belleville: new ObjectId(),
    marais: new ObjectId(),
    bastille: new ObjectId(),
    republique: new ObjectId(),
  };

  await db.collection("neighbourhoods").insertMany([
    {
      _id: nids.montmartre,
      name: "Montmartre",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [2.33, 48.88],
            [2.34, 48.88],
            [2.34, 48.89],
            [2.33, 48.89],
            [2.33, 48.88],
          ],
        ],
      },
      createdAt: past(60),
    },
    {
      _id: nids.belleville,
      name: "Belleville",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [2.37, 48.87],
            [2.38, 48.87],
            [2.38, 48.88],
            [2.37, 48.88],
            [2.37, 48.87],
          ],
        ],
      },
      createdAt: past(55),
    },
    {
      _id: nids.marais,
      name: "Le Marais",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [2.35, 48.85],
            [2.36, 48.85],
            [2.36, 48.86],
            [2.35, 48.86],
            [2.35, 48.85],
          ],
        ],
      },
      createdAt: past(50),
    },
    {
      _id: nids.bastille,
      name: "Bastille",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [2.36, 48.85],
            [2.37, 48.85],
            [2.37, 48.86],
            [2.36, 48.86],
            [2.36, 48.85],
          ],
        ],
      },
      createdAt: past(45),
    },
    {
      _id: nids.republique,
      name: "République",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [2.36, 48.86],
            [2.37, 48.86],
            [2.37, 48.87],
            [2.36, 48.87],
            [2.36, 48.86],
          ],
        ],
      },
      createdAt: past(40),
    },
  ]);
  console.log("✓ 5 quartiers créés");

  // ── Users ────────────────────────────────────────────────────────────────
  const uids = {
    admin: new ObjectId(),
    modo_montmartre: new ObjectId(),
    modo_belleville: new ObjectId(),
    alice: new ObjectId(),
    bob: new ObjectId(),
    charlie: new ObjectId(),
    diana: new ObjectId(),
    eve: new ObjectId(),
    frank: new ObjectId(),
    grace: new ObjectId(),
    hugo: new ObjectId(),
    iris: new ObjectId(),
  };

  await db.collection("users").insertMany([
    {
      _id: uids.admin,
      email: "admin@hoodly.com",
      password: await hash("Admin1234!"),
      firstName: "Admin",
      lastName: "Hoodly",
      role: "admin",
      neighbourhoodId: null,
      points: 0,
      isActive: true,
      lang: "fr",
      createdAt: past(60),
    },
    {
      _id: uids.modo_montmartre,
      email: "modo.montmartre@hoodly.com",
      password: await hash("Modo1234!"),
      firstName: "Sophie",
      lastName: "Leroux",
      role: "moderateur",
      neighbourhoodId: nids.montmartre.toString(),
      points: 120,
      isActive: true,
      lang: "fr",
      createdAt: past(55),
    },
    {
      _id: uids.modo_belleville,
      email: "modo.belleville@hoodly.com",
      password: await hash("Modo1234!"),
      firstName: "Marc",
      lastName: "Dupont",
      role: "moderateur",
      neighbourhoodId: nids.belleville.toString(),
      points: 95,
      isActive: true,
      lang: "fr",
      createdAt: past(50),
    },
    {
      _id: uids.alice,
      email: "alice@hoodly.com",
      password: await hash("Habitant1234!"),
      firstName: "Alice",
      lastName: "Martin",
      role: "habitant",
      neighbourhoodId: nids.montmartre.toString(),
      points: 45,
      isActive: true,
      lang: "fr",
      createdAt: past(40),
    },
    {
      _id: uids.bob,
      email: "bob@hoodly.com",
      password: await hash("Habitant1234!"),
      firstName: "Bob",
      lastName: "Bernard",
      role: "habitant",
      neighbourhoodId: nids.montmartre.toString(),
      points: 30,
      isActive: true,
      lang: "fr",
      createdAt: past(38),
    },
    {
      _id: uids.charlie,
      email: "charlie@hoodly.com",
      password: await hash("Habitant1234!"),
      firstName: "Charlie",
      lastName: "Petit",
      role: "habitant",
      neighbourhoodId: nids.belleville.toString(),
      points: 60,
      isActive: true,
      lang: "fr",
      createdAt: past(35),
    },
    {
      _id: uids.diana,
      email: "diana@hoodly.com",
      password: await hash("Habitant1234!"),
      firstName: "Diana",
      lastName: "Moreau",
      role: "habitant",
      neighbourhoodId: nids.belleville.toString(),
      points: 25,
      isActive: true,
      lang: "fr",
      createdAt: past(30),
    },
    {
      _id: uids.eve,
      email: "eve@hoodly.com",
      password: await hash("Habitant1234!"),
      firstName: "Eve",
      lastName: "Simon",
      role: "habitant",
      neighbourhoodId: nids.marais.toString(),
      points: 15,
      isActive: true,
      lang: "fr",
      createdAt: past(28),
    },
    {
      _id: uids.frank,
      email: "frank@hoodly.com",
      password: await hash("Habitant1234!"),
      firstName: "Frank",
      lastName: "Laurent",
      role: "habitant",
      neighbourhoodId: nids.marais.toString(),
      points: 50,
      isActive: true,
      lang: "fr",
      createdAt: past(25),
    },
    {
      _id: uids.grace,
      email: "grace@hoodly.com",
      password: await hash("Habitant1234!"),
      firstName: "Grace",
      lastName: "Thomas",
      role: "habitant",
      neighbourhoodId: nids.bastille.toString(),
      points: 20,
      isActive: true,
      lang: "fr",
      createdAt: past(22),
    },
    {
      _id: uids.hugo,
      email: "hugo@hoodly.com",
      password: await hash("Habitant1234!"),
      firstName: "Hugo",
      lastName: "Richard",
      role: "habitant",
      neighbourhoodId: nids.bastille.toString(),
      points: 35,
      isActive: true,
      lang: "fr",
      createdAt: past(18),
    },
    {
      _id: uids.iris,
      email: "iris@hoodly.com",
      password: await hash("Habitant1234!"),
      firstName: "Iris",
      lastName: "Garcia",
      role: "habitant",
      neighbourhoodId: nids.republique.toString(),
      points: 10,
      isActive: true,
      lang: "fr",
      createdAt: past(15),
    },
  ]);
  console.log("✓ 12 utilisateurs créés (admin@hoodly.com / Admin1234!)");

  // ── Events ───────────────────────────────────────────────────────────────
  const eids = {
    soiree: new ObjectId(),
    jardinage: new ObjectId(),
    vide_grenier: new ObjectId(),
    concert: new ObjectId(),
    marche: new ObjectId(),
    reunion: new ObjectId(),
    expo: new ObjectId(),
    yoga: new ObjectId(),
    fete_voisins: new ObjectId(),
    collecte: new ObjectId(),
    velo: new ObjectId(),
    pique_nique: new ObjectId(),
  };

  await db.collection("events").insertMany([
    // Montmartre
    {
      _id: eids.soiree,
      title: "Soirée de quartier",
      description: "Grande soirée conviviale pour tous les voisins",
      type: "social",
      organizerId: uids.modo_montmartre.toString(),
      neighbourhoodId: nids.montmartre.toString(),
      date: future(7),
      participants: [
        uids.alice.toString(),
        uids.bob.toString(),
        uids.modo_montmartre.toString(),
      ],
      interestUsers: [uids.frank.toString()],
      createdAt: past(10),
    },
    {
      _id: eids.jardinage,
      title: "Atelier jardinage collectif",
      description: "Venez jardiner ensemble dans le square",
      type: "atelier",
      organizerId: uids.modo_montmartre.toString(),
      neighbourhoodId: nids.montmartre.toString(),
      date: future(14),
      participants: [uids.alice.toString()],
      interestUsers: [uids.bob.toString()],
      createdAt: past(8),
    },
    {
      _id: eids.vide_grenier,
      title: "Vide grenier de printemps",
      description: "Venez vendre et acheter !",
      type: "commerce",
      organizerId: uids.modo_montmartre.toString(),
      neighbourhoodId: nids.montmartre.toString(),
      date: past(5),
      participants: [uids.alice.toString(), uids.bob.toString()],
      interestUsers: [],
      createdAt: past(20),
    },
    // Belleville
    {
      _id: eids.concert,
      title: "Concert de rue",
      description: "Musiciens du quartier en plein air",
      type: "culture",
      organizerId: uids.modo_belleville.toString(),
      neighbourhoodId: nids.belleville.toString(),
      date: future(5),
      participants: [uids.charlie.toString(), uids.diana.toString()],
      interestUsers: [],
      createdAt: past(7),
    },
    {
      _id: eids.marche,
      title: "Marché solidaire",
      description: "Produits locaux et artisanat",
      type: "commerce",
      organizerId: uids.modo_belleville.toString(),
      neighbourhoodId: nids.belleville.toString(),
      date: future(10),
      participants: [uids.charlie.toString()],
      interestUsers: [uids.diana.toString()],
      createdAt: past(6),
    },
    {
      _id: eids.reunion,
      title: "Réunion de quartier",
      description: "Bilan des projets en cours",
      type: "reunion",
      organizerId: uids.modo_belleville.toString(),
      neighbourhoodId: nids.belleville.toString(),
      date: past(3),
      participants: [
        uids.charlie.toString(),
        uids.diana.toString(),
        uids.modo_belleville.toString(),
      ],
      interestUsers: [],
      createdAt: past(15),
    },
    // Marais
    {
      _id: eids.expo,
      title: "Exposition photo",
      description: "Photos du quartier par ses habitants",
      type: "culture",
      organizerId: uids.frank.toString(),
      neighbourhoodId: nids.marais.toString(),
      date: future(12),
      participants: [uids.frank.toString(), uids.eve.toString()],
      interestUsers: [],
      createdAt: past(5),
    },
    {
      _id: eids.yoga,
      title: "Yoga en plein air",
      description: "Séance de yoga tous les samedis",
      type: "sport",
      organizerId: uids.eve.toString(),
      neighbourhoodId: nids.marais.toString(),
      date: future(3),
      participants: [uids.eve.toString()],
      interestUsers: [uids.frank.toString()],
      createdAt: past(4),
    },
    // Bastille
    {
      _id: eids.fete_voisins,
      title: "Fête des voisins",
      description: "La grande fête annuelle !",
      type: "social",
      organizerId: uids.modo_montmartre.toString(),
      neighbourhoodId: nids.bastille.toString(),
      date: future(20),
      participants: [uids.grace.toString(), uids.hugo.toString()],
      interestUsers: [],
      createdAt: past(3),
    },
    {
      _id: eids.collecte,
      title: "Collecte alimentaire",
      description: "Pour les familles dans le besoin",
      type: "solidarite",
      organizerId: uids.hugo.toString(),
      neighbourhoodId: nids.bastille.toString(),
      date: future(8),
      participants: [uids.hugo.toString()],
      interestUsers: [uids.grace.toString()],
      createdAt: past(2),
    },
    // République
    {
      _id: eids.velo,
      title: "Atelier réparation vélo",
      description: "Apprenez à réparer votre vélo",
      type: "atelier",
      organizerId: uids.iris.toString(),
      neighbourhoodId: nids.republique.toString(),
      date: future(6),
      participants: [uids.iris.toString()],
      interestUsers: [],
      createdAt: past(4),
    },
    {
      _id: eids.pique_nique,
      title: "Pique-nique de printemps",
      description: "Rendez-vous au parc !",
      type: "social",
      organizerId: uids.iris.toString(),
      neighbourhoodId: nids.republique.toString(),
      date: past(10),
      participants: [uids.iris.toString()],
      interestUsers: [],
      createdAt: past(20),
    },
  ]);
  console.log("✓ 12 événements créés");

  // ── Announcements ────────────────────────────────────────────────────────
  await db.collection("announcements").insertMany([
    // Montmartre
    {
      _id: new ObjectId(),
      authorId: uids.alice.toString(),
      neighbourhoodId: nids.montmartre.toString(),
      title: "Cours de guitare",
      description:
        "Je propose des cours de guitare pour débutants, 1h/semaine.",
      type: "offer",
      isPaid: true,
      points: 10,
      status: "open",
      acceptedBy: null,
      contractId: null,
      createdAt: past(5),
    },
    {
      _id: new ObjectId(),
      authorId: uids.bob.toString(),
      neighbourhoodId: nids.montmartre.toString(),
      title: "Garde de chat",
      description:
        "Cherche quelqu'un pour garder mon chat pendant les vacances.",
      type: "request",
      isPaid: false,
      points: 5,
      status: "open",
      acceptedBy: null,
      contractId: null,
      createdAt: past(3),
    },
    {
      _id: new ObjectId(),
      authorId: uids.modo_montmartre.toString(),
      neighbourhoodId: nids.montmartre.toString(),
      title: "Aide déménagement",
      description: "Propose mon aide pour déménagements légers.",
      type: "offer",
      isPaid: false,
      points: 15,
      status: "done",
      acceptedBy: uids.alice.toString(),
      contractId: null,
      createdAt: past(15),
    },
    // Belleville
    {
      _id: new ObjectId(),
      authorId: uids.charlie.toString(),
      neighbourhoodId: nids.belleville.toString(),
      title: "Cours de cuisine",
      description: "Cuisinière amateur, je partage mes recettes en atelier.",
      type: "offer",
      isPaid: true,
      points: 8,
      status: "open",
      acceptedBy: null,
      contractId: null,
      createdAt: past(4),
    },
    {
      _id: new ObjectId(),
      authorId: uids.diana.toString(),
      neighbourhoodId: nids.belleville.toString(),
      title: "Babysitting",
      description: "Expérimentée avec les enfants 2-8 ans.",
      type: "offer",
      isPaid: true,
      points: 12,
      status: "open",
      acceptedBy: null,
      contractId: null,
      createdAt: past(2),
    },
    {
      _id: new ObjectId(),
      authorId: uids.charlie.toString(),
      neighbourhoodId: nids.belleville.toString(),
      title: "Recherche plombier",
      description: "Petit problème de fuite, besoin d'aide rapidement.",
      type: "request",
      isPaid: true,
      points: 0,
      status: "accepted",
      acceptedBy: uids.modo_belleville.toString(),
      contractId: null,
      createdAt: past(8),
    },
    // Marais
    {
      _id: new ObjectId(),
      authorId: uids.frank.toString(),
      neighbourhoodId: nids.marais.toString(),
      title: "Cours de photo",
      description: "Photographe amateur, initiation à la photo numérique.",
      type: "offer",
      isPaid: false,
      points: 10,
      status: "open",
      acceptedBy: null,
      contractId: null,
      createdAt: past(6),
    },
    {
      _id: new ObjectId(),
      authorId: uids.eve.toString(),
      neighbourhoodId: nids.marais.toString(),
      title: "Promenade de chien",
      description: "Disponible le matin pour promener votre chien.",
      type: "offer",
      isPaid: false,
      points: 5,
      status: "open",
      acceptedBy: null,
      contractId: null,
      createdAt: past(3),
    },
    // Bastille
    {
      _id: new ObjectId(),
      authorId: uids.grace.toString(),
      neighbourhoodId: nids.bastille.toString(),
      title: "Soutien scolaire",
      description: "Propose aide aux devoirs maths/français collège.",
      type: "offer",
      isPaid: false,
      points: 8,
      status: "open",
      acceptedBy: null,
      contractId: null,
      createdAt: past(5),
    },
    {
      _id: new ObjectId(),
      authorId: uids.hugo.toString(),
      neighbourhoodId: nids.bastille.toString(),
      title: "Besoin de peintre",
      description: "Salon à repeindre, cherche coup de main.",
      type: "request",
      isPaid: true,
      points: 0,
      status: "open",
      acceptedBy: null,
      contractId: null,
      createdAt: past(1),
    },
    // République
    {
      _id: new ObjectId(),
      authorId: uids.iris.toString(),
      neighbourhoodId: nids.republique.toString(),
      title: "Réparation vélo",
      description: "Je répare les vélos gratuitement le weekend.",
      type: "offer",
      isPaid: false,
      points: 10,
      status: "open",
      acceptedBy: null,
      contractId: null,
      createdAt: past(4),
    },
    {
      _id: new ObjectId(),
      authorId: uids.iris.toString(),
      neighbourhoodId: nids.republique.toString(),
      title: "Cherche covoiturage",
      description: "Trajet Paris–Lyon régulier, cherche covoitureur.",
      type: "request",
      isPaid: false,
      points: 5,
      status: "open",
      acceptedBy: null,
      contractId: null,
      createdAt: past(2),
    },
  ]);
  console.log("✓ 12 annonces créées");

  // ── Votes ────────────────────────────────────────────────────────────────
  await db.collection("votes").insertMany([
    // Montmartre
    {
      _id: new ObjectId(),
      question: "Faut-il installer des bancs supplémentaires dans le parc ?",
      type: "yesno",
      options: ["Oui", "Non"],
      isAnonymous: false,
      endsAt: future(5),
      neighbourhoodId: nids.montmartre.toString(),
      results: [
        { option: "Oui", userIds: [uids.alice, uids.bob] },
        { option: "Non", userIds: [] },
      ],
      createdAt: past(2),
    },
    {
      _id: new ObjectId(),
      question: "Quel jour préférez-vous pour la fête de quartier ?",
      type: "multiple",
      options: ["Samedi", "Dimanche", "Vendredi soir"],
      isAnonymous: false,
      endsAt: future(10),
      neighbourhoodId: nids.montmartre.toString(),
      results: [
        { option: "Samedi", userIds: [uids.alice] },
        { option: "Dimanche", userIds: [uids.bob] },
        { option: "Vendredi soir", userIds: [] },
      ],
      createdAt: past(1),
    },
    // Belleville
    {
      _id: new ObjectId(),
      question: "Souhaitez-vous un jardin partagé dans le quartier ?",
      type: "yesno",
      options: ["Oui", "Non"],
      isAnonymous: true,
      endsAt: future(3),
      neighbourhoodId: nids.belleville.toString(),
      results: [
        { option: "Oui", userIds: [uids.charlie, uids.diana] },
        { option: "Non", userIds: [] },
      ],
      createdAt: past(3),
    },
    {
      _id: new ObjectId(),
      question: "Fréquence idéale du marché solidaire ?",
      type: "multiple",
      options: ["Hebdomadaire", "Mensuel", "Bimensuel"],
      isAnonymous: false,
      endsAt: past(1),
      neighbourhoodId: nids.belleville.toString(),
      results: [
        { option: "Hebdomadaire", userIds: [uids.charlie] },
        { option: "Mensuel", userIds: [] },
        { option: "Bimensuel", userIds: [uids.diana] },
      ],
      createdAt: past(10),
    },
    // Marais
    {
      _id: new ObjectId(),
      question: "Installer un local à vélos sécurisé ?",
      type: "yesno",
      options: ["Oui", "Non"],
      isAnonymous: false,
      endsAt: future(7),
      neighbourhoodId: nids.marais.toString(),
      results: [
        { option: "Oui", userIds: [uids.frank, uids.eve] },
        { option: "Non", userIds: [] },
      ],
      createdAt: past(2),
    },
    {
      _id: new ObjectId(),
      question: "Thème de l'exposition photo collective ?",
      type: "multiple",
      options: ["Portraits", "Architecture", "Nature urbaine"],
      isAnonymous: false,
      endsAt: future(4),
      neighbourhoodId: nids.marais.toString(),
      results: [
        { option: "Portraits", userIds: [uids.eve] },
        { option: "Architecture", userIds: [uids.frank] },
        { option: "Nature urbaine", userIds: [] },
      ],
      createdAt: past(1),
    },
    // Bastille
    {
      _id: new ObjectId(),
      question: "Organiser un composteur collectif ?",
      type: "yesno",
      options: ["Oui", "Non"],
      isAnonymous: false,
      endsAt: future(6),
      neighbourhoodId: nids.bastille.toString(),
      results: [
        { option: "Oui", userIds: [uids.grace] },
        { option: "Non", userIds: [uids.hugo] },
      ],
      createdAt: past(3),
    },
    {
      _id: new ObjectId(),
      question: "Heure préférée pour les ateliers ?",
      type: "multiple",
      options: ["Matin", "Après-midi", "Soirée"],
      isAnonymous: false,
      endsAt: future(8),
      neighbourhoodId: nids.bastille.toString(),
      results: [
        { option: "Matin", userIds: [] },
        { option: "Après-midi", userIds: [uids.grace, uids.hugo] },
        { option: "Soirée", userIds: [] },
      ],
      createdAt: past(2),
    },
    // République
    {
      _id: new ObjectId(),
      question: "Créer une bibliothèque de quartier ?",
      type: "yesno",
      options: ["Oui", "Non"],
      isAnonymous: false,
      endsAt: future(5),
      neighbourhoodId: nids.republique.toString(),
      results: [
        { option: "Oui", userIds: [uids.iris] },
        { option: "Non", userIds: [] },
      ],
      createdAt: past(1),
    },
    {
      _id: new ObjectId(),
      question: "Fréquence des ateliers vélo ?",
      type: "multiple",
      options: [
        "Toutes les semaines",
        "Tous les 15 jours",
        "Une fois par mois",
      ],
      isAnonymous: false,
      endsAt: future(9),
      neighbourhoodId: nids.republique.toString(),
      results: [
        { option: "Toutes les semaines", userIds: [uids.iris] },
        { option: "Tous les 15 jours", userIds: [] },
        { option: "Une fois par mois", userIds: [] },
      ],
      createdAt: past(2),
    },
  ]);
  console.log("✓ 10 sondages créés");

  // ── Conversations & Messages ─────────────────────────────────────────────
  const convIds = {
    alice_bob: new ObjectId(),
    charlie_diana: new ObjectId(),
  };

  await db.collection("conversations").insertMany([
    {
      _id: convIds.alice_bob,
      participants: [uids.alice.toString(), uids.bob.toString()],
      lastMessage: "On se retrouve samedi ?",
      createdAt: past(2),
    },
    {
      _id: convIds.charlie_diana,
      participants: [uids.charlie.toString(), uids.diana.toString()],
      lastMessage: "Super idée !",
      createdAt: past(1),
    },
  ]);

  await db.collection("messages").insertMany([
    {
      _id: new ObjectId(),
      conversationId: convIds.alice_bob.toString(),
      senderId: uids.alice.toString(),
      content: "Salut Bob ! Tu viens à la soirée samedi ?",
      createdAt: past(2),
    },
    {
      _id: new ObjectId(),
      conversationId: convIds.alice_bob.toString(),
      senderId: uids.bob.toString(),
      content: "Oui bien sûr ! À quelle heure on se retrouve ?",
      createdAt: past(2),
    },
    {
      _id: new ObjectId(),
      conversationId: convIds.alice_bob.toString(),
      senderId: uids.alice.toString(),
      content: "On se retrouve samedi ?",
      createdAt: past(1),
    },
    {
      _id: new ObjectId(),
      conversationId: convIds.charlie_diana.toString(),
      senderId: uids.charlie.toString(),
      content: "Tu as vu le concert de rue ce weekend ?",
      createdAt: past(1),
    },
    {
      _id: new ObjectId(),
      conversationId: convIds.charlie_diana.toString(),
      senderId: uids.diana.toString(),
      content: "Super idée !",
      createdAt: past(1),
    },
  ]);
  console.log("✓ 2 conversations et 5 messages créés");

  await client.close();

  // ── Neo4j ────────────────────────────────────────────────────────────────
  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  );
  const session = driver.session();

  await session.run("MATCH (n) DETACH DELETE n");

  // ATTENDED relations — cohérentes avec les participants dans MongoDB
  const attended: {
    userId: string;
    eventId: string;
    neighbourhoodId: string;
  }[] = [
    // Montmartre — soiree
    {
      userId: uids.alice.toString(),
      eventId: eids.soiree.toString(),
      neighbourhoodId: nids.montmartre.toString(),
    },
    {
      userId: uids.bob.toString(),
      eventId: eids.soiree.toString(),
      neighbourhoodId: nids.montmartre.toString(),
    },
    {
      userId: uids.modo_montmartre.toString(),
      eventId: eids.soiree.toString(),
      neighbourhoodId: nids.montmartre.toString(),
    },
    // Montmartre — jardinage
    {
      userId: uids.alice.toString(),
      eventId: eids.jardinage.toString(),
      neighbourhoodId: nids.montmartre.toString(),
    },
    // Montmartre — vide grenier (passé)
    {
      userId: uids.alice.toString(),
      eventId: eids.vide_grenier.toString(),
      neighbourhoodId: nids.montmartre.toString(),
    },
    {
      userId: uids.bob.toString(),
      eventId: eids.vide_grenier.toString(),
      neighbourhoodId: nids.montmartre.toString(),
    },
    // Belleville — concert
    {
      userId: uids.charlie.toString(),
      eventId: eids.concert.toString(),
      neighbourhoodId: nids.belleville.toString(),
    },
    {
      userId: uids.diana.toString(),
      eventId: eids.concert.toString(),
      neighbourhoodId: nids.belleville.toString(),
    },
    // Belleville — marche
    {
      userId: uids.charlie.toString(),
      eventId: eids.marche.toString(),
      neighbourhoodId: nids.belleville.toString(),
    },
    // Belleville — reunion (passé)
    {
      userId: uids.charlie.toString(),
      eventId: eids.reunion.toString(),
      neighbourhoodId: nids.belleville.toString(),
    },
    {
      userId: uids.diana.toString(),
      eventId: eids.reunion.toString(),
      neighbourhoodId: nids.belleville.toString(),
    },
    // Marais
    {
      userId: uids.frank.toString(),
      eventId: eids.expo.toString(),
      neighbourhoodId: nids.marais.toString(),
    },
    {
      userId: uids.eve.toString(),
      eventId: eids.expo.toString(),
      neighbourhoodId: nids.marais.toString(),
    },
    {
      userId: uids.eve.toString(),
      eventId: eids.yoga.toString(),
      neighbourhoodId: nids.marais.toString(),
    },
    // Bastille
    {
      userId: uids.grace.toString(),
      eventId: eids.fete_voisins.toString(),
      neighbourhoodId: nids.bastille.toString(),
    },
    {
      userId: uids.hugo.toString(),
      eventId: eids.fete_voisins.toString(),
      neighbourhoodId: nids.bastille.toString(),
    },
    {
      userId: uids.hugo.toString(),
      eventId: eids.collecte.toString(),
      neighbourhoodId: nids.bastille.toString(),
    },
    // République
    {
      userId: uids.iris.toString(),
      eventId: eids.velo.toString(),
      neighbourhoodId: nids.republique.toString(),
    },
    {
      userId: uids.iris.toString(),
      eventId: eids.pique_nique.toString(),
      neighbourhoodId: nids.republique.toString(),
    },
  ];

  for (const { userId, eventId, neighbourhoodId } of attended) {
    await session.run(
      `MERGE (u:User {id: $userId})
       MERGE (e:Event {id: $eventId})
       ON CREATE SET e.neighbourhoodId = $neighbourhoodId
       MERGE (u)-[:ATTENDED]->(e)`,
      { userId, eventId, neighbourhoodId },
    );
  }

  console.log(`${attended.length} relations ATTENDED créées dans Neo4j`);

  // Chaînes de reco attendues sans ces blocages :
  //   bob        → jardinage  (via profil alice qui partage soiree)
  //   diana      → marche     (via profil charlie qui partage concert + reunion)
  //   frank      → yoga       (via profil eve qui partage expo)
  //   grace      → collecte   (via profil hugo qui partage fete_voisins)
  //   modo_montmartre → vide_grenier + jardinage (via alice + bob)
  const interested: {
    userId: string;
    eventId: string;
    neighbourhoodId: string;
  }[] = [
    // frank (Marais) s'intéresse à la soirée Montmartre — crée un pivot cross-quartier
    {
      userId: uids.frank.toString(),
      eventId: eids.soiree.toString(),
      neighbourhoodId: nids.montmartre.toString(),
    },
    // modo_belleville s'intéresse au marché → renforce le score marche pour diana (passe de 1 à 2)
    {
      userId: uids.modo_belleville.toString(),
      eventId: eids.marche.toString(),
      neighbourhoodId: nids.belleville.toString(),
    },
    // modo_montmartre s'intéresse au jardinage → renforce la reco jardinage pour bob (passe de 1 à 2)
    {
      userId: uids.modo_montmartre.toString(),
      eventId: eids.jardinage.toString(),
      neighbourhoodId: nids.montmartre.toString(),
    },
    // hugo s'intéresse à la fête des voisins (il y assiste déjà → ATTENDED, INTERESTED_IN coexistent sans problème)
    {
      userId: uids.hugo.toString(),
      eventId: eids.fete_voisins.toString(),
      neighbourhoodId: nids.bastille.toString(),
    },
  ];

  for (const { userId, eventId, neighbourhoodId } of interested) {
    await session.run(
      `MERGE (u:User {id: $userId})
       MERGE (e:Event {id: $eventId})
       ON CREATE SET e.neighbourhoodId = $neighbourhoodId
       MERGE (u)-[:INTERESTED_IN]->(e)`,
      { userId, eventId, neighbourhoodId },
    );
  }

  console.log(`${interested.length} relations INTERESTED_IN créées dans Neo4j`);

  await session.close();
  await driver.close();

  // ── SQLite — Incidents ───────────────────────────────────────────────────
  const sqlite = new Database(SQLITE_PATH);

  sqlite.exec(`DELETE FROM incidents`);

  const insertIncident = sqlite.prepare(`
    INSERT INTO incidents (id, title, description, category, status, reportedBy, neighborhoodId, reportedAt, syncedAt, isDirty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const incidents = [
    // Montmartre
    [
      randomUUID(),
      "Lampadaire cassé rue Lepic",
      "Le lampadaire au coin de la rue Lepic ne fonctionne plus depuis 3 jours.",
      "Voirie",
      "open",
      uids.alice.toString(),
      nids.montmartre.toString(),
      past(5).toISOString(),
      null,
      0,
    ],
    [
      randomUUID(),
      "Tags sur le mur de l'école",
      "Des graffitis ont été faits sur la façade de l'école primaire.",
      "Dégradation",
      "open",
      uids.bob.toString(),
      nids.montmartre.toString(),
      past(3).toISOString(),
      null,
      0,
    ],
    [
      randomUUID(),
      "Poubelles débordantes square",
      "Les poubelles du square Suzanne Buisson n'ont pas été vidées depuis une semaine.",
      "Propreté",
      "resolved",
      uids.modo_montmartre.toString(),
      nids.montmartre.toString(),
      past(15).toISOString(),
      past(10).toISOString(),
      0,
    ],
    // Belleville
    [
      randomUUID(),
      "Nid-de-poule dangereux",
      "Gros trou dans la chaussée rue de Belleville, dangereux pour les vélos.",
      "Voirie",
      "open",
      uids.charlie.toString(),
      nids.belleville.toString(),
      past(4).toISOString(),
      null,
      0,
    ],
    [
      randomUUID(),
      "Fuite d'eau trottoir",
      "Une fuite d'eau visible sur le trottoir devant le n°42.",
      "Infrastructure",
      "open",
      uids.diana.toString(),
      nids.belleville.toString(),
      past(2).toISOString(),
      null,
      1,
    ],
    [
      randomUUID(),
      "Banc cassé parc",
      "Le banc près de l'entrée du parc est cassé et dangereux.",
      "Mobilier urbain",
      "resolved",
      uids.modo_belleville.toString(),
      nids.belleville.toString(),
      past(20).toISOString(),
      past(12).toISOString(),
      0,
    ],
    // Marais
    [
      randomUUID(),
      "Éclairage défaillant passage",
      "Plusieurs ampoules grillées dans le passage couvert, dangereux le soir.",
      "Voirie",
      "open",
      uids.frank.toString(),
      nids.marais.toString(),
      past(6).toISOString(),
      null,
      0,
    ],
    [
      randomUUID(),
      "Dépôt sauvage déchets",
      "Dépôt de cartons et meubles abandonnés rue du Temple.",
      "Propreté",
      "open",
      uids.eve.toString(),
      nids.marais.toString(),
      past(1).toISOString(),
      null,
      1,
    ],
    // Bastille
    [
      randomUUID(),
      "Signalisation effacée",
      "Marquage au sol du passage piéton complètement effacé place de la Bastille.",
      "Voirie",
      "open",
      uids.grace.toString(),
      nids.bastille.toString(),
      past(8).toISOString(),
      null,
      0,
    ],
    [
      randomUUID(),
      "Arbre dangereux",
      "Un arbre penche fortement après la tempête, risque de chute.",
      "Espaces verts",
      "open",
      uids.hugo.toString(),
      nids.bastille.toString(),
      past(2).toISOString(),
      null,
      1,
    ],
    [
      randomUUID(),
      "Fontaine hors service",
      "La fontaine à eau du square est cassée depuis 2 semaines.",
      "Infrastructure",
      "resolved",
      uids.grace.toString(),
      nids.bastille.toString(),
      past(25).toISOString(),
      past(18).toISOString(),
      0,
    ],
    // République
    [
      randomUUID(),
      "Vélos abandonnés trottoir",
      "Plusieurs vélos épaves encombrent le trottoir depuis des mois.",
      "Voirie",
      "open",
      uids.iris.toString(),
      nids.republique.toString(),
      past(7).toISOString(),
      null,
      0,
    ],
    [
      randomUUID(),
      "Jeux enfants dégradés",
      "Toboggan cassé et balançoire hors service dans le square.",
      "Mobilier urbain",
      "open",
      uids.iris.toString(),
      nids.republique.toString(),
      past(3).toISOString(),
      null,
      1,
    ],
  ];

  for (const inc of incidents) {
    insertIncident.run(...inc);
  }

  sqlite.close();
  console.log(`✓ ${incidents.length} incidents créés dans SQLite`);

  console.log("\nSeed ok");
  console.log("   admin@hoodly.com       / Admin1234!");
  console.log("   modo.montmartre@hoodly.com / Modo1234!");
  console.log("   alice@hoodly.com       / Habitant1234!");
  console.log("   bob@hoodly.com         / Habitant1234!");
  console.log("   charlie@hoodly.com     / Habitant1234!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
