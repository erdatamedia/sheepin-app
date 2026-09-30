// Memeriksa kontras pasangan warna di src/app/globals.css (WCAG 2.1).
// Teks biasa >= 4.5, teks besar/tebal & ikon/grafik >= 3.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf(':root'), css.indexOf('@theme'));
const tokens = {};
for (const [, name, value] of root.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) {
  tokens[name] = value;
}
tokens.white = '#ffffff';

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(tokens[a]), lum(tokens[b])].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [latar, teks/ikon, minimal, keterangan]
const pairs = [
  ['background', 'foreground', 4.5, 'teks utama di kanvas'],
  ['surface-strong', 'foreground', 4.5, 'teks utama di kartu'],
  ['background', 'ink-muted', 4.5, 'teks sekunder di kanvas'],
  ['surface-strong', 'ink-muted', 4.5, 'teks sekunder di kartu'],
  ['fill-tint', 'ink-soft', 4.5, 'teks di latar tint / badge netral'],
  ['fill-tint', 'foreground', 4.5, 'teks di segmented'],
  ['fill-tint', 'ink-muted', 4.5, 'label segmented tidak terpilih'],
  ['accent', 'white', 4.5, 'teks tombol utama'],
  ['accent-strong', 'white', 4.5, 'teks tombol ditekan'],
  ['background', 'accent', 4.5, 'tautan di kanvas'],
  ['surface-strong', 'accent', 4.5, 'tautan di kartu'],
  ['accent-soft', 'accent-strong', 4.5, 'teks tombol tinted (pakai accent-strong)'],
  ['accent-soft', 'foreground', 4.5, 'teks di pilihan terpilih'],
  ['success-soft', 'success', 4.5, 'badge sukses'],
  ['warning-soft', 'warning', 4.5, 'badge peringatan'],
  ['danger-soft', 'danger', 4.5, 'badge bahaya'],
  ['info-soft', 'info', 4.5, 'badge info'],
  ['surface-strong', 'danger', 4.5, 'teks galat di kartu'],
  ['background', 'accent-icon', 3, 'ikon aksen di kanvas'],
  ['surface-strong', 'accent-icon', 3, 'ikon aksen di kartu'],
  ['surface-strong', 'success-fill', 3, 'grafik sukses'],
  ['surface-strong', 'warning-fill', 3, 'grafik peringatan'],
  ['surface-strong', 'danger-fill', 3, 'grafik bahaya'],
  ['surface-strong', 'info-fill', 3, 'grafik info'],
];

let failed = 0;
for (const [bg, fg, min, note] of pairs) {
  const value = ratio(bg, fg);
  const ok = value >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'OK  ' : 'GAGAL'} ${value.toFixed(2).padStart(5)} (min ${min})  ${fg} di ${bg}  - ${note}`);
}
console.log(failed ? `\n${failed} pasangan gagal.` : '\nSemua pasangan lolos.');
process.exit(failed ? 1 : 0);
