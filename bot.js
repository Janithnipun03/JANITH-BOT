

process.on("uncaughtException", (err) => {
  console.log("⚠️ Network error:", err.message);
});

process.on("unhandledRejection", (err) => {
  console.log("⚠️ Promise error:", err?.message || err);
});const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("\nSCAN THIS QR WITH WHATSAPP\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "connecting") {
      console.log("Connecting to WhatsApp...");
    }

    if (connection === "open") {
      console.log("JANITH BOT CONNECTED!");
    }

    if (connection === "close") {
      console.log("Connection closed.");
      console.log("Reconnecting in 5 seconds...");

      setTimeout(() => {
        startBot();
      }, 5000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (text.toLowerCase() === ".menu") {
        await sock.sendMessage(jid, {
          text:
`╭━━━〔 JANITH BOT 〕━━━╮

🎬 Media Downloader
🎵 Audio Downloader
📁 File Downloader
🖼️ Image Downloader

👑 Owner: JANITH

Type .help

╰━━━━━━━━━━━━━━━━━━━━╯`
        });
      }

      if (text.toLowerCase() === ".help") {
        await sock.sendMessage(jid, {
          text:
`JANITH BOT

.menu
.help

More features coming soon...`
        });
      }
    }
  });
}

startBot();

