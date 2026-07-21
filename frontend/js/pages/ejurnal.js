/**
 * ejurnal.js — Halaman Form E-Jurnal Mengajar Harian
 */

const EJurnalPage = (() => {

  let _masterData = null;
  let _currentJadwalList = [];
  let _atpData = [];

  function render(container, user) {
    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fa-solid fa-book-open" style="font-size:1.4rem;"></i> E-Jurnal Harian</h2>
        <p>Catat kegiatan pembelajaran hari ini</p>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <i class="fa-solid fa-pen-to-square"></i> Form Jurnal Mengajar
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
                <span class="form-check-hint">Centang ini jika menggantikan jadwal mengajar guru lain hari ini.</span>
              </div>
            </label>
          </div>

          <!-- Pilih Jadwal -->
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
            <label class="form-label" for="jur_atp">Materi Pembelajaran (ATP)</label>
            <select id="jur_atp" class="form-control" onchange="EJurnalPage._onAtpChange()">
              <option value="">-- Pilih Materi --</option>
            </select>
          </div>

          <!-- Materi Bebas -->
          <div class="form-group" id="div-materi-bebas" style="display:none;">
            <label class="form-label" for="jur_materi_bebas">Materi Lainnya (di luar ATP)</label>
            <input type="text" id="jur_materi_bebas" class="form-control" placeholder="Tuliskan materi yang diajarkan">
          </div>

          <!-- Kehadiran -->
          <div class="form-group">
            <label class="form-label">Kehadiran Siswa <span class="required">*</span></label>
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

          <!-- Catatan -->
          <div class="form-group">
            <label class="form-label" for="jur_kendala">Catatan / Kendala (Opsional)</label>
            <textarea id="jur_kendala" class="form-control" rows="3" placeholder="Tuliskan catatan atau kendala selama pembelajaran..."></textarea>
          </div>

          <button type="submit" id="btn-submit-jurnal" class="btn btn-primary btn-full btn-lg">
            <i class="fa-solid fa-floppy-disk"></i> Simpan Jurnal
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
    `;

    _loadFormData();
  }

  async function _loadFormData() {
    document.getElementById('jurnal-loading-state').style.display = 'block';
    document.getElementById('form-jurnal').style.display = 'none';
    document.getElementById('jurnal-error-state').style.display = 'none';

    try {
      const res = await API.jurnal.getFormData();
      if (!res.success) throw new Error(res.message);

      _masterData = res.data;
      _atpData = res.data.atp;

      document.getElementById('jur-hari-badge').textContent = res.data.hari;
      document.getElementById('jurnal-loading-state').style.display = 'none';
      document.getElementById('form-jurnal').style.display = 'block';

      _toggleInval(false); // default: jadwal sendiri

    } catch (err) {
      document.getElementById('jurnal-loading-state').style.display = 'none';
      document.getElementById('jurnal-error-state').style.display = 'block';
      document.getElementById('jurnal-error-msg').textContent = `Gagal memuat data: ${err.message}`;
    }
  }

  function _toggleInval(isChecked) {
    _currentJadwalList = isChecked ? _masterData.jadwalSemua : _masterData.jadwalKu;
    _renderJadwalDropdown(_currentJadwalList);
  }

  function _renderJadwalDropdown(list) {
    const sel = document.getElementById('jur_jadwal');
    const noMsg = document.getElementById('jur-no-jadwal-msg');

    sel.innerHTML = '<option value="">-- Pilih Kelas & Mapel --</option>';

    if (!list || list.length === 0) {
      noMsg.style.display = 'block';
      sel.disabled = true;
    } else {
      noMsg.style.display = 'none';
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
      catatan_kendala: document.getElementById('jur_kendala').value,
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
      } else {
        toast('error', `Gagal: ${res.message}`);
      }
    } catch (err) {
      toast('error', `Error: ${err.message}`);
    } finally {
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Jurnal';
      btn.disabled = false;
    }
  }

  function destroy() {}

  return { render, destroy, _toggleInval, _onJadwalSelect, _onAtpChange, _handleSubmit, _loadFormData };
})();
