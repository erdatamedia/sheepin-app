/** Perkiraan tanggal lahir dari umur (bulan) pada tanggal pencatatan. */
export function estimateBirthDate(recordDate: string, ageMonths: number): Date {
  const date = new Date(`${recordDate.slice(0, 10)}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() - ageMonths);
  return date;
}
