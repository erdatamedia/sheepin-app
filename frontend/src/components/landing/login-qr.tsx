import QRCode from 'qrcode';
import { cn } from '@/lib/utils';

/**
 * QR ke halaman masuk, dibuat di server (tanpa JS di klien). Latar terang tetap dipertahankan
 * agar mudah dipindai dari proyektor maupun layar redup.
 */
export async function LoginQr({
  url,
  className,
  label,
}: {
  url: string;
  className?: string;
  label?: string;
}) {
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#3e2e24', light: '#fffbf7' },
  });

  return (
    <div
      role="img"
      aria-label={label ?? `Kode QR menuju ${url}`}
      className={cn(
        'aspect-square rounded-[var(--radius-card)] bg-[#fffbf7] p-4 shadow-[var(--shadow-soft)] [&>svg]:h-full [&>svg]:w-full',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
