import { Controller, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { DocumentsService } from "./documents.service";

@ApiTags("Documents")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}
}
