import { LocalDiskStorage } from "./localDiskStorage";

export type SavedFile = {
	url: string;
};

export interface FileStorage {
	save(filename: string, data: Buffer): Promise<SavedFile>;
	remove(url: string): Promise<void>;
}

// 本番では環境変数等でS3/GCS実装に差し替える想定
export const storage: FileStorage = new LocalDiskStorage();
