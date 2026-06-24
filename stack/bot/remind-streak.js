/* СТЭК — персональные напоминания «стрик под угрозой» (cron, раз в день вечером).
   Берёт статы из users.json (их пишет server.js /sync) и шлёт тем, кто сегодня не играл.
   Пример cron:  0 20 * * *  BOT_TOKEN=xxxx node bot/remind-streak.js */
const fs = require("fs");
const TOKEN = process.env.BOT_TOKEN;
const WEBAPP = process.env.WEBAPP_URL || "https://pvtmup.github.io/website2025/stack/";
const FILE = __dirname + "/users.json";
if(!TOKEN){ console.error("Задай BOT_TOKEN"); process.exit(1); }
const API = `https://api.telegram.org/bot${TOKEN}`;
const KB = { inline_keyboard:[[{ text:"🔥 Спасти стрик", web_app:{ url: WEBAPP } }]] };

const todayKey = ()=>{ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); };
const load = ()=>{ try{ return JSON.parse(fs.readFileSync(FILE,"utf8")); }catch(e){ return {}; } };
async function tg(m,b){ const r=await fetch(`${API}/${m}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}); return r.json(); }
const sleep = ms => new Promise(r=>setTimeout(r,ms));

(async ()=>{
  const db = load(), today = todayKey(); let sent=0;
  for(const u of Object.values(db)){
    if(!u.started || !u.chat) continue;
    if((u.streak|0) < 2) continue;            // напоминаем только при заметном стрике
    if(u.dailyKey === today) continue;         // уже играл сегодня
    try{ const r=await tg("sendMessage",{ chat_id:u.chat,
      text:`🔥 Твой стрик ${u.streak} дней под угрозой! Сыграй сегодня, чтобы не потерять.`,
      reply_markup:KB }); if(r.ok) sent++; }catch(e){}
    await sleep(40);
  }
  console.log("Стрик-напоминаний отправлено:", sent);
})();
