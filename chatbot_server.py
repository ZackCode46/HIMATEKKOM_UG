from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Simpan nama user (sederhana)
user_name = None

# === RULE-BASED REPLIES ===
RULES = [
    {"key": "daftar", "reply": "Untuk mendaftar, silakan buka menu 'Pendaftaran' di website kami."},
    {"key": "proker", "reply": "Program kerja HIMATEKKOM dapat kamu lihat di halaman Proker."},
    {"key": "info", "reply": "Kunjungi halaman Informasi untuk pengumuman terbaru."},
    {"key": "tentang", "reply": "HIMATEKKOM adalah Himpunan Mahasiswa Teknik Komputer Universitas Gunadarma."},
    {"key": "struktur", "reply": "Struktur kepengurusan HIMATEKKOM dapat dilihat di halaman Struktur."},
    {"key": "media partner", "reply": "Hubungi kami melalui Instagram @himatekkom.ug atau WhatsApp https://wa.me/083156960998"},
    {"key": "kontak", "reply": "Kamu dapat menghubungi kami lewat WhatsApp: https://wa.me/083156960998"}
]

def get_rule_based_reply(user_msg: str) -> str:
    global user_name
    msg = user_msg.lower().strip()

    # Sapaan awal
    if msg in ["halo", "hai", "hi", "helo", "hello"]:
        return (
            "Iya, halo juga! 😊\n"
            "Ada yang bisa aku bantu?\n"
            "Ketik salah satu pilihan berikut:\n"
            "• daftar\n• info\n• proker\n• tentang\n• struktur\n• kontak"
        )

    # Tangkap nama user
    if "nama saya" in msg or "saya" in msg and any(word in msg for word in ["nama", "adalah"]):
        name = msg.replace("nama saya", "").replace("adalah", "").strip().title()
        user_name = name
        return f"Senang bertemu denganmu, {user_name}! 😊 Apa yang ingin kamu ketahui hari ini?"

    # Balas kalau user bilang terima kasih
    if "terima kasih" in msg or "makasih" in msg:
        return "Sama-sama! 😄 Senang bisa membantu kamu."

    # Kalau user nanya siapa kamu
    if "kamu siapa" in msg:
        return "Aku asisten virtual HIMATEKKOM Gunadarma, siap membantu kamu soal kegiatan, pendaftaran, dan info kampus!"

    # Cek aturan umum
    for rule in RULES:
        if rule["key"] in msg:
            return rule["reply"]

    # Kalau tidak dikenali
    return (
        "Maaf, aku belum memahami pertanyaan kamu. 😅\n"
        "Silakan pilih salah satu topik berikut:\n"
        "• daftar\n• info\n• proker\n• tentang\n• struktur\n• kontak"
    )

# === ENDPOINT CHAT ===
@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        if not user_message:
            return jsonify({"reply": "Pesan tidak boleh kosong."}), 400

        reply = get_rule_based_reply(user_message)
        return jsonify({"reply": reply})
    except Exception as e:
        print(f"[Server Error] {e}")
        return jsonify({"reply": "Maaf, server sedang mengalami gangguan."}), 500

if __name__ == "__main__":
    print("🤖 Chatbot HIMATEKKOM aktif di http://localhost:5000/api/chat")
    app.run(host="0.0.0.0", port=5000, debug=True)
