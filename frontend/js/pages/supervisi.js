const SupervisiPage = {
  render: async (container) => {
    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fa-solid fa-clipboard-check"></i> Supervisi KBM</h2>
        <p>Penilaian dan pemantauan kegiatan belajar mengajar.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Jadwal & Hasil Supervisi</h3>
          <button class="btn btn-primary btn-sm" onclick="SupervisiPage.showForm()"><i class="fa-solid fa-plus"></i> Input Nilai</button>
        </div>
        <div id="supervisi-content">
          <div class="skeleton skeleton-card"></div>
        </div>
      </div>
    `;

    try {
      const res = await API.supervisi.getData();
      if (!res.success) throw new Error(res.message);

      if (res.data.length === 0) {
        document.getElementById('supervisi-content').innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-clipboard-check"></i>
            <p>Belum ada data supervisi.</p>
          </div>
        `;
        return;
      }

      let rows = res.data.map(item => `
        <tr>
          <td>${item.tgl}</td>
          <td><b>${item.nama}</b><br><span style="font-size:0.7rem;color:var(--text-muted)">${item.mapel}</span></td>
          <td><span class="badge ${item.nilai > 0 ? 'badge-success' : 'badge-muted'}">${item.nilai > 0 ? item.nilai : 'Belum'}</span></td>
          <td>${item.catatan}</td>
        </tr>
      `).join('');

      document.getElementById('supervisi-content').innerHTML = `
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Guru & Mapel</th>
                <th>Nilai</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('supervisi-content').innerHTML = `
        <div class="alert alert-danger"><i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat data: ${err.message}</div>
      `;
    }
  },

  showForm: () => {
    App.toast('info', 'Form input supervisi dalam pengembangan.');
  }
};
