import { mediaUrl } from '@/lib/media';

/**
 * Kartu bergambar (PNG) untuk dibagikan. Digambar di klien dengan canvas dari data yang sudah dimuat,
 * jadi tidak ada tautan publik dan tidak ada data yang keluar dari perangkat kecuali pengguna membagikannya.
 */

const W = 1080;
const H = 1350;
const FONT = '-apple-system, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const C = {
  ink: '#3e2e24',
  muted: '#6b5646',
  accent: '#805a3d',
  accentDark: '#6e4b32',
  soft: '#ead9c8',
  cream: '#fffbf7',
  success: '#2f6b3f',
};

type Ctx = CanvasRenderingContext2D;

function loadImage(src?: string | null): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fillRound(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
  roundPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  opts: { size: number; weight?: number; color?: string; align?: CanvasTextAlign; maxWidth?: number },
) {
  ctx.font = `${opts.weight ?? 500} ${opts.size}px ${FONT}`;
  ctx.fillStyle = opts.color ?? C.ink;
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y, opts.maxWidth);
}

function fitText(ctx: Ctx, value: string, maxWidth: number, size: number, weight: number) {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (ctx.measureText(value).width > maxWidth && s > 24) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
  return s;
}

function chip(ctx: Ctx, label: string, x: number, y: number, h = 62) {
  ctx.font = `600 30px ${FONT}`;
  const w = ctx.measureText(label).width + 52;
  fillRound(ctx, x, y, w, h, h / 2, 'rgba(255,251,247,0.92)');
  text(ctx, label, x + 26, y + h / 2 + 10, { size: 30, weight: 600, color: C.accentDark });
  return w;
}

function drawBackground(ctx: Ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f8efe5');
  g.addColorStop(0.5, '#efdcc8');
  g.addColorStop(1, '#e2c3a3');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const glow = (x: number, y: number, r: number, color: string) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, color);
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  };
  glow(120, 80, 520, 'rgba(214,160,118,0.45)');
  glow(1000, 600, 520, 'rgba(196,136,96,0.28)');
  glow(200, 1300, 600, 'rgba(238,200,160,0.6)');
}

async function drawHeader(ctx: Ctx, rightLabel?: string) {
  const logo = await loadImage('/icons/icon-192.png');
  if (logo) {
    ctx.save();
    roundPath(ctx, 60, 52, 72, 72, 20);
    ctx.clip();
    ctx.drawImage(logo, 60, 52, 72, 72);
    ctx.restore();
  }
  text(ctx, 'Sheep-In', 152, 102, { size: 44, weight: 700, color: C.ink });
  if (rightLabel) {
    ctx.font = `600 28px ${FONT}`;
    const w = ctx.measureText(rightLabel).width + 44;
    fillRound(ctx, W - 60 - w, 62, w, 54, 27, 'rgba(255,251,247,0.85)');
    text(ctx, rightLabel, W - 60 - w / 2, 98, { size: 28, weight: 600, color: C.accentDark, align: 'center' });
  }
}

function drawFooter(ctx: Ctx, line?: string) {
  if (line) text(ctx, line, W / 2, 1268, { size: 30, weight: 600, color: C.ink, align: 'center', maxWidth: 940 });
  text(ctx, 'Dicatat dengan Sheep-In  ·  sheep-in.com', W / 2, 1316, {
    size: 26,
    weight: 500,
    color: C.muted,
    align: 'center',
  });
}

function tile(ctx: Ctx, x: number, y: number, w: number, h: number, label: string, value: string, hint?: string) {
  fillRound(ctx, x, y, w, h, 32, 'rgba(255,251,247,0.9)');
  text(ctx, label, x + 28, y + 52, { size: 26, weight: 500, color: C.muted, maxWidth: w - 56 });
  const size = fitText(ctx, value, w - 56, 62, 700);
  text(ctx, value, x + 28, y + 128, { size, weight: 700, color: C.ink });
  if (hint) text(ctx, hint, x + 28, y + h - 22, { size: 24, weight: 500, color: C.muted, maxWidth: w - 56 });
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal membuat gambar'))), 'image/png'),
  );
}

function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Kanvas tidak tersedia');
  return { canvas, ctx };
}

/* ---------------------------------------------------------------- Kartu ternak */

export type SheepCardData = {
  code: string;
  name?: string | null;
  breed: string;
  genderLabel: string;
  ageLabel?: string | null;
  statusLabel: string;
  photoUrl?: string | null;
  farmerLine?: string | null;
  periodLabel: string;
  latestWeightKg?: number | null;
  adgGrams?: number | null;
  gainKg?: number | null;
  bcs?: number | null;
  bcsLabel?: string | null;
  healthLabel?: string | null;
  series: { date: string; weightKg: number }[];
};

function drawSparkline(ctx: Ctx, series: SheepCardData['series'], x: number, y: number, w: number, h: number) {
  fillRound(ctx, x, y, w, h, 32, 'rgba(255,251,247,0.9)');
  text(ctx, 'Perjalanan bobot', x + 28, y + 50, { size: 26, weight: 500, color: C.muted });
  if (series.length < 2) {
    text(ctx, 'Butuh minimal dua penimbangan', x + w / 2, y + h / 2 + 30, {
      size: 28,
      color: C.muted,
      align: 'center',
    });
    return;
  }
  const left = x + 40;
  const right = x + w - 40;
  const top = y + 84;
  const bottom = y + h - 56;
  const values = series.map((s) => s.weightKg);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < 1) {
    lo -= 0.5;
    hi += 0.5;
  }
  const t0 = new Date(series[0].date).getTime();
  const t1 = new Date(series[series.length - 1].date).getTime();
  const px = (d: string) => (t1 === t0 ? left : left + ((new Date(d).getTime() - t0) / (t1 - t0)) * (right - left));
  const py = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);

  // area di bawah garis
  const grad = ctx.createLinearGradient(0, top, 0, bottom);
  grad.addColorStop(0, 'rgba(128,90,61,0.28)');
  grad.addColorStop(1, 'rgba(128,90,61,0)');
  ctx.beginPath();
  series.forEach((s, i) => (i ? ctx.lineTo(px(s.date), py(s.weightKg)) : ctx.moveTo(px(s.date), py(s.weightKg))));
  ctx.lineTo(px(series[series.length - 1].date), bottom);
  ctx.lineTo(px(series[0].date), bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  series.forEach((s, i) => (i ? ctx.lineTo(px(s.date), py(s.weightKg)) : ctx.moveTo(px(s.date), py(s.weightKg))));
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  series.forEach((s, i) => {
    const last = i === series.length - 1;
    ctx.beginPath();
    ctx.arc(px(s.date), py(s.weightKg), last ? 11 : 7, 0, Math.PI * 2);
    ctx.fillStyle = last ? C.accentDark : C.cream;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = C.accent;
    ctx.stroke();
  });

  const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  text(ctx, `${fmt(series[0].date)}  ${series[0].weightKg} kg`, left, y + h - 20, { size: 24, color: C.muted });
  text(ctx, `${fmt(series[series.length - 1].date)}  ${series[series.length - 1].weightKg} kg`, right, y + h - 20, {
    size: 24,
    color: C.muted,
    align: 'right',
  });
}

export async function renderSheepCard(data: SheepCardData): Promise<Blob> {
  const { canvas, ctx } = makeCanvas();
  drawBackground(ctx);
  await drawHeader(ctx, data.periodLabel);

  // foto
  const px = 60;
  const py = 150;
  const pw = 960;
  const ph = 520;
  const photo = await loadImage(mediaUrl(data.photoUrl));
  ctx.save();
  roundPath(ctx, px, py, pw, ph, 44);
  ctx.clip();
  if (photo) {
    const scale = Math.max(pw / photo.width, ph / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    ctx.drawImage(photo, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = C.soft;
    ctx.fillRect(px, py, pw, ph);
    const glyph = await loadImage('/decor/sheep-line.svg');
    if (glyph) {
      ctx.globalAlpha = 0.28;
      const gw = 560;
      const gh = (gw * glyph.height) / glyph.width;
      ctx.drawImage(glyph, px + (pw - gw) / 2, py + (ph - gh) / 2, gw, gh);
      ctx.globalAlpha = 1;
    }
  }
  const shade = ctx.createLinearGradient(0, py + ph - 260, 0, py + ph);
  shade.addColorStop(0, 'rgba(40,28,20,0)');
  shade.addColorStop(1, 'rgba(40,28,20,0.72)');
  ctx.fillStyle = shade;
  ctx.fillRect(px, py + ph - 260, pw, 260);
  ctx.restore();

  const codeSize = fitText(ctx, data.code, pw - 80, 84, 800);
  text(ctx, data.code, px + 40, py + ph - 76, { size: codeSize, weight: 800, color: '#ffffff' });
  if (data.name) {
    text(ctx, data.name, px + 40, py + ph - 28, { size: 38, weight: 500, color: 'rgba(255,255,255,0.92)', maxWidth: pw - 80 });
  }

  // chip
  let cx = 60;
  const chips = [data.genderLabel, data.breed, data.ageLabel, data.statusLabel].filter(Boolean) as string[];
  for (const label of chips) {
    const w = chip(ctx, label, cx, 700);
    cx += w + 14;
    if (cx > W - 200) break;
  }

  // statistik
  const tw = 300;
  const gap = 30;
  const ty = 790;
  tile(
    ctx,
    60,
    ty,
    tw,
    190,
    'Bobot terakhir',
    data.latestWeightKg != null ? `${data.latestWeightKg} kg` : '-',
    data.gainKg != null ? `${data.gainKg > 0 ? '+' : ''}${data.gainKg} kg di periode ini` : undefined,
  );
  tile(
    ctx,
    60 + tw + gap,
    ty,
    tw,
    190,
    'Tambah bobot harian',
    data.adgGrams != null ? `${data.adgGrams} g` : '-',
    data.adgGrams != null ? 'per hari' : 'butuh 2 timbangan',
  );
  tile(
    ctx,
    60 + (tw + gap) * 2,
    ty,
    tw,
    190,
    'Kondisi tubuh',
    data.bcs != null ? `${data.bcs} / 5` : '-',
    data.bcsLabel ?? data.healthLabel ?? undefined,
  );

  drawSparkline(ctx, data.series, 60, 1010, 960, 230);
  drawFooter(ctx, data.farmerLine ?? undefined);
  return canvasBlob(canvas);
}

/* -------------------------------------------------------------- Kartu peternak */

export type FarmerCardData = {
  name: string;
  groupLine?: string | null;
  periodLabel: string;
  sheepActive: number;
  totalRecords: number;
  activeDays: number;
  streakDays: number;
  averageAdgGrams?: number | null;
  badges: { title: string; earned: boolean }[];
  topGrowers: { label: string; adgGrams: number | null }[];
};

export async function renderFarmerCard(data: FarmerCardData): Promise<Blob> {
  const { canvas, ctx } = makeCanvas();
  drawBackground(ctx);
  await drawHeader(ctx, data.periodLabel);

  text(ctx, 'Rapor Peternak', 60, 206, { size: 34, weight: 600, color: C.accent });
  const nameSize = fitText(ctx, data.name, 960, 92, 800);
  text(ctx, data.name, 60, 296, { size: nameSize, weight: 800, color: C.ink });
  if (data.groupLine) text(ctx, data.groupLine, 60, 344, { size: 32, color: C.muted, maxWidth: 960 });

  const tw = 465;
  const th = 172;
  const gx = 24;
  tile(ctx, 60, 384, tw, th, 'Ternak dipantau', `${data.sheepActive}`, 'ekor aktif');
  tile(ctx, 60 + tw + gx, 384, tw, th, 'Catatan masuk', `${data.totalRecords}`, 'timbang, kondisi, kesehatan');
  tile(ctx, 60, 384 + th + gx, tw, th, 'Hari mengisi data', `${data.activeDays}`, 'hari berbeda');
  tile(
    ctx,
    60 + tw + gx,
    384 + th + gx,
    tw,
    th,
    'Runtun berturut-turut',
    `${data.streakDays} hari`,
    data.averageAdgGrams != null ? `rata-rata tumbuh ${data.averageAdgGrams} g/hari` : undefined,
  );

  // lencana
  const by = 384 + (th + gx) * 2 + 24;
  text(ctx, 'Lencana diraih', 60, by + 36, { size: 34, weight: 700, color: C.ink });
  let bx = 60;
  let byy = by + 56;
  const earned = data.badges.filter((b) => b.earned);
  if (earned.length === 0) {
    text(ctx, 'Terus mencatat untuk meraih lencana pertama.', 60, byy + 44, { size: 30, color: C.muted });
  }
  for (const b of earned.slice(0, 8)) {
    ctx.font = `600 30px ${FONT}`;
    const w = ctx.measureText(b.title).width + 84;
    if (bx + w > W - 60) {
      bx = 60;
      byy += 72;
    }
    fillRound(ctx, bx, byy, w, 62, 31, 'rgba(255,251,247,0.92)');
    ctx.beginPath();
    ctx.arc(bx + 31, byy + 31, 15, 0, Math.PI * 2);
    ctx.fillStyle = C.success;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bx + 24, byy + 31);
    ctx.lineTo(bx + 29, byy + 37);
    ctx.lineTo(bx + 39, byy + 25);
    ctx.stroke();
    text(ctx, b.title, bx + 58, byy + 41, { size: 30, weight: 600, color: C.accentDark });
    bx += w + 14;
  }

  // ternak tumbuh terbaik
  if (data.topGrowers.length > 0) {
    const gy = byy + 62 + 70;
    text(ctx, 'Pertumbuhan terbaik', 60, gy, { size: 34, weight: 700, color: C.ink });
    data.topGrowers.slice(0, 3).forEach((g, i) => {
      const y = gy + 18 + i * 58;
      text(ctx, `${i + 1}. ${g.label}`, 60, y + 36, { size: 32, weight: 600, color: C.ink, maxWidth: 640 });
      if (g.adgGrams != null) {
        text(ctx, `${g.adgGrams} g/hari`, W - 60, y + 36, { size: 32, weight: 700, color: C.accentDark, align: 'right' });
      }
    });
  }

  drawFooter(ctx);
  return canvasBlob(canvas);
}

/* ------------------------------------------------------------------- Membagikan */

export async function shareOrDownload(blob: Blob, filename: string, title: string, message: string) {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text: message });
    return 'shared' as const;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded' as const;
}
