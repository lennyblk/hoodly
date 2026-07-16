/**
 * Seed script — run once inside the container:
 *   docker exec -it hoodly_api_dev npx ts-node src/seed.ts
 */
import { MongoClient, ObjectId } from "mongodb";
import * as bcrypt from "bcryptjs";
import neo4j from "neo4j-driver";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Database = require("better-sqlite3");
import { randomUUID } from "crypto";

const SQLITE_PATH = process.env.SQLITE_PATH || "./hoodly_local.db";

const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb://root:root@localhost:27017/hoodly?authSource=admin";
const NEO4J_URI = process.env.NEO4J_URI || "neo4j://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "password";

const hash = (p: string) => bcrypt.hash(p, 10);
const future = (days: number) => new Date(Date.now() + days * 86400000);
const past = (days: number) => new Date(Date.now() - days * 86400000);
const d = (iso: string) => new Date(iso);

async function seed() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db("hoodly");

  const existingUsers = await db.collection("users").countDocuments();
  if (existingUsers > 0) {
    console.log(`DB already seeded (${existingUsers} users found), skipping.`);
    await client.close();
    return;
  }

  console.log("Seed start...");

  // ── IDs ─────────────────────────────────────────────────────────────────
  const uids = {
    admin: new ObjectId(),
    modo_montmartre: new ObjectId(),
    modo_belleville: new ObjectId(),
    modo_marais: new ObjectId(),
    // Montmartre habitants
    alice: new ObjectId(),
    bob: new ObjectId(),
    julien: new ObjectId(),
    camille: new ObjectId(),
    // Belleville habitants
    charlie: new ObjectId(),
    diana: new ObjectId(),
    karim: new ObjectId(),
    lea: new ObjectId(),
    // Marais habitants
    eve: new ObjectId(),
    frank: new ObjectId(),
    nadia: new ObjectId(),
    // Bastille habitants
    grace: new ObjectId(),
    hugo: new ObjectId(),
    omar: new ObjectId(),
    // Republique habitants
    iris: new ObjectId(),
    thomas: new ObjectId(),
    // Bon Marche habitants
    sophie: new ObjectId(),
    remi: new ObjectId(),
    clara: new ObjectId(),
  };

  const nids = {
    montmartre: new ObjectId(),
    belleville: new ObjectId(),
    marais: new ObjectId(),
    bastille: new ObjectId(),
    republique: new ObjectId(),
    bonmarche: new ObjectId(),
  };

  // ── Neighbourhoods (vrais polygones) ───────────────────────────────────
  await db.collection("neighbourhoods").insertMany([
    {
      _id: nids.montmartre,
      name: "Montmartre",
      geometry: { type: "Polygon", coordinates: [[[2.320948,48.878772],[2.352533,48.877249],[2.354507,48.895194],[2.323265,48.896322],[2.320948,48.878772]]] },
      createdBy: uids.admin.toString(),
      createdAt: d("2026-05-15T16:28:06.078Z"),
    },
    {
      _id: nids.belleville,
      name: "Belleville",
      geometry: { type: "Polygon", coordinates: [[[2.37,48.87],[2.398882,48.869796],[2.393475,48.886051],[2.368326,48.884133],[2.37,48.87]]] },
      createdBy: uids.admin.toString(),
      createdAt: d("2026-05-20T16:28:06.078Z"),
    },
    {
      _id: nids.marais,
      name: "Le Marais",
      geometry: { type: "Polygon", coordinates: [[[2.321119,48.858391],[2.33614,48.855452],[2.357512,48.849355],[2.357597,48.863584],[2.327042,48.872841],[2.321119,48.858391]]] },
      createdBy: uids.admin.toString(),
      createdAt: d("2026-05-25T16:28:06.078Z"),
    },
    {
      _id: nids.bastille,
      name: "Bastille",
      geometry: { type: "Polygon", coordinates: [[[2.360516,48.839701],[2.401457,48.847266],[2.394762,48.858331],[2.375708,48.858899],[2.361202,48.858335],[2.360516,48.839701]]] },
      createdBy: uids.admin.toString(),
      createdAt: d("2026-05-30T16:28:06.078Z"),
    },
    {
      _id: nids.republique,
      name: "République",
      geometry: { type: "Polygon", coordinates: [[[2.358027,48.86528],[2.36,48.86],[2.395449,48.858956],[2.388582,48.869006],[2.36824,48.869458],[2.367983,48.874537],[2.344723,48.87053],[2.358027,48.86528]]] },
      createdBy: uids.admin.toString(),
      createdAt: d("2026-06-04T16:28:06.078Z"),
    },
    {
      _id: nids.bonmarche,
      name: "Bon Marché",
      geometry: { type: "Polygon", coordinates: [[[2.354507,48.848619],[2.321548,48.856748],[2.311506,48.838157],[2.342148,48.831318],[2.354507,48.848619]]] },
      createdBy: uids.admin.toString(),
      createdAt: d("2026-07-14T16:43:38.470Z"),
    },
  ]);
  console.log("6 quartiers");

  // ── Users ──────────────────────────────────────────────────────────────
  const pw = await hash("Habitant1234!");
  const modoPw = await hash("Modo1234!");
  const adminPw = await hash("Admin1234!");

  const u = (id: ObjectId, email: string, password: string, firstName: string, lastName: string, role: string, nid: ObjectId | null, address: string | null, points: number, days: number) => ({
    _id: id, email, password, firstName, lastName, role,
    neighbourhoodId: nid ? nid.toString() : null,
    address, points, isActive: true, lang: "fr", createdAt: past(days),
  });

  await db.collection("users").insertMany([
    u(uids.admin, "admin@hoodly.com", adminPw, "Admin", "Hoodly", "admin", null, null, 50, 90),
    u(uids.modo_montmartre, "modo.montmartre@hoodly.com", modoPw, "Sophie", "Leroux", "moderateur", nids.montmartre, null, 120, 80),
    u(uids.modo_belleville, "modo.belleville@hoodly.com", modoPw, "Marc", "Dupont", "moderateur", nids.belleville, null, 95, 75),
    u(uids.modo_marais, "modo.marais@hoodly.com", modoPw, "Nathalie", "Roche", "moderateur", nids.marais, null, 80, 70),
    // Montmartre
    u(uids.alice, "alice@hoodly.com", pw, "Alice", "Martin", "habitant", nids.montmartre, "8 rue des Abbesses, 75018 Paris", 85, 60),
    u(uids.bob, "bob@hoodly.com", pw, "Bob", "Bernard", "habitant", nids.montmartre, "23 rue Caulaincourt, 75018 Paris", 60, 55),
    u(uids.julien, "julien@hoodly.com", pw, "Julien", "Morel", "habitant", nids.montmartre, "5 rue Gabrielle, 75018 Paris", 50, 40),
    u(uids.camille, "camille@hoodly.com", pw, "Camille", "Duval", "habitant", nids.montmartre, "18 rue Lepic, 75018 Paris", 50, 35),
    // Belleville
    u(uids.charlie, "charlie@hoodly.com", pw, "Charlie", "Petit", "habitant", nids.belleville, "17 rue Denoyez, 75020 Paris", 70, 50),
    u(uids.diana, "diana@hoodly.com", pw, "Diana", "Moreau", "habitant", nids.belleville, "5 rue Jouye-Rouve, 75020 Paris", 55, 45),
    u(uids.karim, "karim@hoodly.com", pw, "Karim", "Bensaid", "habitant", nids.belleville, "32 rue de Belleville, 75020 Paris", 50, 38),
    u(uids.lea, "lea@hoodly.com", pw, "Léa", "Fontaine", "habitant", nids.belleville, "10 rue Ramponeau, 75020 Paris", 50, 30),
    // Marais
    u(uids.eve, "eve@hoodly.com", pw, "Eve", "Simon", "habitant", nids.marais, "31 rue des Francs-Bourgeois, 75004 Paris", 65, 48),
    u(uids.frank, "frank@hoodly.com", pw, "Frank", "Laurent", "habitant", nids.marais, "14 rue de Rivoli, 75004 Paris", 50, 42),
    u(uids.nadia, "nadia@hoodly.com", pw, "Nadia", "Khelifi", "habitant", nids.marais, "7 rue du Temple, 75004 Paris", 50, 28),
    // Bastille
    u(uids.grace, "grace@hoodly.com", pw, "Grace", "Thomas", "habitant", nids.bastille, "9 rue de la Roquette, 75011 Paris", 55, 40),
    u(uids.hugo, "hugo@hoodly.com", pw, "Hugo", "Richard", "habitant", nids.bastille, "22 rue de Charonne, 75011 Paris", 65, 35),
    u(uids.omar, "omar@hoodly.com", pw, "Omar", "Diallo", "habitant", nids.bastille, "15 rue de Lappe, 75011 Paris", 50, 25),
    // Republique
    u(uids.iris, "iris@hoodly.com", pw, "Iris", "Garcia", "habitant", nids.republique, "3 rue du Faubourg du Temple, 75010 Paris", 60, 32),
    u(uids.thomas, "thomas@hoodly.com", pw, "Thomas", "Lemaire", "habitant", nids.republique, "28 avenue de la République, 75011 Paris", 50, 20),
    // Bon Marche
    u(uids.sophie, "sophie@hoodly.com", pw, "Sophie", "Blanchard", "habitant", nids.bonmarche, "24 rue de Sèvres, 75007 Paris", 50, 10),
    u(uids.remi, "remi@hoodly.com", pw, "Rémi", "Perrin", "habitant", nids.bonmarche, "38 rue du Bac, 75007 Paris", 50, 8),
    u(uids.clara, "clara@hoodly.com", pw, "Clara", "Rousseau", "habitant", nids.bonmarche, "12 rue de Babylone, 75007 Paris", 50, 5),
  ]);
  console.log("23 utilisateurs");

  // ── Events ─────────────────────────────────────────────────────────────
  const eids = {
    soiree: new ObjectId(), jardinage: new ObjectId(), vide_grenier: new ObjectId(), karaoke: new ObjectId(),
    cours_cuisine: new ObjectId(), rando_montmartre: new ObjectId(),
    concert: new ObjectId(), marche: new ObjectId(), reunion: new ObjectId(), fresque: new ObjectId(),
    theatre_belleville: new ObjectId(), repair_cafe: new ObjectId(),
    expo: new ObjectId(), yoga: new ObjectId(), brocante_marais: new ObjectId(),
    lecture_marais: new ObjectId(), danse_marais: new ObjectId(),
    fete_voisins: new ObjectId(), collecte: new ObjectId(), course: new ObjectId(),
    escape_bastille: new ObjectId(), potager_bastille: new ObjectId(),
    velo: new ObjectId(), pique_nique: new ObjectId(), debat: new ObjectId(),
    cine_republique: new ObjectId(), tricot_republique: new ObjectId(),
    brunch: new ObjectId(), atelier_couture: new ObjectId(), marche_bm: new ObjectId(),
    chorale_bm: new ObjectId(), lecture_bm: new ObjectId(),
  };

  const ev = (id: ObjectId, title: string, desc: string, type: string, orgId: ObjectId, nid: ObjectId, date: Date, parts: ObjectId[], interest: ObjectId[], rewarded: boolean, created: number) => ({
    _id: id, title, description: desc, type, organizerId: orgId.toString(), neighbourhoodId: nid.toString(),
    date, participants: parts.map(p => p.toString()), interestUsers: interest.map(i => i.toString()),
    pointsRewarded: rewarded, createdAt: past(created),
  });

  await db.collection("events").insertMany([
    // Montmartre
    ev(eids.soiree, "Soirée de quartier", "Grande soirée conviviale pour tous les voisins", "social", uids.modo_montmartre, nids.montmartre, future(7), [uids.alice, uids.bob, uids.julien, uids.modo_montmartre], [uids.camille], false, 10),
    ev(eids.jardinage, "Atelier jardinage collectif", "Venez jardiner ensemble dans le square", "atelier", uids.alice, nids.montmartre, future(14), [uids.alice, uids.camille], [uids.bob, uids.julien], false, 8),
    ev(eids.vide_grenier, "Vide grenier de printemps", "Venez vendre et acheter !", "commerce", uids.modo_montmartre, nids.montmartre, past(5), [uids.alice, uids.bob, uids.julien], [], true, 20),
    ev(eids.karaoke, "Karaoké entre voisins", "Soirée karaoké au café du coin", "social", uids.julien, nids.montmartre, future(3), [uids.julien, uids.camille, uids.bob], [uids.alice], false, 5),
    ev(eids.cours_cuisine, "Cours de cuisine du monde", "Découvrez les recettes des voisins", "atelier", uids.camille, nids.montmartre, future(21), [uids.camille, uids.alice], [uids.julien], false, 2),
    ev(eids.rando_montmartre, "Rando urbaine Montmartre", "Balade historique dans les rues secrètes", "sport", uids.alice, nids.montmartre, future(9), [uids.alice, uids.julien], [uids.camille], false, 3),
    // Belleville
    ev(eids.concert, "Concert de rue", "Musiciens du quartier en plein air", "culture", uids.modo_belleville, nids.belleville, future(5), [uids.charlie, uids.diana, uids.karim], [uids.lea], false, 7),
    ev(eids.marche, "Marché solidaire", "Produits locaux et artisanat", "commerce", uids.modo_belleville, nids.belleville, future(10), [uids.charlie, uids.lea], [uids.diana, uids.karim], false, 6),
    ev(eids.reunion, "Réunion de quartier", "Bilan des projets en cours", "reunion", uids.modo_belleville, nids.belleville, past(3), [uids.charlie, uids.diana, uids.karim, uids.modo_belleville], [], true, 15),
    ev(eids.fresque, "Fresque murale collaborative", "Peignons ensemble le mur de la rue Denoyez", "culture", uids.karim, nids.belleville, future(18), [uids.karim, uids.lea, uids.charlie], [uids.diana], false, 4),
    ev(eids.theatre_belleville, "Théâtre de rue", "Spectacle improvisé sur la place", "culture", uids.diana, nids.belleville, future(25), [uids.diana, uids.lea], [uids.charlie], false, 2),
    ev(eids.repair_cafe, "Repair Café", "Réparez vos objets avec des bénévoles", "atelier", uids.lea, nids.belleville, future(12), [uids.lea, uids.charlie], [uids.karim], false, 3),
    // Marais
    ev(eids.expo, "Exposition photo", "Photos du quartier par ses habitants", "culture", uids.frank, nids.marais, future(12), [uids.frank, uids.eve, uids.nadia], [], false, 5),
    ev(eids.yoga, "Yoga en plein air", "Séance de yoga tous les samedis", "sport", uids.eve, nids.marais, future(3), [uids.eve, uids.nadia], [uids.frank], false, 4),
    ev(eids.brocante_marais, "Brocante du Marais", "Antiquités et objets vintage", "commerce", uids.modo_marais, nids.marais, past(7), [uids.eve, uids.frank, uids.nadia], [], true, 18),
    ev(eids.lecture_marais, "Club de lecture", "Échangez autour de vos lectures du mois", "culture", uids.nadia, nids.marais, future(8), [uids.nadia, uids.eve], [uids.frank], false, 2),
    ev(eids.danse_marais, "Initiation danse swing", "Apprenez le swing entre voisins", "sport", uids.frank, nids.marais, future(16), [uids.frank], [uids.eve, uids.nadia], false, 1),
    // Bastille
    ev(eids.fete_voisins, "Fête des voisins", "La grande fête annuelle !", "social", uids.grace, nids.bastille, future(20), [uids.grace, uids.hugo, uids.omar], [], false, 3),
    ev(eids.collecte, "Collecte alimentaire", "Pour les familles dans le besoin", "solidarite", uids.hugo, nids.bastille, future(8), [uids.hugo, uids.omar], [uids.grace], false, 2),
    ev(eids.course, "Course solidaire du 11e", "5km de course pour une association", "sport", uids.omar, nids.bastille, past(2), [uids.omar, uids.hugo, uids.grace], [], true, 12),
    ev(eids.escape_bastille, "Escape game de quartier", "Énigmes dans les rues de Bastille", "social", uids.grace, nids.bastille, future(13), [uids.grace, uids.hugo], [uids.omar], false, 2),
    ev(eids.potager_bastille, "Potager partagé", "Entretien du potager collectif", "atelier", uids.hugo, nids.bastille, future(6), [uids.hugo], [uids.grace, uids.omar], false, 1),
    // Republique
    ev(eids.velo, "Atelier réparation vélo", "Apprenez à réparer votre vélo", "atelier", uids.iris, nids.republique, future(6), [uids.iris, uids.thomas], [], false, 4),
    ev(eids.pique_nique, "Pique-nique de printemps", "Rendez-vous au parc !", "social", uids.thomas, nids.republique, past(10), [uids.iris, uids.thomas], [], true, 20),
    ev(eids.debat, "Débat citoyen", "Discussion ouverte sur l'avenir du quartier", "reunion", uids.iris, nids.republique, future(15), [uids.iris], [uids.thomas], false, 3),
    ev(eids.cine_republique, "Ciné en plein air", "Projection sur la place de la République", "culture", uids.thomas, nids.republique, future(22), [uids.thomas], [uids.iris], false, 1),
    ev(eids.tricot_republique, "Atelier tricot solidaire", "Tricotez des bonnets pour les sans-abri", "atelier", uids.iris, nids.republique, future(10), [uids.iris, uids.thomas], [], false, 3),
    // Bon Marche
    ev(eids.brunch, "Brunch dominical", "Brunch partagé sur la place", "social", uids.sophie, nids.bonmarche, future(4), [uids.sophie, uids.remi, uids.clara], [], false, 6),
    ev(eids.atelier_couture, "Atelier couture", "Apprenez à recoudre vos vêtements", "atelier", uids.clara, nids.bonmarche, future(11), [uids.clara, uids.sophie], [uids.remi], false, 3),
    ev(eids.marche_bm, "Marché bio du Bon Marché", "Producteurs locaux et bio", "commerce", uids.remi, nids.bonmarche, past(4), [uids.remi, uids.sophie, uids.clara], [], true, 14),
    ev(eids.chorale_bm, "Chorale de quartier", "Chantez avec vos voisins tous les mercredis", "culture", uids.sophie, nids.bonmarche, future(5), [uids.sophie, uids.clara], [uids.remi], false, 2),
    ev(eids.lecture_bm, "Lecture au jardin", "Lectures à voix haute dans le jardin partagé", "culture", uids.clara, nids.bonmarche, future(17), [uids.clara], [uids.sophie, uids.remi], false, 1),
  ]);
  console.log("32 evenements");

  // ── Announcements ──────────────────────────────────────────────────────
  const avail = (daysAhead: number, startTime: string, endTime: string) =>
    ({ date: future(daysAhead).toISOString().slice(0, 10), startTime, endTime });
  await db.collection("announcements").insertMany([
    // Montmartre
    { _id: new ObjectId(), authorId: uids.alice.toString(), neighbourhoodId: nids.montmartre.toString(), title: "Cours de guitare", description: "Je propose des cours de guitare pour débutants, 1h/semaine.", type: "offer", isPaid: true, points: 10, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(3, "14:00", "15:00"), avail(6, "14:00", "15:00")], serviceDetails: null, createdAt: past(5) },
    { _id: new ObjectId(), authorId: uids.bob.toString(), neighbourhoodId: nids.montmartre.toString(), title: "Garde de chat", description: "Cherche quelqu'un pour garder mon chat pendant les vacances.", type: "request", isPaid: false, points: 5, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(10, "09:00", "10:00"), avail(11, "09:00", "10:00")], serviceDetails: null, createdAt: past(3) },
    { _id: new ObjectId(), authorId: uids.modo_montmartre.toString(), neighbourhoodId: nids.montmartre.toString(), title: "Aide déménagement", description: "Propose mon aide pour déménagements légers.", type: "offer", isPaid: false, points: 15, status: "done", acceptedBy: uids.alice.toString(), contractId: null, availabilities: null, serviceDetails: { chosenDate: past(10).toISOString().slice(0,10), timeSlot: "09:00-12:00" }, createdAt: past(15) },
    { _id: new ObjectId(), authorId: uids.julien.toString(), neighbourhoodId: nids.montmartre.toString(), title: "Cours de maths", description: "Etudiant en maths, propose du soutien scolaire niveau lycée.", type: "offer", isPaid: true, points: 12, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(4, "17:00", "18:30"), avail(7, "17:00", "18:30")], serviceDetails: null, createdAt: past(2) },
    { _id: new ObjectId(), authorId: uids.camille.toString(), neighbourhoodId: nids.montmartre.toString(), title: "Cherche coiffeuse", description: "Cherche une coiffeuse à domicile pour une coupe.", type: "request", isPaid: true, points: 8, status: "accepted", acceptedBy: uids.alice.toString(), contractId: null, availabilities: null, serviceDetails: { chosenDate: future(3).toISOString().slice(0,10), timeSlot: "10:00-11:00" }, createdAt: past(4) },
    // Belleville
    { _id: new ObjectId(), authorId: uids.charlie.toString(), neighbourhoodId: nids.belleville.toString(), title: "Cours de cuisine", description: "Cuisinière amateur, je partage mes recettes en atelier.", type: "offer", isPaid: true, points: 8, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(5, "10:00", "12:00")], serviceDetails: null, createdAt: past(4) },
    { _id: new ObjectId(), authorId: uids.diana.toString(), neighbourhoodId: nids.belleville.toString(), title: "Babysitting", description: "Expérimentée avec les enfants 2-8 ans.", type: "offer", isPaid: true, points: 12, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(1, "09:00", "12:00"), avail(2, "09:00", "12:00"), avail(8, "09:00", "12:00")], serviceDetails: null, createdAt: past(2) },
    { _id: new ObjectId(), authorId: uids.charlie.toString(), neighbourhoodId: nids.belleville.toString(), title: "Recherche plombier", description: "Petit problème de fuite, besoin d'aide rapidement.", type: "request", isPaid: true, points: 0, status: "accepted", acceptedBy: uids.karim.toString(), contractId: null, availabilities: null, serviceDetails: { chosenDate: future(2).toISOString().slice(0,10), timeSlot: "10:00-11:00" }, createdAt: past(8) },
    { _id: new ObjectId(), authorId: uids.karim.toString(), neighbourhoodId: nids.belleville.toString(), title: "Montage de meubles", description: "Je monte vos meubles IKEA rapidement.", type: "offer", isPaid: false, points: 10, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(6, "09:00", "18:00"), avail(7, "09:00", "18:00")], serviceDetails: null, createdAt: past(3) },
    { _id: new ObjectId(), authorId: uids.lea.toString(), neighbourhoodId: nids.belleville.toString(), title: "Aide admin", description: "Aide pour remplir des formulaires administratifs.", type: "offer", isPaid: false, points: 5, status: "done", acceptedBy: uids.diana.toString(), contractId: null, availabilities: null, serviceDetails: { chosenDate: past(5).toISOString().slice(0,10), timeSlot: "14:00-16:00" }, createdAt: past(12) },
    // Marais
    { _id: new ObjectId(), authorId: uids.frank.toString(), neighbourhoodId: nids.marais.toString(), title: "Cours de photo", description: "Photographe amateur, initiation à la photo numérique.", type: "offer", isPaid: false, points: 10, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(9, "10:00", "12:00")], serviceDetails: null, createdAt: past(6) },
    { _id: new ObjectId(), authorId: uids.eve.toString(), neighbourhoodId: nids.marais.toString(), title: "Promenade de chien", description: "Disponible le matin pour promener votre chien.", type: "offer", isPaid: false, points: 5, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(1, "07:00", "09:00"), avail(2, "07:00", "09:00"), avail(3, "07:00", "09:00")], serviceDetails: null, createdAt: past(3) },
    { _id: new ObjectId(), authorId: uids.nadia.toString(), neighbourhoodId: nids.marais.toString(), title: "Cours de yoga privé", description: "Prof de yoga certifiée, cours individuel.", type: "offer", isPaid: true, points: 15, status: "accepted", acceptedBy: uids.frank.toString(), contractId: null, availabilities: null, serviceDetails: { chosenDate: future(5).toISOString().slice(0,10), timeSlot: "08:00-09:00" }, createdAt: past(4) },
    // Bastille
    { _id: new ObjectId(), authorId: uids.grace.toString(), neighbourhoodId: nids.bastille.toString(), title: "Soutien scolaire", description: "Propose aide aux devoirs maths/français collège.", type: "offer", isPaid: false, points: 8, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(6, "14:00", "16:00"), avail(13, "14:00", "16:00")], serviceDetails: null, createdAt: past(5) },
    { _id: new ObjectId(), authorId: uids.hugo.toString(), neighbourhoodId: nids.bastille.toString(), title: "Besoin de peintre", description: "Salon à repeindre, cherche coup de main.", type: "request", isPaid: true, points: 20, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(7, "10:00", "17:00"), avail(8, "10:00", "17:00")], serviceDetails: null, createdAt: past(1) },
    { _id: new ObjectId(), authorId: uids.omar.toString(), neighbourhoodId: nids.bastille.toString(), title: "Réparation électrique", description: "Electricien de métier, je peux dépanner vos petits soucis.", type: "offer", isPaid: true, points: 15, status: "done", acceptedBy: uids.grace.toString(), contractId: null, availabilities: null, serviceDetails: { chosenDate: past(3).toISOString().slice(0,10), timeSlot: "09:00-10:00" }, createdAt: past(10) },
    // Republique
    { _id: new ObjectId(), authorId: uids.iris.toString(), neighbourhoodId: nids.republique.toString(), title: "Réparation vélo", description: "Je répare les vélos gratuitement le weekend.", type: "offer", isPaid: false, points: 10, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(4, "10:00", "17:00"), avail(5, "10:00", "17:00")], serviceDetails: null, createdAt: past(4) },
    { _id: new ObjectId(), authorId: uids.thomas.toString(), neighbourhoodId: nids.republique.toString(), title: "Cherche covoiturage", description: "Trajet Paris–Lyon régulier, cherche covoitureur.", type: "request", isPaid: false, points: 5, status: "open", acceptedBy: null, contractId: null, availabilities: null, serviceDetails: null, createdAt: past(2) },
    { _id: new ObjectId(), authorId: uids.thomas.toString(), neighbourhoodId: nids.republique.toString(), title: "Aide informatique", description: "Je dépanne vos PC et configure vos box internet.", type: "offer", isPaid: false, points: 8, status: "accepted", acceptedBy: uids.iris.toString(), contractId: null, availabilities: null, serviceDetails: { chosenDate: future(1).toISOString().slice(0,10), timeSlot: "15:00-16:00" }, createdAt: past(6) },
    // Bon Marche
    { _id: new ObjectId(), authorId: uids.sophie.toString(), neighbourhoodId: nids.bonmarche.toString(), title: "Cours de piano", description: "Pianiste classique, donne cours débutants/intermédiaires.", type: "offer", isPaid: true, points: 15, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(2, "18:00", "19:00"), avail(5, "18:00", "19:00")], serviceDetails: null, createdAt: past(5) },
    { _id: new ObjectId(), authorId: uids.remi.toString(), neighbourhoodId: nids.bonmarche.toString(), title: "Jardinage balcon", description: "Je peux vous aider à aménager votre balcon en jardin.", type: "offer", isPaid: false, points: 8, status: "open", acceptedBy: null, contractId: null, availabilities: [avail(3, "09:00", "12:00")], serviceDetails: null, createdAt: past(3) },
    { _id: new ObjectId(), authorId: uids.clara.toString(), neighbourhoodId: nids.bonmarche.toString(), title: "Besoin de pet-sitter", description: "Cherche quelqu'un pour garder mon chien ce weekend.", type: "request", isPaid: false, points: 5, status: "accepted", acceptedBy: uids.remi.toString(), contractId: null, availabilities: null, serviceDetails: { chosenDate: future(2).toISOString().slice(0,10), timeSlot: "08:00-20:00" }, createdAt: past(1) },
  ]);
  console.log("22 annonces");

  // ── Votes ──────────────────────────────────────────────────────────────
  const vt = (q: string, type: string, opts: string[], anon: boolean, end: Date, nid: ObjectId, results: any[], rewarded: boolean, created: number) => ({
    _id: new ObjectId(), question: q, type, options: opts, isAnonymous: anon, endsAt: end, neighbourhoodId: nid.toString(), results, pointsRewarded: rewarded, createdAt: past(created),
  });

  await db.collection("votes").insertMany([
    // Montmartre
    vt("Faut-il installer des bancs supplémentaires dans le parc ?", "yesno", ["Oui","Non"], false, future(5), nids.montmartre, [{option:"Oui",userIds:[uids.alice,uids.bob,uids.julien]},{option:"Non",userIds:[uids.camille]}], false, 2),
    vt("Quel jour pour la fête de quartier ?", "multiple", ["Samedi","Dimanche","Vendredi soir"], false, future(10), nids.montmartre, [{option:"Samedi",userIds:[uids.alice,uids.julien]},{option:"Dimanche",userIds:[uids.bob]},{option:"Vendredi soir",userIds:[uids.camille]}], false, 1),
    // Belleville
    vt("Souhaitez-vous un jardin partagé ?", "yesno", ["Oui","Non"], true, future(3), nids.belleville, [{option:"Oui",userIds:[uids.charlie,uids.diana,uids.lea]},{option:"Non",userIds:[uids.karim]}], false, 3),
    vt("Fréquence du marché solidaire ?", "multiple", ["Hebdomadaire","Mensuel","Bimensuel"], false, past(1), nids.belleville, [{option:"Hebdomadaire",userIds:[uids.charlie,uids.karim]},{option:"Mensuel",userIds:[]},{option:"Bimensuel",userIds:[uids.diana]}], true, 10),
    // Marais
    vt("Installer un local à vélos sécurisé ?", "yesno", ["Oui","Non"], false, future(7), nids.marais, [{option:"Oui",userIds:[uids.frank,uids.eve,uids.nadia]},{option:"Non",userIds:[]}], false, 2),
    vt("Thème de l'exposition photo ?", "multiple", ["Portraits","Architecture","Nature urbaine"], false, future(4), nids.marais, [{option:"Portraits",userIds:[uids.eve]},{option:"Architecture",userIds:[uids.frank,uids.nadia]},{option:"Nature urbaine",userIds:[]}], false, 1),
    // Bastille
    vt("Organiser un composteur collectif ?", "yesno", ["Oui","Non"], false, future(6), nids.bastille, [{option:"Oui",userIds:[uids.grace,uids.omar]},{option:"Non",userIds:[uids.hugo]}], false, 3),
    vt("Heure préférée pour les ateliers ?", "multiple", ["Matin","Après-midi","Soirée"], false, future(8), nids.bastille, [{option:"Matin",userIds:[uids.omar]},{option:"Après-midi",userIds:[uids.grace,uids.hugo]},{option:"Soirée",userIds:[]}], false, 2),
    // Republique
    vt("Créer une bibliothèque de quartier ?", "yesno", ["Oui","Non"], false, future(5), nids.republique, [{option:"Oui",userIds:[uids.iris,uids.thomas]},{option:"Non",userIds:[]}], false, 1),
    vt("Fréquence des ateliers vélo ?", "multiple", ["Toutes les semaines","Tous les 15 jours","Une fois par mois"], false, past(2), nids.republique, [{option:"Toutes les semaines",userIds:[uids.iris]},{option:"Tous les 15 jours",userIds:[uids.thomas]},{option:"Une fois par mois",userIds:[]}], true, 12),
    // Bon Marche
    vt("Créer un espace de coworking partagé ?", "yesno", ["Oui","Non"], false, future(12), nids.bonmarche, [{option:"Oui",userIds:[uids.sophie,uids.clara]},{option:"Non",userIds:[uids.remi]}], false, 4),
    vt("Quel type d'atelier préférez-vous ?", "multiple", ["Cuisine","Couture","Jardinage","Peinture"], false, future(8), nids.bonmarche, [{option:"Cuisine",userIds:[uids.remi]},{option:"Couture",userIds:[uids.clara]},{option:"Jardinage",userIds:[uids.sophie,uids.remi]},{option:"Peinture",userIds:[]}], false, 2),
  ]);
  console.log("12 sondages");

  // ── Conversations & Messages ───────────────────────────────────────────
  const convIds = { alice_bob: new ObjectId(), charlie_diana: new ObjectId(), sophie_remi: new ObjectId(), grace_hugo: new ObjectId() };

  await db.collection("conversations").insertMany([
    { _id: convIds.alice_bob, participants: [uids.alice.toString(), uids.bob.toString()], lastMessage: "On se retrouve samedi ?", createdAt: past(2) },
    { _id: convIds.charlie_diana, participants: [uids.charlie.toString(), uids.diana.toString()], lastMessage: "Super idée pour la fresque !", createdAt: past(1) },
    { _id: convIds.sophie_remi, participants: [uids.sophie.toString(), uids.remi.toString()], lastMessage: "Je ramène le gâteau dimanche", createdAt: past(1) },
    { _id: convIds.grace_hugo, participants: [uids.grace.toString(), uids.hugo.toString()], lastMessage: "T'as vu le résultat du vote ?", createdAt: past(1) },
  ]);

  await db.collection("messages").insertMany([
    { _id: new ObjectId(), conversationId: convIds.alice_bob.toString(), senderId: uids.alice.toString(), content: "Salut Bob ! Tu viens à la soirée samedi ?", createdAt: past(2) },
    { _id: new ObjectId(), conversationId: convIds.alice_bob.toString(), senderId: uids.bob.toString(), content: "Oui ! À quelle heure on se retrouve ?", createdAt: past(2) },
    { _id: new ObjectId(), conversationId: convIds.alice_bob.toString(), senderId: uids.alice.toString(), content: "On se retrouve samedi ?", createdAt: past(1) },
    { _id: new ObjectId(), conversationId: convIds.charlie_diana.toString(), senderId: uids.charlie.toString(), content: "Tu as vu le projet de fresque ?", createdAt: past(1) },
    { _id: new ObjectId(), conversationId: convIds.charlie_diana.toString(), senderId: uids.diana.toString(), content: "Super idée pour la fresque !", createdAt: past(1) },
    { _id: new ObjectId(), conversationId: convIds.sophie_remi.toString(), senderId: uids.sophie.toString(), content: "On organise le brunch dimanche, tu viens ?", createdAt: past(2) },
    { _id: new ObjectId(), conversationId: convIds.sophie_remi.toString(), senderId: uids.remi.toString(), content: "Avec plaisir ! Je peux ramener quelque chose ?", createdAt: past(1) },
    { _id: new ObjectId(), conversationId: convIds.sophie_remi.toString(), senderId: uids.sophie.toString(), content: "Je ramène le gâteau dimanche", createdAt: past(1) },
    { _id: new ObjectId(), conversationId: convIds.grace_hugo.toString(), senderId: uids.grace.toString(), content: "Le composteur a été voté pour !", createdAt: past(1) },
    { _id: new ObjectId(), conversationId: convIds.grace_hugo.toString(), senderId: uids.hugo.toString(), content: "T'as vu le résultat du vote ?", createdAt: past(1) },
  ]);
  console.log("4 conversations, 10 messages");

  await client.close();

  // ── Neo4j ──────────────────────────────────────────────────────────────
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session();
  await session.run("MATCH (n) DETACH DELETE n");

  const allEvents = [
    // Montmartre
    ...[eids.soiree, eids.jardinage, eids.vide_grenier, eids.karaoke, eids.cours_cuisine, eids.rando_montmartre].map(eid => ({ eid, nid: nids.montmartre })),
    // Belleville
    ...[eids.concert, eids.marche, eids.reunion, eids.fresque, eids.theatre_belleville, eids.repair_cafe].map(eid => ({ eid, nid: nids.belleville })),
    // Marais
    ...[eids.expo, eids.yoga, eids.brocante_marais, eids.lecture_marais, eids.danse_marais].map(eid => ({ eid, nid: nids.marais })),
    // Bastille
    ...[eids.fete_voisins, eids.collecte, eids.course, eids.escape_bastille, eids.potager_bastille].map(eid => ({ eid, nid: nids.bastille })),
    // Republique
    ...[eids.velo, eids.pique_nique, eids.debat, eids.cine_republique, eids.tricot_republique].map(eid => ({ eid, nid: nids.republique })),
    // Bon Marche
    ...[eids.brunch, eids.atelier_couture, eids.marche_bm, eids.chorale_bm, eids.lecture_bm].map(eid => ({ eid, nid: nids.bonmarche })),
  ];

  const attendedPairs: [ObjectId, ObjectId][] = [
    // Montmartre
    [uids.alice, eids.soiree], [uids.bob, eids.soiree], [uids.julien, eids.soiree], [uids.modo_montmartre, eids.soiree],
    [uids.alice, eids.jardinage], [uids.camille, eids.jardinage],
    [uids.alice, eids.vide_grenier], [uids.bob, eids.vide_grenier], [uids.julien, eids.vide_grenier],
    [uids.julien, eids.karaoke], [uids.camille, eids.karaoke], [uids.bob, eids.karaoke],
    [uids.camille, eids.cours_cuisine], [uids.alice, eids.cours_cuisine],
    [uids.alice, eids.rando_montmartre], [uids.julien, eids.rando_montmartre],
    // Belleville
    [uids.charlie, eids.concert], [uids.diana, eids.concert], [uids.karim, eids.concert],
    [uids.charlie, eids.marche], [uids.lea, eids.marche],
    [uids.charlie, eids.reunion], [uids.diana, eids.reunion], [uids.karim, eids.reunion], [uids.modo_belleville, eids.reunion],
    [uids.karim, eids.fresque], [uids.lea, eids.fresque], [uids.charlie, eids.fresque],
    [uids.diana, eids.theatre_belleville], [uids.lea, eids.theatre_belleville],
    [uids.lea, eids.repair_cafe], [uids.charlie, eids.repair_cafe],
    // Marais
    [uids.frank, eids.expo], [uids.eve, eids.expo], [uids.nadia, eids.expo],
    [uids.eve, eids.yoga], [uids.nadia, eids.yoga],
    [uids.eve, eids.brocante_marais], [uids.frank, eids.brocante_marais], [uids.nadia, eids.brocante_marais],
    [uids.nadia, eids.lecture_marais], [uids.eve, eids.lecture_marais],
    [uids.frank, eids.danse_marais],
    // Bastille
    [uids.grace, eids.fete_voisins], [uids.hugo, eids.fete_voisins], [uids.omar, eids.fete_voisins],
    [uids.hugo, eids.collecte], [uids.omar, eids.collecte],
    [uids.omar, eids.course], [uids.hugo, eids.course], [uids.grace, eids.course],
    [uids.grace, eids.escape_bastille], [uids.hugo, eids.escape_bastille],
    [uids.hugo, eids.potager_bastille],
    // Republique
    [uids.iris, eids.velo], [uids.thomas, eids.velo],
    [uids.iris, eids.pique_nique], [uids.thomas, eids.pique_nique],
    [uids.iris, eids.debat], [uids.thomas, eids.debat],
    [uids.thomas, eids.cine_republique],
    [uids.iris, eids.tricot_republique], [uids.thomas, eids.tricot_republique],
    // Bon Marche
    [uids.sophie, eids.brunch], [uids.remi, eids.brunch], [uids.clara, eids.brunch],
    [uids.clara, eids.atelier_couture], [uids.sophie, eids.atelier_couture],
    [uids.remi, eids.marche_bm], [uids.sophie, eids.marche_bm], [uids.clara, eids.marche_bm],
    [uids.sophie, eids.chorale_bm], [uids.clara, eids.chorale_bm],
    [uids.clara, eids.lecture_bm],
    // Modos dans leur quartier
    [uids.modo_marais, eids.expo], [uids.modo_marais, eids.yoga],
    [uids.modo_montmartre, eids.jardinage], [uids.modo_belleville, eids.marche],
    // Admin visite tout
    [uids.admin, eids.soiree], [uids.admin, eids.concert], [uids.admin, eids.expo],
  ];

  const eventNidMap = new Map(allEvents.map(e => [e.eid.toString(), e.nid.toString()]));

  for (const [uid, eid] of attendedPairs) {
    await session.run(
      `MERGE (u:User {id: $userId}) MERGE (e:Event {id: $eventId}) ON CREATE SET e.neighbourhoodId = $nid MERGE (u)-[:ATTENDED]->(e)`,
      { userId: uid.toString(), eventId: eid.toString(), nid: eventNidMap.get(eid.toString())! },
    );
  }
  console.log(`${attendedPairs.length} ATTENDED`);

  const interestedPairs: [ObjectId, ObjectId][] = [
    // Montmartre
    [uids.camille, eids.soiree], [uids.bob, eids.jardinage], [uids.julien, eids.jardinage], [uids.alice, eids.karaoke],
    [uids.camille, eids.vide_grenier],
    // Belleville
    [uids.lea, eids.concert], [uids.diana, eids.marche], [uids.karim, eids.marche], [uids.diana, eids.fresque],
    [uids.charlie, eids.concert], [uids.lea, eids.reunion],
    // Marais
    [uids.frank, eids.yoga], [uids.eve, eids.brocante_marais], [uids.nadia, eids.expo],
    // Bastille
    [uids.grace, eids.collecte], [uids.hugo, eids.fete_voisins], [uids.omar, eids.fete_voisins],
    [uids.hugo, eids.course], [uids.grace, eids.course],
    // Republique
    [uids.thomas, eids.debat], [uids.iris, eids.debat], [uids.iris, eids.velo], [uids.thomas, eids.pique_nique],
    // Bon Marche
    [uids.remi, eids.atelier_couture], [uids.sophie, eids.marche_bm], [uids.clara, eids.brunch],
    [uids.sophie, eids.brunch], [uids.remi, eids.brunch],
    // Cross-quartier (recommandations inter-quartiers)
    [uids.frank, eids.soiree], [uids.iris, eids.expo], [uids.alice, eids.concert],
    [uids.charlie, eids.expo], [uids.grace, eids.brunch], [uids.sophie, eids.yoga],
    [uids.hugo, eids.velo], [uids.nadia, eids.soiree], [uids.omar, eids.concert],
    [uids.clara, eids.karaoke], [uids.thomas, eids.fete_voisins], [uids.karim, eids.jardinage],
    [uids.julien, eids.brunch], [uids.lea, eids.pique_nique], [uids.bob, eids.expo],
    // Admin & modos (cross-quartier curiosity)
    [uids.admin, eids.soiree], [uids.admin, eids.concert], [uids.admin, eids.expo],
    [uids.admin, eids.fete_voisins], [uids.admin, eids.velo], [uids.admin, eids.brunch],
    [uids.modo_montmartre, eids.jardinage], [uids.modo_montmartre, eids.karaoke],
    [uids.modo_belleville, eids.concert], [uids.modo_belleville, eids.fresque],
    [uids.modo_marais, eids.expo], [uids.modo_marais, eids.yoga], [uids.modo_marais, eids.brocante_marais],
  ];

  for (const [uid, eid] of interestedPairs) {
    await session.run(
      `MERGE (u:User {id: $userId}) MERGE (e:Event {id: $eventId}) ON CREATE SET e.neighbourhoodId = $nid MERGE (u)-[:INTERESTED_IN]->(e)`,
      { userId: uid.toString(), eventId: eid.toString(), nid: eventNidMap.get(eid.toString())! },
    );
  }
  console.log(`${interestedPairs.length} INTERESTED_IN`);

  await session.close();
  await driver.close();

  // ── SQLite — Incidents ─────────────────────────────────────────────────
  const sqlite = new Database(SQLITE_PATH);
  sqlite.exec(`DELETE FROM incidents`);

  const ins = sqlite.prepare(`INSERT INTO incidents (id, title, description, category, status, reportedBy, neighborhoodId, reportedAt, syncedAt, isDirty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const incidents: any[][] = [
    [randomUUID(), "Lampadaire cassé rue Lepic", "Le lampadaire ne fonctionne plus depuis 3 jours.", "Voirie", "open", uids.alice.toString(), nids.montmartre.toString(), past(5).toISOString(), null, 0],
    [randomUUID(), "Tags sur le mur de l'école", "Graffitis sur la façade de l'école primaire.", "Dégradation", "open", uids.bob.toString(), nids.montmartre.toString(), past(3).toISOString(), null, 0],
    [randomUUID(), "Poubelles débordantes square", "Poubelles non vidées depuis une semaine.", "Propreté", "resolved", uids.julien.toString(), nids.montmartre.toString(), past(15).toISOString(), past(10).toISOString(), 0],
    [randomUUID(), "Nid-de-poule dangereux", "Gros trou chaussée rue de Belleville.", "Voirie", "open", uids.charlie.toString(), nids.belleville.toString(), past(4).toISOString(), null, 0],
    [randomUUID(), "Fuite d'eau trottoir", "Fuite visible devant le n°42.", "Infrastructure", "open", uids.diana.toString(), nids.belleville.toString(), past(2).toISOString(), null, 1],
    [randomUUID(), "Banc cassé parc", "Banc cassé et dangereux.", "Mobilier urbain", "resolved", uids.karim.toString(), nids.belleville.toString(), past(20).toISOString(), past(12).toISOString(), 0],
    [randomUUID(), "Éclairage défaillant passage", "Ampoules grillées dans le passage couvert.", "Voirie", "open", uids.frank.toString(), nids.marais.toString(), past(6).toISOString(), null, 0],
    [randomUUID(), "Dépôt sauvage déchets", "Cartons et meubles abandonnés rue du Temple.", "Propreté", "open", uids.eve.toString(), nids.marais.toString(), past(1).toISOString(), null, 1],
    [randomUUID(), "Signalisation effacée", "Passage piéton effacé place de la Bastille.", "Voirie", "open", uids.grace.toString(), nids.bastille.toString(), past(8).toISOString(), null, 0],
    [randomUUID(), "Arbre dangereux", "Arbre penchant après la tempête.", "Espaces verts", "open", uids.hugo.toString(), nids.bastille.toString(), past(2).toISOString(), null, 1],
    [randomUUID(), "Fontaine hors service", "Fontaine à eau cassée depuis 2 semaines.", "Infrastructure", "resolved", uids.omar.toString(), nids.bastille.toString(), past(25).toISOString(), past(18).toISOString(), 0],
    [randomUUID(), "Vélos abandonnés trottoir", "Vélos épaves encombrant le trottoir.", "Voirie", "open", uids.iris.toString(), nids.republique.toString(), past(7).toISOString(), null, 0],
    [randomUUID(), "Jeux enfants dégradés", "Toboggan cassé dans le square.", "Mobilier urbain", "open", uids.thomas.toString(), nids.republique.toString(), past(3).toISOString(), null, 1],
    [randomUUID(), "Trottoir abîmé rue de Sèvres", "Dalles cassées dangereuses pour les piétons.", "Voirie", "open", uids.sophie.toString(), nids.bonmarche.toString(), past(4).toISOString(), null, 0],
    [randomUUID(), "Poubelle renversée rue du Bac", "Poubelle de tri renversée chaque semaine.", "Propreté", "open", uids.remi.toString(), nids.bonmarche.toString(), past(2).toISOString(), null, 0],
  ];

  for (const inc of incidents) ins.run(...inc);
  sqlite.close();
  console.log(`${incidents.length} incidents`);

  console.log("\nSeed ok");
  console.log("   admin@hoodly.com            / Admin1234!");
  console.log("   modo.montmartre@hoodly.com  / Modo1234!");
  console.log("   modo.belleville@hoodly.com  / Modo1234!");
  console.log("   modo.marais@hoodly.com      / Modo1234!");
  console.log("   alice@hoodly.com            / Habitant1234!");
  console.log("   sophie@hoodly.com           / Habitant1234!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
