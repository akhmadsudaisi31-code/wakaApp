function api_getJadwalSaya() {
  try {
    const user = requireRole(['guru', 'waka']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheetJadwal = ss.getSheetByName(CONFIG.SHEET_NAMES.JADWAL);
    
    if (!sheetJadwal) throw new Error("Tabel jadwal belum di-setup.");
    
    const data = sheetJadwal.getDataRange().getValues();
    const headers = data[0];
    
    const idxGuru = headers.indexOf("id_guru");
    const idxHari = headers.indexOf("hari");
    const idxJam = headers.indexOf("jam_ke");
    const idxKelas = headers.indexOf("id_kelas");
    const idxMapel = headers.indexOf("mapel");
    
    const hasil = [];
    for(let i = 1; i < data.length; i++) {
      if (data[i][idxGuru] === user.id_guru) {
        hasil.push({
          hari: data[i][idxHari],
          jam_ke: data[i][idxJam],
          kelas: data[i][idxKelas],
          mapel: data[i][idxMapel]
        });
      }
    }
    
    // Urutkan berdasarkan hari (Senin-Minggu) lalu jam
    const hariMap = { "Senin":1, "Selasa":2, "Rabu":3, "Kamis":4, "Jumat":5, "Sabtu":6, "Minggu":7 };
    hasil.sort((a, b) => {
      let ha = hariMap[a.hari] || 99;
      let hb = hariMap[b.hari] || 99;
      if (ha !== hb) return ha - hb;
      return parseInt(a.jam_ke) - parseInt(b.jam_ke);
    });
    
    return { success: true, data: hasil };
  } catch(e) {
    return { success: false, message: e.message };
  }
}
