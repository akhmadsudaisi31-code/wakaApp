/**
 * API untuk mengambil data Dashboard Analisis
 */
function api_getDashboardData() {
  try {
    const user = requireRole(['guru', 'waka', 'kepsek']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Ambil Data Jurnal
    const sheetJurnal = ss.getSheetByName(CONFIG.SHEET_NAMES.JURNAL);
    const dataJurnal = sheetJurnal.getDataRange().getValues();
    const headJurnal = dataJurnal[0];
    
    const idxTglJur = headJurnal.indexOf("tanggal");
    const idxGuruJur = headJurnal.indexOf("id_guru");
    const idxMapelJur = headJurnal.indexOf("mapel");
    const idxAtpJur = headJurnal.indexOf("id_atp");
    
    // Ambil Data Jadwal
    const sheetJadwal = ss.getSheetByName(CONFIG.SHEET_NAMES.JADWAL);
    const dataJadwal = sheetJadwal.getDataRange().getValues();
    const headJadwal = dataJadwal[0];
    
    const idxGuruJdw = headJadwal.indexOf("id_guru");
    const idxMapelJdw = headJadwal.indexOf("mapel");
    
    // 1. Data untuk Role GURU (Statistik Pribadi 7 Hari Terakhir)
    if (user.role === 'guru' || user.role === 'waka') {
      // Hitung jurnal masuk milik guru ini dalam 7 hari terakhir
      let jurnalKu = 0;
      for (let i = 1; i < dataJurnal.length; i++) {
        const tglStr = dataJurnal[i][idxTglJur];
        const dDate = new Date(tglStr);
        if (dataJurnal[i][idxGuruJur] === user.id_guru && dDate >= sevenDaysAgo && dDate <= today) {
          jurnalKu++;
        }
      }
      
      // Hitung total jam mengajar guru ini dalam 1 minggu dari jadwal
      let totalJamKuSeminggu = 0;
      for (let i = 1; i < dataJadwal.length; i++) {
        if (dataJadwal[i][idxGuruJdw] === user.id_guru) {
          totalJamKuSeminggu++;
        }
      }
      
      var guruStats = {
        jurnalMasuk: jurnalKu,
        targetJurnal: totalJamKuSeminggu,
        persen: totalJamKuSeminggu > 0 ? Math.round((jurnalKu / totalJamKuSeminggu) * 100) : 100
      };
    }
    
    // 2. Data untuk WAKA / KEPSEK
    if (user.role === 'waka' || user.role === 'kepsek') {
      // Hitung kepatuhan semua guru
      const sheetGuru = ss.getSheetByName(CONFIG.SHEET_NAMES.GURU);
      const dataGuru = sheetGuru.getDataRange().getValues();
      const headGuru = dataGuru[0];
      const idxIdG = headGuru.indexOf("id_guru");
      const idxNamaG = headGuru.indexOf("nama");
      const idxWaG = headGuru.indexOf("no_wa");
      
      let targetPerGuru = {};
      let masukPerGuru = {};
      let namaGuruMap = {};
      let waGuruMap = {};
      
      // Inisialisasi map
      for (let i = 1; i < dataGuru.length; i++) {
        const id = dataGuru[i][idxIdG];
        namaGuruMap[id] = dataGuru[i][idxNamaG];
        if (idxWaG > -1) waGuruMap[id] = dataGuru[i][idxWaG];
        targetPerGuru[id] = 0;
        masukPerGuru[id] = 0;
      }
      
      // Hitung target 1 minggu per guru
      for (let i = 1; i < dataJadwal.length; i++) {
        const id = dataJadwal[i][idxGuruJdw];
        if (targetPerGuru[id] !== undefined) targetPerGuru[id]++;
      }
      
      // Hitung jurnal masuk per guru (7 hari terakhir)
      let totalJurnalAll = 0;
      for (let i = 1; i < dataJurnal.length; i++) {
        const dDate = new Date(dataJurnal[i][idxTglJur]);
        if (dDate >= sevenDaysAgo && dDate <= today) {
          const id = dataJurnal[i][idxGuruJur];
          if (masukPerGuru[id] !== undefined) {
            masukPerGuru[id]++;
            totalJurnalAll++;
          }
        }
      }
      
      let totalTargetAll = 0;
      let kepatuhanRendah = []; // < 80%
      
      for (let id in targetPerGuru) {
        let t = targetPerGuru[id];
        totalTargetAll += t;
        if (t > 0) {
          let p = Math.round((masukPerGuru[id] / t) * 100);
          if (p < 80) {
            kepatuhanRendah.push({
              nama: namaGuruMap[id] || id,
              persen: p,
              masuk: masukPerGuru[id],
              target: t,
              no_wa: waGuruMap[id] || ''
            });
          }
        }
      }
      
      var globalStats = {
        totalJurnalAll: totalJurnalAll,
        totalTargetAll: totalTargetAll,
        persenAll: totalTargetAll > 0 ? Math.round((totalJurnalAll / totalTargetAll) * 100) : 100,
        kepatuhanRendah: kepatuhanRendah
      };
    }
    
    return {
      success: true,
      data: {
        role: user.role,
        guruStats: guruStats || null,
        globalStats: globalStats || null
      }
    };
    
  } catch (e) {
    return { success: false, message: e.message };
  }
}
