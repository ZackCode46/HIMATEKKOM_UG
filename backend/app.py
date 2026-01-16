from flask import Flask, request, jsonify
from flask_cors import CORS
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime

app = Flask(__name__)
CORS(app)  # penting buat HTTPS GitHub Pages

# ===== GOOGLE SHEET CONFIG =====
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

creds = Credentials.from_service_account_file(
    "service_account.json",
    scopes=SCOPES
)

client = gspread.authorize(creds)

sheet = client.open("Register").sheet1


@app.route("/daftar", methods=["POST"])
def daftar():
    try:
        data = request.json

        row = [
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            data.get("nama"),
            data.get("npm"),
            data.get("kelas"),
            data.get("email"),
            data.get("no_telp"),
            data.get("jurusan"),
            data.get("divisi"),
            data.get("pengalaman")
        ]

        sheet.append_row(row)

        return jsonify({
            "status": "success",
            "message": "Pendaftaran berhasil! Data tersimpan."
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == "__main__":
    app.run()
