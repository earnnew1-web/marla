const MAX_SIDE = 1280;
const JPEG_QUALITY = 0.82;
const SKIP_COMPRESS_BELOW_BYTES = 350_000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read payment slip"));
    };
    reader.onerror = () => reject(new Error("Could not read payment slip"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load payment slip image"));
    image.src = src;
  });
}

async function compressDataUrl(dataUrl: string): Promise<string> {
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return dataUrl;

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

/** Resize/compress slip images before order submit to keep uploads fast. */
export async function compressPaymentSlipFile(file: File): Promise<{ dataUrl: string; fileName: string }> {
  const dataUrl = await readFileAsDataUrl(file);
  const baseName = file.name.replace(/\.[^.]+$/i, "") || "payment-slip";

  if (file.size <= SKIP_COMPRESS_BELOW_BYTES && file.type === "image/jpeg") {
    return { dataUrl, fileName: file.name };
  }

  try {
    const compressed = await compressDataUrl(dataUrl);
    return { dataUrl: compressed, fileName: `${baseName}.jpg` };
  } catch {
    return { dataUrl, fileName: file.name };
  }
}
