import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { CACHE_MANAGER, Inject, Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { v4 as uuidv4 } from "uuid"
import { extname } from "path"
import { S3FileDataDto } from "./s3-file-data.dto"
import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetDistributionCommand,
} from "@aws-sdk/client-cloudfront"
import { Cache } from "cache-manager"

@Injectable()
export class FilesService {
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    // NestJS's cache is used to set the CloudFront Distribution URL.
    // This is required as getting the URL is an async task,
    // and AWS SDK would need to be invoked on every request otherwise.
    this.cf
      .send(
        new GetDistributionCommand({
          Id: this.cfDistId,
        })
      )
      .then(result => {
        const cfDistUrl = result.Distribution.DomainName
        this.logger.log(
          `Using CloudFront distribution at ${cfDistUrl}, URL cached in memory`
        )
        this.cacheManager.set("CF_DIST_URL", cfDistUrl)
      })
  }

  private readonly s3 = new S3Client({
    region: this.configService.get("REGION"),
  })

  private readonly cf = new CloudFrontClient({
    region: this.configService.get("REGION"),
  })

  public cfDistUrl
  private logger = new Logger(FilesService.name)
  private readonly bucket: string = this.configService.get("BUCKET_NAME")
  private readonly cfDistId: string = this.configService.get("CF_DIST_ID")

  /**
   * Uploads a single file to S3.
   * @param file - The file to be uploaded
   * @returns Uploaded file data, including the file key generated with a UUIDv4
   */
  async uploadFile(file: Express.Multer.File): Promise<S3FileDataDto> {
    const key = `${uuidv4()}${extname(file.originalname)}`

    // Upload to S3
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    )

    return {
      key: key,
      size: file.size,
      type: file.mimetype,
    }
  }

  /**
   * Gets all files.
   * @returns An array of all file data
   */
  async getFiles(): Promise<S3FileDataDto[]> {
    let result: ListObjectsV2CommandOutput, token: string
    const results: ListObjectsV2CommandOutput[] = []

    // Because aws-sdk returns a maximum of 1000 objects in a request,
    // pagination is needed
    do {
      result = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          ContinuationToken: token,
        })
      )
      results.push(result)
      token = result.NextContinuationToken
    } while (result.IsTruncated)

    return results.flatMap(result => {
      return result.Contents.map(content => ({
        key: content.Key,
        size: content.Size,
        lastModified: content.LastModified,
      }))
    })
  }

  /**
   * Deletes a file.
   * @param key - Key (filename) to be deleted
   */
  async deleteFile(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    )
  }

  /**
   * Updates a file.
   * @param key - Key (filename) to be updated
   * @param file - File to update existing file with
   * @returns Updated file data, including the file key generated with a UUIDv4
   */
  async updateFile(
    key: string,
    file: Express.Multer.File
  ): Promise<S3FileDataDto> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      )
    } catch (err) {
      if (err.name == "NotFound") {
        throw Error("File not found") // Only update if file exists
      }
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    )

    await this.cf.send(
      new CreateInvalidationCommand({
        DistributionId: this.cfDistId,
        InvalidationBatch: {
          Paths: { Items: [`/${key}`], Quantity: 1 },
          CallerReference: `${key}-${Date.now()}`,
        },
      })
    )

    return {
      key: key,
      size: file.size,
      type: file.mimetype,
    }
  }
}
