import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, MongoRepository } from "typeorm";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "stream";
import * as crypto from "crypto";
import PDFDocument from "pdfkit";
import { JwtService } from "@nestjs/jwt";
import {
  Document,
  DocumentStatus,
  DocumentType,
  SignatureEntry,
} from "../../entities/mongodb/Document";
import {
  Announcement,
  AnnouncementStatus,
} from "../../entities/mongodb/Announcement";
import { User } from "../../entities/mongodb/User";
import { UsersService } from "../users/users.service";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import { SignDocumentDto } from "./dto/sign-document.dto";
import { GenerateContractDto } from "./dto/generate-contract.dto";

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document, "mongodb")
    private documentsRepository: MongoRepository<Document>,
    @InjectRepository(Announcement, "mongodb")
    private announcementsRepository: MongoRepository<Announcement>,
    @InjectDataSource("mongodb")
    private dataSource: DataSource,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  // ─── GridFS helpers

  private getBucket(): GridFSBucket {
    const db = (this.dataSource.driver as any).queryRunner.databaseConnection;
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
  // ───

  async upload(
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    userId: string,
  ) {
    const gridfsId = await this.uploadToGridFS(file.buffer, file.originalname);
    const doc = this.documentsRepository.create({
      title: dto.title,
      type: dto.type ?? DocumentType.OTHER,
      name: file.originalname,
      ownerId: userId,
      signers: [],
      signatures: [],
      status: DocumentStatus.DRAFT,
      gridfsId,
      announcementId: dto.announcementId,
    } as any);
    return this.documentsRepository.save(doc);
  }

  async sign(
    id: string,
    dto: SignDocumentDto,
    userId: string,
    userEmail: string,
  ) {
    // OTP token
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

    // Dl le PDF depuis GridFS + hash SHA-256
    if (!doc.gridfsId) {
      throw new BadRequestException(
        "Ce document ne contient pas de fichier PDF",
      );
    }
    const buffer = await this.downloadFromGridFS(doc.gridfsId);
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    const entry: SignatureEntry = {
      userId: new ObjectId(userId),
      hash,
      date: new Date(),
    };
    doc.signatures = [...(doc.signatures ?? []), entry];

    // Passer en SIGNED si tous les signataires ont signé
    const signerIds = [...(doc.signers ?? [])];
    if (isOwner && !signerIds.includes(userId)) signerIds.push(userId);
    const signedIds = doc.signatures.map((s) => s.userId.toString());
    const allSigned =
      signerIds.length > 0 && signerIds.every((sid) => signedIds.includes(sid));
    if (allSigned) doc.status = DocumentStatus.SIGNED;

    return this.documentsRepository.save(doc);
  }

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

    const pdfBuffer = await this.buildContractPdf(
      announcement,
      author,
      acceptedByUser,
    );

    // Upload dans GridFS
    const filename = `contrat_${dto.announcementId}_${Date.now()}.pdf`;
    const gridfsId = await this.uploadToGridFS(pdfBuffer, filename);

    // Créer l'entité Document
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
    } as any);
    const savedDoc = (await this.documentsRepository.save(
      doc,
    )) as unknown as Document;

    announcement.contractId = savedDoc.id.toString();
    await this.announcementsRepository.save(announcement);

    return savedDoc;
  }

  private buildContractPdf(
    announcement: Announcement,
    author: User,
    acceptedByUser: User,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const dateStr = new Date().toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("HOODLY", { align: "center" });
      doc
        .fontSize(14)
        .font("Helvetica")
        .text("Contrat de service entre voisins", { align: "center" });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor("#888888")
        .text(`Généré le ${dateStr}`, { align: "center" });
      doc.fillColor("#000000").moveDown(1.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(1);

      doc.fontSize(13).font("Helvetica-Bold").text("PARTIES");
      doc.moveDown(0.5).fontSize(11).font("Helvetica");
      doc.text(
        `Prestataire : ${author.firstName} ${author.lastName} (${author.email})`,
      );
      doc.text(
        `Bénéficiaire : ${acceptedByUser.firstName} ${acceptedByUser.lastName} (${acceptedByUser.email})`,
      );
      doc.moveDown(1);

      doc.fontSize(13).font("Helvetica-Bold").text("OBJET DU SERVICE");
      doc.moveDown(0.5).fontSize(11).font("Helvetica");
      doc.text(`Titre : ${announcement.title}`);
      doc.text(
        `Type : ${announcement.type === "offer" ? "Offre de service" : "Demande de service"}`,
      );
      doc.moveDown(0.5).text("Description :");
      doc.text(announcement.description, { indent: 20 });
      doc.moveDown(1);

      doc.fontSize(13).font("Helvetica-Bold").text("COMPENSATION");
      doc.moveDown(0.5).fontSize(11).font("Helvetica");
      if (announcement.isPaid) {
        doc.text(
          "Ce service est payant. Les modalités de paiement sont convenues entre les parties.",
        );
      } else {
        doc.text(
          `Ce service donne lieu à un échange de ${announcement.points} points Hoodly.`,
        );
      }
      doc.moveDown(1);

      doc.fontSize(13).font("Helvetica-Bold").text("CONDITIONS GÉNÉRALES");
      doc.moveDown(0.5).fontSize(10).font("Helvetica");
      doc.text(
        "1. Les parties s'engagent à respecter les termes convenus dans ce contrat.",
      );
      doc.text("2. Tout litige sera résolu de manière amiable entre voisins.");
      doc.text(
        "3. Ce contrat est valable pour la prestation décrite ci-dessus uniquement.",
      );
      doc.text(
        "4. La signature numérique des deux parties est requise pour valider ce contrat.",
      );
      doc.moveDown(2);

      // Zone de signature
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(1);
      doc.fontSize(11).font("Helvetica-Bold").text("SIGNATURES");
      doc.moveDown(1);

      const sigY = doc.y;
      doc.font("Helvetica").fontSize(10);
      doc.text(`${author.firstName} ${author.lastName}`, 50, sigY);
      doc.text("Signature : ___________________", 50, sigY + 18);
      doc.text("Date : ___________________", 50, sigY + 34);
      doc.text(
        `${acceptedByUser.firstName} ${acceptedByUser.lastName}`,
        300,
        sigY,
      );
      doc.text("Signature : ___________________", 300, sigY + 18);
      doc.text("Date : ___________________", 300, sigY + 34);

      doc.end();
    });
  }
}
