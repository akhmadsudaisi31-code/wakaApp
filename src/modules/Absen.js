/**
 * Absen.js — Modul Absensi Guru (Selfie ke Google Drive)
 *
 * Fitur:
 * 1. Folder Drive per guru: Absensi_Guru/{NamaGuru}/
 * 2. Kompresi gambar: resize via Canvas + kualitas JPEG 0.65
 *    (dilakukan di sisi client sebelum upload, lihat absen.js frontend)
 * 3. File diberi nama: Absen_{Jenis}_{Tanggal}_{WaktuEpoch}.jpg
 * 4. Mencatat URL foto ke sheet Data_Absensi
 */

/**
 * Mendapatkan atau membuat folder Drive untuk guru tertentu.
 * Struktur: Root Drive → "Absensi_Guru" → "{nama_guru}"
 *
 * @param {string} namaGuru  - Nama lengkap guru (dari Master_Guru)
 * @param {string} idGuru    - ID guru untuk fallback jika nama kosong
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function _getOrCreateFolderGuru(namaGuru, idGuru) {
  const ROOT_FOLDER_NAME = 'Absensi_Guru';

  // Ambil atau buat folder root "Absensi_Guru"
  let rootFolder;
  const rootQuery = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (rootQuery.hasNext()) {
    rootFolder = rootQuery.next();
  } else {
    rootFolder = DriveApp.createFolder(ROOT_FOLDER_NAME);
  }

  // Nama folder per guru: gunakan nama lengkap, sanitasi karakter ilegal
  const sanitizedName = (namaGuru || idGuru)
    .replace(/[\\/:*?"<>|]/g, '_') // Hapus karakter ilegal di nama folder
    .trim()
    .substring(0, 50);             // Batasi panjang nama

  const guruFolderName = `${sanitizedName}_${idGuru}`;

  // Cari folder guru di dalam rootFolder
  let guruFolder;
  const guruQuery = rootFolder.getFoldersByName(guruFolderName);
  if (guruQuery.hasNext()) {
    guruFolder = guruQuery.next();
  } else {
    guruFolder = rootFolder.createFolder(guruFolderName);
    // Set agar folder bisa dilihat oleh siapa saja dengan link (opsional)
    // guruFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  return guruFolder;
}

/**
 * Kompres Base64 image dengan mengecilkan dimensi + kualitas JPEG.
 * Dilakukan di sisi server menggunakan Utilities.newBlob().
 * Kompresi utama SUDAH dilakukan di frontend (canvas resize + quality 0.65).
 * Fungsi ini hanya validasi & strip header data-URL.
 *
 * @param {string} base64WithHeader - Data URL penuh (data:image/jpeg;base64,...)
 * @param {string} filename         - Nama file untuk blob
 * @returns {GoogleAppsScript.Base.Blob}
 */
function _decodeAndCompressImage(base64WithHeader, filename) {
  // Strip header "data:image/jpeg;base64," atau "data:image/png;base64," dsb.
  const parts = base64WithHeader.split(',');
  if (parts.length < 2) {
    throw new Error('Format data foto tidak valid.');
  }

  const base64Data  = parts[1];
  // Deteksi mime type dari header
  const mimeMatch   = parts[0].match(/data:(image\/[a-zA-Z+]+);base64/);
  const mimeType    = (mimeMatch && mimeMatch[1]) ? mimeMatch[1] : 'image/jpeg';

  // Decode Base64 → Blob
  const imageBlob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    mimeType,
    filename
  );

  return imageBlob;
}

/**
 * API utama: Terima foto absen dari frontend, simpan ke Drive (per-guru),
 * dan catat ke sheet Data_Absensi.
 *
 * @param {object} payload
 * @param {string} payload.jenis  - "Masuk" | "Pulang"
 * @param {string} payload.foto   - Data URL base64 (sudah dikompresi di frontend)
 * @returns {{ success: boolean, message?: string }}
 */
function api_submitAbsen(payload) {
  try {
    // Validasi role & ambil data user
    const user = requireRole(['guru', 'waka', 'kepsek']);

    // Validasi payload
    if (!payload || !payload.foto) {
      return { success: false, message: 'Data foto tidak ditemukan.' };
    }
    if (!['Masuk', 'Pulang'].includes(payload.jenis)) {
      return { success: false, message: 'Jenis absen tidak valid. Harus "Masuk" atau "Pulang".' };
    }

    // Ambil nama lengkap guru dari Master_Guru (untuk nama folder)
    const ss        = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const guruSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GURU);
    let namaGuru    = user.id_guru; // fallback

    if (guruSheet) {
      const guruData = guruSheet.getDataRange().getValues();
      // Header: [id_guru, nama, email, role, mapel_diampu, status_aktif]
      for (let i = 1; i < guruData.length; i++) {
        if (guruData[i][0] === user.id_guru) {
          namaGuru = guruData[i][1] || user.id_guru;
          break;
        }
      }
    }

    // Buat nama file dengan timestamp
    const now        = new Date();
    const tglStr     = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd');
    const epoch      = now.getTime();
    const filename   = `Absen_${payload.jenis}_${tglStr}_${epoch}.jpg`;

    // Decode & buat blob gambar (kompresi dilakukan di frontend)
    const imageBlob  = _decodeAndCompressImage(payload.foto, filename);

    // Ambil/buat folder guru di Drive
    const guruFolder = _getOrCreateFolderGuru(namaGuru, user.id_guru);

    // Upload file ke folder guru
    const file = guruFolder.createFile(imageBlob);
    // Set sharing: anyone with link can VIEW (supaya bisa preview)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fotoUrl = file.getUrl();

    // Auto-create atau buka sheet Data_Absensi
    let absenSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ABSENSI);
    if (!absenSheet) {
      absenSheet = ss.insertSheet(CONFIG.SHEET_NAMES.ABSENSI);
      absenSheet.appendRow(['timestamp', 'tanggal', 'id_guru', 'nama_guru', 'jenis_absen', 'foto_url', 'folder_drive']);
      absenSheet.getRange('A1:G1').setFontWeight('bold');
      absenSheet.setFrozenRows(1);
    }

    // Catat ke sheet
    absenSheet.appendRow([
      now,                         // timestamp (datetime)
      tglStr,                      // tanggal (date string, mudah di-filter)
      user.id_guru,                // id_guru
      namaGuru,                    // nama_guru (denormalisasi untuk kemudahan baca sheet)
      payload.jenis,               // "Masuk" | "Pulang"
      fotoUrl,                     // URL foto di Drive
      guruFolder.getUrl()          // URL folder guru (untuk akses cepat)
    ]);

    return {
      success  : true,
      message  : `Absen ${payload.jenis} berhasil disimpan.`,
      foto_url : fotoUrl
    };

  } catch (e) {
    Logger.log('Error api_submitAbsen: ' + e.message + '\n' + e.stack);
    return { success: false, message: e.message };
  }
}
