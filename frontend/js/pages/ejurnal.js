/**
 * ejurnal.js — Halaman Form E-Jurnal Mengajar Harian
 */

const EJurnalPage = (() => {

  let _masterData = null;
  let _currentJadwalList = [];
  let _atpData = [];
  let _activeTab = 'form';
  let _riwayatList = [];

  function render(container, user) {
    container.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
        <div>
          <h2><i class="fa-solid fa-book-open" style="font-size:1.4rem; color:var(--green);"></i> E-Jurnal Mengajar</h2>
          <p>Catat kegiatan pembelajaran harian dan pantau riwayat jurnal</p>
        </div>
      </div>

      <!-- Tab Navigasi: Form vs Riwayat -->
      <div class="page-tabs">
        <button class="page-tab-btn active" id="tab-btn-form" onclick="EJurnalPage.switchTab('form')">
          <i class="fa-solid fa-pen-to-square"></i> Form Input Jurnal
        </button>
        <button class="page-tab-btn" id="tab-btn-riwayat" onclick="EJurnalPage.switchTab('riwayat')">
          <i class="fa-solid fa-clock-rotate-left"></i> Riwayat Jurnal
        </button>
      </div>

      <!-- TAB 1: FORM INPUT JURNAL -->
      <div id="pane-jurnal-form">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <i class="fa-solid fa-feather-pointed"></i> Form Pengisian Jurnal
            </div>
            <span class="badge badge-primary" id="jur-hari-badge">Memuat...</span>
          </div>

          <div id="jurnal-loading-state">
            ${[1,2,3].map(() => `<div class="skeleton skeleton-text" style="margin-bottom:14px; height:40px;"></div>`).join('')}
          </div>

          <form id="form-jurnal" style="display:none;" onsubmit="EJurnalPage._handleSubmit(event)">

            <!-- Checkbox: Guru Pengganti (Inval) -->
            <div class="form-group">
              <label class="form-check" for="jur_is_inval">
                <input type="checkbox" id="jur_is_inval" onchange="EJurnalPage._toggleInval(this.checked)">
                <div>
                  <strong class="form-check-label">Saya adalah Guru Pengganti (Inval)</strong>
                  <span class="form-check-hint">Centang jika hari ini menggantikan jam mengajar guru lain.</span>
                </div>
              </label>
            </div>

            <!-- Pilih Jadwal Kelas -->
            <div class="form-group">
              <label class="form-label" for="jur_jadwal">Kelas & Mapel <span class="required">*</span></label>
              <select id="jur_jadwal" class="form-control" required onchange="EJurnalPage._onJadwalSelect()">
                <option value="">-- Pilih Jadwal --</option>
              </select>
              <p id="jur-no-jadwal-msg" style="display:none; font-size:0.82rem; color:var(--text-muted); margin-top:6px;">
                <i class="fa-solid fa-circle-info"></i> Tidak ada jadwal untuk hari ini.
              </p>
            </div>

            <!-- Materi ATP -->
            <div class="form-group">
              <label class="form-label" for="jur_atp">Materi Pembelajaran (Berdasarkan ATP)</label>
              <select id="jur_atp" class="form-control" onchange="EJurnalPage._onAtpChange()">
                <option value="">-- Pilih Materi ATP --</option>
              </select>
            </div>

            <!-- Materi Bebas / Topik Tambahan -->
            <div class="form-group" id="div-materi-bebas" style="display:none;">
              <label class="form-label" for="jur_materi_bebas">Topik / Bahasan Materi (Lainnya)</label>
              <input type="text" id="jur_materi_bebas" class="form-control" placeholder="Contoh: Pembahasan Soal Try Out / Praktikum Khusus">
            </div>

            <!-- Kehadiran Siswa -->
            <div class="form-group">
              <label class="form-label">Presensi Kehadiran Siswa <span class="required">*</span></label>
              <div class="form-row">
                <div>
                  <label class="form-label" for="jur_hadir" style="font-size:0.8rem; color:var(--success);">
                    <i class="fa-solid fa-circle-check"></i> Hadir
                  </label>
                  <input type="number" id="jur_hadir" class="form-control" min="0" value="0" required>
                </div>
                <div>
                  <label class="form-label" for="jur_sakit" style="font-size:0.8rem; color:var(--info);">
                    <i class="fa-solid fa-hospital"></i> Sakit
                  </label>
                  <input type="number" id="jur_sakit" class="form-control" min="0" value="0" required>
                </div>
                <div>
                  <label class="form-label" for="jur_izin" style="font-size:0.8rem; color:var(--warning);">
                    <i class="fa-solid fa-file-circle-check"></i> Izin
                  </label>
                  <input type="number" id="jur_izin" class="form-control" min="0" value="0" required>
                </div>
                <div>
                  <label class="form-label" for="jur_alpa" style="font-size:0.8rem; color:var(--danger);">
                    <i class="fa-solid fa-circle-xmark"></i> Alpa
                  </label>
                  <input type="number" id="jur_alpa" class="form-control" min="0" value="0" required>
                </div>
              </div>
            </div>

            <!-- Link Dokumentasi / Foto Kegiatan -->
            <div class="form-group">
              <label class="form-label" for="jur_link_dok">
                <i class="fa-solid fa-camera" style="color:var(--green);"></i> Link Foto Kegiatan / Dokumentasi KBM (Opsional)
              </label>
              <input type="url" id="jur_link_dok" class="form-control" placeholder="https://drive.google.com/... atau link foto online">
              <span style="display:block; font-size:0.75rem; color:var(--text-muted); margin-top:3px;">
                Unggah foto ke Google Drive atau penyimpanan cloud, lalu cantumkan link publiknya di sini.
              </span>
            </div>

            <!-- Catatan Kendala KBM -->
            <div class="form-group">
              <label class="form-label" for="jur_kendala">
                <i class="fa-regular fa-message"></i> Catatan Pelaksanaan & Kendala KBM (Opsional)
              </label>
              <textarea id="jur_kendala" class="form-control" rows="3" placeholder="Tuliskan kendala selama KBM, catatan kemajuan siswa, atau hal lainnya..."></textarea>
            </div>

            <button type="submit" id="btn-submit-jurnal" class="btn btn-primary btn-full btn-lg">
              <i class="fa-solid fa-floppy-disk"></i> Simpan E-Jurnal
            </button>
          </form>

          <div id="jurnal-error-state" style="display:none;">
            <div class="alert alert-danger">
              <i class="fa-solid fa-circle-exclamation"></i>
              <span id="jurnal-error-msg">Gagal memuat data.</span>
            </div>
            <button class="btn btn-outline" onclick="EJurnalPage._loadFormData()">
              <i class="fa-solid fa-rotate-right"></i> Coba Lagi
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 2: RIWAYAT JURNAL -->
      <div id="pane-jurnal-riwayat" style="display:none;">
        <div class="card">
          <div class="card-header" style="flex-wrap:wrap; gap:8px;">
            <div class="card-title">
              <i class="fa-solid fa-list-check"></i> Riwayat Pengisian Jurnal
            </div>
            <button class="btn btn-outline btn-sm" onclick="EJurnalPage._loadRiwayatData()">
              <i class="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>

          <div id="riwayat-loading-state" style="display:none;">
            ${[1,2,3].map(() => `<div class="skeleton skeleton-text" style="margin-bottom:10px; height:48px;"></div>`).join('')}
          </div>

          <div id="riwayat-empty-state" class="empty-state" style="display:none;">
            <i class="fa-solid fa-book-open-reader"></i>
            <p>Belum ada catatan jurnal yang tersimpan.</p>
          </div>

          <div class="table-wrap" id="riwayat-table-wrap">
            <table class="table" id="riwayat-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kelas & Mapel</th>
                  <th>Jam</th>
                  <th>Materi / Topik</th>
                  <th>Presensi (H/S/I/A)</th>
                  <th>Catatan Kendala</th>
                  <th>Foto / Link</th>
                </tr>
              </thead>
              <tbody id="riwayat-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    _loadFormData();
  }

  function switchTab(tab) {
    _activeTab = tab;
    const btnForm = document.getElementById('tab-btn-form');
    const btnRiwayat = document.getElementById('tab-btn-riwayat');
    const paneForm = document.getElementById('pane-jurnal-form');
    const paneRiwayat = document.getElementById('pane-jurnal-riwayat');

    if (!btnForm || !btnRiwayat) return;

    if (tab === 'form') {
      btnForm.classList.add('active');
      btnRiwayat.classList.remove('active');
      paneForm.style.display = 'block';
      paneRiwayat.style.display = 'none';
    } else {
      btnRiwayat.classList.add('active');
      btnForm.classList.remove('active');
      paneForm.style.display = 'none';
      paneRiwayat.style.display = 'block';
      _loadRiwayatData();
    }
  }

  async function _loadFormData() {
    const loadingState = document.getElementById('jurnal-loading-state');
    const formEl = document.getElementById('form-jurnal');
    const errorState = document.getElementById('jurnal-error-state');

    if (loadingState) loadingState.style.display = 'block';
    if (formEl) formEl.style.display = 'none';
    if (errorState) errorState.style.display = 'none';

    try {
      const res = await API.jurnal.getFormData();
      if (!res.success) throw new Error(res.message);

      _masterData = res.data;
      _atpData = res.data.atp || [];

      const hariBadge = document.getElementById('jur-hari-badge');
      if (hariBadge) hariBadge.textContent = res.data.hari || 'Hari Ini';

      if (loadingState) loadingState.style.display = 'none';
      if (formEl) formEl.style.display = 'block';

      _toggleInval(false);

    } catch (err) {
      if (loadingState) loadingState.style.display = 'none';
      if (errorState) {
        errorState.style.display = 'block';
        document.getElementById('jurnal-error-msg').textContent = `Gagal memuat data: ${err.message}`;
      }
    }
  }

  async function _loadRiwayatData() {
    const loadingEl = document.getElementById('riwayat-loading-state');
    const emptyEl = document.getElementById('riwayat-empty-state');
    const tableWrap = document.getElementById('riwayat-table-wrap');
    const tbody = document.getElementById('riwayat-tbody');

    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (tbody) tbody.innerHTML = '';

    try {
      const res = await API.jurnal.getRiwayat();
      if (loadingEl) loadingEl.style.display = 'none';

      if (!res.success || !res.data || res.data.length === 0) {
        if (emptyEl) emptyEl.style.display = 'block';
        if (tableWrap) tableWrap.style.display = 'none';
        return;
      }

      if (tableWrap) tableWrap.style.display = 'block';
      _riwayatList = res.data;

      tbody.innerHTML = _riwayatList.map((item) => {
        const hadirBadge = `<span style="font-weight:600; color:var(--success);">${item.hadir || 0}</span>`;
        const sakitBadge = `<span style="color:var(--info);">${item.sakit || 0}</span>`;
        const izinBadge  = `<span style="color:var(--warning);">${item.izin || 0}</span>`;
        const alpaBadge  = `<span style="color:var(--danger); font-weight:600;">${item.alpa || 0}</span>`;

        const linkDoc = item.link_dokumentasi 
          ? `<a href="${item.link_dokumentasi}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; font-size:0.75rem;">
               <i class="fa-solid fa-arrow-up-right-from-square"></i> Foto
             </a>`
          : `<span style="color:var(--text-muted); font-size:0.78rem;">-</span>`;

        const catatan = item.catatan_kendala 
          ? `<span title="${item.catatan_kendala}" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-size:0.78rem; max-width:200px;">${item.catatan_kendala}</span>`
          : `<span style="color:var(--text-muted); font-size:0.78rem;">-</span>`;

        return `
          <tr>
            <td style="white-space:nowrap; font-weight:500;">${item.tanggal || '-'}</td>
            <td>
              <div style="font-weight:600;">${item.id_kelas || '-'}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${item.mapel || '-'}</div>
            </td>
            <td style="text-align:center;"><span class="badge badge-outline">Jam ${item.jam_ke || '-'}</span></td>
            <td>
              <div style="font-size:0.8rem;">${item.materi || '-'}</div>
            </td>
            <td style="white-space:nowrap; font-size:0.8rem;">
              ${hadirBadge} / ${sakitBadge} / ${izinBadge} / ${alpaBadge}
            </td>
            <td>${catatan}</td>
            <td style="text-align:center;">${linkDoc}</td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      if (loadingEl) loadingEl.style.display = 'none';
      toast('error', 'Gagal memuat riwayat jurnal: ' + err.message);
    }
  }

  function _toggleInval(isChecked) {
    if (!_masterData) return;
    _currentJadwalList = isChecked ? _masterData.jadwalSemua : _masterData.jadwalKu;
    _renderJadwalDropdown(_currentJadwalList);
  }

  function _renderJadwalDropdown(list) {
    const sel = document.getElementById('jur_jadwal');
    const noMsg = document.getElementById('jur-no-jadwal-msg');
    if (!sel) return;

    sel.innerHTML = '<option value="">-- Pilih Kelas & Mapel --</option>';

    if (!list || list.length === 0) {
      if (noMsg) noMsg.style.display = 'block';
      sel.disabled = true;
    } else {
      if (noMsg) noMsg.style.display = 'none';
      sel.disabled = false;
      list.forEach((j, idx) => {
        sel.innerHTML += `<option value="${idx}">Kelas ${j.id_kelas} — ${j.mapel} (Jam ke-${j.jam_ke})</option>`;
      });
    }
  }

  function _onJadwalSelect() {
    const idx = document.getElementById('jur_jadwal').value;
    const atpSel = document.getElementById('jur_atp');
    atpSel.innerHTML = '<option value="">-- Pilih Materi ATP --</option>';
    document.getElementById('jur_materi_bebas').value = '';

    if (idx === '') return;

    const jadwal = _currentJadwalList[idx];
    const filtered = _atpData.filter(a => a.mapel === jadwal.mapel);
    filtered.forEach(a => {
      atpSel.innerHTML += `<option value="${a.id_atp}">[${a.id_atp}] ${a.deskripsi}</option>`;
    });
    atpSel.innerHTML += `<option value="LAINNYA">Lainnya (Materi di luar ATP)</option>`;
    _onAtpChange();
  }

  function _onAtpChange() {
    const val = document.getElementById('jur_atp').value;
    const divBebas = document.getElementById('div-materi-bebas');
    const inputBebas = document.getElementById('jur_materi_bebas');

    if (val === 'LAINNYA' || val === '') {
      divBebas.style.display = 'block';
      if (val === 'LAINNYA') inputBebas.setAttribute('required', 'true');
      else inputBebas.removeAttribute('required');
    } else {
      divBebas.style.display = 'none';
      inputBebas.removeAttribute('required');
    }
  }

  async function _handleSubmit(e) {
    e.preventDefault();

    const idx = document.getElementById('jur_jadwal').value;
    if (idx === '') { toast('warning', 'Pilih jadwal kelas terlebih dahulu!'); return; }

    const jadwal = _currentJadwalList[idx];
    let atpVal = document.getElementById('jur_atp').value;
    let materiBebas = document.getElementById('jur_materi_bebas').value;

    if (atpVal === 'LAINNYA') atpVal = '';
    else if (atpVal !== '') materiBebas = '';

    const payload = {
      id_kelas: jadwal.id_kelas,
      mapel: jadwal.mapel,
      jam_ke: jadwal.jam_ke,
      id_atp: atpVal,
      materi_bebas: materiBebas,
      jumlah_hadir: parseInt(document.getElementById('jur_hadir').value) || 0,
      jumlah_sakit: parseInt(document.getElementById('jur_sakit').value) || 0,
      jumlah_izin:  parseInt(document.getElementById('jur_izin').value)  || 0,
      jumlah_alpa:  parseInt(document.getElementById('jur_alpa').value)  || 0,
      link_dokumentasi: document.getElementById('jur_link_dok').value.trim(),
      catatan_kendala: document.getElementById('jur_kendala').value.trim(),
      isInval: document.getElementById('jur_is_inval').checked,
    };

    const btn = document.getElementById('btn-submit-jurnal');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    try {
      const res = await API.jurnal.submit(payload);
      if (res.success) {
        toast('success', res.message || 'Jurnal berhasil disimpan!');
        document.getElementById('form-jurnal').reset();
        _toggleInval(false);
        document.getElementById('div-materi-bebas').style.display = 'none';
        
        setTimeout(() => {
          switchTab('riwayat');
        }, 1200);
      } else {
        toast('error', `Gagal: ${res.message}`);
      }
    } catch (err) {
      toast('error', `Error: ${err.message}`);
    } finally {
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan E-Jurnal';
      btn.disabled = false;
    }
  }

  function destroy() {}

  return {
    render,
    destroy,
    switchTab,
    _toggleInval,
    _onJadwalSelect,
    _onAtpChange,
    _handleSubmit,
    _loadFormData,
    _loadRiwayatData
  };
})();
