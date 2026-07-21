/**
 * Format tanggal dari objek Date ke YYYY-MM-DD
 */
function formatDate(dateObj) {
  if (!dateObj) return "";
  const d = new Date(dateObj);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

/**
 * Format timestamp sekarang (WIB)
 */
function getCurrentTimestamp() {
  return Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss");
}

/**
 * Nama hari dari Date
 */
function getDayName(dateObj) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[dateObj.getDay()];
}
