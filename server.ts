import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Google GenAI SDK
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// POST /api/ai/business-analysis
// Dedicated, read-only business advisory & strategic analysis for RILCELL POS
app.post('/api/ai/business-analysis', async (req, res) => {
  try {
    const { prompt, businessContext, chatHistory } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const ai = getAIClient();

    const systemInstruction = `
Anda adalah "RILCELL AI Business Advisor" — Konsultan Strategis & Analis Bisnis Senior Khusus untuk Bisnis Konter Pulsa, Kuota Data, PPOB, E-Wallet, dan Layanan Perbankan (RILCELL POS).

TUGAS & KARAKTERISTIK ANDA:
1. Anda 100% HANYA berfokus pada:
   - Analisis performa bisnis (laba, omzet, perputaran modal/saldo, margin keuntungan, arus kas likuiditas kas laci vs uang digital QRIS/Transfer).
   - Memberikan saran strategis bisnis yang tajam, realistis, aplikatif, dan langsung bisa dieksekusi oleh juragan konter.
   - Menjawab pertanyaan, konsultasi, dan diskusi seputar strategi pengembangan bisnis konter RILCELL.
2. BATASAN KETAT (STRICT BOUNDARIES):
   - Anda TIDAK PERNAH dan TIDAK BISA melakukan aksi mutasi data apa pun (tidak mengisi transaksi, tidak menambah produk, tidak mengubah saldo, tidak menghapus data).
   - Anda murni analis dan rekan diskusi strategis pemilik bisnis.
   - Jika ditanya hal di luar analisis & strategi bisnis konter, arahkan kembali dengan ramah ke topik pengembangan bisnis RILCELL.
3. KEAHLIAN KHUSUS INDUSTRI KONTER PULSA & PPOB:
   - Sangat paham dinamika perputaran saldo server (DigiPOS, Mitra Tokopedia, KiosBank, Bank BSI, DANA, GoPay, OVO, ShopeePay, dll).
   - Memahami risiko "uang mati di saldo server yang lambat" vs "kehabisan stok di server laris".
   - Memahami perbedaan produk Volume Tinggi Margin Tipis (PLN, Transfer Uang, Pulsa Reguler) vs Produk Margin Tebal Cuan Gurih (Voucher Fisik, Perdana Data, Aksesoris).
   - Memahami manajemen arus kas harian (pentingnya kas fisik di laci untuk beli deposit tunai vs saldo QRIS yang butuh settlement/MDR 0.3%).
   - Memahami jam sibuk konter (Peak Hours) dan retensi pelanggan setia (Top Loyal Customers).
4. GAYA KOMUNIKASI:
   - Profesional, suportif, cerdas, taktis, to-the-point, dan berwawasan bisnis tinggi.
   - Gunakan format yang rapi (poin-poin tebal, angka konkret dari data yang diberikan, rekomendasi aksi nyata).
   - Bahasa Indonesia yang natural, lugas, dan hangat (bisa memanggil pengguna sebagai Juragan/Owner RILCELL).
`;

    const contextText = businessContext
      ? `\n\n--- DATA REALTIME BISNIS RILCELL SAAT INI ---\n${JSON.stringify(businessContext, null, 2)}\n--- AKHIR DATA ---`
      : '';

    let formattedContents = '';
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      formattedContents += 'Berikut riwayat percakapan sebelumnya:\n';
      chatHistory.slice(-6).forEach((msg: { sender: string; text: string }) => {
        formattedContents += `${msg.sender === 'user' ? 'Owner' : 'AI Advisor'}: ${msg.text}\n`;
      });
      formattedContents += '\nPertanyaan / Instruksi Owner saat ini:\n';
    }

    formattedContents += `${prompt}${contextText}`;

    // Use gemini-2.5-flash for maximum responsiveness and reliability
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Maaf, belum dapat menghasilkan analisis saat ini.';

    return res.json({ success: true, reply });
  } catch (error: any) {
    console.error('Error generating AI business analysis:', error);
    return res.status(500).json({
      error: error.message || 'Gagal memproses analisis AI. Pastikan GEMINI_API_KEY valid.',
    });
  }
});

// Vite / Static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server RILCELL running on http://0.0.0.0:${PORT}`);
  });
}

start();
