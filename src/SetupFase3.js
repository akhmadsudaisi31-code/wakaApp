/**
 * Jalankan ini HANYA SEKALI dari editor Apps Script untuk membuat sheet Perangkat_Ajar (Fase 3).
 */
function setupFase3() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // Cek apakah sheet sudah ada
  if (ss.getSheetByName(CONFIG.SHEET_NAMES.PERANGKAT)) {
    Logger.log("Sheet " + CONFIG.SHEET_NAMES.PERANGKAT + " sudah ada.");
    return;
  }
  
  const sheet = ss.insertSheet(CONFIG.SHEET_NAMES.PERANGKAT);
  sheet.appendRow(["id_guru", "mapel", "jenis_dokumen", "status", "link_dokumen", "tanggal_update"]);
  
  // Contoh dummy
  sheet.appendRow(["G001", "Matematika", "Modul Ajar", "Belum Kumpul", "", ""]);
  sheet.appendRow(["G002", "Bahasa Inggris", "ATP", "Sudah Kumpul", "https://docs.google.com/dummy", formatDate(new Date())]);
  
  sheet.getRange("A1:F1").setFontWeight("bold");
  sheet.setFrozenRows(1);
  
  Logger.log("Sheet Perangkat_Ajar berhasil dibuat!");
}
