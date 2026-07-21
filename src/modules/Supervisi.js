function api_submitSupervisi(payload) {
  try {
    const user = requireRole(['waka', 'kepsek']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SUPERVISI);
    if (!sheet) throw new Error("Database Supervisi belum di-setup.");
    
    // Generate simple ID
    const idSupervisi = "SUP-" + new Date().getTime();
    
    sheet.appendRow([
      idSupervisi,
      new Date(),
      payload.id_guru,
      user.id_guru, // supervisor
      payload.nilai,
      payload.catatan
    ]);
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
