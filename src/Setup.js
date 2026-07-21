/**
 * Fungsi untuk menginisialisasi Spreadsheet database beserta data dummy (Fase 0).
 * Jalankan fungsi setupDatabase() ini sekali saja dari editor Apps Script.
 */

function setupDatabase() {
  // Buat Spreadsheet baru di root Drive
  const ss = SpreadsheetApp.create("DB_WakaKurikulum");
  const ssId = ss.getId();
  
  // Hapus sheet default "Sheet1" nanti setelah sheet lain dibuat
  const defaultSheet = ss.getSheets()[0];
  
  // 1. Sheet Master_Guru
  const sheetGuru = ss.insertSheet("Master_Guru");
  sheetGuru.appendRow(["id_guru", "nama", "email", "role", "mapel_diampu", "status_aktif"]);
  sheetGuru.appendRow(["G001", "Budi Santoso", Session.getActiveUser().getEmail(), "waka", "Matematika", true]);
  sheetGuru.appendRow(["G002", "Siti Aminah", "siti.dummy@gmail.com", "guru", "Bahasa Inggris", true]);
  sheetGuru.appendRow(["G003", "Ahmad Dahlan", "ahmad.dummy@gmail.com", "kepsek", "", true]);
  
  // 2. Sheet Master_Kelas
  const sheetKelas = ss.insertSheet("Master_Kelas");
  sheetKelas.appendRow(["id_kelas", "tingkat", "jurusan", "wali_kelas"]);
  sheetKelas.appendRow(["X-TKJ-1", "X", "TKJ", "G002"]);
  sheetKelas.appendRow(["XI-RPL-1", "XI", "RPL", "G001"]);
  
  // 3. Sheet Master_Jadwal
  const sheetJadwal = ss.insertSheet("Master_Jadwal");
  sheetJadwal.appendRow(["id_jadwal", "id_guru", "id_kelas", "mapel", "hari", "jam_ke", "tahun_ajaran", "semester"]);
  sheetJadwal.appendRow(["JDW001", "G001", "X-TKJ-1", "Matematika", "Senin", 1, "2026/2027", "Ganjil"]);
  sheetJadwal.appendRow(["JDW002", "G002", "XI-RPL-1", "Bahasa Inggris", "Selasa", 2, "2026/2027", "Ganjil"]);
  
  // 4. Sheet Master_ATP
  const sheetATP = ss.insertSheet("Master_ATP");
  sheetATP.appendRow(["id_atp", "mapel", "kelas_tingkat", "urutan", "deskripsi_materi"]);
  sheetATP.appendRow(["ATP-MTK-X-1", "Matematika", "X", 1, "Eksponen dan Logaritma"]);
  sheetATP.appendRow(["ATP-BING-XI-1", "Bahasa Inggris", "XI", 1, "Narrative Text"]);
  
  // 5. Sheet E_Jurnal
  const sheetJurnal = ss.insertSheet("E_Jurnal");
  sheetJurnal.appendRow(["timestamp", "tanggal", "id_guru", "id_kelas", "mapel", "jam_ke", "id_atp", "materi_bebas", "jumlah_hadir", "jumlah_sakit", "jumlah_izin", "jumlah_alpa", "catatan_kendala"]);
  
  // Format Header (Bold & Frozen)
  const sheets = [sheetGuru, sheetKelas, sheetJadwal, sheetATP, sheetJurnal];
  sheets.forEach(s => {
    s.getRange("A1:" + String.fromCharCode(64 + s.getLastColumn()) + "1").setFontWeight("bold");
    s.setFrozenRows(1);
  });
  
  // Hapus sheet default
  ss.deleteSheet(defaultSheet);
  
  Logger.log("Database berhasil dibuat! ID Spreadsheet Anda: " + ssId);
  Logger.log("PENTING: Salin ID Spreadsheet ini dan paste ke file Config.js di variabel SPREADSHEET_ID.");
}
