/* СТЭК — рассылка напоминаний (запускать по расписанию раз в день).
   Пример cron:  0 18 * * *  BOT_TOKEN=xxxx node /path/stack/bot/remind.js
*/
const fs = require("fs");
const TOKEN = process.env.BOT_TOKEN;
const WEBAPP = process.env.WEBAPP_URL || "https://pvtmup.github.io/website2025/stack/";
const FILE = __dirname + "/users.json";
if(!TOKEN){ console.error("Задай BOT_TOKEN"); process.exit(1); }
const API = `https://api.telegram.org/bot${TOKEN}`;

const TEXTS = [
  "Твой стрик ждёт 🔥 Забери ежедневную награду в СТЭК!",
  "Новые задания дня в СТЭК 🎯 Успей выполнить и забрать монеты.",
  "Кто-то уже метит в топ дня 🧱 Защитишь рекорд?",
  "Сезон тикает ⏳ Прокачай батл-пасс, пока не сменился.",
];
const kb = { inline_keyboard:[[{ text:"🎮 Играть", web_app:{ url: WEBAPP } }]] };

function load(){ try{ return JSON.parse(fs.readFileSync(FILE,"utf8")); }catch(e){ return {}; } }
async function call(method, body){
  const r = await fetch(`${API}/${method}`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body) });
  return r.json();
}
const sleep = ms => new Promise(r=>setTimeout(r,ms));

(async ()=>{
  const users = load(); const ids = Object.keys(users);
  let ok=0, fail=0;
  for(let i=0;i<ids.length;i++){
    const text = TEXTS[(Math.floor(Date.now()/86400000) + i) % TEXTS.length];
    try{ const r = await call("sendMessage", { chat_id: ids[i], text, reply_markup: kb }); r.ok?ok++:fail++; }
    catch(e){ fail++; }
    await sleep(40); // ~25 msg/sec, не упираемся в лимиты
  }
  console.log(`Отправлено: ${ok}, ошибок: ${fail}, всего: ${ids.length}`);
})();
