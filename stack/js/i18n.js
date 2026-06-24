/* СТЭК — лёгкая локализация (RU исходник → EN заменой фрагментов).
   Применяется к готовому HTML/тостам, поэтому не трогает логику экранов.
   RU и EN не делят буквы, поэтому замена безопасна (атрибуты/числа не задеваются). */
(function(){
  const DICT = {
    "XP капает за каждый забег (выше башня и больше перфектов — больше XP). Сезон сменится через":
      "XP comes from every run (taller tower and more perfects = more XP). Season changes in",
    "СТЭК":"STACK",
    // длинные фразы (foot/описания)
    "Один тап — ставишь блок. Точно по центру — комбо и шире башня. Заходи каждый день: награда за стрик и новые задания.":
      "One tap drops a block. Hit dead-center for combo and a wider tower. Come back daily for streak rewards and new quests.",
    "Скины меняют только вид башни — никакого преимущества. Монеты капают за высоту и перфекты.":
      "Skins only change the look — no advantage. Coins come from height and perfects.",
    "Долгосрочные цели — награда начисляется автоматически при выполнении. Есть к чему возвращаться.":
      "Long-term goals — rewards are granted automatically. Always something to come back for.",
    "Каждый день — новая башня и новый рейтинг. Возвращайся за местом в топе.":
      "A new tower and ranking every day. Come back for a top spot.",
    "Сыграй дневной челлендж, чтобы попасть в список.":"Play the daily challenge to join the list.",
    "Один сид на день у всех.":"Everyone shares one seed per day.",
    "открывает все премиум-награды сезона + эксклюзивные скины":"unlocks all premium season rewards + exclusive skins",
    "Премиум-пасс активен в этом сезоне":"Premium pass active this season",
    "играй, чтобы прокачивать":"play to level up",
    "заходи каждый день — награда растёт":"come back daily — reward grows",
    // how-to
    "Тапни, чтобы поставить блок":"Tap to drop a block",
    "ставит движущийся блок на башню.":"drops the moving block onto the tower.",
    "комбо растёт, башня даже шире.":"combo grows, tower gets wider.",
    "режет край. Промахнулся мимо — конец.":"trims the edge. Miss entirely = game over.",
    "по центру — бонусные монеты.":"centered = bonus coins.",
    "Тап по экрану":"Tap the screen",
    "Точно по центру":"Dead-center",
    "Золотой блок":"Gold block",
    "Промах":"Miss",
    "Поехали":"Let's go",
    "тап — поставить блок":"tap to drop a block",
    // меню/кнопки
    "Дневной челлендж":"Daily challenge",
    "дневной челлендж":"daily challenge",
    "сегодня · твой рекорд":"today · your best",
    "Таблица · сегодня":"Ranking · today",
    "Магазин скинов":"Skin shop",
    "Ответить на вызов":"Answer challenge",
    "Бросить вызов другу":"Challenge a friend",
    "Бросить вызов":"Challenge",
    "Задания дня":"Daily quests",
    "обновятся завтра":"reset tomorrow",
    "Ежедневная награда":"Daily reward",
    "башня в один тап":"one-tap tower",
    "на той же башне":"on the same tower",
    "тебя вызвали":"you're challenged",
    "бросил вызов":"challenged you",
    "Активировать пасс":"Activate pass",
    "Нужен премиум-пасс":"Premium pass needed",
    "Не хватает монет на пасс":"Not enough coins for the pass",
    "Не хватает монет":"Not enough coins",
    "Премиум-пасс активирован!":"Premium pass activated!",
    "Награда забрана":"Reward claimed",
    "за первый вызов другу!":"for your first challenge!",
    "за первый вызов":"for first challenge",
    "за задание":"for a quest",
    "НОВЫЙ РЕКОРД":"NEW BEST",
    "Твой первый забег!":"Your first run!",
    "макс комбо":"max combo",
    "высота башни":"tower height",
    "вызов отправлен":"challenge sent",
    "приглашение отправлено":"invite sent",
    "ссылка скопирована":"link copied",
    "отправлено":"sent",
    "отмена":"cancelled",
    // короткие
    "есть награды":"rewards ready",
    "перфектов всего":"perfects total",
    "перфектов за забег":"perfects in a run",
    "в одном забеге":"in one run",
    "скина в коллекции":"skins collected",
    "Магазин":"Shop",
    "Таблица":"Ranking",
    "Позвать":"Invite",
    "Играть":"Play",
    "Ещё раз":"Again",
    "Домой":"Home",
    "Уровень":"Level","уровень":"level",
    "Сезон":"Season",
    "осталось":"left","открыть":"open",
    "Высота ":"Height ",
    "перфектов":"perfects",
    "забегов":"runs","забега":"runs","забег":"run",
    "Набери":"Reach","Сыграй":"Play","Комбо ×":"Combo ×",
    "не хватило":"short by",
    "обогнал":"beat",
    "лучше":"better than","игроков":"of players",
    "рекорд":"best","монет":"coins","побей":"beat",
    "дуэль":"duel","Дуэль":"Duel",
    "стрик":"streak","Стрик":"Streak","дней":"days","день":"day",
    "Цели":"Goals","Надеть":"Equip","надет":"on",
    "скин":"skin","Награда":"Reward",
    " на той же башне → играть":" on the same tower → play",
    " дн.":"d"," до ":" to "," на ":" by ",
    "· ты":"· you","· твой":"· your",
    // скины
    "Радуга":"Rainbow","Неон":"Neon","Закат":"Sunset","Лёд":"Ice","Кислота":"Acid","Золото":"Gold","Нуар":"Noir","Аврора":"Aurora","Лава":"Lava",
    // сезоны
    "Неоновый сезон":"Neon season","Ледяной сезон":"Ice season","Золотая лихорадка":"Gold rush","Кислотный сезон":"Acid season",
    // ники таблицы
    "Соня":"Sonya","Кай":"Kai","Макс":"Max","Алиса":"Alice","Дэн":"Dan","Ника":"Nika","Лёва":"Leva","Рита":"Rita","Тимур":"Timur","Ева":"Eva","Глеб":"Gleb","Маша":"Masha","Артём":"Artem","Юля":"Yulia","Стас":"Stas","Лера":"Lera","Марк":"Mark","Аня":"Anya","Игрок":"Player","Ты":"You",
  };
  const KEYS = Object.keys(DICT).sort((a,b)=>b.length-a.length); // длинные первыми

  let lang = "ru";
  function set(l){ lang = (l==="en")?"en":"ru"; }
  function get(){ return lang; }
  function t(s){
    if(lang!=="en" || s==null) return s;
    let out = ""+s;
    for(const k of KEYS) if(out.indexOf(k)>=0) out = out.split(k).join(DICT[k]);
    return out;
  }
  window.STACK_I18N = { set, get, t };
})();
