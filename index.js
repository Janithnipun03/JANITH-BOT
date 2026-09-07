const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const qrcode = require("qrcode-terminal");

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("\n📱 Scan this QR:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ BOT CONNECTED!");
    }

    if (connection === "close") {
      console.log("🔄 CONNECTION CLOSED — RESTARTING...");
      setTimeout(startBot, 3000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message) return;

    const jid = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    console.log("📩 MESSAGE:", text);

    if (text.trim().toLowerCase() === ".ping") {
      await sock.sendMessage(jid, {
        text: "🏓 Pong! Bot is working!"
      });
    }

    if (text.trim().toLowerCase() === ".alive") {
      await sock.sendMessage(jid, {
        text: "✅ Bot is alive!"
      });
    }

    if (text.trim().toLowerCase() === ".menu") {
      await sock.sendMessage(jid, {
        text: `🤖 BOT MENU

.ping
.alive
.menu`
      });
    }
  });
}

startBot();
