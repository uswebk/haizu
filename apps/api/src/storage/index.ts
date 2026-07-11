import { LocalDiskStorage } from "./localDiskStorage";

export type SavedFile = {
	url: string;
};

export interface FileStorage {
	save(filename: string, data: Buffer): Promise<SavedFile>;
	remove(url: string): Promise<void>;
}

// Switch the storage backend via STORAGE_DRIVER. The default is local disk (for development).
// For production (s3 / gcs, etc.), implement FileStorage and add a case to the switch below.
function createStorage(): FileStorage {
	const driver = process.env.STORAGE_DRIVER ?? "local";
	switch (driver) {
		case "local":
			return new LocalDiskStorage();
		default:
			throw new Error(
				`Unknown STORAGE_DRIVER: "${driver}". 実装済みは "local" のみです。本番アダプタは src/storage/ に追加してください。`,
			);
	}
}

export const storage: FileStorage = createStorage();
