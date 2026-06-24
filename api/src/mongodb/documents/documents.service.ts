import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, MongoRepository } from "typeorm";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "stream";
import { Document } from "../../entities/mongodb/Document";

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document, "mongodb")
    private documentsRepository: MongoRepository<Document>,
    @InjectDataSource("mongodb")
    private dataSource: DataSource,
  ) {}

  // ─── GridFS

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

  // ─── CRUD ────────────────────────────────────────────────────────────────────

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
}
