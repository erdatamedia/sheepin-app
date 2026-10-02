'use client';

import { ClipboardPlus, PencilLine, Trash2 } from 'lucide-react';
import { ListGroup, ListRow, RowIcon } from '@/components/ui/list-group';
import { Sheet } from '@/components/ui/sheet';

/** Aksi cepat satu ternak dari daftar: catat, ubah data, hapus. Ubah dan hapus dikerjakan di halaman detail. */
export function SheepActionSheet({
  target,
  onClose,
}: {
  target: { id: string; code: string; name?: string | null } | null;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={!!target}
      onClose={onClose}
      title={target ? (target.name ? `${target.code} · ${target.name}` : target.code) : 'Aksi ternak'}
    >
      {target && (
        <ListGroup>
          <ListRow
            href={`/recording?sheepId=${target.id}`}
            leading={<RowIcon icon={ClipboardPlus} />}
            leadingSize="icon"
            title="Catat perkembangan"
          />
          <ListRow
            href={`/sheep/${target.id}?aksi=ubah`}
            leading={<RowIcon icon={PencilLine} />}
            leadingSize="icon"
            title="Ubah data"
            subtitle="Perbaiki kode, nama, jenis, dan lainnya"
          />
          <ListRow
            href={`/sheep/${target.id}?aksi=hapus`}
            leading={<RowIcon icon={Trash2} tone="danger" />}
            leadingSize="icon"
            title="Hapus ternak"
            subtitle="Untuk ternak yang salah input"
            tone="danger"
          />
        </ListGroup>
      )}
    </Sheet>
  );
}
