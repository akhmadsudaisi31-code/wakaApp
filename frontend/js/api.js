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

  /**
   * Fungsi inti: kirim request ke GAS backend.
   * @param {string} action  — nama fungsi di backend (tanpa prefix api_)
   * @param {object} payload — data yang dikirim ke fungsi tersebut
   */
  async function call(action, payload = {}) {
    if (!_token) throw new Error("Belum login. Token tidak tersedia.");

    const body = JSON.stringify({ action, token: _token, payload });

    const response = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      body: body
      // JANGAN set Content-Type: application/json — akan trigger CORS preflight
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
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
    submit: (payload) => call('submitAbsen', payload),
  };

  // === JADWAL ===
  const jadwal = {
    getData: () => call('getJadwal', {}),
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

  return { setToken, getToken, _devOverride, auth, dashboard, jurnal, absen, jadwal, perangkat, pkl, supervisi, master };
})();
