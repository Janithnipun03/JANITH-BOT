const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const QRCode = require("qrcode-terminal");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\n📱 WhatsApp QR එක:\n");
      QRCode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("\n✅ WhatsApp Bot Connected!\n");
    }

    if (connection === "close") {
      const code =
        lastDisconnect?.error?.output?.statusCode;

      if (code !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconnecting...");
        startBot();
      } else {
        console.log("❌ Logged out. Delete auth_info and link again.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (text.toLowerCase() === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 Pong!\n🤖 Bot is online."
      });
    }

    if (text.toLowerCase() === ".menu") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
`╭───〔 🤖 BOT MENU 〕───╮
│
│ .ping
│ .alive
│ .menu
│
╰────────────────────╯`
      });
    }

    if (text.toLowerCase() === ".alive") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "✅ Bot is alive and running!"
      });
    }
  });
}

startBot();

