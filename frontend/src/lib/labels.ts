export function labelPeran(role?: string | null) {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'OFFICER':
      return 'Petugas';
    case 'FARMER':
      return 'Peternak';
    default:
      return role || '-';
  }
}

export function labelJenisKelamin(gender?: string | null) {
  switch (gender) {
    case 'MALE':
      return 'Jantan';
    case 'FEMALE':
      return 'Betina';
    default:
      return gender || '-';
  }
}

export function labelStatusTernak(status?: string | null) {
  switch (status) {
    case 'ACTIVE':
      return 'Aktif';
    case 'SOLD':
      return 'Terjual';
    case 'DEAD':
      return 'Mati';
    case 'CULLED':
      return 'Afkir';
    default:
      return status || '-';
  }
}

export function labelStatusKesehatan(status?: string | null) {
  switch (status) {
    case 'HEALTHY':
      return 'Sehat';
    case 'SICK':
      return 'Sakit';
    case 'RECOVERING':
      return 'Pemulihan';
    default:
      return status || '-';
  }
}

export function labelStatusReproduksi(status?: string | null) {
  switch (status) {
    case 'OPEN':
      return 'Siap Kawin';
    case 'MATED':
      return 'Sudah Kawin';
    case 'PREGNANT':
      return 'Bunting';
    case 'LAMBED':
      return 'Sudah Beranak';
    default:
      return status || '-';
  }
}

export function labelJenisCatatan(type?: string | null) {
  switch (type) {
    case 'WEIGHT':
      return 'Bobot';
    case 'BCS':
      return 'BCS';
    case 'HEALTH':
      return 'Kesehatan';
    case 'REPRODUCTION':
      return 'Reproduksi';
    case 'STATUS':
      return 'Status';
    default:
      return type || '-';
  }
}

export function labelSumberLokasi(source?: string | null) {
  switch (source) {
    case 'GPS':
      return 'GPS';
    case 'MAP_PICKER':
      return 'Pilih di Peta';
    case 'MANUAL':
      return 'Input Manual';
    default:
      return source || '-';
  }
}

export function labelStatusData(status?: string | null) {
  switch (status) {
    case 'COMPLETE':
      return 'Lengkap';
    case 'PARTIAL':
      return 'Sebagian';
    case 'MINIMAL':
      return 'Minimal';
    case 'INSUFFICIENT_DATA':
      return 'Data Kurang';
    case 'GOOD':
      return 'Baik';
    case 'FAIR':
      return 'Cukup';
    case 'POOR':
      return 'Buruk';
    case 'IDEAL':
      return 'Ideal';
    case 'STABLE':
      return 'Stabil';
    case 'CAUTION':
      return 'Perlu Perhatian';
    case 'UP':
      return 'Naik';
    case 'DOWN':
      return 'Turun';
    case 'LOW':
      return 'Rendah';
    case 'HIGH':
      return 'Tinggi';
    case 'BAD':
      return 'Buruk';
    default:
      return status || '-';
  }
}
