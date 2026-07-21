/**
 * app.js — Main Application Logic (v2.0)
 *
 * Alur Auth (TANPA Google Cloud Console):
 * 1. Halaman load → cek sessionStorage untuk token yang tersimpan
 * 2. Atau: cek URL params (?token=xxx) → berarti baru login dari GAS
 * 3. Jika ada token → verifikasi ke backend → tampilkan app
 * 4. Jika tidak ada → tampilkan tombol "Login via Google" (redirect ke GAS URL)
 */

const App = (() => {

  // === STATE ===
  let _user = null;
  let _currentPage = null;
  const SESSION_KEY = 'waka_session_token';

  // === NAVIGASI CONFIG PER ROLE ===
  // Semua menu yang muncul di SIDEBAR per role
  const NAV_ITEMS = {
    guru:   ['home', 'jadwal', 'jurnal', 'absen', 'perangkat', 'pkl'],
    waka:   ['home', 'jadwal', 'jurnal', 'absen', 'perangkat', 'pkl', 'supervisi', 'master'],
    kepsek: ['home', 'jadwal', 'perangkat', 'supervisi', 'master'],
  };

  // 4 item yang SELALU tampil di mobile bottom bar (sama untuk semua role)
  const BOTTOM_NAV_ITEMS = ['home', 'jadwal', 'jurnal', 'absen'];

  const PAGE_META = {
    home:      { label: 'Beranda',      icon: 'fa-solid fa-house',            module: DashboardPage },
    jadwal:    { label: 'Jadwal',       icon: 'fa-regular fa-calendar-check', module: JadwalPage    },
    jurnal:    { label: 'E-Jurnal',     icon: 'fa-solid fa-book-open',        module: EJurnalPage   },
    absen:     { label: 'Absensi',      icon: 'fa-solid fa-camera-retro',     module: AbsenPage     },
    perangkat: { label: 'Perangkat',    icon: 'fa-solid fa-folder-open',      module: PerangkatPage },
    pkl:       { label: 'Jurnal PKL',   icon: 'fa-solid fa-briefcase',        module: PKLPage       },
    supervisi: { label: 'Supervisi',    icon: 'fa-solid fa-clipboard-check',  module: SupervisiPage },
    master:    { label: 'Data Master',  icon: 'fa-solid fa-database',         module: MasterPage    },
  };

  // === INIT ===
  function init() {
    // === DEV MODE ===
    if (CONFIG.DEV_MODE) {
      console.warn('⚠️ DEV MODE aktif. Matikan CONFIG.DEV_MODE sebelum deploy ke produksi.');
      document.getElementById('dev-login-panel').style.display = 'block';
      document.querySelector('.login-divider span').textContent = '🛠️ Mode Development';
      // btn-google-login tetap display:none (sudah di HTML)
      return;
    }

    // === PRODUCTION MODE — tampilkan tombol Google ===
    // Pastikan GIS sudah dimuat
    if (typeof google === 'undefined') {
      console.error('Google Identity Services gagal dimuat.');
      return;
    }

    google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
      document.getElementById('google-login-container'),
      { theme: 'outline', size: 'large', width: '100%' }
    );
    
    // google.accounts.id.prompt(); // Opsional: Tampilkan One Tap prompt

    // Cek apakah ada token yang tersimpan di sesi sebelumnya
    const savedToken = sessionStorage.getItem(SESSION_KEY);
    if (savedToken) {
      showLoading('Memverifikasi sesi...');
      API.setToken(savedToken);
      API.auth.verify()
        .then(res => {
          hideLoading();
          if (res.success) {
            _user = res.user;
            _renderApp();
            toast('success', `Selamat datang kembali, ${_user.nama}!`);
          } else {
            sessionStorage.removeItem(SESSION_KEY);
          }
        })
        .catch(err => {
          hideLoading();
          sessionStorage.removeItem(SESSION_KEY);
        });
    }
  }

  // === HANDLER OAUTH GOOGLE ===
  function handleCredentialResponse(response) {
    showLoading('Sedang masuk...');
    // response.credential adalah JWT Token dari Google
    const jwtToken = response.credential;
    
    // Kirim JWT token ke GAS untuk diverifikasi dan ditukar dengan akses
    API.setToken(jwtToken);
    API.auth.loginWithGoogle(jwtToken)
      .then(res => {
        hideLoading();
        if (res.success) {
          _user = res.user;
          // Simpan token aplikasi (UUID dari GAS) bukan JWT-nya
          sessionStorage.setItem(SESSION_KEY, res.sessionToken);
          API.setToken(res.sessionToken);
          
          _renderApp();
          toast('success', `Selamat datang, ${_user.nama}!`);
        } else {
          toast('error', res.message || 'Akses ditolak.');
          API.setToken(null);
        }
      })
      .catch(err => {
        hideLoading();
        toast('error', 'Gagal menghubungi server: ' + err.message);
        console.error("Login catch error:", err);
        API.setToken(null);
      });
  }

  // === DEV LOGIN (hanya untuk DEV_MODE) ===
  async function devLogin(role) {
    showLoading(`Login sebagai ${role}...`);
    try {
      const res = await MockAPI.auth.getCurrentUser(role);
      _user = res.data;

      // Override API calls dengan MockAPI saat DEV_MODE
      API._devOverride(role);

      hideLoading();
      _renderApp();
      toast('info', `[DEV] Login sebagai ${_user.nama} (${role})`);
    } catch (err) {
      hideLoading();
      toast('error', 'Dev login gagal: ' + err.message);
    }
  }


  function _showLoginError(msg) {
    const errEl   = document.getElementById('login-error-msg');
    const errText = document.getElementById('login-error-text');
    if (errEl && errText) {
      errText.textContent = msg;
      errEl.style.display = 'flex';
    }
  }

  // === REDIRECT KE GAS UNTUK LOGIN ===
  function redirectToGASLogin() {
    // Simpan URL saat ini agar GAS tau ke mana harus redirect (opsional, sudah ada di Config GAS)
    showLoading('Mengarahkan ke halaman login Google...');
    // Redirect ke GAS URL — GAS akan handle auth via Session, lalu redirect balik ke Netlify
    window.location.href = CONFIG.GAS_URL;
  }

  // === LOGOUT ===
  function logout() {
    if (!confirm('Yakin ingin keluar?')) return;
    sessionStorage.removeItem(SESSION_KEY);
    API.setToken(null);
    _user = null;
    _currentPage = null;

    document.getElementById('app-shell').classList.add('hidden');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-error-msg').style.display = 'none';
    toast('info', 'Anda telah keluar dari aplikasi.');
  }

  // === RENDER APP ===
  function _renderApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-shell').classList.remove('hidden');

    _renderNav();
    _renderUserInfo();
    navigateTo('home');
  }

  function _renderNav() {
    const allowedPages  = NAV_ITEMS[_user.role] || ['home'];
    const desktopNav    = document.getElementById('nav-items');
    const mobileNav     = document.getElementById('mobile-bottom-nav');

    desktopNav.innerHTML = '';
    mobileNav.innerHTML  = '';

    // --- SIDEBAR: semua menu sesuai role ---
    allowedPages.forEach(pageId => {
      const meta = PAGE_META[pageId];
      if (!meta) return;

      const di = document.createElement('div');
      di.className = 'nav-item';
      di.id = `nav-desktop-${pageId}`;
      di.innerHTML = `<i class="${meta.icon}"></i><span>${meta.label}</span>`;
      di.onclick = () => navigateTo(pageId);
      desktopNav.appendChild(di);
    });

    // --- BOTTOM BAR MOBILE: hanya 4 menu utama ---
    BOTTOM_NAV_ITEMS.forEach(pageId => {
      const meta = PAGE_META[pageId];
      if (!meta) return;

      const mi = document.createElement('div');
      mi.className = 'mobile-nav-item';
      mi.id = `nav-mobile-${pageId}`;
      mi.innerHTML = `<i class="${meta.icon}"></i><span>${meta.label}</span>`;
      mi.onclick = () => navigateTo(pageId);
      mobileNav.appendChild(mi);
    });
  }

  function _renderUserInfo() {
    const initials  = _user.nama ? _user.nama.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase() : '?';
    const roleLabel = { guru: 'Guru', waka: 'Waka Kurikulum', kepsek: 'Kepala Sekolah' }[_user.role] || _user.role;

    document.getElementById('nav-user-info').innerHTML = `
      <div class="nav-user-avatar">${initials}</div>
      <div class="nav-user-info">
        <div class="nav-user-name">${_user.nama}</div>
        <div class="nav-user-role">${roleLabel}</div>
      </div>
    `;
    document.getElementById('mobile-user-avatar').textContent = initials;
  }

  // === NAVIGATION ===
  function navigateTo(pageId) {
    const meta = PAGE_META[pageId];
    if (!meta) return;

    if (_currentPage?.destroy) _currentPage.destroy();

    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => el.classList.remove('active'));
    const desktopEl = document.getElementById(`nav-desktop-${pageId}`);
    const mobileEl  = document.getElementById(`nav-mobile-${pageId}`);
    if (desktopEl) desktopEl.classList.add('active');
    if (mobileEl)  mobileEl.classList.add('active');

    document.getElementById('mobile-page-title').textContent = meta.label;

    const container = document.getElementById('page-container');
    container.innerHTML = '';
    container.className = 'page-container page-enter';

    if (meta.module) {
      _currentPage = meta.module;
      meta.module.render(container, _user);
    } else {
      container.innerHTML = `
        <div class="page-header"><h2>${meta.label}</h2></div>
        <div class="card">
          <div class="empty-state">
            <i class="fa-solid fa-wrench"></i>
            <p>Halaman ini sedang dalam pengembangan.</p>
          </div>
        </div>
      `;
    }

    // Tutup sidebar mobile setelah navigasi
    _closeSidebar();

    window.scrollTo(0, 0);
  }

  function getUser() { return _user; }

  // === SIDEBAR MOBILE TOGGLE ===
  function toggleSidebar() {
    const nav     = document.getElementById('app-nav');
    const overlay = document.getElementById('sidebar-overlay');
    const isOpen  = nav.classList.contains('sidebar-open');
    if (isOpen) {
      nav.classList.remove('sidebar-open');
      overlay.classList.remove('active');
    } else {
      nav.classList.add('sidebar-open');
      overlay.classList.add('active');
    }
  }

  function _closeSidebar() {
    document.getElementById('app-nav')?.classList.remove('sidebar-open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
  }

  // === LOADING ===
  function showLoading(text = 'Memuat...') {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').classList.remove('hidden');
  }

  function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
  }

  // === TOAST ===
  function toast(type, message, duration = 4000) {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = '0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  return { init, devLogin, logout, navigateTo, getUser, toggleSidebar, showLoading, hideLoading, toast };
})();

// === INIT ===
document.addEventListener('DOMContentLoaded', () => App.init());

// Expose toast globally for page modules
function toast(type, msg) { App.toast(type, msg); }
