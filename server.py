function doPost(e) {
  try {
    const sheet = SpreadsheetApp
      .openById('1HOZ4AliQ44L2rG8PTyZA0GieFNGTvtEvciygQ924OGw')
      .getSheetByName('pendaftaran_hima');

    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),
      data.nama,
      data.npm,
      data.kelas,
      data.email,
      data.no_telp,
      data.jurusan,
      data.divisi,
      data.pengalaman
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Pendaftaran berhasil!'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
