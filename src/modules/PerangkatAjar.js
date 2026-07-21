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
    const headPerangkat = dataPerangkat[0];
    
    // Mapping guru
    const sheetGuru = ss.getSheetByName(CONFIG.SHEET_NAMES.GURU);
    const dataGuru = sheetGuru.getDataRange().getValues();
    let mapGuru = {};
    for (let i = 1; i < dataGuru.length; i++) {
      mapGuru[dataGuru[i][0]] = dataGuru[i][1];
    }
    
    let hasil = [];
    
    for (let i = 1; i < dataPerangkat.length; i++) {
      const row = dataPerangkat[i];
      if (user.role === 'guru') {
        // Guru hanya melihat miliknya
        if (row[0] === user.id_guru) {
          hasil.push({
            id_guru: row[0],
            nama_guru: mapGuru[row[0]],
            mapel: row[1],
            jenis_dokumen: row[2],
            status: row[3],
            link: row[4],
            tgl: row[5] ? formatDate(row[5]) : '-',
            row_index: i + 1 // Untuk update
          });
        }
      } else {
        // Waka/Kepsek melihat semua
        hasil.push({
          id_guru: row[0],
          nama_guru: mapGuru[row[0]],
          mapel: row[1],
          jenis_dokumen: row[2],
          status: row[3],
          link: row[4],
          tgl: row[5] ? formatDate(row[5]) : '-',
          row_index: i + 1
        });
      }
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
    
    const rowIndex = payload.row_index;
    const isGuru = user.role === 'guru';
    
    // Jika guru, hanya update link & status mnjd 'Sudah Kumpul'
    if (isGuru && payload.action === 'upload') {
      // Asumsi kolom E (5) adalah link, kolom D (4) adalah status, kolom F (6) adalah tgl
      sheet.getRange(rowIndex, 5).setValue(payload.link);
      sheet.getRange(rowIndex, 4).setValue('Sudah Kumpul');
      sheet.getRange(rowIndex, 6).setValue(new Date());
    } 
    // Jika waka, update status mnjd 'Terverifikasi' atau 'Revisi' dsb
    else if (!isGuru && payload.action === 'verify') {
      sheet.getRange(rowIndex, 4).setValue(payload.new_status);
    }
    
    return { success: true, message: "Berhasil diupdate!" };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
