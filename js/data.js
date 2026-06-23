/* ============================================================
   LORE — content & narrative grammar
   This is the "writers' room" the AI showrunner draws from.
   Everything is parameterized with {you}, {co}, {world}, etc.
   ============================================================ */
window.LORE_DATA = {

  archetypes: [
    { id:"star",     emoji:"🌟", name:"The Star",     desc:"Born for the spotlight. Adored, envied, watched.",      g:["#ff9d3d","#7a1538"], accent:"#ffd66b" },
    { id:"rebel",    emoji:"🔥", name:"The Rebel",    desc:"Breaks the rules everyone else obeys.",                g:["#ff4d6d","#2a1147"], accent:"#ff6b3d" },
    { id:"mystery",  emoji:"🌙", name:"The Mystery",  desc:"Nobody knows your real story. Yet.",                   g:["#243b8f","#06121f"], accent:"#5cd6ff" },
    { id:"lover",    emoji:"💗", name:"The Heart",    desc:"Every season turns on who you choose.",                g:["#ff7eb6","#3a1255"], accent:"#ff9ed1" },
    { id:"trickster",emoji:"🎭", name:"The Trickster",desc:"Chaos follows you and the fans love it.",               g:["#19c0a8","#241050"], accent:"#19e6c1" },
    { id:"underdog", emoji:"⚡", name:"The Underdog", desc:"Counted out. About to flip the whole world.",          g:["#ffd66b","#5e2a0e"], accent:"#ffb43d" },
  ],

  worlds: [
    { id:"neon",    emoji:"🌆", name:"Neon City",      desc:"Rooftop parties, secret clubs, midnight deals.",   g:["#1a0b2e","#3d1361"] },
    { id:"academy", emoji:"🎓", name:"Elite Academy",  desc:"Old money, sharp rivalries, forbidden romance.",   g:["#0d1b2a","#1b3a4b"] },
    { id:"fame",    emoji:"🎬", name:"Fame Heights",   desc:"Influencers, labels, the climb to the top.",       g:["#2a0a1f","#5e1239"] },
    { id:"realm",   emoji:"🗡️", name:"The Riven Realm",desc:"Crowns, prophecies, blades in the dark.",          g:["#0a1a14","#143a2a"] },
    { id:"after",   emoji:"🌌", name:"Afterglow",      desc:"A city that never sleeps, between worlds.",         g:["#150a2a","#2e1b5e"] },
  ],

  // suggested co-stars when the player has no real friends to invite yet
  seedNames: ["Kai","Mira","Dev","Luna","Theo","Nova","Zane","Ivy","Rio","Sage","Jin","Esme","Cole","Wren","Ash","Remy"],

  relationships: {
    ally:   { label:"Ally",   color:"var(--ally)",   verb:"has your back" },
    rival:  { label:"Rival",  color:"var(--rival)",  verb:"wants you gone" },
    love:   { label:"Love",   color:"var(--love)",   verb:"can't stay away" },
    secret: { label:"Secret", color:"var(--secret)", verb:"knows something" },
  },

  // status ladder (fans needed)
  tiers: [
    { id:0, name:"Nameless",            req:0 },
    { id:1, name:"Character w/ Lore",   req:300 },
    { id:2, name:"Local Star",          req:1500 },
    { id:3, name:"Legend of the Season",req:7000 },
    { id:4, name:"CANON",               req:25000 },
  ],

  achievements: [
    { id:"pilot",     icon:"🎬", t:"Pilot Aired",         d:"You shot your very first episode." },
    { id:"firstfan",  icon:"💜", t:"First 100 Fans",      d:"Someone out there is rooting for you." },
    { id:"costar",    icon:"🤝", t:"Co-Star Cast",        d:"You pulled a real person into your story." },
    { id:"cliff",     icon:"😱", t:"Cliffhanger King",    d:"An episode of yours broke 10k views." },
    { id:"heartbreak",icon:"💔", t:"Heartbreak Arc",      d:"You let a love line burn. Iconic." },
    { id:"villain",   icon:"😈", t:"Main Villain",        d:"You chose chaos. The fans ate it up." },
    { id:"streak",    icon:"🔥", t:"7-Day Streak",        d:"A week of episodes. The algorithm noticed." },
    { id:"viral",     icon:"🚀", t:"Gone Viral",          d:"A clip of yours left the app." },
    { id:"legend",    icon:"👑", t:"Legend of the Season",d:"You climbed past 7,000 fans." },
    { id:"canon",     icon:"🏛️", t:"Written into Canon",  d:"You are now permanent LORE." },
    { id:"retconwar", icon:"↺",  t:"Retcon War",          d:"You rewrote the past. History is yours now." },
    { id:"canonduel", icon:"⚔️", t:"Canon Duel",          d:"You took a story dispute to the room — and won." },
    { id:"bughunter", icon:"🐛", t:"Lore Bug Bounty",     d:"You caught the showrunner slipping. Iconic." },
    { id:"caster",    icon:"📨", t:"Casting Director",     d:"A friend accepted their role in your series." },
    { id:"saboteur",  icon:"🕵️", t:"The Saboteur",         d:"You injected an anonymous twist into the canon." },
    { id:"crossover", icon:"🌀", t:"Cursed Crossover",     d:"You collided two worlds into one cursed episode." },
    { id:"gueststar", icon:"🎬", t:"Guest Star",           d:"You guest-starred in someone else's series." },
  ],

  // DISCOVER — other creators' ongoing series you can guest-star in
  creatorTaglines: [
    " in their villain era","fresh off a season finale","the most shipped cast this week",
    "down bad and trending","one betrayal from CANON","rewriting their whole lore",
    "currently at war with their own cast","accidentally went viral last night",
  ],
  guestOpens: [
    "{you} pulled up to {host}'s world uninvited — and stole the entire scene.",
    "{host} did NOT plan for {you} to show up. The fans did though.",
    "One guest slot opened in {host}'s series. {you} kicked the door in.",
    "{you} walked onto {host}'s set like they owned it. Honestly? They kind of did now.",
  ],
  guestBeats: [
    "{host}'s cast didn't know whether to clap or run. {you} just smiled.",
    "Half of {host}'s fans switched allegiance the second {you} spoke.",
    "{host} tried to keep control of their own story. {you} had other plans.",
  ],

  // WRITERS' ROOM SABOTAGE — drop an anonymous chaos twist nobody can trace
  sabotageOptions: [
    "Everyone secretly swaps loyalties before the night is over.",
    "A character everyone thought was gone walks back in.",
    "The whole world finds out {you}'s biggest secret at once.",
    "Two sworn enemies are forced to team up — or lose everything.",
    "Someone proposes. Loudly. To absolutely the wrong person.",
    "The lights cut, and when they return, one person is missing.",
  ],

  // CURSED CROSSOVER — collide your world with another
  crossoverOpens: [
    "Reality glitched. {world} bled straight into {world2}, and {you} was standing on the seam.",
    "Nobody asked for {world} and {world2} to collide. {you} got the front-row seat anyway.",
    "Two worlds, one night. {you} woke up in {world}, but the rules of {world2} came with.",
  ],

  // RETCON WAR — rewrite the past, flip a co-star into the villain
  retconTitles: ["RETCON: {co} Was Always the Villain","RETCON: The Truth About {co}",
                 "RETCON: {co}, Rewritten","RETCON: Everyone Forgot What {co} Did"],
  retconScenes: [
    "Turns out the story was never what you thought. {co} set all of it up. You just hadn't noticed.",
    "New canon, effective immediately: {co} was the problem the whole time. The receipts were always there.",
    "You rewound the tape. Frame by frame, {co}'s smile gets worse. The fans see it now too.",
    "One edit and the whole season flips. {co} isn't the friend anymore. {co} is the reason.",
  ],
  retconCliffs: [
    "{co} just got the notification. The reply is going to be ugly.",
    "Half the fandom switched sides in an hour. {co} has no idea yet.",
    "Somewhere, {co} is screenshotting this for a comeback. Good luck.",
  ],

  /* ---------------- NARRATIVE GRAMMAR ----------------
     The engine composes episodes from these slot pools.
     {you} = player, {co} = a co-star, {world} = world name */

  // episode title fragments -> "The {a} {b}"
  titleA: ["Last","Secret","Burning","Stolen","Forbidden","Midnight","Broken","Golden","Silent","Final","Hidden","Cruel","Sweet","Reckless"],
  titleB: ["Confession","Betrayal","Crown","Kiss","Promise","Lie","Spotlight","Heist","Rumor","Choice","Dance","Truth","War","Goodbye"],

  // cold opens by archetype
  opens: {
    star:    ["The whole {world} was watching when {you} walked in — and {you} loved it.",
              "Cameras, whispers, flashbulbs. {you} owned the room before saying a word."],
    rebel:   ["{you} wasn't supposed to be here tonight. That was exactly the point.",
              "Rules were made to be broken, and {you} had a long list to get through."],
    mystery: ["Nobody in {world} could say where {you} came from. The not-knowing made them lean closer.",
              "{you} kept one secret behind every smile. Tonight, one of them slipped."],
    lover:   ["Two people wanted {you} tonight. {you} could only ruin one of them.",
              "{you} swore not to fall again. {world} had other plans."],
    trickster:["{you} set the whole thing in motion just to see what would happen.",
              "Chaos has a favorite child in {world}, and tonight it wore {you}'s face."],
    underdog:["They laughed at {you} last season. Nobody was laughing now.",
              "{you} had nothing left to lose — which, in {world}, made {you} dangerous."],
  },

  // mid beats keyed by relationship type of the co-star in scene
  beats: {
    ally:   ["{co} pulled {you} aside. “Whatever happens next, I'm in. Don't make me regret it.”",
             "{co} covered for {you} when it counted. Now {co} wanted a favor back.",
             "“We do this together or not at all,” {co} said, eyes locked on {you}."],
    rival:  ["{co} smiled the way only an enemy can. “Enjoy tonight. It's the last one you'll win.”",
             "{co} had been collecting {you}'s mistakes like trophies. Tonight {co} cashed one in.",
             "Across the room, {co} raised a glass to {you} — a toast that felt like a threat."],
    love:   ["{co} stepped close enough that {you} forgot the rest of {world} existed.",
             "“Tell me to leave and I will,” {co} whispered. {you} didn't.",
             "{co} left a note in {you}'s hand and disappeared before {you} could read it."],
    secret: ["{co} knew. {you} could see it. The only question was the price of silence.",
             "“I saw what you did,” {co} murmured. “And I haven't decided what to do about it.”",
             "{co} slid a phone across the table. One photo. {you}'s whole world on a screen."],
  },

  // generic beats when no co-star yet
  solo: ["A message lit up {you}'s phone from a number with no name.",
         "The music dropped, the lights cut, and every head in {world} turned toward {you}.",
         "{you} found the one door in {world} that was never supposed to open — slightly ajar.",
         "An invitation arrived sealed in gold. No sender. Just {you}'s name."],

  // cliffhangers
  cliffs: ["Then the doors flew open — and the one person {you} swore was gone walked in.",
           "{you}'s phone buzzed once. The message read: “They know.”",
           "The lights came back up. Everyone was staring at {you}. Someone had said {you}'s name on stage.",
           "And that's when {you} realized the whole night had been a setup — by someone {you} trusted.",
           "A single word was waiting on the mirror in lipstick. {you}'s name, crossed out.",
           "The screen went dark. When it lit again, {you} was trending across all of {world}."],

  // the choices offered after each episode. {a}/{b} = co-star names if any
  choiceSets: [
    [ {t:"Confront them in front of everyone", k:"🔥", tag:"bold",   eff:{rival:+2, fans:1.4}},
      {t:"Slip away and keep the secret",      k:"🌙", tag:"sly",    eff:{secret:+2, fans:1.0}},
      {t:"Make it a public spectacle",         k:"🎭", tag:"chaos",  eff:{fans:1.7, rival:+1}} ],
    [ {t:"Choose {a}",                         k:"💗", tag:"romance", eff:{love:+3, fans:1.3}},
      {t:"Choose {b}",                         k:"💞", tag:"romance", eff:{love:+3, fans:1.3}},
      {t:"Choose nobody. Choose the crown.",   k:"👑", tag:"power",   eff:{fans:1.5}} ],
    [ {t:"Trust {a} with everything",          k:"🤝", tag:"loyal",   eff:{ally:+3, fans:1.1}},
      {t:"Betray {a} before they betray you",  k:"🗡️", tag:"villain", eff:{rival:+3, fans:1.6}},
      {t:"Disappear and let them wonder",      k:"💨", tag:"mystery", eff:{secret:+2, fans:1.2}} ],
    [ {t:"Burn it all down",                   k:"💥", tag:"chaos",   eff:{fans:1.9, rival:+2}},
      {t:"Play the long game",                 k:"♟️", tag:"power",   eff:{fans:1.2, ally:+1}},
      {t:"Tell the truth, finally",            k:"🕊️", tag:"honest",  eff:{love:+1, fans:1.4}} ],
  ],

  // names/titles for the trending feed (fake but believable other "creators")
  feedNames: ["@sterling","@yuki.exe","@thecrownless","@rhea_rising","@no.lastname","@kingoftuesday",
              "@velvet","@d3vil_may","@ophelia.mp4","@lastsong","@apex.ari","@miss.midnight"],
  feedTitles: ["The Last Confession","Betrayed at the Gala","She Chose Wrong","The Heist Goes Live",
               "Crowned and Hunted","The Kiss That Ended a Season","Caught on Camera","The Double Cross",
               "Midnight Coup","The Secret Twin","Burned Every Bridge","Trending by Accident"],

  // fan comments shown under played episodes (social proof + dopamine)
  fanNames: ["@stan_no1","@plottwist","@cryingrn","@team_{you}","@notyourbabe","@lorehead","@s1ep7",
             "@midnight.cut","@unaliveme","@shipper.exe","@certified.fan","@4amthoughts","@itsgiving",
             "@maincharacter","@thatwaswild","@rewatching","@sobbing","@chronically.online"],
  fanComments: {
    hype:  ["NObody is doing it like {you} 😭🔥","screaming this episode ate","{you} the blueprint fr","ok MAIN CHARACTER energy 💅","this is so cinematic i cant","{you} said let me end them ✋"],
    ship:  ["{you} x {co} or i riot 😩","the TENSION between {you} and {co} hello??","i ship it im sorry","{co} look at {you} ONE more time challenge","they're literally endgame stop"],
    shock: ["NO BECAUSE THE CLIFFHANGER 😱","i gasped on the train","not me yelling at my phone","WHO let this happen","plot armor who? {you} in DANGER"],
    villain:["{you} the villain we deserve 😈","not {you} being iconic AND evil","ok but he's right tho","villain arc of the season fr","i fear {you} but i respect it"],
  },

  // Writers' Room — daily plot-twist polls (the retention loop)
  writersPrompts: [
    { setup:"The showrunner is deciding next season's first twist. Cast your vote.",
      options:[ {t:"A new rival arrives from {you}'s past", eff:1.0},
                {t:"{you}'s secret finally goes public",   eff:1.3},
                {t:"A love triangle nobody saw coming",    eff:1.1} ] },
    { setup:"The fans want a finale moment. What ends the season?",
      options:[ {t:"A wedding that gets interrupted",      eff:1.2},
                {t:"A betrayal at the very last second",   eff:1.4},
                {t:"{you} walks away from it all",          eff:1.0} ] },
    { setup:"Pick the genre the world leans into next.",
      options:[ {t:"Heist thriller",  eff:1.1},
                {t:"Forbidden romance",eff:1.2},
                {t:"Murder mystery",   eff:1.3} ] },
    { setup:"A mystery character is joining. Who are they to {you}?",
      options:[ {t:"A long-lost sibling", eff:1.1},
                {t:"An ex who got famous",eff:1.3},
                {t:"A stalker with a plan",eff:1.4} ] },
  ],

  finaleTitles: ["SEASON FINALE: Everything Burns","SEASON FINALE: The Last Crown","SEASON FINALE: No One Walks Away","SEASON FINALE: The Truth, Finally"],

  // CANON DUEL — two contradicting versions of the same event; the room decides
  duelClaims: [
    { topic:"the breakup",   a:"{you} ended it. Clean.",            b:"{co} walked first and never looked back." },
    { topic:"the party",     a:"{you} was never even there.",       b:"{you} started the whole thing." },
    { topic:"the secret",    a:"{co} told everyone.",               b:"{you} kept it. {co} is lying." },
    { topic:"the win",       a:"{you} earned it fair.",             b:"{you} only won because {co} let it slide." },
    { topic:"the betrayal",  a:"{co} sold {you} out.",              b:"{you} did it first." },
  ],

  // LORE BUG BOUNTY — the showrunner's funniest continuity slips
  loreBugs: [
    "The showrunner brought back a character it killed off two episodes ago. No explanation.",
    "{you} was in two places in the same scene. The fans noticed before you did.",
    "An ally suddenly had a twin nobody mentioned. Classic.",
    "A 'permanent' tattoo vanished by the next episode.",
    "The showrunner forgot whose birthday party it was — and made it {you}'s twice.",
    "Someone's name changed spelling mid-episode. The receipts are everywhere.",
  ],
};
