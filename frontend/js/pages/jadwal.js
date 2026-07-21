/**
 * jadwal.js — Halaman Jadwal Mengajar
 */

const JadwalPage = (() => {

  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  function render(container, user) {
    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fa-regular fa-calendar-check" style="font-size:1.4rem;"></i> Jadwal Mengajar</h2>
        <p>Jadwal mengajar aktif tahun ajaran ini</p>
      </div>

      <div id="jadwal-loading">
        ${[1,2,3].map(() => `<div class="skeleton skeleton-card"></div>`).join('')}
      </div>
      <div id="jadwal-content" style="display:none;"></div>
    `;

    _loadData(user);
  }

  async function _loadData(user) {
    try {
      const res = await API.jadwal.getData();
      if (!res.success) throw new Error(res.message);

      document.getElementById('jadwal-loading').style.display = 'none';
      document.getElementById('jadwal-content').style.display = 'block';
      _render(res.data, user);

    } catch (err) {
      document.getElementById('jadwal-loading').innerHTML = `
        <div class="alert alert-danger">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>Gagal memuat jadwal: ${err.message}</span>
        </div>
      `;
    }
  }

  function _render(data, user) {
    const container = document.getElementById('jadwal-content');
    const { jadwalKu = [], jadwalSemua = [], hari: hariIni } = data;

    const jadwalToShow = user.role === 'guru' ? jadwalKu : jadwalSemua;

    if (jadwalToShow.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <i class="fa-regular fa-calendar-xmark"></i>
            <p>Tidak ada jadwal mengajar yang ditemukan.</p>
          </div>
        </div>
      `;
      return;
    }

    // Group by hari
    const byHari = {};
    jadwalToShow.forEach(j => {
      if (!byHari[j.hari]) byHari[j.hari] = [];
      byHari[j.hari].push(j);
    });

    const hariOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    container.innerHTML = hariOrder.filter(h => byHari[h]).map(hari => {
      const isToday = hari === hariIni;
      return `
        <div class="card" ${isToday ? 'style="border-color:var(--primary); border-width:2px;"' : ''}>
          <div class="card-header">
            <div class="card-title">
              <i class="fa-solid fa-calendar-day"></i> ${hari}
            </div>
            ${isToday ? '<span class="badge badge-primary">Hari Ini</span>' : ''}
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Jam Ke</th>
                  <th>Kelas</th>
                  <th>Mata Pelajaran</th>
                  ${user.role !== 'guru' ? '<th>Guru</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${byHari[hari].sort((a,b) => a.jam_ke - b.jam_ke).map(j => `
                  <tr>
                    <td><span class="badge badge-primary">Jam ${j.jam_ke}</span></td>
                    <td><strong>${j.id_kelas}</strong></td>
                    <td>${j.mapel}</td>
                    ${user.role !== 'guru' ? `<td>${j.id_guru || '-'}</td>` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
  }

  function destroy() {}

  return { render, destroy };
})();
