import fs from "fs/promises";
import path from "path";

export interface ObjectStorage {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

function resolveKey(root: string, key: string) {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    throw new Error("INVALID_KEY");
  }
  const base = path.resolve(root);
  const full = path.resolve(base, key);
  if (full !== base && !full.startsWith(base + path.sep)) {
    throw new Error("INVALID_KEY");
  }
  return full;
}

export class LocalFsStorage implements ObjectStorage {
  constructor(private readonly root: string) {}

  async put(key: string, data: Buffer) {
    const full = resolveKey(this.root, key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
  }

  async get(key: string) {
    return fs.readFile(resolveKey(this.root, key));
  }

  async delete(key: string) {
    await fs.rm(resolveKey(this.root, key), { force: true });
  }
}

let singleton: ObjectStorage | null = null;

export function getStorage() {
  if (singleton) return singleton;
  const driver = process.env.STORAGE_DRIVER || "local";
  if (driver !== "local") {
    throw new Error("Only STORAGE_DRIVER=local is implemented in this demo");
  }
  singleton = new LocalFsStorage(
    process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), ".data", "storage"),
  );
  return singleton;
}
