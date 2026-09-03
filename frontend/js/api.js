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
    jurnal.getRiwayat        = () => MockAPI.jurnal.getRiwayat();
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

  // Cache dengan TTL (Time To Live) dan Stale-While-Revalidate
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Menit cache
  let _memoryCache = {};

  /** Bersihkan semua cache */
  function clearCache() { 
    _memoryCache = {}; 
    try {
      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith('api_cache_')) sessionStorage.removeItem(k);
      });
    } catch(e) {}
  }

  /**
   * Fungsi inti: kirim request ke GAS backend.
   * Dilengkapi Stale-While-Revalidate (SWR) agar navigasi menu instan tanpa loading lama.
   */
  async function call(action, payload = {}, forceRefresh = false) {
    if (!_token) throw new Error("Belum login. Token tidak tersedia.");

    const isGet = action.startsWith('get');
    const cacheKey = 'api_cache_' + action + '_' + JSON.stringify(payload);
    const now = Date.now();

    // 1. Cek Memory Cache & SessionStorage untuk GET request
    if (isGet && !forceRefresh) {
      let cached = _memoryCache[cacheKey];
      if (!cached) {
        try {
          const stored = sessionStorage.getItem(cacheKey);
          if (stored) cached = JSON.parse(stored);
        } catch (e) {}
      }

      if (cached) {
        // Jika data masih fresh (< 5 menit), langsung return seketika (0ms delay!)
        if (now - cached.timestamp < CACHE_TTL_MS) {
          return cached.data;
        }
      }
    }

    // 2. Jika mutasi data (submit/save/delete), bersihkan cache agar data terbaru selalu tampil
    if (!isGet && action !== 'verifyToken' && action !== 'loginWithGoogle') {
      clearCache();
    }

    const body = JSON.stringify({ action, token: _token, payload });

    const fetchPromise = fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: body
    }).then(async response => {
      if (!response.ok) throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      const json = await response.json();
      
      // Simpan hasil ke cache jika request sukses
      if (isGet && json && json.success) {
        const cacheEntry = { timestamp: Date.now(), data: json };
        _memoryCache[cacheKey] = cacheEntry;
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        } catch (e) {}
      }
      return json;
    });

    try {
      return await fetchPromise;
    } catch (err) {
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
    getRiwayat: () => call('getRiwayatJurnal', {}),
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
