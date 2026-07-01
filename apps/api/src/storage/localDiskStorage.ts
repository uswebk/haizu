import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorage, SavedFile } from ".";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const PUBLIC_PATH = "/uploads";

export class LocalDiskStorage implements FileStorage {
	async save(filename: string, data: Buffer): Promise<SavedFile> {
		await mkdir(UPLOAD_DIR, { recursive: true });
		const key = `${randomUUID()}${path.extname(filename)}`;
		await writeFile(path.join(UPLOAD_DIR, key), data);
		return { url: `${PUBLIC_PATH}/${key}` };
	}

	async remove(url: string): Promise<void> {
		if (!url.startsWith(PUBLIC_PATH)) return;
		const key = url.slice(PUBLIC_PATH.length + 1);
		await rm(path.join(UPLOAD_DIR, key), { force: true });
	}
}
