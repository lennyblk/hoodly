import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, MongoRepository } from "typeorm";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "stream";
import * as crypto from "crypto";
import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import PDFDocument from "pdfkit";
import { PDFDocument as PdfLibDoc, rgb, degrees, StandardFonts } from "pdf-lib";
import { JwtService } from "@nestjs/jwt";
import {
  Document,
  DocumentStatus,
  DocumentType,
  SignatureEntry,
  SignatureZone,
} from "../../entities/mongodb/Document";
import {
  Announcement,
  AnnouncementStatus,
  AnnouncementType,
} from "../../entities/mongodb/Announcement";
import { User } from "../../entities/mongodb/User";
import { UsersService } from "../users/users.service";
import { PointsService } from "../users/points.service";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import { SignDocumentDto } from "./dto/sign-document.dto";
import { GenerateContractDto } from "./dto/generate-contract.dto";

// A4 dimensions in pts (PDFKit default)
const A4_HEIGHT = 841.89;

// Signature page — absolute positions (PDFKit top-left origin)
const SIG_BOX_TOP = 150;
const SIG_BOX_HEIGHT = 80;
const SIG_BOX_WIDTH = 200;
// pdf-lib y from bottom = A4_HEIGHT - SIG_BOX_TOP - SIG_BOX_HEIGHT
const SIG_Y_PDF_LIB = Math.round(A4_HEIGHT - SIG_BOX_TOP - SIG_BOX_HEIGHT);

@Injectable()
export class DocumentsService implements OnModuleInit {
  private fontRegular: Buffer | null = null;
  private fontBold: Buffer | null = null;

  constructor(
    @InjectRepository(Document, "mongodb")
    private documentsRepository: MongoRepository<Document>,
    @InjectRepository(Announcement, "mongodb")
    private announcementsRepository: MongoRepository<Announcement>,
    @InjectDataSource("mongodb")
    private dataSource: DataSource,
    private jwtService: JwtService,
    private usersService: UsersService,
    private pointsService: PointsService,
  ) {}

  async onModuleInit() {
    const fontDir = "/usr/share/fonts/dejavu";
    try {
      this.fontRegular = fs.readFileSync(`${fontDir}/DejaVuSans.ttf`);
      this.fontBold = fs.readFileSync(`${fontDir}/DejaVuSans-Bold.ttf`);
      console.log("[DocumentsService] DejaVu font loaded — UTF-8 PDF ready");
    } catch (e: any) {
      console.warn(
        "[DocumentsService] Font load failed, using Helvetica fallback:",
        e.message,
      );
    }
  }

  private downloadBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const follow = (u: string, depth: number) => {
        if (depth > 5) return reject(new Error("Too many redirects"));
        const mod = u.startsWith("https") ? https : http;
        (mod as typeof https).get(u, (res) => {
          if (
            res.statusCode !== undefined &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            return follow(res.headers.location, depth + 1);
          }
          if (res.statusCode !== 200)
            return reject(new Error(`HTTP ${res.statusCode}`));
          const chunks: Buffer[] = [];
          res.on("data", (c: Buffer) => chunks.push(c));
          res.on("end", () => resolve(Buffer.concat(chunks)));
          res.on("error", reject);
        }).on("error", reject);
      };
      follow(url, 0);
    });
  }

  // ─── GridFS helpers 

  private getBucket(): GridFSBucket {
    const mongoClient = (this.dataSource.driver as any).queryRunner
      .databaseConnection;
    const db = mongoClient.db();
    return new GridFSBucket(db, { bucketName: "documents" });
  }

  async uploadToGridFS(buffer: Buffer, filename: string): Promise<string> {
    const bucket = this.getBucket();
    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(filename);
      Readable.from(buffer)
        .pipe(uploadStream)
        .on("finish", () => resolve(uploadStream.id.toString()))
        .on("error", reject);
    });
  }

  async downloadFromGridFS(gridfsId: string): Promise<Buffer> {
    const bucket = this.getBucket();
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(gridfsId);
    } catch {
      throw new BadRequestException("Invalid GridFS ID format");
    }
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      bucket
        .openDownloadStream(objectId)
        .on("data", (chunk: Buffer) => chunks.push(chunk))
        .on("end", () => resolve(Buffer.concat(chunks)))
        .on("error", reject);
    });
  }

  async deleteFromGridFS(gridfsId: string): Promise<void> {
    const bucket = this.getBucket();
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(gridfsId);
    } catch {
      throw new BadRequestException("Invalid GridFS ID format");
    }
    await bucket.delete(objectId);
  }

  // ─── CRUD 

  async findAll(userId?: string) {
    if (userId) {
      return this.documentsRepository.find({
        where: {
          $or: [{ ownerId: userId }, { signers: userId }],
        } as any,
      });
    }
    return this.documentsRepository.find();
  }

  async findOne(id: string) {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new BadRequestException("Invalid document ID format");
    }
    const doc = await this.documentsRepository.findOneBy({
      _id: objectId,
    } as any);
    if (!doc) throw new NotFoundException(`Document with id ${id} not found`);
    return doc;
  }

  async upload(
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    userId: string,
  ) {
    let signers: string[] = [userId];
    if (dto.announcementId) {
      try {
        const announcementOid = new ObjectId(dto.announcementId);
        const ann = await this.announcementsRepository.findOneBy({
          _id: announcementOid,
        } as any);
        if (ann?.authorId && ann?.acceptedBy) {
          signers = [ann.authorId, ann.acceptedBy];
        }
      } catch {
        // invalid announcementId — keep owner as sole signer
      }
    } else if (dto.signerEmail) {
      const otherUser = await this.usersService.findByEmail(dto.signerEmail);
      if (!otherUser) {
        throw new BadRequestException(`Aucun utilisateur trouvé avec l'email ${dto.signerEmail}`);
      }
      if (otherUser._id.toString() === userId) {
        throw new BadRequestException("Vous ne pouvez pas vous désigner vous-même comme signataire");
      }
      signers = [userId, otherUser._id.toString()];
    }

    const { buffer: pdfWithSigPage, zones: signatureZones } =
      await this.appendSignaturePage(file.buffer, signers.length);

    const gridfsId = await this.uploadToGridFS(pdfWithSigPage, file.originalname);

    const doc = this.documentsRepository.create({
      title: dto.title,
      type: dto.type ?? DocumentType.OTHER,
      name: file.originalname,
      ownerId: userId,
      signers,
      signatures: [],
      status: DocumentStatus.PENDING,
      gridfsId,
      announcementId: dto.announcementId,
      signatureZones,
    } as any);
    return this.documentsRepository.save(doc);
  }

  // ─── Sign 

  async sign(
    id: string,
    dto: SignDocumentDto,
    userId: string,
    userEmail: string,
  ) {
    // Verify OTP token
    try {
      const payload = await this.jwtService.verifyAsync<{
        email: string;
        type: string;
      }>(dto.otpToken, { secret: process.env.OTP_SECRET });
      if (payload.type !== "otp" || payload.email !== userEmail) {
        throw new UnauthorizedException(
          "OTP token invalide ou ne correspond pas à cet utilisateur",
        );
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException("OTP token expiré ou invalide");
    }

    const doc = await this.findOne(id);

    const isOwner = doc.ownerId === userId;
    const isSigner = doc.signers?.includes(userId);
    if (!isOwner && !isSigner) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à signer ce document",
      );
    }
    const alreadySigned = doc.signatures?.some(
      (s) => s.userId.toString() === userId,
    );
    if (alreadySigned) {
      throw new BadRequestException("Vous avez déjà signé ce document");
    }

    if (!doc.gridfsId) {
      throw new BadRequestException(
        "Ce document ne contient pas de fichier PDF",
      );
    }

    // Download PDF + compute hash
    const pdfBuffer = await this.downloadFromGridFS(doc.gridfsId);
    const hash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

    const signDate = new Date();
    const entry: SignatureEntry = {
      userId: new ObjectId(userId),
      hash,
      date: signDate,
    };
    doc.signatures = [...(doc.signatures ?? []), entry];

    // Embed signature image in PDF if provided
    if (dto.signatureImage) {
      let zone: SignatureZone | null = null;

      if (doc.signatureZones?.length) {
        const signerIndex = doc.signers.findIndex(
          (s) => s === userId || s.toString() === userId,
        );
        zone = signerIndex >= 0 ? doc.signatureZones[signerIndex] : null;
      }

      // No predefined zone — auto-place at bottom of last page
      if (!zone) {
        const signerIndex = doc.signers.findIndex(
          (s) => s === userId || s.toString() === userId,
        );
        // Offset horizontally so multiple signers don't overlap
        const xOffset = signerIndex <= 0 ? 30 : 280;
        zone = { page: -1, x: xOffset, y: 30, w: 200, h: 60 };
      }

      try {
        const updatedBuffer = await this.embedSignatureImage(
          pdfBuffer,
          dto.signatureImage,
          zone,
          signDate,
        );
        await this.deleteFromGridFS(doc.gridfsId);
        doc.gridfsId = await this.uploadToGridFS(updatedBuffer, doc.name);
      } catch (e: any) {
        console.warn(
          "[DocumentsService] Signature embed failed (non-fatal):",
          e.message,
        );
      }
    }

    const signerIds = [...(doc.signers ?? [])];
    if (isOwner && !signerIds.includes(userId)) signerIds.push(userId);
    const signedIds = doc.signatures.map((s) => s.userId.toString());
    const allSigned =
      signerIds.length > 0 && signerIds.every((sid) => signedIds.includes(sid));
    if (allSigned) {
      const payment = await this.getPendingPayment(doc);
      if (payment) {
        const payer = await this.usersService.findOne(payment.payerId).catch(() => null);
        if (!payer || (payer.points ?? 0) < payment.amount) {
          await this.cancelForInsufficientFunds(doc, payment.announcement);
        }
      }

      doc.status = DocumentStatus.SIGNED;
      try {
        await this.transferPoints(doc);
      } catch (e: any) {
        console.warn('[DocumentsService] Points transfer failed (non-fatal):', e.message);
      }
    }

    return this.documentsRepository.save(doc);
  }

  // ─── Points transfer on contract signature

  private async getPendingPayment(
    doc: Document,
  ): Promise<{ announcement: Announcement; payerId: string; providerId: string; amount: number } | null> {
    if (!doc.announcementId) return null;
    const announcement = await this.announcementsRepository.findOne({
      where: { _id: new ObjectId(doc.announcementId) } as any,
    });
    if (!announcement || !announcement.points) return null;
    if (announcement.status === AnnouncementStatus.DONE) return null;

    // offer: author=prestataire, acceptedBy=beneficiaire (paye)
    // request: author=demandeur (paye), acceptedBy=prestataire
    let payerId: string;
    let providerId: string;
    if (announcement.type === AnnouncementType.OFFER) {
      payerId = announcement.acceptedBy;
      providerId = announcement.authorId;
    } else {
      payerId = announcement.authorId;
      providerId = announcement.acceptedBy;
    }
    if (!payerId || !providerId) return null;

    return { announcement, payerId, providerId, amount: announcement.points };
  }

  private async transferPoints(doc: Document): Promise<void> {
    const payment = await this.getPendingPayment(doc);
    if (!payment) return;

    const { announcement, payerId, providerId, amount } = payment;
    await this.pointsService.addPoints(payerId, -amount, `Paiement contrat — ${announcement.title}`);
    await this.pointsService.addPoints(providerId, amount, `Contrat réglé — ${announcement.title}`);

    announcement.status = AnnouncementStatus.DONE;
    await this.announcementsRepository.save(announcement);
  }

  private async cancelForInsufficientFunds(doc: Document, announcement: Announcement): Promise<never> {
    if (doc.gridfsId) {
      try {
        const pdfBuffer = await this.downloadFromGridFS(doc.gridfsId);
        const stamped = await this.stampRefused(pdfBuffer);
        await this.deleteFromGridFS(doc.gridfsId);
        doc.gridfsId = await this.uploadToGridFS(stamped, doc.name);
      } catch (e: any) {
        console.warn('[DocumentsService] Stamp cancelled failed (non-fatal):', e.message);
      }
    }
    doc.status = DocumentStatus.REFUSED;
    await this.documentsRepository.save(doc);

    announcement.status = AnnouncementStatus.OPEN;
    announcement.acceptedBy = null as any;
    announcement.contractId = null as any;
    announcement.serviceDetails = null as any;
    await this.announcementsRepository.save(announcement);

    throw new BadRequestException(
      'Contrat annulé : le solde de points du payeur est insuffisant pour régler la prestation',
    );
  }

  // ─── Refuse

  async refuse(id: string, userId: string) {
    const doc = await this.findOne(id);

    const isOwner = doc.ownerId === userId;
    const isSigner = doc.signers?.includes(userId);
    if (!isOwner && !isSigner) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à refuser ce document");
    }
    if (doc.status === DocumentStatus.REFUSED) {
      throw new BadRequestException("Ce document est déjà refusé");
    }

    if (doc.gridfsId) {
      try {
        const pdfBuffer = await this.downloadFromGridFS(doc.gridfsId);
        const stamped = await this.stampRefused(pdfBuffer);
        await this.deleteFromGridFS(doc.gridfsId);
        doc.gridfsId = await this.uploadToGridFS(stamped, doc.name);
      } catch (e: any) {
        console.warn("[DocumentsService] Stamp refused failed (non-fatal):", e.message);
      }
    }

    doc.status = DocumentStatus.REFUSED;
    const saved = await this.documentsRepository.save(doc);

    if (doc.announcementId) {
      try {
        const announcementObjectId = new ObjectId(doc.announcementId);
        const announcement = await this.announcementsRepository.findOneBy({
          _id: announcementObjectId,
        } as any);
        if (announcement) {
          announcement.status = AnnouncementStatus.OPEN;
          announcement.acceptedBy = null as any;
          announcement.contractId = null as any;
          announcement.serviceDetails = null as any;
          await this.announcementsRepository.save(announcement);
        }
      } catch (e: any) {
        console.warn("[DocumentsService] Failed to release announcement after refusal (non-fatal):", e.message);
      }
    }

    return saved;
  }

  private async stampRefused(pdfBuffer: Buffer): Promise<Buffer> {
    const pdfDoc = await PdfLibDoc.load(pdfBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const text = "CONTRAT ANNULÉ";
      const fontSize = Math.min(width, height) * 0.1;
      const angle = 45;

      page.drawText(text, {
        x: width * 0.05,
        y: height * 0.42,
        size: fontSize,
        color: rgb(0.85, 0.1, 0.1),
        opacity: 0.55,
        rotate: degrees(angle),
      });
    }

    return Buffer.from(await pdfDoc.save());
  }

  private async embedSignatureImage(
    pdfBuffer: Buffer,
    base64Png: string,
    zone: SignatureZone,
    date: Date,
  ): Promise<Buffer> {
    const pdfDoc = await PdfLibDoc.load(pdfBuffer, {
      ignoreEncryption: true,
    });
    const pages = pdfDoc.getPages();
    const pageIndex =
      zone.page < 0 ? pages.length + zone.page : zone.page;
    const page = pages[Math.max(0, Math.min(pageIndex, pages.length - 1))];

    const pngBytes = Buffer.from(base64Png, "base64");
    const pngImage = await pdfDoc.embedPng(pngBytes);

    page.drawImage(pngImage, {
      x: zone.x,
      y: zone.y,
      width: zone.w,
      height: zone.h,
    });

    return Buffer.from(await pdfDoc.save());
  }

  // ─── Generate contract 

  async generateContract(dto: GenerateContractDto, userId: string) {
    let announcementObjectId: ObjectId;
    try {
      announcementObjectId = new ObjectId(dto.announcementId);
    } catch {
      throw new BadRequestException("Invalid announcement ID format");
    }
    const announcement = await this.announcementsRepository.findOneBy({
      _id: announcementObjectId,
    } as any);
    if (!announcement) {
      throw new NotFoundException(
        `Announcement ${dto.announcementId} not found`,
      );
    }
    if (announcement.status !== AnnouncementStatus.ACCEPTED) {
      throw new BadRequestException(
        "Le contrat ne peut être généré que pour une annonce acceptée",
      );
    }
    if (announcement.contractId) {
      throw new BadRequestException(
        "Un contrat existe déjà pour cette annonce",
      );
    }

    const author = await this.usersService.findOne(announcement.authorId);
    const acceptedByUser = await this.usersService.findOne(
      announcement.acceptedBy,
    );

    const { buffer: pdfBuffer, zones } = await this.buildContractPdf(
      announcement,
      author,
      acceptedByUser,
    );

    const filename = `contrat_${dto.announcementId}_${Date.now()}.pdf`;
    const gridfsId = await this.uploadToGridFS(pdfBuffer, filename);

    const doc = this.documentsRepository.create({
      title: `Contrat — ${announcement.title}`,
      type: DocumentType.CONTRACT,
      name: filename,
      ownerId: announcement.authorId,
      signers: [announcement.authorId, announcement.acceptedBy],
      signatures: [],
      status: DocumentStatus.PENDING,
      gridfsId,
      announcementId: dto.announcementId,
      signatureZones: zones,
    } as any);
    const savedDoc = (await this.documentsRepository.save(
      doc,
    )) as unknown as Document;

    announcement.contractId = savedDoc.id.toString();
    await this.announcementsRepository.save(announcement);

    return savedDoc;
  }

  // ─── Signature page append (for uploaded PDFs)

  private async appendSignaturePage(
    pdfBuffer: Buffer,
    signerCount: number,
  ): Promise<{ buffer: Buffer; zones: SignatureZone[] }> {
    try {
      const pdfDoc = await PdfLibDoc.load(pdfBuffer, { ignoreEncryption: true });
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();

      page.drawText("SIGNATURES", {
        x: 50,
        y: height - 50,
        size: 16,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      page.drawLine({
        start: { x: 50, y: height - 65 },
        end: { x: width - 50, y: height - 65 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      const xPositions = signerCount === 1 ? [50] : [50, 300];
      const zones: SignatureZone[] = [];

      for (let i = 0; i < Math.min(signerCount, xPositions.length); i++) {
        const x = xPositions[i];

        page.drawText(`Signataire ${i + 1}`, {
          x,
          y: height - 85,
          size: 10,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });

        page.drawRectangle({
          x,
          y: SIG_Y_PDF_LIB,
          width: SIG_BOX_WIDTH,
          height: SIG_BOX_HEIGHT,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 1,
        });

        page.drawText("Zone de signature", {
          x: x + 40,
          y: SIG_Y_PDF_LIB + SIG_BOX_HEIGHT / 2 - 4,
          size: 8,
          font: helvetica,
          color: rgb(0.7, 0.7, 0.7),
        });

        zones.push({ page: -1, x, y: SIG_Y_PDF_LIB, w: SIG_BOX_WIDTH, h: SIG_BOX_HEIGHT });
      }

      const buffer = Buffer.from(await pdfDoc.save());
      return { buffer, zones };
    } catch {
      return { buffer: pdfBuffer, zones: [] };
    }
  }

  // ─── PDF generation 

  private buildContractPdf(
    announcement: Announcement,
    author: User,
    acceptedByUser: User,
  ): Promise<{ buffer: Buffer; zones: SignatureZone[] }> {
    return new Promise((resolve, reject) => {
      const pdfDoc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("error", reject);

      // Register fonts (UTF-8 support)
      if (this.fontRegular) pdfDoc.registerFont("Regular", this.fontRegular);
      if (this.fontBold) pdfDoc.registerFont("Bold", this.fontBold);
      const R = this.fontRegular ? "Regular" : "Helvetica";
      const B = this.fontBold ? "Bold" : "Helvetica-Bold";

      const dateStr = new Date().toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // ── Page 1 : contenu 

      // Strip characters outside Latin-1 (emojis, etc.) that Helvetica can't encode
      const safe = (s: string) => (s ?? '').replace(/[^\x00-\xFF]/gu, '');

      pdfDoc.fontSize(22).font(B).text("HOODLY", { align: "center" });
      pdfDoc
        .fontSize(14)
        .font(R)
        .text("Contrat de service entre voisins", { align: "center" });
      pdfDoc.moveDown(0.5);
      pdfDoc
        .fontSize(10)
        .fillColor("#888888")
        .text(`Généré le ${dateStr}`, { align: "center" });
      pdfDoc.fillColor("#000000").moveDown(1.5);
      pdfDoc.moveTo(50, pdfDoc.y).lineTo(545, pdfDoc.y).stroke().moveDown(1);

      pdfDoc.fontSize(13).font(B).text("PARTIES");
      pdfDoc.moveDown(0.5).fontSize(11).font(R);
      pdfDoc.text(
        `Prestataire : ${author.firstName} ${author.lastName} (${author.email})`,
      );
      pdfDoc.text(
        `Bénéficiaire : ${acceptedByUser.firstName} ${acceptedByUser.lastName} (${acceptedByUser.email})`,
      );
      pdfDoc.moveDown(1);

      pdfDoc.fontSize(13).font(B).text("OBJET DU SERVICE");
      pdfDoc.moveDown(0.5).fontSize(11).font(R);
      pdfDoc.text(`Titre : ${safe(announcement.title)}`);
      pdfDoc.text(
        `Type : ${announcement.type === "offer" ? "Offre de service" : "Demande de service"}`,
      );
      pdfDoc.moveDown(0.5).text("Description :");
      pdfDoc.text(safe(announcement.description), { indent: 20 });
      pdfDoc.moveDown(1);

      pdfDoc.fontSize(13).font(B).text("COMPENSATION");
      pdfDoc.moveDown(0.5).fontSize(11).font(R);
      if (announcement.isPaid) {
        pdfDoc.text(
          "Ce service est payant. Les modalités de paiement sont convenues entre les parties.",
        );
      } else {
        pdfDoc.text(
          `Ce service donne lieu à un échange de ${announcement.points} points Hoodly.`,
        );
      }
      pdfDoc.moveDown(1);

      // ── Modalités de prestation (serviceDetails) 
      if (announcement.serviceDetails) {
        const sd = announcement.serviceDetails;
        pdfDoc.fontSize(13).font(B).text("MODALITÉS DE PRESTATION");
        pdfDoc.moveDown(0.5).fontSize(11).font(R);
        const fmtIso = (s: string) => {
          const p = s.split("-");
          if (p.length === 3) return `${parseInt(p[2])}/${parseInt(p[1])}/${p[0]}`;
          return s; // day name ("Lun") or unknown — display as-is
        };
        if (sd.chosenDate) pdfDoc.text(`Date choisie : ${fmtIso(sd.chosenDate)}`);
        if (sd.timeSlot) pdfDoc.text(`Créneau horaire : ${sd.timeSlot}`);
        if (sd.notes) { pdfDoc.text("Notes :"); pdfDoc.text(safe(sd.notes), { indent: 20 }); }
        pdfDoc.moveDown(1);
      }

      pdfDoc.fontSize(13).font(B).text("CONDITIONS GÉNÉRALES");
      pdfDoc.moveDown(0.5).fontSize(10).font(R);
      pdfDoc.text(
        "1. Les parties s'engagent à respecter les termes convenus dans ce contrat.",
      );
      pdfDoc.text("2. Tout litige sera résolu de manière amiable entre voisins.");
      pdfDoc.text(
        "3. Ce contrat est valable pour la prestation décrite ci-dessus uniquement.",
      );
      pdfDoc.text(
        "4. La signature numérique des deux parties est requise pour valider ce contrat.",
      );

      // ── Page 2 : signatures (coordonnees absolues connues)

      pdfDoc.addPage();

      pdfDoc.fontSize(16).font(B).text("SIGNATURES", 50, 50, { align: "left" });
      pdfDoc.moveTo(50, 82).lineTo(545, 82).stroke();

      // Labels colonnes
      pdfDoc
        .fontSize(10)
        .font(B)
        .text("Prestataire", 50, 100)
        .text("Bénéficiaire", 300, 100);
      pdfDoc
        .font(R)
        .fontSize(10)
        .text(`${author.firstName} ${author.lastName}`, 50, 116)
        .text(
          `${acceptedByUser.firstName} ${acceptedByUser.lastName}`,
          300,
          116,
        );

      // Zones de signature (rectangles)
      pdfDoc
        .rect(50, SIG_BOX_TOP, SIG_BOX_WIDTH, SIG_BOX_HEIGHT)
        .stroke();
      pdfDoc
        .rect(300, SIG_BOX_TOP, SIG_BOX_WIDTH, SIG_BOX_HEIGHT)
        .stroke();

      // Texte placeholder dans les zones
      pdfDoc
        .font(R)
        .fontSize(8)
        .fillColor("#bbbbbb")
        .text("Zone de signature", 50, SIG_BOX_TOP + 34, {
          width: SIG_BOX_WIDTH,
          align: "center",
        })
        .text("Zone de signature", 300, SIG_BOX_TOP + 34, {
          width: SIG_BOX_WIDTH,
          align: "center",
        });
      pdfDoc.fillColor("#000000");


      // Zones pour pdf-lib (y depuis le bas, page index -1 = derniere page)
      const zones: SignatureZone[] = [
        { page: -1, x: 50, y: SIG_Y_PDF_LIB, w: SIG_BOX_WIDTH, h: SIG_BOX_HEIGHT },
        { page: -1, x: 300, y: SIG_Y_PDF_LIB, w: SIG_BOX_WIDTH, h: SIG_BOX_HEIGHT },
      ];

      pdfDoc.on("end", () =>
        resolve({ buffer: Buffer.concat(chunks), zones }),
      );
      pdfDoc.end();
    });
  }
}
