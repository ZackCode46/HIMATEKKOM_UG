from flask import Flask, request, jsonify
import gspread
from google.oauth2.service_account import Credentials
import traceback

app = Flask(__name__)

# Konfigurasi
CREDENTIALS_FILE = "credentials.json"
SHEET_ID = "1HOZ4AliQ44L2rG8PTyZA0GieFNGTvtEvciygQ924OGw"
WORKSHEET_NAME = "pendaftaran_hima"

# Inisialisasi klien Google Sheets dengan penanganan error
try:
    print("🔁 Mencoba mengautentikasi ke Google Sheets...")
    creds = Credentials.from_service_account_file(
        CREDENTIALS_FILE,
        scopes=["https://www.googleapis.com/auth/spreadsheets"]  # Perbaiki: hapus spasi ekstra
    )
    client = gspread.authorize(creds)
    print("✅ Autentikasi berhasil!")

    print(f"🔁 Membuka spreadsheet dengan ID: {SHEET_ID}...")
    spreadsheet = client.open_by_key(SHEET_ID)

    print(f"🔁 Mencari worksheet bernama: '{WORKSHEET_NAME}'...")
    sheet = spreadsheet.worksheet(WORKSHEET_NAME)
    print(f"✅ Berhasil terhubung ke worksheet '{WORKSHEET_NAME}'!")

except FileNotFoundError:
    print(f"❌ Gagal: File kredensial '{CREDENTIALS_FILE}' tidak ditemukan.")
    sheet = None

except gspread.exceptions.APIError as e:
    print(f"❌ Gagal mengakses Google Sheets API: {e}")
    sheet = None

except gspread.exceptions.SpreadsheetNotFound:
    print(f"❌ Spreadsheet dengan ID '{SHEET_ID}' tidak ditemukan. Pastikan ID benar dan spreadsheet dibagikan ke email service account.")
    sheet = None

except gspread.exceptions.WorksheetNotFound:
    print(f"❌ Worksheet '{WORKSHEET_NAME}' tidak ditemukan di spreadsheet. Pastikan nama tab sudah diganti menjadi '{WORKSHEET_NAME}'.")
    sheet = None

except Exception as e:
    print(f"❌ Terjadi kesalahan tak terduga saat inisialisasi: {e}")
    traceback.print_exc()
    sheet = None

# Endpoint pendaftaran
@app.route("/daftar", methods=["POST"])
def daftar():
    if sheet is None:
        return jsonify({
            "status": "error",
            "message": "Server belum terhubung ke Google Sheets. Cek log untuk detail error."
        }), 500

    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "status": "error",
                "message": "Data tidak ditemukan. Kirim dalam format JSON."
            }), 400

        # Validasi field wajib (opsional tapi disarankan)
        required_fields = ["nama", "npm", "kelas", "email", "no_telp", "jurusan", "divisi", "pengalaman"]
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return jsonify({
                    "status": "error",
                    "message": f"Field '{field}' wajib diisi."
                }), 400

        # Simpan ke Google Sheet
        row = [
            data["nama"],
            data["npm"],
            data["kelas"],
            data["email"],
            data["no_telp"],
            data["jurusan"],
            data["divisi"],
            data["pengalaman"]
        ]
        sheet.append_row(row)
        print(f"✅ Data berhasil disimpan untuk: {data['nama']}")

        return jsonify({
            "status": "success",
            "message": "Data berhasil disimpan ke Google Sheets!"
        }), 200

    except gspread.exceptions.APIError as e:
        print(f"❌ Gagal menyimpan data: {e}")
        return jsonify({
            "status": "error",
            "message": "Gagal menyimpan data ke Google Sheets. Periksa izin akses."
        }), 500

    except Exception as e:
        print(f"❌ Kesalahan saat menyimpan data: {e}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": "Terjadi kesalahan internal saat menyimpan data."
        }), 500

# Endpoint kesehatan (opsional, untuk cek status server)
@app.route("/health", methods=["GET"])
def health():
    status = "siap" if sheet is not None else "error: belum terhubung ke Google Sheets"
    return jsonify({"status": "berjalan", "google_sheet": status})

if __name__ == "__main__":
    print("🚀 Menjalankan server Flask...")
    app.run(debug=False, host="0.0.0.0", port=5000)