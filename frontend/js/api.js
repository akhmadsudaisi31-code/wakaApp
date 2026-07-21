/**
 * api.js — Klien API untuk berkomunikasi dengan GAS Backend
 * Saat CONFIG.DEV_MODE = true, semua calls di-override oleh MockAPI.
 */

const API = (() => {

  /** Token Google ID saat ini (diisi oleh auth.js) */
  let _token = null;

  /** Set token setelah login GAS berhasil */
  function setToken(token) { _token = token; }

  /** Ambil token saat ini */
  function getToken() { return _token; }

  /**
   * Override semua API calls dengan MockAPI untuk testing lokal.
   */
  function _devOverride(role = 'waka') {
    auth.verify              = () => MockAPI.auth.verify();
    auth.loginWithGoogle     = (jwtToken) => MockAPI.auth.loginWithGoogle(jwtToken);
    dashboard.getData        = () => MockAPI.dashboard.getData(role);
    jurnal.getFormData       = () => MockAPI.jurnal.getFormData();
    jurnal.submit            = (p) => MockAPI.jurnal.submit(p);
    absen.getLocations       = () => MockAPI.absen.getLocations();
    absen.getStatusHariIni   = () => MockAPI.absen.getStatusHariIni();
    absen.submit             = (p) => MockAPI.absen.submit(p);
    jadwal.getData           = () => MockAPI.jadwal.getData();
    perangkat.getData        = () => MockAPI.perangkat.getData();
    perangkat.update         = (p) => MockAPI.perangkat.update(p);
    pkl.getData              = () => MockAPI.pkl.getData();
    pkl.submit               = (p) => MockAPI.pkl.submit(p);
    supervisi.getData        = () => MockAPI.supervisi.getData();
    supervisi.submit         = (p) => MockAPI.supervisi.submit(p);
    master.getTableData      = (t) => MockAPI.master.getTableData(t);
    master.saveRow           = (t, i, r) => MockAPI.master.saveRow({ tableName: t, rowIndex: i, rowArray: r });
    master.deleteRow         = (t, i) => MockAPI.master.deleteRow({ tableName: t, rowIndex: i });
    console.log(`[DEV] API di-override dengan MockAPI (role: ${role})`);
  }

  let _cache = {};

  /** Bersihkan semua cache */
  function clearCache() { _cache = {}; }

  /**
   * Fungsi inti: kirim request ke GAS backend.
   * @param {string} action  — nama fungsi di backend (tanpa prefix api_)
   * @param {object} payload — data yang dikirim ke fungsi tersebut
   * @param {boolean} forceRefresh — paksa ambil dari server
   */
  async function call(action, payload = {}, forceRefresh = false) {
    if (!_token) throw new Error("Belum login. Token tidak tersedia.");

    const isGet = action.startsWith('get');
    const cacheKey = action + '_' + JSON.stringify(payload);

    // 1. Cek Cache untuk request GET
    if (isGet && !forceRefresh && _cache[cacheKey]) {
      return _cache[cacheKey]; // Return promise/data yang sudah ada
    }

    // 2. Jika ini mutasi (save, submit, delete, dll), bersihkan cache agar fresh
    if (!isGet && action !== 'verifyToken' && action !== 'loginWithGoogle') {
      clearCache();
    }

    const body = JSON.stringify({ action, token: _token, payload });

    const fetchPromise = fetch(CONFIG.GAS_URL, {
      method: 'POST',
      body: body
    }).then(async response => {
      if (!response.ok) throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      return await response.json();
    });

    // 3. Simpan promise ke cache agar request bersamaan tidak dobel
    if (isGet) {
      _cache[cacheKey] = fetchPromise;
    }

    try {
      return await fetchPromise;
    } catch (err) {
      if (isGet) delete _cache[cacheKey]; // Hapus cache jika gagal
      throw err;
    }
  }

  // === AUTH ===
  const auth = {
    verify: () => call('verifyToken', {}),
    loginWithGoogle: (jwtToken) => call('loginWithGoogle', { jwtToken })
  };

  // === DASHBOARD ===
  const dashboard = {
    getData: () => call('getDashboardData', {}),
  };

  // === E-JURNAL ===
  const jurnal = {
    getFormData: () => call('getFormDataJurnal', {}),
    submit: (payload) => call('submitJurnal', payload),
  };

  // === ABSENSI ===
  const absen = {
    getLocations: () => call('getLokasiAbsen'),
    getStatusHariIni: () => call('getAbsenHariIni'),
    submit: (payload) => call('submitAbsen', payload),
  };

  // === JADWAL ===
  const jadwal = {
    getData: () => call('getJadwal', {}),
    save   : (payload) => call('saveJadwal', payload),
  };

  // === PERANGKAT AJAR ===
  const perangkat = {
    getData: () => call('getPerangkatData', {}),
    update: (payload) => call('updatePerangkat', payload),
  };

  // === MASTER DATA ===
  const master = {
    getTableData: (tableName) => call('getTableData', { tableName }),
    saveRow: (tableName, rowIndex, rowArray) => call('saveRow', { tableName, rowIndex, rowArray }),
    deleteRow: (tableName, rowIndex) => call('deleteRow', { tableName, rowIndex }),
  };



  // === PKL ===
  const pkl = {
    getData: () => call('getPKLData', {}),
    submit: (payload) => call('submitPKL', payload),
  };

  // === SUPERVISI ===
  const supervisi = {
    getData: () => call('getSupervisiData', {}),
    submit: (payload) => call('submitSupervisi', payload),
  };

  return { setToken, getToken, clearCache, _devOverride, auth, dashboard, jurnal, absen, jadwal, perangkat, pkl, supervisi, master };
})();
