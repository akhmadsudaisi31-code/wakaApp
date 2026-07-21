function api_submitMonitoringPKL(payload) {
  try {
    const user = requireRole(['guru']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MONITORING);
    if (!sheet) throw new Error("Database PKL belum di-setup.");
    
    sheet.appendRow([
      new Date(),
      payload.id_pkl,
      user.id_guru,
      payload.catatan,
      payload.link_foto
    ]);
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
