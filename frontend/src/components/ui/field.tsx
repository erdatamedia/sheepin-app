type FieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

/** Label di atas kolom isian; membungkus input agar seluruh label bisa diketuk. */
export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}
