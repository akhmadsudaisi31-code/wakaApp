/**
 * Code.js — Entry Point Google Apps Script (v2.0 — Pure API Backend)
 *
 * Alur Login (TANPA Google Cloud Console):
 * 1. User klik "Login via Google" di frontend Netlify
 * 2. Browser diarahkan ke GAS Web App URL (doGet)
 * 3. GAS mengenali user via Session.getActiveUser() — Google sudah handle auth-nya
 * 4. GAS membuat token sesi (UUID, disimpan di PropertiesService, valid 8 jam)
 * 5. GAS redirect balik ke Netlify: {FRONTEND_URL}?token=xxx&name=yyy&role=zzz
 * 6. Frontend menyimpan token di sessionStorage dan memuat aplikasi
 * 7. Setiap API call berikutnya menyertakan token di body request
 * 8. GAS memvalidasi token dan menjalankan fungsi yang diminta
 *
 * Deploy Settings WAJIB:
 *   Execute as:  User accessing the web app  ← agar Session.getActiveUser() bisa membaca email
 *   Who can access: Anyone with Google account
 */

// Global user yang di-set oleh doPost sebelum memanggil api_ functions
var GAS_CURRENT_USER = null;

/**
 * doGet — Halaman Login / Token Generator
 * Dipanggil saat user klik "Login" dari frontend Netlify.
 */
function doGet(e) {
  const user = getCurrentUser();

  // Jika tidak authorized, tampilkan halaman info
  if (!user.authorized) {
    const alasan = user.reason || 'Akun tidak terdaftar';
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Akses Ditolak — Waka Kurikulum</title>
        <style>
          body { font-family: Arial, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#f1f5f9; }
          .card { background:white; border-radius:16px; padding:40px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.1); max-width:400px; }
          .icon { font-size:3rem; margin-bottom:16px; }
          h2 { color:#dc2626; margin:0 0 10px; }
          p  { color:#64748b; margin:0 0 20px; }
          small { color:#94a3b8; }
        </style>
      </head><body>
        <div class="card">
          <div class="icon">🚫</div>
          <h2>Akses Ditolak</h2>
          <p>${alasan}</p>
          <p><strong>Email Anda:</strong> ${user.email || 'Tidak diketahui'}</p>
          <small>Hubungi Waka Kurikulum untuk mendaftarkan akun Anda.</small>
        </div>
      </body></html>
    `).setTitle('Akses Ditolak — Waka Kurikulum')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ✅ User authorized — buat token sesi
  const token = generateSessionToken(user);
  const frontendUrl = CONFIG.FRONTEND_URL;

  // Redirect ke Netlify dengan token sebagai query param
  const redirectUrl = `${frontendUrl}?token=${token}&name=${encodeURIComponent(user.nama)}&role=${encodeURIComponent(user.role)}`;

  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Mengalihkan...</title>
      <style>
        body { font-family: Arial, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#4f46e5; }
        .box { text-align:center; color:white; }
        .spinner { width:40px; height:40px; border:4px solid rgba(255,255,255,0.3); border-top:4px solid white; border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        p { margin:0; font-size:1rem; opacity:0.9; }
      </style>
    </head><body>
      <div class="box">
        <div class="spinner"></div>
        <p>Login berhasil! Mengalihkan ke aplikasi...</p>
      </div>
      <script>
        // Redirect otomatis ke frontend Netlify
        setTimeout(function() {
          window.location.href = '${redirectUrl}';
        }, 500);
      </script>
    </body></html>
  `).setTitle('Login Berhasil...')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * doPost — API Router Utama
 * Menerima JSON body: { action, token, payload }
 */
function doPost(e) {
  try {
    const raw = e.postData ? e.postData.contents : '{}';
    const req = JSON.parse(raw);

    const { action, token, payload } = req;

    if (!action) {
      return _jsonResponse({ success: false, message: 'Parameter "action" wajib diisi.' });
    }

    // === AUTH ROUTING (Non-Session) ===
    if (action === 'loginWithGoogle') {
      const idToken = payload.jwtToken;
      const authResult = verifyAndGetUser(idToken);
      
      if (!authResult.authorized) {
        return _jsonResponse({ success: false, message: authResult.reason });
      }
      
      // Buat session token UUID
      const sessionToken = generateSessionToken(authResult);
      return _jsonResponse({ success: true, user: authResult, sessionToken: sessionToken });
    }
    
    // Validasi session token (UUID) untuk endpoint lainnya
    let verifiedUser;
    try {
      verifiedUser = validateSessionToken(token);
    } catch (authErr) {
      return _jsonResponse({ success: false, message: `Auth Error: ${authErr.message}`, needsRelogin: true });
    }

    // Set global user untuk digunakan oleh fungsi api_ yang memanggil requireRole()
    GAS_CURRENT_USER = verifiedUser;

    // === ROUTING ===
    switch (action) {
      case 'verifyToken':
        return _jsonResponse({ success: true, user: verifiedUser });

      case 'getCurrentUser':
        return _jsonResponse({ success: true, data: verifiedUser });

      case 'getDashboardData':
        return _jsonResponse(api_getDashboardData());

      case 'getFormDataJurnal':
        return _jsonResponse(api_getFormDataJurnal());

      case 'submitJurnal':
        return _jsonResponse(api_submitJurnal(payload));

      case 'submitAbsen':
        return _jsonResponse(api_submitAbsen(payload));

      case 'getJadwal':
        return _jsonResponse(_api_getJadwal());

      case 'getPerangkatData':
        return _jsonResponse(api_getPerangkatData());

      case 'updatePerangkat':
        return _jsonResponse(api_updatePerangkat(payload));

      case 'getTableData':
        return _jsonResponse(api_getTableData(payload.tableName));

      case 'saveRow':
        return _jsonResponse(api_saveRow(payload.tableName, payload.rowIndex, payload.rowArray));

      case 'deleteRow':
        return _jsonResponse(api_deleteRow(payload.tableName, payload.rowIndex));

      default:
        return _jsonResponse({ success: false, message: `Action tidak dikenal: ${action}` });
    }

  } catch (err) {
    Logger.log('doPost Error: ' + err.message);
    return _jsonResponse({ success: false, message: `Server Error: ${err.message}` });
  } finally {
    GAS_CURRENT_USER = null;
  }
}

/**
 * API tambahan: getJadwal
 */
function _api_getJadwal() {
  try {
    const user = requireRole(['guru', 'waka', 'kepsek']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheetJadwal = ss.getSheetByName(CONFIG.SHEET_NAMES.JADWAL);
    if (!sheetJadwal) return { success: false, message: 'Sheet jadwal tidak ditemukan.' };

    const dataJadwal = sheetJadwal.getDataRange().getValues();
    const head = dataJadwal[0];

    const idxGuru  = head.indexOf('id_guru');
    const idxKelas = head.indexOf('id_kelas');
    const idxMapel = head.indexOf('mapel');
    const idxHari  = head.indexOf('hari');
    const idxJam   = head.indexOf('jam_ke');

    const hariIni = getDayName(new Date());
    let jadwalKu = [], jadwalSemua = [];

    for (let i = 1; i < dataJadwal.length; i++) {
      const row = dataJadwal[i];
      const j = {
        id_guru: row[idxGuru], id_kelas: row[idxKelas],
        mapel: row[idxMapel], hari: row[idxHari], jam_ke: row[idxJam]
      };
      jadwalSemua.push(j);
      if (row[idxGuru] === user.id_guru) jadwalKu.push(j);
    }

    return { success: true, data: { hari: hariIni, jadwalKu, jadwalSemua } };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Helper: kembalikan response JSON
 */
function _jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * include() — dipertahankan untuk kompatibilitas
 */
function include(filename, data) {
  const template = HtmlService.createTemplateFromFile(filename);
  if (data) { for (let key in data) template[key] = data[key]; }
  return template.evaluate().getContent();
}
