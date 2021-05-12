import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createHash } from "crypto"
import { extname } from "path"
import { S3FileDataDto } from "./s3-file-data.dto"

@Injectable()
export class FilesService {
  constructor(private configService: ConfigService) {}

  private readonly s3 = new S3Client({
    region: this.configService.get("REGION"),
  })

  private readonly bucket = this.configService.get("BUCKET_NAME")

  /**
   * Uploads a single file to S3.
   * @param file - The file to be uploaded
   * @returns The name of the uploaded file,
   *   generated with a base64url encoded hash of the file buffer
   */
  async uploadFile(file: Express.Multer.File): Promise<S3FileDataDto> {
    // Generate the file name
    const fileHash = createHash("sha1")
      .update(file.buffer)
      .digest("base64")
      .replace("+", "-") // Convert base64 to base64url
      .replace("/", "_")

    const fileExtension = extname(file.originalname)
    const fileName = `${fileHash}${fileExtension}`

    // Upload to S3
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    )

    return {
      key: fileName,
      size: file.size,
      type: file.mimetype,
    }
  }

  /**
   * Gets all files.
   * @returns An array of all files
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
   * @param key Key (filename) to be deleted
   */
  async deleteFile(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    )
  }
}
