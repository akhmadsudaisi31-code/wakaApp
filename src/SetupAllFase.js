function setupAllFase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // Fase 4
  if (!ss.getSheetByName(CONFIG.SHEET_NAMES.DUDI)) {
    const sheet = ss.insertSheet(CONFIG.SHEET_NAMES.DUDI);
    sheet.appendRow(["id_dudi", "nama_perusahaan", "alamat", "kontak"]);
    sheet.getRange("A1:D1").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  if (!ss.getSheetByName(CONFIG.SHEET_NAMES.PKL)) {
    const sheet = ss.insertSheet(CONFIG.SHEET_NAMES.PKL);
    sheet.appendRow(["id_pkl", "nama_siswa", "id_kelas", "id_dudi", "id_guru_pembimbing", "status"]);
    sheet.getRange("A1:F1").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  if (!ss.getSheetByName(CONFIG.SHEET_NAMES.MONITORING)) {
    const sheet = ss.insertSheet(CONFIG.SHEET_NAMES.MONITORING);
    sheet.appendRow(["timestamp", "id_pkl", "id_guru", "catatan", "link_foto"]);
    sheet.getRange("A1:E1").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  // Fase 5
  if (!ss.getSheetByName(CONFIG.SHEET_NAMES.SUPERVISI)) {
    const sheet = ss.insertSheet(CONFIG.SHEET_NAMES.SUPERVISI);
    sheet.appendRow(["id_supervisi", "tanggal", "id_guru_disupervisi", "id_waka_supervisor", "nilai", "catatan"]);
    sheet.getRange("A1:F1").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  Logger.log("Semua sheet tambahan berhasil dibuat!");
}
