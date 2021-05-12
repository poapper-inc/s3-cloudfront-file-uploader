/**
 * DTO for S3 file data transfer from service to controller
 */
export class S3FileDataDto {
  key: string
  lastModified?: Date
  size: number
  type?: string
}
