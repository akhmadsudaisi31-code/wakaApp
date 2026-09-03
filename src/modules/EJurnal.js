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
    
    let dokumentasiUrl = payload.link_dokumentasi || "";

    // Jika ada file foto gambar yang diunggah langsung (base64)
    if (payload.foto_base64) {
      try {
        const folderName = "Dokumentasi_EJurnal";
        let rootFolder;
        const rootQuery = DriveApp.getFoldersByName(folderName);
        if (rootQuery.hasNext()) {
          rootFolder = rootQuery.next();
        } else {
          rootFolder = DriveApp.createFolder(folderName);
        }

        const guruFolderName = `${user.nama || user.id_guru}_${user.id_guru}`.replace(/[\\/:*?"<>|]/g, '_').trim();
        let guruFolder;
        const gQuery = rootFolder.getFoldersByName(guruFolderName);
        if (gQuery.hasNext()) {
          guruFolder = gQuery.next();
        } else {
          guruFolder = rootFolder.createFolder(guruFolderName);
        }

        // Format nama file: Jurnal_Kelas_Tanggal_Waktu
        const safeKelas = (payload.id_kelas || 'Kelas').replace(/[\\/:*?"<>|]/g, '_');
        const filename = `Jurnal_${safeKelas}_${todayStr}_${Date.now()}.jpg`;

        // Decode base64
        const parts = payload.foto_base64.split(',');
        const base64Data = parts.length > 1 ? parts[1] : parts[0];
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg', filename);

        const uploadedFile = guruFolder.createFile(blob);
        uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        dokumentasiUrl = uploadedFile.getUrl();
      } catch (driveErr) {
        Logger.log('Gagal upload gambar jurnal ke Drive: ' + driveErr.message);
        // Fallback tetap lanjutkan penyimpanan data jurnal meski foto gagal
      }
    }

    // Buat rowData berdasarkan urutan header yang ada di sheet
    const dataJurnal = sheetJurnal.getDataRange().getValues();
    const headJurnal = dataJurnal[0];
    
    // Pastikan kolom baru link_dokumentasi ada di header jika belum ada
    if (headJurnal.indexOf("link_dokumentasi") === -1) {
      sheetJurnal.getRange(1, headJurnal.length + 1).setValue("link_dokumentasi").setFontWeight("bold");
      headJurnal.push("link_dokumentasi");
    }

    const valueMap = {
      "timestamp": timestamp,
      "tanggal": todayStr,
      "id_guru": user.id_guru,
      "id_kelas": payload.id_kelas,
      "mapel": payload.mapel,
      "jam_ke": payload.jam_ke,
      "id_atp": payload.id_atp || "",
      "materi_bebas": payload.materi_bebas || "",
      "jumlah_hadir": payload.jumlah_hadir || 0,
      "jumlah_sakit": payload.jumlah_sakit || 0,
      "jumlah_izin": payload.jumlah_izin || 0,
      "jumlah_alpa": payload.jumlah_alpa || 0,
      "catatan_kendala": payload.catatan_kendala || "",
      "status_kehadiran": statusKehadiran,
      "link_dokumentasi": dokumentasiUrl
    };

    let rowData = headJurnal.map(h => (valueMap[h] !== undefined ? valueMap[h] : ""));

    // Cek duplikasi entri di hari, guru, kelas, dan jam yang sama
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

/**
 * Mengambil riwayat pengisian jurnal guru (7-30 hari terakhir)
 */
function api_getRiwayatJurnal() {
  try {
    const user = requireRole(['guru', 'waka', 'kepsek']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheetJurnal = ss.getSheetByName(CONFIG.SHEET_NAMES.JURNAL);
    if (!sheetJurnal) return { success: true, data: [] };

    const data = sheetJurnal.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    const head = data[0];
    const idxTgl = head.indexOf("tanggal");
    const idxGuru = head.indexOf("id_guru");
    const idxKelas = head.indexOf("id_kelas");
    const idxMapel = head.indexOf("mapel");
    const idxJam = head.indexOf("jam_ke");
    const idxAtp = head.indexOf("id_atp");
    const idxMateriBebas = head.indexOf("materi_bebas");
    const idxHadir = head.indexOf("jumlah_hadir");
    const idxSakit = head.indexOf("jumlah_sakit");
    const idxIzin = head.indexOf("jumlah_izin");
    const idxAlpa = head.indexOf("jumlah_alpa");
    const idxCatatan = head.indexOf("catatan_kendala");
    const idxLink = head.indexOf("link_dokumentasi");

    let riwayat = [];
    // Baca dari data terbaru (bawah ke atas)
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      // Jika guru biasa, hanya tampilkan jurnal miliknya
      if (user.role === 'guru' && row[idxGuru] !== user.id_guru) {
        continue;
      }

      riwayat.push({
        tanggal: formatDate(row[idxTgl]),
        id_guru: row[idxGuru],
        id_kelas: row[idxKelas],
        mapel: row[idxMapel],
        jam_ke: row[idxJam],
        id_atp: idxAtp > -1 ? row[idxAtp] : '',
        materi: (idxMateriBebas > -1 && row[idxMateriBebas]) ? row[idxMateriBebas] : (idxAtp > -1 ? row[idxAtp] : '-'),
        hadir: idxHadir > -1 ? (row[idxHadir] || 0) : 0,
        sakit: idxSakit > -1 ? (row[idxSakit] || 0) : 0,
        izin: idxIzin > -1 ? (row[idxIzin] || 0) : 0,
        alpa: idxAlpa > -1 ? (row[idxAlpa] || 0) : 0,
        catatan_kendala: idxCatatan > -1 ? row[idxCatatan] : '',
        link_dokumentasi: idxLink > -1 ? row[idxLink] : ''
      });

      if (riwayat.length >= 30) break; // Batasi 30 entri terbaru
    }

    return { success: true, data: riwayat };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
