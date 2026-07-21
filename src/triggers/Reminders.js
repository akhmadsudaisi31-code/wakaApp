/**
 * Fungsi ini harus di-set sebagai Time-Driven trigger (misal tiap hari jam 16:00).
 * Mengecek guru yang punya jadwal hari ini tetapi belum mengisi jurnal sepenuhnya.
 */
function checkAndSendReminders() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  const hariIni = getDayName(new Date());
  const tglIni = formatDate(new Date());
  
  // 1. Ambil jadwal hari ini
  const sheetJadwal = ss.getSheetByName(CONFIG.SHEET_NAMES.JADWAL);
  const dataJadwal = sheetJadwal.getDataRange().getValues();
  const headJadwal = dataJadwal[0];
  const idxIdGuruJ = headJadwal.indexOf("id_guru");
  const idxHariJ = headJadwal.indexOf("hari");
  const idxJamJ = headJadwal.indexOf("jam_ke");
  const idxKelasJ = headJadwal.indexOf("id_kelas");
  const idxMapelJ = headJadwal.indexOf("mapel");
  
  let jadwalHariIni = [];
  for (let i = 1; i < dataJadwal.length; i++) {
    if (dataJadwal[i][idxHariJ] === hariIni) {
      jadwalHariIni.push({
        id_guru: dataJadwal[i][idxIdGuruJ],
        id_kelas: dataJadwal[i][idxKelasJ],
        mapel: dataJadwal[i][idxMapelJ],
        jam_ke: dataJadwal[i][idxJamJ]
      });
    }
  }
  
  if (jadwalHariIni.length === 0) return; // Tidak ada jadwal hari ini
  
  // 2. Ambil jurnal yang sudah masuk hari ini
  const sheetJurnal = ss.getSheetByName(CONFIG.SHEET_NAMES.JURNAL);
  const dataJurnal = sheetJurnal.getDataRange().getValues();
  const headJurnal = dataJurnal[0];
  const idxTgl = headJurnal.indexOf("tanggal");
  const idxIdGuruJur = headJadwal.indexOf("id_guru");
  const idxKelasJur = headJadwal.indexOf("id_kelas");
  const idxJamJur = headJadwal.indexOf("jam_ke");
  
  let setJurnalMasuk = new Set();
  for (let i = 1; i < dataJurnal.length; i++) {
    if (formatDate(dataJurnal[i][idxTgl]) === tglIni) {
      const key = `${dataJurnal[i][idxIdGuruJur]}_${dataJurnal[i][idxKelasJur]}_${dataJurnal[i][idxJamJur]}`;
      setJurnalMasuk.add(key);
    }
  }
  
  // 3. Bandingkan, kelompokkan per guru yang belum isi
  let guruBelumIsi = {}; // { "id_guru": [jadwal1, jadwal2] }
  
  jadwalHariIni.forEach(jdw => {
    const key = `${jdw.id_guru}_${jdw.id_kelas}_${jdw.jam_ke}`;
    if (!setJurnalMasuk.has(key)) {
      if (!guruBelumIsi[jdw.id_guru]) guruBelumIsi[jdw.id_guru] = [];
      guruBelumIsi[jdw.id_guru].push(jdw);
    }
  });
  
  if (Object.keys(guruBelumIsi).length === 0) return; // Semua sudah isi
  
  // 4. Ambil email guru
  const sheetGuru = ss.getSheetByName(CONFIG.SHEET_NAMES.GURU);
  const dataGuru = sheetGuru.getDataRange().getValues();
  const headGuru = dataGuru[0];
  const idxIdG = headGuru.indexOf("id_guru");
  const idxEmailG = headGuru.indexOf("email");
  const idxNamaG = headGuru.indexOf("nama");
  const idxStatusG = headGuru.indexOf("status_aktif");
  
  let mapGuru = {};
  for (let i = 1; i < dataGuru.length; i++) {
    if (dataGuru[i][idxStatusG] === true || dataGuru[i][idxStatusG].toString().toLowerCase() === "true") {
      mapGuru[dataGuru[i][idxIdG]] = {
        nama: dataGuru[i][idxNamaG],
        email: dataGuru[i][idxEmailG]
      };
    }
  }
  
  // 5. Kirim email
  for (let id_guru in guruBelumIsi) {
    const g = mapGuru[id_guru];
    if (g && g.email) {
      let listJadwal = guruBelumIsi[id_guru].map(j => `- Kelas ${j.id_kelas}, ${j.mapel} (Jam ke-${j.jam_ke})`).join("\\n");
      
      let subject = `[${CONFIG.APP_INFO.NAMA_SEKOLAH}] Pengingat E-Jurnal Mengajar - ${tglIni}`;
      let body = `Yth. ${g.nama},\\n\\nMohon segera mengisi E-Jurnal Mengajar untuk hari ini (${hariIni}, ${tglIni}).\\n\\nAnda tercatat belum mengisi jurnal untuk jadwal berikut:\\n${listJadwal}\\n\\nSilakan kunjungi Web App Sistem Waka Kurikulum untuk melengkapinya.\\n\\nTerima kasih.`;
      
      try {
        MailApp.sendEmail(g.email, subject, body);
      } catch(e) {
        Logger.log(`Gagal kirim email ke ${g.email}: ` + e.message);
      }
    }
  }
}
