/**
 * Auth.js — Autentikasi & Otorisasi (v2.0)
 *
 * Strategi Auth (TANPA Google Cloud Console):
 * - Login dilakukan via GAS doGet() yang memanfaatkan Session.getActiveUser()
 *   (Google handle auth-nya secara native — tidak perlu OAuth Client ID).
 * - GAS menghasilkan UUID token dan menyimpannya di PropertiesService dengan expiry.
 * - Frontend menyimpan token di sessionStorage dan mengirimnya di setiap API call.
 * - doPost() memvalidasi token via validateSessionToken().
 */

/**
 * Menghasilkan session token (UUID) untuk user yang sudah terverifikasi.
 * Token disimpan di PropertiesService dengan data user + waktu expiry.
 *
 * @param {object} user - user object yang sudah authorized
 * @returns {string} UUID token
 */
function generateSessionToken(user) {
  const token = Utilities.getUuid();
  const expiry = Date.now() + CONFIG.SESSION_DURATION_MS;

  const tokenData = {
    email:       user.email,
    role:        user.role,
    nama:        user.nama,
    id_guru:     user.id_guru,
    no_wa:       user.no_wa || '',
    authorized:  true,
    status_aktif: true,
    expiry:      expiry
  };

  // Simpan token di Script Properties
  const props = PropertiesService.getScriptProperties();
  props.setProperty(`sess_${token}`, JSON.stringify(tokenData));

  // Bersihkan token-token lama yang sudah expired (agar tidak menumpuk)
  _cleanupExpiredTokens(props);

  Logger.log(`Token dibuat untuk: ${user.email} | Expiry: ${new Date(expiry).toISOString()}`);
  return token;
}

/**
 * Memvalidasi UUID token dari request frontend.
 * Digunakan di setiap doPost() request.
 *
 * @param {string} token - UUID token dari frontend
 * @returns {object} user data
 * @throws Error jika token tidak valid atau sudah expired
 */
function validateSessionToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token tidak diberikan. Silakan login kembali.');
  }

  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(`sess_${token}`);

  if (!raw) {
    throw new Error('Sesi tidak valid atau sudah berakhir. Silakan login kembali melalui tombol Login.');
  }

  let tokenData;
  try {
    tokenData = JSON.parse(raw);
  } catch (e) {
    throw new Error('Data sesi korup. Silakan login kembali.');
  }

  // Cek expiry
  if (Date.now() > tokenData.expiry) {
    props.deleteProperty(`sess_${token}`);
    throw new Error('Sesi telah berakhir (lebih dari 8 jam). Silakan login kembali.');
  }

  return tokenData;
}

/**
 * Membersihkan token yang sudah expired dari PropertiesService.
 * Dipanggil otomatis saat generateSessionToken().
 */
function _cleanupExpiredTokens(props) {
  try {
    const allProps = props.getProperties();
    const now = Date.now();
    Object.keys(allProps).forEach(key => {
      if (key.startsWith('sess_')) {
        try {
          const data = JSON.parse(allProps[key]);
          if (now > data.expiry) props.deleteProperty(key);
        } catch (e) {
          props.deleteProperty(key); // hapus jika format rusak
        }
      }
    });
  } catch (e) {
    Logger.log('Cleanup tokens error (non-fatal): ' + e.message);
  }
}

/**
 * Mengambil informasi user yang sedang login via Session (untuk doGet fallback/legacy).
 * Mengembalikan object { email, role, nama, id_guru, authorized }
 */
function getCurrentUser() {
  const email = Session.getActiveUser().getEmail();
  if (!email) return { email: '', authorized: false, reason: 'Email tidak bisa dibaca. Pastikan Anda login dengan akun Google.' };

  return _findUserByEmail(email);
}

/**
 * Memverifikasi Google ID Token (JWT) yang dikirim dari Frontend (Google Identity Services)
 *
 * @param {string} idToken - JWT token dari GIS
 * @returns {object} { authorized, email, role, nama, dsb... }
 */
function verifyAndGetUser(idToken) {
  if (!idToken) return { authorized: false, reason: 'Token tidak valid (kosong)' };

  try {
    // Membaca isi JWT (Base64 decode) tanpa UrlFetchApp agar tidak butuh izin external_request
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      return { authorized: false, reason: 'Format token salah' };
    }

    // Decode payload (bagian kedua dari JWT)
    // Gunakan charset UTF-8 agar nama dengan karakter khusus tidak rusak
    const payloadRaw = Utilities.base64DecodeWebSafe(parts[1]);
    const payloadString = Utilities.newBlob(payloadRaw).getDataAsString();
    const payload = JSON.parse(payloadString);
    
    const email = payload.email;
    const emailVerified = payload.email_verified;

    if (!emailVerified) {
      return { authorized: false, reason: 'Email belum diverifikasi oleh Google' };
    }

    // Cari user di Master_Guru berdasarkan email
    return _findUserByEmail(email);

  } catch (e) {
    Logger.log('Error decode ID Token: ' + e.message);
    return { authorized: false, reason: 'Gagal membaca akun: ' + e.message };
  }
}

/**
 * Helper internal: cari user berdasarkan email di sheet Master_Guru
 */
function _findUserByEmail(email) {
  const defaultResp = { email: email, authorized: false };

  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheetGuru = ss.getSheetByName(CONFIG.SHEET_NAMES.GURU);
    if (!sheetGuru) return { ...defaultResp, reason: 'Database Master_Guru tidak ditemukan.' };

    const data = sheetGuru.getDataRange().getValues();
    const headers = data[0];

    const idxEmail  = headers.indexOf('email');
    const idxStatus = headers.indexOf('status_aktif');
    const idxRole   = headers.indexOf('role');
    const idxNama   = headers.indexOf('nama');
    const idxId     = headers.indexOf('id_guru');
    const idxWa     = headers.indexOf('no_wa');

    if (idxEmail === -1 || idxStatus === -1 || idxRole === -1) {
      return { ...defaultResp, reason: 'Kolom di Master_Guru tidak lengkap.' };
    }

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[idxEmail] && row[idxEmail].toString().toLowerCase() === email.toLowerCase()) {
        const isAktif = row[idxStatus] === true || row[idxStatus].toString().toLowerCase() === 'true';
        if (!isAktif) return { email, authorized: false, reason: 'Akun Anda tidak aktif. Hubungi Waka Kurikulum.' };

        return {
          email,
          authorized:   true,
          role:         row[idxRole],
          nama:         row[idxNama],
          id_guru:      row[idxId],
          no_wa:        idxWa > -1 ? row[idxWa] : '',
          status_aktif: true
        };
      }
    }

    return { email, authorized: false, reason: 'Email tidak terdaftar. Hubungi Waka Kurikulum untuk pendaftaran.' };

  } catch (e) {
    Logger.log('_findUserByEmail Error: ' + e.message);
    return { ...defaultResp, reason: 'Error sistem: ' + e.message };
  }
}

/**
 * Middleware validasi role server-side.
 * Mengutamakan GAS_CURRENT_USER (dari doPost) sebelum Session.
 *
 * @param {Array<string>} allowedRoles
 * @returns user object
 * @throws Error jika tidak punya akses
 */
function requireRole(allowedRoles) {
  const user = GAS_CURRENT_USER || getCurrentUser();

  if (!user || !user.authorized) {
    throw new Error('Anda tidak memiliki akses. Silakan login kembali.');
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`Akses ditolak: role "${user.role}" tidak diizinkan untuk operasi ini.`);
    }
  }

  return user;
}
