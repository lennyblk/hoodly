import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { DocumentsService } from "./documents.service";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import { SignDocumentDto } from "./dto/sign-document.dto";
import { GenerateContractDto } from "./dto/generate-contract.dto";

@ApiTags("Documents")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @ApiOperation({ summary: "Upload un PDF via GridFS" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        title: { type: "string" },
        type: { type: "string", enum: ["contract", "other"] },
        announcementId: { type: "string" },
      },
      required: ["file", "title"],
    },
  })
  @ApiResponse({ status: 201, description: "Document créé." })
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user as { userId: string };
    return this.documentsService.upload(file, dto, user.userId);
  }

  @ApiOperation({ summary: "Lister les documents accessibles" })
  @ApiResponse({ status: 200, description: "Liste des documents." })
  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user as { userId: string };
    return this.documentsService.findAll(user.userId);
  }

  @ApiOperation({ summary: "Récupérer un document par ID" })
  @ApiResponse({ status: 200, description: "Document trouvé." })
  @ApiResponse({ status: 404, description: "Document introuvable." })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.documentsService.findOne(id);
  }

  @ApiOperation({ summary: "Télécharger le fichier PDF d'un document" })
  @ApiResponse({ status: 200, description: "Fichier PDF renvoyé." })
  @ApiResponse({ status: 404, description: "Document ou fichier introuvable." })
  @Get(":id/file")
  async downloadFile(@Param("id") id: string, @Res() res: Response) {
    const doc = await this.documentsService.findOne(id);
    const buffer = await this.documentsService.downloadFromGridFS(doc.gridfsId!);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.name}"`,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }

  @ApiOperation({
    summary: "Générer automatiquement un contrat PDF pour une annonce acceptée",
  })
  @ApiResponse({
    status: 201,
    description: "Contrat généré et lié à l'annonce.",
  })
  @ApiResponse({
    status: 400,
    description: "Annonce non acceptée ou contrat déjà existant.",
  })
  @Post("generate-contract")
  generateContract(@Body() dto: GenerateContractDto, @Req() req: Request) {
    const user = (req as any).user as { userId: string };
    return this.documentsService.generateContract(dto, user.userId);
  }

  @ApiOperation({
    summary: "Signer un document — MFA OTP obligatoire",
    description:
      "Flux MFA requis avant appel : POST /auth/otp/send → POST /auth/otp/verify → fournir otpToken ici.",
  })
  @ApiResponse({
    status: 201,
    description: "Document signé, hash SHA-256 enregistré.",
  })
  @ApiResponse({ status: 401, description: "OTP token invalide ou expiré." })
  @ApiResponse({
    status: 403,
    description: "Non autorisé à signer ce document.",
  })
  @ApiOperation({ summary: "Refuser un document — le PDF est marqué CONTRAT ANNULÉ" })
  @ApiResponse({ status: 201, description: "Document refusé, PDF estampillé." })
  @Post(":id/refuse")
  refuse(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any).user as { userId: string };
    return this.documentsService.refuse(id, user.userId);
  }

  @Post(":id/sign")
  sign(
    @Param("id") id: string,
    @Body() dto: SignDocumentDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user as { userId: string; email: string };
    return this.documentsService.sign(id, dto, user.userId, user.email);
  }
}
