import {
  BadRequestException,
  Controller,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { FileInterceptor } from "@nestjs/platform-express"
import { FilesService } from "./files.service"

@Controller("files")
export class FilesController {
  constructor(
    private filesService: FilesService,
    private configService: ConfigService
  ) {}

  private logger = new Logger(FilesController.name)
  private readonly cfDistUrl = this.configService.get("CF_DIST_URL")

  /**
   * Uploads a single file.
   */
  @Post("/")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    let uploadedFileName

    try {
      uploadedFileName = await this.filesService.uploadFile(file)
    } catch (err) {
      this.logger.error(err)
      throw new BadRequestException(err.name)
    }

    const uploadedUrl = new URL(uploadedFileName, this.cfDistUrl)
    this.logger.log(`${file.originalname} uploaded to ${uploadedUrl}`)

    return {
      file: uploadedFileName,
      url: uploadedUrl.href,
    }
  }
}
