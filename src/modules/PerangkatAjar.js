/**
 * API untuk Fase 3 - Perangkat Ajar
 */

function api_getPerangkatData() {
  try {
    const user = requireRole(['guru', 'waka', 'kepsek']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Pastikan sheet ada
    let sheetPerangkat = ss.getSheetByName(CONFIG.SHEET_NAMES.PERANGKAT);
    if (!sheetPerangkat) throw new Error("Database Perangkat belum disetup.");
    
    const dataPerangkat = sheetPerangkat.getDataRange().getValues();
    const headPerangkat = dataPerangkat[0] || [];
    const idxGuru = headPerangkat.indexOf('id_guru');
    const idxMapel = headPerangkat.indexOf('mapel');
    const idxJenis = headPerangkat.indexOf('jenis_dokumen');
    const idxStatus = headPerangkat.indexOf('status');
    const idxLink = headPerangkat.indexOf('link_dokumen');
    const idxTgl = headPerangkat.indexOf('tanggal_update');
    
    // Mapping guru
    const sheetGuru = ss.getSheetByName(CONFIG.SHEET_NAMES.GURU);
    let mapGuru = {};
    if (sheetGuru) {
      const dataGuru = sheetGuru.getDataRange().getValues();
      for (let i = 1; i < dataGuru.length; i++) {
        mapGuru[dataGuru[i][0]] = dataGuru[i][1];
      }
    }
    
    let hasil = [];
    
    for (let i = 1; i < dataPerangkat.length; i++) {
      const row = dataPerangkat[i];
      const gId = idxGuru > -1 ? row[idxGuru] : row[0];
      
      if (user.role === 'guru' && String(gId) !== String(user.id_guru)) {
        continue;
      }
      
      const tglVal = idxTgl > -1 ? row[idxTgl] : row[5];
      hasil.push({
        id_guru: gId,
        nama_guru: mapGuru[gId] || gId,
        mapel: idxMapel > -1 ? row[idxMapel] : row[1],
        jenis_dokumen: idxJenis > -1 ? row[idxJenis] : row[2],
        status: idxStatus > -1 ? row[idxStatus] : row[3],
        link: idxLink > -1 ? row[idxLink] : row[4],
        tgl: tglVal ? formatDate(tglVal) : '-',
        row_index: i + 1
      });
    }
    
    return { success: true, data: hasil, role: user.role };
    
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function api_updatePerangkat(payload) {
  try {
    const user = requireRole(['guru', 'waka', 'kepsek']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PERANGKAT);
    
    if (!sheet) throw new Error("Tabel Perangkat_Ajar tidak ditemukan.");

    const rowIndex = parseInt(payload.row_index);
    if (!rowIndex || rowIndex <= 1) throw new Error("Index baris tidak valid.");

    const headers = sheet.getDataRange().getValues()[0] || [];
    const idxStatus = headers.indexOf('status') + 1;
    const idxLink = headers.indexOf('link_dokumen') + 1;
    const idxTgl = headers.indexOf('tanggal_update') + 1;

    const isGuru = user.role === 'guru';
    
    // Jika guru, update link & status menjadi 'Sudah Kumpul'
    if (isGuru && payload.action === 'upload') {
      if (idxLink > 0) sheet.getRange(rowIndex, idxLink).setValue(payload.link);
      if (idxStatus > 0) sheet.getRange(rowIndex, idxStatus).setValue('Sudah Kumpul');
      if (idxTgl > 0) sheet.getRange(rowIndex, idxTgl).setValue(new Date());
    } 
    // Jika waka/kepsek, update status verifikasi
    else if (!isGuru && payload.action === 'verify') {
      if (idxStatus > 0) sheet.getRange(rowIndex, idxStatus).setValue(payload.new_status);
      if (idxTgl > 0) sheet.getRange(rowIndex, idxTgl).setValue(new Date());
    }
    
    return { success: true, message: "Perangkat ajar berhasil diupdate!" };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
