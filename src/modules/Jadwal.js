/**
 * Jadwal.js — Modul Jadwal Mengajar
 *
 * Endpoints:
 * - api_getJadwal      : ambil semua jadwal (waka/kepsek) atau jadwal sendiri (guru)
 * - api_saveJadwal     : tambah/update baris jadwal ke sheet Master_Jadwal
 * - api_getJadwalSaya  : (legacy) jadwal guru yang sedang login
 */

// ============================================================
// GET JADWAL — dipakai oleh frontend halaman Jadwal
// ============================================================
function api_getJadwal() {
  try {
    const user = requireRole(['guru', 'waka', 'kepsek']);
    const ss   = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.JADWAL || 'Master_Jadwal');

    if (!sheet) throw new Error('Tabel Master_Jadwal belum dibuat. Jalankan Setup terlebih dahulu.');

    const data    = sheet.getDataRange().getValues();
    const headers = data[0] || [];

    const idxGuru  = headers.indexOf('id_guru');
    const idxKelas = headers.indexOf('id_kelas');
    const idxMapel = headers.indexOf('mapel');
    const idxHari  = headers.indexOf('hari');
    const idxJam   = headers.indexOf('jam_ke');

    const hariMap = { Senin:1, Selasa:2, Rabu:3, Kamis:4, Jumat:5, Sabtu:6, Minggu:7 };
    const hariIni = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date().getDay()];

    const jadwalSemua = [];
    const jadwalKu    = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[idxGuru]) continue; // skip baris kosong

      const item = {
        id_guru  : row[idxGuru]  || '',
        id_kelas : row[idxKelas] || '',
        mapel    : row[idxMapel] || '',
        hari     : row[idxHari]  || '',
        jam_ke   : parseInt(row[idxJam]) || 0,
      };

      jadwalSemua.push(item);
      if (String(item.id_guru) === String(user.id_guru)) {
        jadwalKu.push(item);
      }
    }

    // Urutkan berdasarkan hari lalu jam
    const sortFn = (a, b) => {
      const ha = hariMap[a.hari] || 99;
      const hb = hariMap[b.hari] || 99;
      if (ha !== hb) return ha - hb;
      return a.jam_ke - b.jam_ke;
    };
    jadwalSemua.sort(sortFn);
    jadwalKu.sort(sortFn);

    return {
      success     : true,
      data        : { hari: hariIni, jadwalKu, jadwalSemua }
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ============================================================
// SAVE JADWAL — tambah atau update baris di Master_Jadwal
// ============================================================
function api_saveJadwal(payload) {
  try {
    requireRole(['waka', 'kepsek']);
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.JADWAL || 'Master_Jadwal');

    if (!sheet) throw new Error('Tabel Master_Jadwal belum dibuat. Jalankan Setup terlebih dahulu.');

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Bangun row array sesuai urutan header
    const rowArray = headers.map(h => payload[h] !== undefined ? payload[h] : '');

    // Cek duplikat berdasarkan id_jadwal
    const idCol = headers.indexOf('id_jadwal') + 1;
    if (idCol > 0) {
      const idRange = sheet.getRange(2, idCol, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
      const existIdx = idRange.findIndex(r => String(r[0]) === String(payload.id_jadwal));
      if (existIdx >= 0) {
        // Update baris yang ada
        const targetRow = existIdx + 2;
        sheet.getRange(targetRow, 1, 1, rowArray.length).setValues([rowArray]);
        return { success: true, message: 'Jadwal berhasil diupdate.' };
      }
    }

    // Tambah baris baru
    sheet.appendRow(rowArray);
    return { success: true, message: 'Jadwal berhasil ditambahkan.' };

  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ============================================================
// LEGACY — Dipertahankan agar endpoint lama tidak broken
// ============================================================
function api_getJadwalSaya() {
  try {
    const user  = requireRole(['guru', 'waka']);
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.JADWAL || 'Master_Jadwal');

    if (!sheet) throw new Error('Tabel jadwal belum di-setup.');

    const data    = sheet.getDataRange().getValues();
    const headers = data[0];

    const idxGuru  = headers.indexOf('id_guru');
    const idxHari  = headers.indexOf('hari');
    const idxJam   = headers.indexOf('jam_ke');
    const idxKelas = headers.indexOf('id_kelas');
    const idxMapel = headers.indexOf('mapel');

    const hasil = [];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idxGuru]) === String(user.id_guru)) {
        hasil.push({
          hari   : data[i][idxHari],
          jam_ke : data[i][idxJam],
          kelas  : data[i][idxKelas],
          mapel  : data[i][idxMapel]
        });
      }
    }

    const hariMap = { Senin:1, Selasa:2, Rabu:3, Kamis:4, Jumat:5, Sabtu:6, Minggu:7 };
    hasil.sort((a, b) => {
      const ha = hariMap[a.hari] || 99;
      const hb = hariMap[b.hari] || 99;
      if (ha !== hb) return ha - hb;
      return parseInt(a.jam_ke) - parseInt(b.jam_ke);
    });

    return { success: true, data: hasil };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
