/**
 * Mendapatkan data awal untuk form Jurnal (Jadwal & ATP)
 */
function api_getFormDataJurnal() {
  try {
    const user = requireRole(['guru', 'waka', 'kepsek']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Ambil Jadwal
    const sheetJadwal = ss.getSheetByName(CONFIG.SHEET_NAMES.JADWAL);
    const dataJadwal = sheetJadwal.getDataRange().getValues();
    const headJadwal = dataJadwal[0];
    
    const idxIdKelas = headJadwal.indexOf("id_kelas");
    const idxMapel = headJadwal.indexOf("mapel");
    const idxHari = headJadwal.indexOf("hari");
    const idxJam = headJadwal.indexOf("jam_ke");
    const idxGuru = headJadwal.indexOf("id_guru");
    
    const hariIni = getDayName(new Date());
    
    let jadwalKu = [];
    let jadwalSemua = [];
    
    for (let i = 1; i < dataJadwal.length; i++) {
      let row = dataJadwal[i];
      let j = {
        id_kelas: row[idxIdKelas],
        mapel: row[idxMapel],
        jam_ke: row[idxJam],
        hari: row[idxHari]
      };
      
      // Kumpulkan semua jadwal yang ada di hari ini
      if (row[idxHari] === hariIni) {
        jadwalSemua.push(j);
        if (row[idxGuru] === user.id_guru) {
          jadwalKu.push(j);
        }
      }
    }
    
    // Ambil ATP
    const sheetATP = ss.getSheetByName(CONFIG.SHEET_NAMES.ATP);
    const dataATP = sheetATP.getDataRange().getValues();
    const headATP = dataATP[0];
    
    const idxIdAtp = headATP.indexOf("id_atp");
    const idxMapelAtp = headATP.indexOf("mapel");
    const idxMateri = headATP.indexOf("deskripsi_materi");
    
    let atpTersedia = [];
    let mapelSekolah = [...new Set(jadwalSemua.map(j => j.mapel))];
    
    for (let i = 1; i < dataATP.length; i++) {
      let row = dataATP[i];
      if (mapelSekolah.includes(row[idxMapelAtp])) {
        atpTersedia.push({
          id_atp: row[idxIdAtp],
          mapel: row[idxMapelAtp],
          deskripsi: row[idxMateri]
        });
      }
    }
    
    return {
      success: true,
      data: {
        hari: hariIni,
        jadwalKu: jadwalKu,
        jadwalSemua: jadwalSemua,
        atp: atpTersedia
      }
    };
    
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Menyimpan data Jurnal
 */
function api_submitJurnal(payload) {
  try {
    const user = requireRole(['guru', 'waka']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheetJurnal = ss.getSheetByName(CONFIG.SHEET_NAMES.JURNAL);
    
    const todayStr = formatDate(new Date());
    const timestamp = getCurrentTimestamp();
    
    let statusKehadiran = "Hadir"; // asumsi awal
    if (payload.isInval) {
      statusKehadiran += " (Inval)";
    }
    
    const rowData = [
      timestamp,
      todayStr,
      user.id_guru,
      payload.id_kelas,
      payload.mapel,
      payload.jam_ke,
      payload.id_atp || "",
      payload.materi_bebas || "",
      payload.jumlah_hadir || 0,
      payload.jumlah_sakit || 0,
      payload.jumlah_izin || 0,
      payload.jumlah_alpa || 0,
      statusKehadiran
    ];
    
    // Cek duplikasi
    const dataJurnal = sheetJurnal.getDataRange().getValues();
    const headJurnal = dataJurnal[0];
    
    const idxTgl = headJurnal.indexOf("tanggal");
    const idxIdGuru = headJurnal.indexOf("id_guru");
    const idxIdKelas = headJurnal.indexOf("id_kelas");
    const idxJam = headJurnal.indexOf("jam_ke");
    
    let rowToUpdate = -1;
    for (let i = 1; i < dataJurnal.length; i++) {
      let row = dataJurnal[i];
      if (
        formatDate(row[idxTgl]) === todayStr &&
        row[idxIdGuru] === user.id_guru &&
        row[idxIdKelas] === payload.id_kelas &&
        row[idxJam] == payload.jam_ke
      ) {
        rowToUpdate = i + 1;
        break;
      }
    }
    
    if (rowToUpdate > -1) {
      sheetJurnal.getRange(rowToUpdate, 1, 1, rowData.length).setValues([rowData]);
      return { success: true, message: "Jurnal berhasil diperbarui!" };
    } else {
      sheetJurnal.appendRow(rowData);
      return { success: true, message: "Jurnal berhasil disimpan!" };
    }
    
  } catch (e) {
    return { success: false, message: e.message };
  }
}
