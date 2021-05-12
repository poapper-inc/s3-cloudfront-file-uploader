import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { FileInterceptor } from "@nestjs/platform-express"
import { fileData } from "./file-data"
import { FilesService } from "./files.service"
import { S3FileDataDto } from "./s3-file-data.dto"

@Controller("files")
export class FilesController {
  constructor(
    private filesService: FilesService,
    private configService: ConfigService
  ) {}

  private logger = new Logger(FilesController.name)
  private readonly cfDistUrl = this.configService.get("CF_DIST_URL")

  private getUrl = (key: string) => new URL(key, this.cfDistUrl).href

  /**
   * Uploads a single file.
   */
  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File
  ): Promise<fileData> {
    let result: S3FileDataDto

    try {
      result = await this.filesService.uploadFile(file)
    } catch (err) {
      this.logger.error(err)
      throw new BadRequestException(err.name)
    }

    const uploadedUrl = this.getUrl(result.key)
    this.logger.log(`${file.originalname} uploaded to ${uploadedUrl}`)

    return {
      filename: result.key,
      url: uploadedUrl,
      size: result.size,
      type: result.type,
    }
  }

  /**
   * Gets all files.
   */
  @Get()
  async getFiles(): Promise<fileData[]> {
    let results: S3FileDataDto[]

    try {
      results = await this.filesService.getFiles()
    } catch (err) {
      this.logger.error(err)
      throw new BadRequestException(err.name)
    }

    return results.map(result => ({
      filename: result.key,
      url: this.getUrl(result.key),
      size: result.size,
      lastModified: result.lastModified,
    }))
  }
}
