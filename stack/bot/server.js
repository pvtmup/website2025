/* СТЭК — бэкенд удержания + оплата Stars. Node 18+, без зависимостей.
   Один сервис: регистрация юзеров, синк статов, лидерборд, пинг дуэлей, invoice/вебхук.
   Запуск:  BOT_TOKEN=xxxx node bot/server.js   (PORT, по умолч. 8787)
   Деплой на HTTPS-хост, затем:
     • в stack/js/sync.js → SYNC_API и stack/js/pay.js → PAY_API = <URL>
     • вебхук: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL>/webhook
   Хранилище — users.json (для serverless замени на KV/БД). */
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");

const TOKEN = process.env.BOT_TOKEN;
const PORT  = process.env.PORT || 8787;
const WEBAPP = process.env.WEBAPP_URL || "https://pvtmup.github.io/website2025/stack/";
const FILE  = __dirname + "/users.json";
if(!TOKEN){ console.error("Задай BOT_TOKEN"); process.exit(1); }
const API = `https://api.telegram.org/bot${TOKEN}`;
const PRODUCTS = {
  pass:   { title:"Премиум-пасс сезона", desc:"Все премиум-награды сезона + эксклюзивные скины", stars:150 },
  coins1: { title:"500 монет",  desc:"Пачка монет для СТЭК", stars:75 },
  coins2: { title:"1500 монет", desc:"Пачка монет для СТЭК", stars:199 },
};
const PLAY_KB = { inline_keyboard:[[{ text:"🎮 Играть", web_app:{ url: WEBAPP } }]] };

const load = ()=>{ try{ return JSON.parse(fs.readFileSync(FILE,"utf8")); }catch(e){ return {}; } };
const save = (u)=>{ try{ fs.writeFileSync(FILE, JSON.stringify(u)); }catch(e){} };
async function tg(method, body){
  const r = await fetch(`${API}/${method}`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body) });
  return r.json();
}
function checkInitData(initData){
  try{
    const p = new URLSearchParams(initData); const hash = p.get("hash"); p.delete("hash");
    const dcs = [...p.entries()].map(([k,v])=>`${k}=${v}`).sort().join("\n");
    const secret = crypto.createHmac("sha256","WebAppData").update(TOKEN).digest();
    if(crypto.createHmac("sha256",secret).update(dcs).digest("hex")!==hash) return null;
    return JSON.parse(p.get("user")||"{}");
  }catch(e){ return null; }
}
function send(res, code, obj){
  res.writeHead(code, {"content-type":"application/json","access-control-allow-origin":"*","access-control-allow-headers":"X-Init-Data,content-type"});
  res.end(JSON.stringify(obj));
}
const body = (req)=>new Promise(r=>{ let b=""; req.on("data",c=>b+=c); req.on("end",()=>{ try{ r(JSON.parse(b||"{}")); }catch(e){ r({}); } }); });

const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url, "http://x");
  if(req.method==="OPTIONS") return send(res,204,{});
  const path = url.pathname.replace(/.*?(\/(invoice|webhook|sync|leaderboard|duel\/win))$/,"$1");

  // — синк статов из Mini App (повод для пушей и лидерборда)
  if(req.method==="POST" && path.endsWith("/sync")){
    const u = checkInitData(req.headers["x-init-data"]); if(!u) return send(res,401,{error:"bad initData"});
    const d = await body(req); const db = load(); const id = ""+u.id;
    db[id] = Object.assign(db[id]||{}, { id:u.id, name:(d.name||u.first_name||"").slice(0,18),
      streak:d.streak|0, best:d.best|0, dailyKey:d.dailyKey||null, dailyScore:d.dailyScore|0, seen:Date.now() });
    save(db); return send(res,200,{ok:true});
  }
  // — реальный дневной лидерборд (топ-20 по dailyScore за переданный день)
  if(req.method==="GET" && path.endsWith("/leaderboard")){
    const key = url.searchParams.get("key"); const db = load();
    const top = Object.values(db).filter(x=>x.dailyKey===key && x.dailyScore>0)
      .sort((a,b)=>b.dailyScore-a.dailyScore).slice(0,20).map(x=>({name:x.name||"Игрок",score:x.dailyScore}));
    return send(res,200,{top});
  }
  // — победил в дуэли → пуш тому, кто бросил вызов
  if(req.method==="POST" && path.endsWith("/duel/win")){
    const u = checkInitData(req.headers["x-init-data"]); if(!u) return send(res,401,{error:"bad initData"});
    const d = await body(req); const db = load(); const c = db[""+d.challenger];
    if(c && c.started && c.chat){
      await tg("sendMessage", { chat_id:c.chat,
        text:`🏆 ${u.first_name||"Соперник"} обогнал тебя в дуэли: ${d.score|0} (твой ${d.target|0}). Реванш?`,
        reply_markup: PLAY_KB });
    }
    return send(res,200,{ok:true});
  }
  // — invoice для покупки за Stars
  if(req.method==="GET" && path.endsWith("/invoice")){
    const prod = PRODUCTS[url.searchParams.get("product")]; if(!prod) return send(res,400,{error:"unknown product"});
    const u = checkInitData(req.headers["x-init-data"]); if(!u) return send(res,401,{error:"bad initData"});
    const r = await tg("createInvoiceLink", { title:prod.title, description:prod.desc,
      payload:`${url.searchParams.get("product")}:${u.id}:${Date.now()}`, currency:"XTR", prices:[{label:prod.title, amount:prod.stars}] });
    if(!r.ok) return send(res,500,{error:r.description||"tg"});
    return send(res,200,{link:r.result});
  }
  // — вебхук бота: /start (регистрация), оплата
  if(req.method==="POST" && path.endsWith("/webhook")){
    const u = await body(req);
    if(u.pre_checkout_query) await tg("answerPreCheckoutQuery",{pre_checkout_query_id:u.pre_checkout_query.id, ok:true});
    const m = u.message;
    if(m && m.chat){
      const db=load(); const id=""+m.chat.id;
      db[id]=Object.assign(db[id]||{},{ id:m.chat.id, chat:m.chat.id, name:(m.from&&m.from.first_name||"").slice(0,18), started:true });
      save(db);
      if(m.text && m.text.startsWith("/start")) await tg("sendMessage",{chat_id:m.chat.id, text:"СТЭК 🧱 — башня в один тап. Погнали!", reply_markup:PLAY_KB});
      if(m.successful_payment) console.log("ОПЛАТА:", m.successful_payment.invoice_payload, m.successful_payment.total_amount,"XTR");
    }
    return send(res,200,{ok:true});
  }
  send(res,404,{error:"not found"});
});
server.listen(PORT, ()=>console.log("СТЭК server on :"+PORT));
