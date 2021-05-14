import {
  BadRequestException,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { fileData } from "./file-data"
import { FilesService } from "./files.service"
import { S3FileDataDto } from "./s3-file-data.dto"
import { Cache } from "cache-manager"

@Controller("files")
export class FilesController {
  constructor(
    private filesService: FilesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache // NestJS's cache is used to get the CloudFront Distribution URL
  ) {}

  private logger = new Logger(FilesController.name)
  private getCfDistUrl = async () =>
    `https://${await this.cacheManager.get<string>("CF_DIST_URL")}`
  private getUrl = async (key: string) =>
    new URL(key, await this.getCfDistUrl()).href

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
      throw new BadRequestException(err.name, err.message)
    }

    const uploadedUrl = await this.getUrl(result.key)
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
      throw new BadRequestException(err.name, err.message)
    }

    return Promise.all(
      results.map(async result => ({
        filename: result.key,
        url: await this.getUrl(result.key),
        size: result.size,
        lastModified: result.lastModified,
      }))
    )
  }

  /**
   * Deletes a file.
   */
  @Delete(":file")
  async deleteFile(@Param("file") filename: string) {
    try {
      this.filesService.deleteFile(filename)
    } catch (err) {
      this.logger.error(err)
      throw new BadRequestException(err.name, err.message)
    }
  }

  /**
   * Updates a file.
   */
  @Patch(":file") // PATCH is used as PUT would semantically mean custom filename uploads
  @UseInterceptors(FileInterceptor("file"))
  async updateFile(
    @UploadedFile() file: Express.Multer.File,
    @Param("file") filename: string
  ): Promise<fileData> {
    let result: S3FileDataDto

    try {
      result = await this.filesService.updateFile(filename, file)
    } catch (err) {
      this.logger.error(err)
      throw new BadRequestException(err.name, err.message)
    }

    return {
      filename: result.key,
      url: await this.getUrl(result.key),
      size: result.size,
      type: result.type,
    }
  }
}
