/* СТЭК — Telegram-бот (long-polling, без зависимостей, Node 18+).
   Регистрирует пользователей (для напоминаний) и открывает Mini App.
   Запуск:  BOT_TOKEN=xxxx node bot/bot.js
*/
const fs = require("fs");
const TOKEN = process.env.BOT_TOKEN;
const WEBAPP = process.env.WEBAPP_URL || "https://pvtmup.github.io/website2025/stack/";
const FILE = __dirname + "/users.json";
if(!TOKEN){ console.error("Задай BOT_TOKEN (из @BotFather)"); process.exit(1); }
const API = `https://api.telegram.org/bot${TOKEN}`;

function load(){ try{ return JSON.parse(fs.readFileSync(FILE,"utf8")); }catch(e){ return {}; } }
function save(u){ try{ fs.writeFileSync(FILE, JSON.stringify(u)); }catch(e){} }
async function call(method, body){
  const r = await fetch(`${API}/${method}`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body) });
  return r.json();
}
const playKb = { inline_keyboard:[[{ text:"🎮 Играть", web_app:{ url: WEBAPP } }]] };

let offset = 0;
async function poll(){
  try{
    const r = await call("getUpdates", { offset, timeout:30 });
    for(const u of (r.result||[])){
      offset = u.update_id + 1;
      const msg = u.message; if(!msg || !msg.chat) continue;
      const chat = msg.chat.id;
      const users = load(); users[chat] = { t: Date.now(), name: (msg.from&&msg.from.first_name)||"" }; save(users);
      if(msg.text && msg.text.startsWith("/start")){
        await call("sendMessage", { chat_id:chat,
          text:"СТЭК 🧱 — башня в один тап.\nДневной челлендж, дуэли с друзьями и скины. Погнали!",
          reply_markup: playKb });
      }
    }
  }catch(e){ console.error("poll error:", e.message); }
  setTimeout(poll, 400);
}
console.log("СТЭК бот запущен (polling)…");
poll();
