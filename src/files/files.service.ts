import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createHash } from "crypto"
import { extname } from "path"

@Injectable()
export class FilesService {
  constructor(private configService: ConfigService) {}

  private readonly s3 = new S3Client({
    region: this.configService.get("REGION"),
  })

  /**
   * Uploads a single file to S3.
   * @param file - The file to be uploaded
   * @returns The name of the uploaded file,
   *   generated with a base64url encoded hash of the file buffer
   */
  async uploadFile(file: Express.Multer.File) {
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
        Bucket: this.configService.get("BUCKET_NAME"),
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    )

    return fileName
  }
}
