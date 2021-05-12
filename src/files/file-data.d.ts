/**
 * File data interface, mainly for returning to client
 */
export interface fileData {
  filename: string
  url: string
  size: number
  lastModified?: Date
  type?: string
}
