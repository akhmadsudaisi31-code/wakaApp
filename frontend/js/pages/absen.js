/**
 * absen.js — Halaman Absensi Wajah (Selfie)
 *
 * FIX UTAMA: getUserMedia() sekarang bekerja karena halaman ini diakses
 * dari domain HTTPS yang valid (Netlify/Vercel), bukan dari dalam
 * iframe GAS (script.google.com) yang diblokir browser modern.
 */

const AbsenPage = (() => {

  let _stream = null;
  let _videoEl = null;
  let _canvasEl = null;
  let _mode = 'live'; // 'live' | 'upload'
  let _fallbackBase64 = null;

  // === RENDER ===
  function render(container, user) {
    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fa-solid fa-camera-retro" style="font-size:1.4rem;"></i> Absensi Harian</h2>
        <p>Rekam kehadiran Anda dengan foto selfie</p>
      </div>

      <div style="max-width: 480px; margin: 0 auto;">
        <!-- Mode Selector (Hanya Kamera Langsung) -->
        <div class="camera-mode-tabs" style="display: none;">
          <div class="camera-mode-tab active" id="tab-live">
            <i class="fa-solid fa-video"></i> Kamera Langsung
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fa-solid fa-user-check"></i>
              Selfie Kehadiran
            </div>
            <span class="badge badge-primary">${_getTodayStr()}</span>
          </div>

          <!-- LIVE CAMERA MODE -->
          <div id="absen-live-mode">
            <div class="camera-container">
              <div class="camera-preview" id="camera-preview">
                <div class="camera-placeholder" id="camera-placeholder">
                  <i class="fa-solid fa-camera" style="color: var(--text-muted);"></i>
                  <p>Memuat kamera...</p>
                </div>
                <video id="absen-video" autoplay playsinline muted style="display:none; width:100%; height:100%; object-fit:cover; transform:scaleX(-1);"></video>
                <canvas id="absen-canvas" style="display:none;"></canvas>
                <div class="camera-overlay" id="camera-overlay" style="display:none;">
                  <div class="face-guide"></div>
                </div>
              </div>
            </div>
            <p style="text-align:center; font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">
              <i class="fa-solid fa-circle-info"></i>
              Arahkan wajah ke dalam lingkaran panduan
            </p>
          </div>

          <!-- Error Alert -->
          <div id="camera-error-alert" class="alert alert-warning" style="display:none;">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div>
              <strong>Kamera tidak dapat diakses.</strong>
              <span id="camera-error-detail"> Gunakan mode "Pilih Foto" untuk melanjutkan.</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="absen-buttons">
            <button class="btn-absen-masuk" id="btn-masuk" onclick="AbsenPage._submitAbsen('Masuk')">
              <i class="fa-solid fa-right-to-bracket"></i> Absen Masuk
            </button>
            <button class="btn-absen-pulang" id="btn-pulang" onclick="AbsenPage._submitAbsen('Pulang')">
              <i class="fa-solid fa-house-user"></i> Absen Pulang
            </button>
          </div>

          <!-- Status Message -->
          <div id="absen-status" class="absen-status"></div>
        </div>

        <!-- Info Card -->
        <div class="card">
          <div class="card-title" style="margin-bottom:12px;">
            <i class="fa-solid fa-circle-info"></i> Informasi
          </div>
          <ul style="font-size:0.85rem; color:var(--text-secondary); padding-left:20px; line-height:2;">
            <li>Foto akan disimpan otomatis ke Google Drive sekolah</li>
            <li>Absen Masuk dilakukan sebelum jam pelajaran pertama</li>
            <li>Absen Pulang dilakukan setelah jam pelajaran selesai</li>
            <li>Pastikan wajah terlihat jelas dan pencahayaan cukup</li>
          </ul>
        </div>
      </div>
    `;

    _videoEl = document.getElementById('absen-video');
    _canvasEl = document.getElementById('absen-canvas');

    // Mulai kamera secara otomatis
    _initCamera();
  }

  // === INISIALISASI KAMERA ===
  async function _initCamera() {
    const placeholder = document.getElementById('camera-placeholder');
    const overlay = document.getElementById('camera-overlay');
    const errorAlert = document.getElementById('camera-error-alert');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      _showCameraError('Browser Anda tidak mendukung akses kamera langsung.');
      return;
    }

    placeholder.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><p>Memulai kamera...</p>`;

    try {
      _stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });

      _videoEl.srcObject = _stream;
      _videoEl.style.display = 'block';
      placeholder.style.display = 'none';
      overlay.style.display = 'flex';
      errorAlert.style.display = 'none';

    } catch (err) {
      let detail = '';
      if (err.name === 'NotAllowedError') detail = 'Akses kamera ditolak. Izinkan akses kamera di pengaturan browser Anda.';
      else if (err.name === 'NotFoundError') detail = 'Tidak ada kamera yang terdeteksi di perangkat ini.';
      else detail = err.message;

      _showCameraError(detail);
    }
  }

  function _showCameraError(detail) {
    const errorAlert = document.getElementById('camera-error-alert');
    const placeholder = document.getElementById('camera-placeholder');
    document.getElementById('camera-error-detail').textContent = ' ' + detail;
    errorAlert.style.display = 'flex';
    placeholder.innerHTML = `<i class="fa-solid fa-video-slash" style="color:var(--danger);"></i><p style="color:var(--danger);">Kamera tidak tersedia</p>`;
    // Tidak pindah ke mode upload karena sudah dihapus
    // _switchMode('upload');
  }

  // === SWITCH MODE ===
  function _switchMode(mode) {
    _mode = mode;
  }

  // === FILE SELECT (Mode Upload) ===
  async function _onFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      // Kompresi gambar sebelum disimpan ke state
      _setStatus('Mengompresi foto...', 'processing');
      _fallbackBase64 = await _compressImage(e.target.result);

      const previewImg  = document.getElementById('upload-preview-img');
      const placeholder = document.getElementById('upload-placeholder');
      previewImg.src = _fallbackBase64;
      previewImg.style.display = 'block';
      placeholder.style.display = 'none';

      // Tampilkan estimasi ukuran file
      const sizeKB = Math.round((_fallbackBase64.length * 3 / 4) / 1024);
      _setStatus(`Foto siap (${sizeKB} KB). Klik tombol Absen Masuk atau Absen Pulang.`, 'processing');
    };
    reader.readAsDataURL(file);
  }

  // === AMBIL FOTO DARI VIDEO ===
  function _captureFromVideo() {
    if (!_stream || !_videoEl.videoWidth) return null;

    // Kompresi: batasi dimensi maksimal 800px
    const MAX_DIM = 800;
    let w = _videoEl.videoWidth;
    let h = _videoEl.videoHeight;
    if (w > MAX_DIM || h > MAX_DIM) {
      if (w > h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
      else        { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
    }

    _canvasEl.width  = w;
    _canvasEl.height = h;
    const ctx = _canvasEl.getContext('2d');
    // Mirror agar hasil foto sama dengan preview (seperti cermin)
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(_videoEl, 0, 0, w, h);
    // Kualitas 0.65 = kompres ~60-70% lebih kecil dari original
    return _canvasEl.toDataURL('image/jpeg', 0.65);
  }

  /**
   * Kompres gambar dari file upload via Canvas.
   * @param {string} dataUrl - Data URL original dari FileReader
   * @returns {Promise<string>} Data URL yang sudah dikompresi
   */
  function _compressImage(dataUrl) {
    return new Promise((resolve) => {
      const MAX_DIM = 800;
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
          else        { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
        }
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.onerror = () => resolve(dataUrl); // fallback: kirim original
      img.src = dataUrl;
    });
  }

  // === HELPER JARAK (Haversine Formula) ===
  function _getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radius bumi dalam meter
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // jarak dalam meter
  }

  function _checkLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Browser Anda tidak mendukung GPS / Geolocation.'));
      }
      
      _setStatus('Mengecek lokasi Anda...', 'processing');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          let isAllowed = false;
          let allowedLocationName = '';
          let nearestDistance = Infinity;

          for (const loc of CONFIG.ALLOWED_LOCATIONS) {
            const dist = _getDistance(userLat, userLng, loc.lat, loc.lng);
            if (dist < nearestDistance) nearestDistance = dist;
            
            if (dist <= loc.radius) {
              isAllowed = true;
              allowedLocationName = loc.name;
              break; // Cukup 1 lokasi yang match
            }
          }

          if (isAllowed) {
            resolve({ success: true, name: allowedLocationName });
          } else {
            reject(new Error(`Anda berada di luar area absen. Jarak terdekat: ${Math.round(nearestDistance)} meter dari area diizinkan.`));
          }
        },
        (error) => {
          let msg = 'Gagal mengambil lokasi.';
          if (error.code === 1) msg = 'Akses lokasi (GPS) ditolak. Izinkan GPS untuk absen.';
          if (error.code === 2) msg = 'Lokasi tidak tersedia (Sinyal GPS lemah).';
          if (error.code === 3) msg = 'Waktu permintaan lokasi habis (Timeout).';
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  // === SUBMIT ABSEN ===
  async function _submitAbsen(jenis) {
    const btnMasuk  = document.getElementById('btn-masuk');
    const btnPulang = document.getElementById('btn-pulang');
    btnMasuk.disabled = btnPulang.disabled = true;

    try {
      // 1. Cek Lokasi Dulu (Geofencing)
      if (CONFIG.ALLOWED_LOCATIONS && CONFIG.ALLOWED_LOCATIONS.length > 0) {
        await _checkLocation();
      }

      // 2. Ambil Foto
      let finalBase64 = null;

    if (_mode === 'upload') {
      if (!_fallbackBase64) {
        toast('warning', 'Silakan ambil atau pilih foto selfie terlebih dahulu!');
        return;
      }
      finalBase64 = _fallbackBase64;
    } else {
      if (!_stream) {
        toast('warning', 'Kamera belum siap. Coba mode "Pilih Foto".');
        return;
      }
      finalBase64 = _captureFromVideo();
      if (!finalBase64) {
        toast('warning', 'Gagal mengambil gambar dari kamera. Coba lagi.');
        return;
      }
    }

      _setStatus(`Memproses absen ${jenis}... harap tunggu.`, 'processing');

      const res = await API.absen.submit({ jenis, foto: finalBase64 });

      if (res.success) {
        _setStatus(`✅ Absen ${jenis} berhasil dicatat pada ${new Date().toLocaleTimeString('id-ID')}!`, 'success');
        toast('success', `Absen ${jenis} berhasil disimpan!`);

        // Reset upload state
        if (_mode === 'upload') {
          _fallbackBase64 = null;
          document.getElementById('upload-preview-img').style.display = 'none';
          document.getElementById('upload-placeholder').style.display = 'flex';
          document.getElementById('absen-file-input').value = '';
        }
      } else {
        _setStatus(`❌ Gagal: ${res.message}`, 'error');
        toast('error', `Gagal: ${res.message}`);
      }
    } catch (err) {
      _setStatus(`❌ Error: ${err.message}`, 'error');
      toast('error', `Terjadi kesalahan: ${err.message}`);
    } finally {
      btnMasuk.disabled = btnPulang.disabled = false;
    }
  }

  function _setStatus(msg, type) {
    const el = document.getElementById('absen-status');
    el.textContent = msg;
    el.className = `absen-status show ${type}`;
  }

  // === CLEANUP ===
  function destroy() {
    if (_stream) {
      _stream.getTracks().forEach(track => track.stop());
      _stream = null;
    }
  }

  function _getTodayStr() {
    return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  return { render, destroy, _switchMode, _onFileSelect, _submitAbsen };
})();
