import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import sharp from "sharp";
import { rateLimit } from "@/lib/rate-limit";
import { uploadFile } from "@/lib/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 8;
const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 1600;
const WEBP_QUALITY = 72;

function watermarkSvg(w: number, h: number): Buffer {
  const text = "clothy.by";
  const fontSize = Math.max(14, Math.round(Math.min(w, h) * 0.04));
  const padding = Math.round(fontSize * 0.6);
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <style>.wm { font-family: Inter, Arial, sans-serif; font-size: ${fontSize}px; font-weight: 600; }</style>
    <text x="${w - padding}" y="${h - padding}" text-anchor="end" class="wm"
          fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.15)" stroke-width="0.5">${text}</text>
  </svg>`;
  return Buffer.from(svg);
}

async function processImage(buffer: Buffer): Promise<Buffer> {
  const resized = await sharp(buffer)
    .rotate()
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const { width: w = 800, height: h = 800 } = await sharp(resized).metadata();

  return sharp(resized)
    .composite([{ input: watermarkSvg(w, h), gravity: "southeast" }])
    .webp({ quality: WEBP_QUALITY, effort: 6, smartSubsample: true })
    .toBuffer();
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || user.id;
  const wait = await rateLimit(ip, "upload", 30, 600);
  if (wait !== null) {
    return NextResponse.json(
      { error: `Слишком много загрузок. Подождите ${wait} сек.` },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "Нет файлов для загрузки" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Максимум ${MAX_FILES} файлов` }, { status: 400 });
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `Неподдерживаемый формат: ${file.type}` }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `Файл ${file.name} слишком большой. Максимум 10МБ` }, { status: 400 });
      }
    }

    const urls: string[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const outputBuffer = await processImage(Buffer.from(bytes));
      const url = await uploadFile(outputBuffer, "webp", "image/webp");
      urls.push(url);
    }

    return NextResponse.json({ urls }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Ошибка при загрузке файлов" }, { status: 500 });
  }
}
