import QRCode from "qrcode";

const BACKGROUND = "#000000";
const DOT = "#FFFFFF";
const LOGO_SRC = "/rhood_stamp.png";
const QUIET_ZONE = 4;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

/**
 * R/HOOD flyer QR: white rounded dots on black with the stamp logo in the centre.
 * Uses level H error correction so the logo can cover the middle of the code.
 */
export async function renderBrandedQrPng(url: string, size = 2000): Promise<string> {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const isDark = (r: number, c: number) => qr.modules.data[r * n + c] === 1;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  const pad = size * 0.06;
  const cell = (size - pad * 2) / (n + QUIET_ZONE * 2);
  const origin = pad + cell * QUIET_ZONE;

  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, size, size);

  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  // Keep the logo inside the ~25% centre area that level H can recover.
  const logoModules = Math.floor(n * 0.26) | 1;
  const logoStart = Math.floor((n - logoModules) / 2);
  const inLogo = (r: number, c: number) =>
    r >= logoStart - 1 &&
    r < logoStart + logoModules + 1 &&
    c >= logoStart - 1 &&
    c < logoStart + logoModules + 1;

  const roundRect = (x: number, y: number, w: number, h: number, radius: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  };

  ctx.fillStyle = DOT;
  const inset = cell * 0.08;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!isDark(r, c) || inFinder(r, c) || inLogo(r, c)) continue;
      roundRect(
        origin + c * cell + inset,
        origin + r * cell + inset,
        cell - inset * 2,
        cell - inset * 2,
        cell * 0.32
      );
    }
  }

  const drawFinder = (r: number, c: number) => {
    const x = origin + c * cell;
    const y = origin + r * cell;
    ctx.fillStyle = DOT;
    roundRect(x, y, cell * 7, cell * 7, cell * 1.8);
    ctx.fillStyle = BACKGROUND;
    roundRect(x + cell, y + cell, cell * 5, cell * 5, cell * 1.2);
    ctx.fillStyle = DOT;
    roundRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell * 0.8);
  };
  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  const logo = await loadImage(LOGO_SRC);
  const logoSize = cell * logoModules;
  const logoX = origin + logoStart * cell;
  ctx.save();
  ctx.beginPath();
  ctx.arc(logoX + logoSize / 2, logoX + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(logo, logoX, logoX, logoSize, logoSize);
  ctx.restore();

  return canvas.toDataURL("image/png");
}
