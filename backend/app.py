function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Register");

  sheet.appendRow([
    e.parameter.nama,
    e.parameter.npm,
    e.parameter.kelas,
    e.parameter.email,
    e.parameter.no_telp,
    e.parameter.jurusan,
    e.parameter.divisi,
    e.parameter.pengalaman,
    new Date()
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

if __name__ == "__main__":
    app.run()

