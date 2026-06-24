/* СТЭК — платёжный бэкенд (Telegram Stars / XTR). Node 18+, без зависимостей.
   Запуск:  BOT_TOKEN=xxxx node bot/payments.js   (порт PORT, по умолч. 8787)
   Деплой на любой HTTPS-хост; затем:
     1) пропиши его URL в stack/js/pay.js → PAY_API
     2) поставь вебхук:  https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL>/webhook
   Делает: /invoice?product=ID → invoice-ссылку (Stars); /webhook → подтверждение оплаты. */
const http = require("http");
const crypto = require("crypto");

const TOKEN = process.env.BOT_TOKEN;
const PORT  = process.env.PORT || 8787;
if(!TOKEN){ console.error("Задай BOT_TOKEN"); process.exit(1); }
const API = `https://api.telegram.org/bot${TOKEN}`;

// товары и цены в Stars — синхронно с stack/js/pay.js
const PRODUCTS = {
  pass:   { title:"Премиум-пасс сезона", desc:"Все премиум-награды сезона + эксклюзивные скины", stars:150 },
  coins1: { title:"500 монет",  desc:"Пачка монет для СТЭК", stars:75 },
  coins2: { title:"1500 монет", desc:"Пачка монет для СТЭК", stars:199 },
};

async function tg(method, body){
  const r = await fetch(`${API}/${method}`, { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body) });
  return r.json();
}

// проверка подписи initData Telegram (безопасность: товар привязан к юзеру)
function checkInitData(initData){
  try{
    const p = new URLSearchParams(initData);
    const hash = p.get("hash"); p.delete("hash");
    const dcs = [...p.entries()].map(([k,v])=>`${k}=${v}`).sort().join("\n");
    const secret = crypto.createHmac("sha256","WebAppData").update(TOKEN).digest();
    const calc = crypto.createHmac("sha256",secret).update(dcs).digest("hex");
    if(calc!==hash) return null;
    return JSON.parse(p.get("user")||"{}");
  }catch(e){ return null; }
}

function send(res, code, obj){
  res.writeHead(code, {"content-type":"application/json","access-control-allow-origin":"*","access-control-allow-headers":"X-Init-Data"});
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url, "http://x");
  if(req.method==="OPTIONS") return send(res,204,{});

  // 1) создать invoice-ссылку
  if(req.method==="GET" && url.pathname.endsWith("/invoice")){
    const id = url.searchParams.get("product");
    const prod = PRODUCTS[id];
    if(!prod) return send(res,400,{error:"unknown product"});
    const user = checkInitData(req.headers["x-init-data"]||"");
    if(!user) return send(res,401,{error:"bad initData"});
    const payload = `${id}:${user.id}:${Date.now()}`;
    const r = await tg("createInvoiceLink", {
      title: prod.title, description: prod.desc, payload,
      currency: "XTR", prices: [{ label: prod.title, amount: prod.stars }],
    });
    if(!r.ok) return send(res,500,{error:r.description||"tg error"});
    return send(res,200,{ link:r.result });
  }

  // 2) вебхук бота: подтверждаем pre_checkout и фиксируем оплату
  if(req.method==="POST" && url.pathname.endsWith("/webhook")){
    let b=""; req.on("data",c=>b+=c); req.on("end", async ()=>{
      let u={}; try{ u=JSON.parse(b); }catch(e){}
      if(u.pre_checkout_query){ await tg("answerPreCheckoutQuery",{ pre_checkout_query_id:u.pre_checkout_query.id, ok:true }); }
      if(u.message && u.message.successful_payment){
        const sp=u.message.successful_payment;
        console.log("ОПЛАТА:", sp.invoice_payload, sp.total_amount, "XTR");
        // здесь можно записать покупку в БД (payload = product:userId:ts)
      }
      send(res,200,{ok:true});
    });
    return;
  }
  send(res,404,{error:"not found"});
});
server.listen(PORT, ()=>console.log("СТЭК payments on :"+PORT));
