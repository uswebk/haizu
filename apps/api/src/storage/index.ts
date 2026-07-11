import { LocalDiskStorage } from "./localDiskStorage";

export type SavedFile = {
	url: string;
};

export interface FileStorage {
	save(filename: string, data: Buffer): Promise<SavedFile>;
	remove(url: string): Promise<void>;
}

// STORAGE_DRIVER で保存先を切り替える。デフォルトはローカルディスク（開発用）。
// 本番用（s3 / gcs 等）は FileStorage を実装し、下記 switch に分岐を追加する。
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
