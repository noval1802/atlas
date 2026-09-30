export type StoredDocument = {
  fileId?: string;
  filename: string;
  path: string;
  mimeType?: string;
  size?: number;
  lastModified?: string;
  etag?: string;
  isDirectory: boolean;
};

export interface DocumentStorageService {
  listFiles(path: string): Promise<StoredDocument[]>;
  getFile(path: string): Promise<Response>;
  uploadFile(path: string, content: Uint8Array, mimeType: string): Promise<StoredDocument>;
  getMetadata(path: string): Promise<StoredDocument>;
}

export class DocumentStorageConfigurationError extends Error {}
export class DocumentStorageError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
