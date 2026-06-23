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
};
