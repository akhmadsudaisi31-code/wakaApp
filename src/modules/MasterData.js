/**
 * API untuk CRUD Master Data secara Dinamis
 */

function api_getTableData(tableName) {
  try {
    const user = requireRole(['waka', 'kepsek']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(tableName);
    
    if (!sheet) throw new Error("Tabel tidak ditemukan: " + tableName);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0] || [];
    const rows = [];
    
    for(let i = 1; i < data.length; i++) {
       let formattedRow = data[i].map(cell => {
         if (cell instanceof Date) {
           let d = cell.getDate();
           let m = cell.getMonth() + 1;
           let y = cell.getFullYear();
           return y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d);
         }
         return cell;
       });
       rows.push({ rowIndex: i + 1, rowData: formattedRow });
    }
    
    return { success: true, headers: headers, rows: rows };
  } catch(e) { 
    return { success: false, message: e.message }; 
  }
}

function api_saveRow(tableName, rowIndex, rowArray) {
  try {
    requireRole(['waka', 'kepsek']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(tableName);
    
    if (rowIndex === 0) {
      // Insert / Tambah Data Baru
      sheet.appendRow(rowArray);
    } else {
      // Update Data Lama
      sheet.getRange(rowIndex, 1, 1, rowArray.length).setValues([rowArray]);
    }
    
    return { success: true };
  } catch(e) { 
    return { success: false, message: e.message }; 
  }
}

function api_deleteRow(tableName, rowIndex) {
  try {
    requireRole(['waka', 'kepsek']);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(tableName);
    
    sheet.deleteRow(rowIndex);
    
    return { success: true };
  } catch(e) { 
    return { success: false, message: e.message }; 
  }
}
