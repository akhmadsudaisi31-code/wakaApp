const PKLPage = {
  render: async (container) => {
    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fa-solid fa-briefcase"></i> Jurnal PKL / Prakerin</h2>
        <p>Catat dan pantau kegiatan praktik kerja lapangan siswa.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Data Jurnal PKL</h3>
          <button class="btn btn-primary btn-sm" onclick="PKLPage.showForm()"><i class="fa-solid fa-plus"></i> Tambah Jurnal</button>
        </div>
        <div id="pkl-content">
          <div class="skeleton skeleton-card"></div>
        </div>
      </div>
    `;

    try {
      const res = await API.pkl.getData();
      if (!res.success) throw new Error(res.message);

      if (res.data.length === 0) {
        document.getElementById('pkl-content').innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-briefcase"></i>
            <p>Belum ada data jurnal PKL.</p>
          </div>
        `;
        return;
      }

      let rows = res.data.map(item => `
        <tr>
          <td>${item.tgl}</td>
          <td><b>${item.nama}</b><br><span style="font-size:0.7rem;color:var(--text-muted)">${item.industri}</span></td>
          <td>${item.kegiatan}</td>
          <td><span class="badge ${item.status === 'Terverifikasi' ? 'badge-success' : 'badge-warning'}">${item.status}</span></td>
        </tr>
      `).join('');

      document.getElementById('pkl-content').innerHTML = `
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Siswa & Industri</th>
                <th>Kegiatan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('pkl-content').innerHTML = `
        <div class="alert alert-danger"><i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat data: ${err.message}</div>
      `;
    }
  },

  showForm: () => {
    App.toast('info', 'Fitur tambah jurnal dalam pengembangan.');
  }
};
