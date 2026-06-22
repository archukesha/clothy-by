import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Uploads are stored outside the project dir so deploys don't wipe them
const UPLOADS_DIR =
  process.env.UPLOADS_DIR || join(process.cwd(), "public", "uploads");

export async function uploadFile(
  buffer: Buffer,
  ext: string,
  _contentType: string
): Promise<string> {
  const filename = `${randomUUID()}.${ext}`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
