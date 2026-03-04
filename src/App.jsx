import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// 網頁原生音效引擎 (高音質人聲優化版)
// ==========================================
const SoundEngine = {
  ctx: null,
  bgmInterval: null,
  noteIndex: 0,
  isVoiceOn: true, 
  currentUtterance: null,
  voices: [],
  melody: [
    [392, 0.2], [392, 0.2], [440, 0.4], [392, 0.4], [523, 0.4], [493, 0.8],
    [392, 0.2], [392, 0.2], [440, 0.4], [392, 0.4], [587, 0.4], [523, 0.8]
  ],
  init() {
    try {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      
      // 預先載入系統語音庫
      if ('speechSynthesis' in window) {
        this.voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          this.voices = window.speechSynthesis.getVoices();
        };
      }
    } catch (e) { console.log("AudioContext 初始化失敗", e); }
  },
  unlockAudio() {
    this.init();
    if (this.ctx) {
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
    }
  },
  play(freq, type, duration, vol) {
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  pop() { this.play(600, 'sine', 0.1, 0.05); },
  correct() {
    this.play(600, 'sine', 0.1, 0.1);
    setTimeout(() => this.play(800, 'sine', 0.15, 0.1), 100);
  },
  wrong() { this.play(250, 'sawtooth', 0.3, 0.1); },
  buy() {
    this.play(400, 'square', 0.1, 0.05);
    setTimeout(() => this.play(600, 'square', 0.1, 0.05), 100);
    setTimeout(() => this.play(800, 'square', 0.2, 0.05), 200);
  },
  toggleBGM(enable) {
    if (enable) {
      this.init();
      if (this.bgmInterval) return;
      this.noteIndex = 0;
      this.bgmInterval = setInterval(() => {
        const [freq, dur] = this.melody[this.noteIndex];
        this.play(freq, 'triangle', dur, 0.015);
        this.noteIndex = (this.noteIndex + 1) % this.melody.length;
      }, 400);
    } else {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  },
  toggleVoice(enable) {
    this.isVoiceOn = enable;
    if (!enable && 'speechSynthesis' in window) window.speechSynthesis.cancel(); 
  },
  unlockSpeech() {
    if ('speechSynthesis' in window) {
      const unlockMsg = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(unlockMsg);
    }
  },
  speak(text, lang = 'zh-TW') {
    if (!this.isVoiceOn) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      this.currentUtterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance.lang = lang; 
      
      // 尋找最高品質的人聲
      if (this.voices.length > 0) {
        let bestVoice = null;
        if (lang === 'en-US') {
          const engVoices = this.voices.filter(v => v.lang.startsWith('en'));
          bestVoice = engVoices.find(v => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Samantha')) || engVoices[0];
        } else {
          const twVoices = this.voices.filter(v => v.lang === 'zh-TW');
          bestVoice = twVoices.find(v => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Mei-Jia')) || twVoices[0];
        }
        if (bestVoice) this.currentUtterance.voice = bestVoice;
      }

      this.currentUtterance.rate = lang === 'en-US' ? 0.85 : 1.1; 
      this.currentUtterance.pitch = lang === 'en-US' ? 1.0 : 1.1; 
      this.currentUtterance.volume = lang === 'en-US' ? 1.0 : 0.4; 
      window.speechSynthesis.speak(this.currentUtterance);
    }
  }
};

// ==========================================
// 100 種答對稱讚語音庫
// ==========================================
const PRAISES = [
  "太棒了！", "完全正確！", "你好聰明喔！", "繼續保持！", "簡直是語言天才！", "太完美了！", "發音好標準！", "反應真快！", "沒錯就是這樣！", "好聰明！",
  "一百分！", "太神了！", "讚啦！", "非常優秀！", "超乎想像！", "英文大師就是你！", "無懈可擊！", "太厲害了！", "真是個小神童！", "完美過關！",
  "拼寫速度一流！", "語感滿分！", "無人能敵！", "哆啦A夢都嚇一跳！", "大雄要向你學習了！", "靜香為你鼓掌！", "小夫都嫉妒你了！", "胖虎覺得你很行！", "銅鑼燒是你的了！", "英文難不倒你！",
  "太出色了！", "你太棒了！", "好極了！", "做得好！", "超級棒！", "你真是太棒了！", "這題也難不倒你！", "太帥氣了！", "你一定有偷練！", "無與倫比！",
  "太驚人了！", "簡直無敵！", "拼得真好！", "太快了吧！", "你真聰明！", "絕佳的表現！", "令人佩服！", "這答案太完美！", "天才般的語感！", "你真棒！",
  "為你歡呼！", "真了不起！", "太傑出了！", "無可挑惕！", "外國人都沒你快！", "百發百中！", "太強大了！", "你是我見過最聰明的！", "真是不簡單！", "掌聲鼓勵鼓勵！",
  "拼得真漂亮！", "你太會拼了吧！", "這簡直是奇蹟！", "你絕對是第一名！", "英文小天才！", "太不可思議了！", "你的表現太亮眼了！", "真讓我刮目相看！", "太讓人驕傲了！", "完美命中！",
  "拼得完全正確！", "你的發音真好！", "太優秀啦！", "真是無懈可擊！", "拼得又快又準！", "你真是我的偶像！", "太有才華了！", "這答案太精準了！", "你的腦筋轉得真快！", "太厲害啦！",
  "你真是英文小達人！", "太神準了！", "你的頭腦真清楚！", "太令人驚艷了！", "拼得完全沒錯！", "你真是太神了！", "太讓人讚嘆了！", "你的單字量真是一流！", "太漂亮了！", "你真是英文高手！",
  "太不可思議的準確！", "你的答案無可挑剔！", "太讓人驚訝了！", "你的表現真是頂級！", "太出神入化了！", "你的拼寫真是神乎其技！", "太有智慧了！", "你的頭腦真是靈光！", "太絕妙了！", "完美無瑕！"
];

// 角色與道具資料
const CHARACTERS = [
  { name: "哆啦A夢", icon: "🐱", image: "doraemon.png", color: "bg-blue-500", textColor: "text-blue-500", borderColor: "border-blue-500", msgs: ["仔細聽聲音！幫我拼對這題賺銅鑼燒！", "按下喇叭按鈕，聽聽看是哪個字母的聲音！", "留意母音的變化，答案就在裡面！", "就算拼錯也沒關係，多聽幾次我們再試！", "拼出來了嗎？我等不及要吃銅鑼燒了！"] },
  { name: "大雄", icon: "👦🏻", image: "nobita.png", color: "bg-orange-400", textColor: "text-orange-500", borderColor: "border-orange-400", msgs: ["嗚嗚，英文發音好難...你可以教教我嗎？", "拼完這題我就可以去睡午覺了嗎？", "翻譯蒟蒻壞了，只能靠你了！", "這聲音聽起來好像...我還是不知道！", "你拼得好快喔！教教我自然發音的秘訣吧！"] },
  { name: "靜香", icon: "👧🏻", image: "shizuka.png", color: "bg-pink-400", textColor: "text-pink-500", borderColor: "border-pink-400", msgs: ["用心聽，跟著唸一次，一定能找到正確答案喔！", "忘記的時候，可以打開參考書複習一下。", "加油！我相信你的英文語感！", "專心聽！找對群組的規則就會拼了。", "你專心唸英文的樣子很帥氣呢！"] },
  { name: "小夫", icon: "🦊", image: "suneo.png", color: "bg-green-500", textColor: "text-green-600", borderColor: "border-green-500", msgs: ["哼，這麼簡單的單字，你該不會拼錯吧？", "我可是有請外國人家教的，這題我早就會了！", "如果你聽不懂，我可以勉強唸一次給你聽喔。", "這題要是出在考試裡，我一定拿一百分！", "這聲音的組合，我早就背起來了！"] },
  { name: "胖虎", icon: "🦍", image: "gian.png", color: "bg-orange-600", textColor: "text-orange-700", borderColor: "border-orange-600", msgs: ["拼對的話，我就用英文唱歌給你聽！", "快點拼！我們要去打棒球了！", "不准放棄！大聲唸出來！", "自然發音就是把字拆開！像我揮棒一樣！", "要是拼錯了，就給我去空地罰站聽我唱歌！"] }
];

const GADGETS = [
  { icon: "🚁", name: "竹蜻蜓", cost: 30, desc: "降低 1 級難度，換一個簡單一點的單字！" },
  { icon: "🍞", name: "記憶吐司", cost: 50, desc: "吃了它，正確的字母就會直接浮現在輸入框中喔！" },
  { icon: "🚪", name: "任意門", cost: 80, desc: "直接打開門通往下一關，不用作答也能獲得獎勵！" },
  { icon: "🔦", name: "縮小燈", cost: 120, desc: "光線一照，這題會退回最基礎的短母音 CVC 單字！" },
  { icon: "🧥", name: "隱形斗篷", cost: 150, desc: "進入隱形特訓！全範圍隨機 5 題總複習，答對得 80 銅鑼燒！" },
  { icon: "⏰", name: "時光機", cost: 100, desc: "時光倒流！直接下降 4 級難度，讓發音特訓變得輕輕鬆鬆！" }
];

const FLOWERS = [
  { icon: "🌼", name: "小白菊", cost: 100 }, { icon: "🌻", name: "向日葵", cost: 120 }, { icon: "🌷", name: "鬱金香", cost: 150 }, { icon: "🌹", name: "紅玫瑰", cost: 180 }, { icon: "🌸", name: "櫻花樹", cost: 200 }
];

const DEFAULT_STATS = { lastPlayDate: new Date().toDateString(), todayCorrect: 0, todayWrong: 0, todayTime: 0, totalCorrect: 0, totalWrong: 0, totalTime: 0 };
const APP_VERSION = "v6.0 進階滿百特訓版";

const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}分${s}秒`;
};

// ==========================================
// 英文自然發音題庫 (Phonics Database) 嚴格對應 50 級
// ==========================================
const PHONICS_DB = [
  // 短母音 (Lv 1-10)
  { level: 1, typeName: "短母音 A", word: "cat", prefix: "c", target: "a", suffix: "t" },
  { level: 2, typeName: "短母音 A", word: "map", prefix: "m", target: "a", suffix: "p" },
  { level: 3, typeName: "短母音 E", word: "bed", prefix: "b", target: "e", suffix: "d" },
  { level: 4, typeName: "短母音 E", word: "red", prefix: "r", target: "e", suffix: "d" },
  { level: 5, typeName: "短母音 I", word: "pig", prefix: "p", target: "i", suffix: "g" },
  { level: 6, typeName: "短母音 I", word: "sit", prefix: "s", target: "i", suffix: "t" },
  { level: 7, typeName: "短母音 O", word: "dog", prefix: "d", target: "o", suffix: "g" },
  { level: 8, typeName: "短母音 O", word: "fox", prefix: "f", target: "o", suffix: "x" },
  { level: 9, typeName: "短母音 U", word: "sun", prefix: "s", target: "u", suffix: "n" },
  { level: 10, typeName: "短母音 U", word: "cup", prefix: "c", target: "u", suffix: "p" },

  // 魔法 E (Lv 11-20)
  { level: 11, typeName: "魔法 E (a_e)", word: "cake", prefix: "c", target: "a", suffix: "ke" },
  { level: 12, typeName: "魔法 E (a_e)", word: "game", prefix: "g", target: "a", suffix: "me" },
  { level: 13, typeName: "魔法 E (i_e)", word: "bike", prefix: "b", target: "i", suffix: "ke" },
  { level: 14, typeName: "魔法 E (i_e)", word: "five", prefix: "f", target: "i", suffix: "ve" },
  { level: 15, typeName: "魔法 E (o_e)", word: "nose", prefix: "n", target: "o", suffix: "se" },
  { level: 16, typeName: "魔法 E (o_e)", word: "rose", prefix: "r", target: "o", suffix: "se" },
  { level: 17, typeName: "魔法 E (u_e)", word: "cute", prefix: "c", target: "u", suffix: "te" },
  { level: 18, typeName: "魔法 E (u_e)", word: "tube", prefix: "t", target: "u", suffix: "be" },
  { level: 19, typeName: "魔法 E 綜合", word: "make", prefix: "m", target: "a", suffix: "ke" },
  { level: 20, typeName: "魔法 E 綜合", word: "time", prefix: "t", target: "i", suffix: "me" },

  // 複合子音 (Lv 21-30)
  { level: 21, typeName: "複合子音 sh", word: "ship", prefix: "", target: "sh", suffix: "ip" },
  { level: 22, typeName: "複合子音 sh", word: "fish", prefix: "fi", target: "sh", suffix: "" },
  { level: 23, typeName: "複合子音 ch", word: "chat", prefix: "", target: "ch", suffix: "at" },
  { level: 24, typeName: "複合子音 ch", word: "rich", prefix: "ri", target: "ch", suffix: "" },
  { level: 25, typeName: "複合子音 th", word: "thin", prefix: "", target: "th", suffix: "in" },
  { level: 26, typeName: "複合子音 th", word: "math", prefix: "ma", target: "th", suffix: "" },
  { level: 27, typeName: "複合子音 wh", word: "when", prefix: "", target: "wh", suffix: "en" },
  { level: 28, typeName: "複合子音 ph", word: "photo", prefix: "", target: "ph", suffix: "oto" },
  { level: 29, typeName: "連音 blends", word: "play", prefix: "", target: "pl", suffix: "ay" },
  { level: 30, typeName: "連音 blends", word: "tree", prefix: "", target: "tr", suffix: "ee" },

  // 母音音組 (Lv 31-40)
  { level: 31, typeName: "母音組 ee", word: "see", prefix: "s", target: "ee", suffix: "" },
  { level: 32, typeName: "母音組 ea", word: "read", prefix: "r", target: "ea", suffix: "d" },
  { level: 33, typeName: "母音組 oa", word: "boat", prefix: "b", target: "oa", suffix: "t" },
  { level: 34, typeName: "母音組 ai", word: "rain", prefix: "r", target: "ai", suffix: "n" },
  { level: 35, typeName: "母音組 ay", word: "day", prefix: "d", target: "ay", suffix: "" },
  { level: 36, typeName: "母音組 ie", word: "pie", prefix: "p", target: "ie", suffix: "" },
  { level: 37, typeName: "母音組 ui", word: "juice", prefix: "j", target: "ui", suffix: "ce" },
  { level: 38, typeName: "雙母音 oo", word: "book", prefix: "b", target: "oo", suffix: "k" },
  { level: 39, typeName: "雙母音 oo", word: "moon", prefix: "m", target: "oo", suffix: "n" },
  { level: 40, typeName: "母音組綜合", word: "train", prefix: "tr", target: "ai", suffix: "n" },

  // R控制音與雙母音 (Lv 41-50)
  { level: 41, typeName: "R控制音 ar", word: "car", prefix: "c", target: "ar", suffix: "" },
  { level: 42, typeName: "R控制音 ar", word: "star", prefix: "st", target: "ar", suffix: "" },
  { level: 43, typeName: "R控制音 or", word: "corn", prefix: "c", target: "or", suffix: "n" },
  { level: 44, typeName: "R控制音 er", word: "tiger", prefix: "tig", target: "er", suffix: "" },
  { level: 45, typeName: "R控制音 ir", word: "bird", prefix: "b", target: "ir", suffix: "d" },
  { level: 46, typeName: "R控制音 ur", word: "nurse", prefix: "n", target: "ur", suffix: "se" },
  { level: 47, typeName: "雙母音 ou", word: "house", prefix: "h", target: "ou", suffix: "se" },
  { level: 48, typeName: "雙母音 ow", word: "cow", prefix: "c", target: "ow", suffix: "" },
  { level: 49, typeName: "雙母音 oi", word: "coin", prefix: "c", target: "oi", suffix: "n" },
  { level: 50, typeName: "雙母音 oy", word: "boy", prefix: "b", target: "oy", suffix: "" },

  // L-連音 (Lv 51-55)
  { level: 51, typeName: "L-連音 bl", word: "black", prefix: "", target: "bl", suffix: "ack" },
  { level: 52, typeName: "L-連音 cl", word: "clock", prefix: "", target: "cl", suffix: "ock" },
  { level: 53, typeName: "L-連音 fl", word: "flag", prefix: "", target: "fl", suffix: "ag" },
  { level: 54, typeName: "L-連音 gl", word: "glass", prefix: "", target: "gl", suffix: "ass" },
  { level: 55, typeName: "L-連音 sl", word: "sleep", prefix: "", target: "sl", suffix: "eep" },

  // R-連音 (Lv 56-65)
  { level: 56, typeName: "R-連音 br", word: "brown", prefix: "", target: "br", suffix: "own" },
  { level: 57, typeName: "R-連音 cr", word: "crab", prefix: "", target: "cr", suffix: "ab" },
  { level: 58, typeName: "R-連音 dr", word: "drum", prefix: "", target: "dr", suffix: "um" },
  { level: 59, typeName: "R-連音 fr", word: "frog", prefix: "", target: "fr", suffix: "og" },
  { level: 60, typeName: "R-連音 gr", word: "green", prefix: "", target: "gr", suffix: "een" },
  { level: 61, typeName: "R-連音 pr", word: "price", prefix: "", target: "pr", suffix: "ice" },
  { level: 62, typeName: "R-連音 br", word: "bread", prefix: "", target: "br", suffix: "ead" },
  { level: 63, typeName: "R-連音 cr", word: "cross", prefix: "", target: "cr", suffix: "oss" },
  { level: 64, typeName: "R-連音 dr", word: "drop", prefix: "", target: "dr", suffix: "op" },
  { level: 65, typeName: "R-連音 fr", word: "free", prefix: "", target: "fr", suffix: "ee" },

  // S-連音 (Lv 66-75)
  { level: 66, typeName: "S-連音 sk", word: "sky", prefix: "", target: "sk", suffix: "y" },
  { level: 67, typeName: "S-連音 sm", word: "smile", prefix: "", target: "sm", suffix: "ile" },
  { level: 68, typeName: "S-連音 sn", word: "snake", prefix: "", target: "sn", suffix: "ake" },
  { level: 69, typeName: "S-連音 sp", word: "spoon", prefix: "", target: "sp", suffix: "oon" },
  { level: 70, typeName: "S-連音 st", word: "stop", prefix: "", target: "st", suffix: "op" },
  { level: 71, typeName: "S-連音 sw", word: "swim", prefix: "", target: "sw", suffix: "im" },
  { level: 72, typeName: "S-連音 sk", word: "skin", prefix: "", target: "sk", suffix: "in" },
  { level: 73, typeName: "S-連音 sm", word: "small", prefix: "", target: "sm", suffix: "all" },
  { level: 74, typeName: "S-連音 sn", word: "snow", prefix: "", target: "sn", suffix: "ow" },
  { level: 75, typeName: "S-連音 st", word: "step", prefix: "", target: "st", suffix: "ep" },

  // 字尾連音 (Lv 76-85)
  { level: 76, typeName: "字尾連音 nd", word: "hand", prefix: "ha", target: "nd", suffix: "" },
  { level: 77, typeName: "字尾連音 nd", word: "sand", prefix: "sa", target: "nd", suffix: "" },
  { level: 78, typeName: "字尾連音 nt", word: "ant", prefix: "a", target: "nt", suffix: "" },
  { level: 79, typeName: "字尾連音 nt", word: "tent", prefix: "te", target: "nt", suffix: "" },
  { level: 80, typeName: "字尾連音 st", word: "fast", prefix: "fa", target: "st", suffix: "" },
  { level: 81, typeName: "字尾連音 st", word: "nest", prefix: "ne", target: "st", suffix: "" },
  { level: 82, typeName: "字尾連音 mp", word: "camp", prefix: "ca", target: "mp", suffix: "" },
  { level: 83, typeName: "字尾連音 mp", word: "jump", prefix: "ju", target: "mp", suffix: "" },
  { level: 84, typeName: "字尾連音 nd", word: "wind", prefix: "wi", target: "nd", suffix: "" },
  { level: 85, typeName: "字尾連音 nt", word: "plant", prefix: "pla", target: "nt", suffix: "" },

  // 複雜母音 (Lv 86-100)
  { level: 86, typeName: "複雜母音 au", word: "sauce", prefix: "s", target: "au", suffix: "ce" },
  { level: 87, typeName: "複雜母音 au", word: "cause", prefix: "c", target: "au", suffix: "se" },
  { level: 88, typeName: "複雜母音 aw", word: "draw", prefix: "dr", target: "aw", suffix: "" },
  { level: 89, typeName: "複雜母音 aw", word: "straw", prefix: "str", target: "aw", suffix: "" },
  { level: 90, typeName: "複雜母音 ew", word: "few", prefix: "f", target: "ew", suffix: "" },
  { level: 91, typeName: "複雜母音 ew", word: "new", prefix: "n", target: "ew", suffix: "" },
  { level: 92, typeName: "複雜母音 ew", word: "chew", prefix: "ch", target: "ew", suffix: "" },
  { level: 93, typeName: "複雜母音 igh", word: "night", prefix: "n", target: "igh", suffix: "t" },
  { level: 94, typeName: "複雜母音 igh", word: "high", prefix: "h", target: "igh", suffix: "" },
  { level: 95, typeName: "複雜母音 igh", word: "light", prefix: "l", target: "igh", suffix: "t" },
  { level: 96, typeName: "複雜母音 igh", word: "right", prefix: "r", target: "igh", suffix: "t" },
  { level: 97, typeName: "複雜母音 eigh", word: "eight", prefix: "", target: "eigh", suffix: "t" },
  { level: 98, typeName: "複雜母音 eigh", word: "weight", prefix: "w", target: "eigh", suffix: "t" },
  { level: 99, typeName: "複雜母音 eigh", word: "sleigh", prefix: "sl", target: "eigh", suffix: "" },
  { level: 100, typeName: "大師總複習 igh", word: "flight", prefix: "fl", target: "igh", suffix: "t" }
];

const PHONICS_GROUPS = [
  { title: "📖 短母音 (Short Vowels)", range: [1, 10], color: "bg-red-50 text-red-700 border-red-200", teachingMsg: "短母音 a, e, i, o, u，嘴巴張開短促發音。a 是蝴蝶音，e 是咧嘴音，i 是短衣，o 是短啊，u 是短呃。" },
  { title: "📖 魔法 E (Magic E)", range: [11, 20], color: "bg-blue-50 text-blue-700 border-blue-200", teachingMsg: "字尾有不發音的 e，前面的母音就要發原本字母的長音！像是 a_e 唸 /e/，i_e 唸 /ai/。" },
  { title: "📖 複合子音 (Digraphs)", range: [21, 30], color: "bg-green-50 text-green-700 border-green-200", teachingMsg: "兩個字母手牽手，發出一個新的聲音。例如 sh 發出「噓」的聲音，ch 發出「去」的聲音。" },
  { title: "📖 母音音組 (Vowel Teams)", range: [31, 40], color: "bg-purple-50 text-purple-700 border-purple-200", teachingMsg: "兩個母音走在一起，通常是前面的母音發長音，後面的母音不發音。像是 ee 唸長長的 /i/。" },
  { title: "📖 R控制音與雙母音", range: [41, 50], color: "bg-orange-50 text-orange-700 border-orange-200", teachingMsg: "母音遇到老大 R，聲音就會被改變喔！像是 ar 唸 /ar/。還有 ou 和 ow 會發出被捏到「凹」的聲音。" },
  { title: "📖 L-連音 (L-Blends)", range: [51, 55], color: "bg-teal-50 text-teal-700 border-teal-200", teachingMsg: "子音加上 L，像是 bl, cl, fl，唸的時候要把舌頭頂上去喔！" },
  { title: "📖 R-連音 (R-Blends)", range: [56, 65], color: "bg-cyan-50 text-cyan-700 border-cyan-200", teachingMsg: "子音加上 R，像是 br, cr, dr，唸的時候要捲舌喔！" },
  { title: "📖 S-連音 (S-Blends)", range: [66, 75], color: "bg-indigo-50 text-indigo-700 border-indigo-200", teachingMsg: "以 S 開頭的連音，像蛇一樣發出「嘶」的聲音再接後面的字，像是 sk, sm, sn。" },
  { title: "📖 字尾連音 (Ending Blends)", range: [76, 85], color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", teachingMsg: "放在單字尾巴的兩個子音，兩個聲音都要輕輕唸出來，像是 nd, nt, st。" },
  { title: "📖 複雜母音 (Complex Vowels)", range: [86, 100], color: "bg-rose-50 text-rose-700 border-rose-200", teachingMsg: "特別的字母組合，像是 au 和 aw 唸長音的 喔，igh 唸長音 /ai/，eigh 唸 /e/。" }
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

// ==========================================
// 主程式元件
// ==========================================
export default function App() {
  const [player, setPlayer] = useState({ level: 1, xp: 0, dorayaki: 0, gadgets: {}, flowers: [], stats: { ...DEFAULT_STATS } });
  const [view, setView] = useState('home');
  const [shopTab, setShopTab] = useState('gadgets');
  
  // 英文發音題目狀態
  const [phonicsProblem, setPhonicsProblem] = useState({ word: "", prefix: "", target: "", suffix: "", typeName: "" });
  const [ansText, setAnsText] = useState('');
  
  // 新增：參考書學習模式狀態
  const [isStudying, setIsStudying] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);

  const [currentChar, setCurrentChar] = useState(CHARACTERS[0]);
  const [currentMsg, setCurrentMsg] = useState("");
  const [cloakMode, setCloakMode] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [isVoiceOn, setIsVoiceOn] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('doraemonPhonicsSave_v5');
    if (saved) {
      let parsed = JSON.parse(saved);
      const today = new Date().toDateString();
      if (!parsed.stats) parsed.stats = { ...DEFAULT_STATS };
      else if (parsed.stats.lastPlayDate !== today) {
        parsed.stats = { ...parsed.stats, lastPlayDate: today, todayCorrect: 0, todayWrong: 0, todayTime: 0 };
      }
      if (parsed.flowers && Array.isArray(parsed.flowers)) {
        parsed.flowers = parsed.flowers.map(f => {
          if ((f.x > 25 && f.x < 75 && f.y > 15 && f.y < 85) || f.y > 75) {
            f.y = Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 10) + 85; 
          }
          return f;
        });
      }
      setPlayer(parsed);
    }
  }, []);

  useEffect(() => { localStorage.setItem('doraemonPhonicsSave_v5', JSON.stringify(player)); }, [player]);

  useEffect(() => {
    let timer;
    if (view === 'game') {
      timer = setInterval(() => {
        setPlayer(prev => ({
          ...prev,
          stats: { ...prev.stats, todayTime: prev.stats.todayTime + 1, totalTime: prev.stats.totalTime + 1 }
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view]);

  useEffect(() => { SoundEngine.toggleBGM(isMusicOn); }, [isMusicOn]);
  useEffect(() => { SoundEngine.toggleVoice(isVoiceOn); }, [isVoiceOn]);

  const toggleMusic = () => { SoundEngine.unlockAudio(); SoundEngine.pop(); setIsMusicOn(!isMusicOn); };
  const toggleVoice = () => { SoundEngine.unlockAudio(); SoundEngine.pop(); if (!isVoiceOn) SoundEngine.unlockSpeech(); setIsVoiceOn(!isVoiceOn); };
  const changeView = (newView) => { SoundEngine.unlockAudio(); SoundEngine.pop(); setView(newView); };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`全螢幕請求失敗: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // 播放單字發音
  const playWord = (word = phonicsProblem.word) => {
    if (word) {
        SoundEngine.speak(word, 'en-US');
    }
  };

  // ==========================================
  // 題目生成：嚴格綁定當前等級
  // ==========================================
  const generateProblem = (cloakRemaining = cloakMode) => {
    let targetLevel = player.level;
    let typeNamePrefix = "";
    let availableProblems = [];

    if (cloakRemaining > 0) {
      // 隱形特訓：全範圍總複習
      availableProblems = PHONICS_DB;
      typeNamePrefix = `🌟 隱形特訓 (剩 ${cloakRemaining} 題) - `; 
    } else {
      // 正常測驗：嚴格對應當前等級
      availableProblems = PHONICS_DB.filter(p => p.level === targetLevel);
      if (availableProblems.length === 0) availableProblems = PHONICS_DB.filter(p => p.level <= targetLevel); // 保底防呆
    }

    const selected = availableProblems[Math.floor(Math.random() * availableProblems.length)];
    
    setPhonicsProblem({
        ...selected,
        typeName: typeNamePrefix + selected.typeName
    });
    setAnsText('');
    setIsStudying(false); // 出新題目時強制關閉參考書

    const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    const msg = char.msgs[Math.floor(Math.random() * char.msgs.length)];
    setCurrentChar(char);
    setCurrentMsg(msg);
    setFeedbackMsg("");
    setImageError(false);
    setIsProcessing(false);

    // 延遲發音確保 UI 更新完畢
    setTimeout(() => {
        if(!isStudying) playWord(selected.word);
    }, 500);
  };

  // ==========================================
  // 答案判定邏輯
  // ==========================================
  const submitAnswer = (forceAns = null) => {
    if (isProcessing || isStudying) return; // 讀書模式下禁止答題
    
    const submitted = forceAns !== null ? forceAns : ansText;
    if (submitted.length === 0) { SoundEngine.wrong(); return; }
    
    setIsProcessing(true);
    // 比對文字 (不分大小寫)
    const isCorrect = submitted.toLowerCase() === phonicsProblem.target.toLowerCase();
    
    setPlayer(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        todayCorrect: isCorrect ? prev.stats.todayCorrect + 1 : prev.stats.todayCorrect,
        todayWrong: !isCorrect ? prev.stats.todayWrong + 1 : prev.stats.todayWrong,
        totalCorrect: isCorrect ? prev.stats.totalCorrect + 1 : prev.stats.totalCorrect,
        totalWrong: !isCorrect ? prev.stats.totalWrong + 1 : prev.stats.totalWrong
      }
    }));

    if (isCorrect) {
      SoundEngine.correct();
      let isCloakQuestion = cloakMode > 0;
      let reward = isCloakQuestion ? 80 : 5;
      let newCloak = isCloakQuestion ? cloakMode - 1 : 0;
      setCloakMode(newCloak);
      
      let newXp = player.xp;
      if (!isCloakQuestion) newXp += 1;
      
      let newLevel = player.level;
      let finalXp = newXp;
      let leveledUp = false;
      
      if (newXp >= 5) { 
          if (newLevel < 100) { newLevel++; leveledUp = true; }
          finalXp = 0; 
      }
      
      setPlayer(prev => ({ ...prev, dorayaki: prev.dorayaki + reward, level: newLevel, xp: finalXp }));
      const praiseMsg = PRAISES[Math.floor(Math.random() * PRAISES.length)];
      
      setTimeout(() => { playWord(phonicsProblem.word); }, 800);

      if (leveledUp) {
        SoundEngine.buy();
        setFeedbackMsg(`🎉 ${praiseMsg}\n升級到 Lv.${newLevel}！🥞+${reward}`);
        SoundEngine.speak(`${praiseMsg}，恭喜升級！`, 'zh-TW');
        setTimeout(() => generateProblem(newCloak), 4000);
      } else {
        setFeedbackMsg(`✨ ${praiseMsg}\n銅鑼燒 + ${reward} 🥞`);
        SoundEngine.speak(praiseMsg, 'zh-TW');
        setTimeout(() => generateProblem(newCloak), 2500);
      }
    } else {
      SoundEngine.wrong();
      if (cloakMode > 0) {
        setCloakMode(prev => prev - 1);
        setFeedbackMsg(`拼錯了！剩 ${cloakMode-1} 次機會！`);
        if (cloakMode - 1 <= 0) setTimeout(() => generateProblem(0), 1500);
        else setIsProcessing(false);
      } else {
        setFeedbackMsg("聽起來不太像喔，再聽一次！");
        SoundEngine.speak("差一點點，再試一次吧！", 'zh-TW');
        setTimeout(() => { playWord(phonicsProblem.word); setIsProcessing(false); }, 1500);
      }
    }
  };

  const handleKeyPress = (val) => {
    if(isStudying) return; // 讀書模式阻擋輸入
    SoundEngine.pop();
    if (val === '⌫') {
      setAnsText(prev => prev.slice(0, -1));
    } else {
      setAnsText(prev => (prev.length < phonicsProblem.target.length ? prev + val : prev));
    }
  };

  const buyItem = (item, isFlower = false) => {
    if (player.dorayaki >= item.cost) {
      SoundEngine.buy();
      if (isFlower) {
        let fx, fy;
        do {
            fx = Math.floor(Math.random() * 90) + 5; 
            fy = Math.floor(Math.random() * 90) + 5; 
        } while (fx > 25 && fx < 75 && fy > 20 && fy < 80);

        const newFlower = { icon: item.icon, x: fx, y: fy };
        setPlayer(prev => ({ ...prev, dorayaki: prev.dorayaki - item.cost, flowers: [...prev.flowers, newFlower] }));
      } else {
        setPlayer(prev => ({ ...prev, dorayaki: prev.dorayaki - item.cost, gadgets: { ...prev.gadgets, [item.name]: (prev.gadgets[item.name] || 0) + 1 } }));
      }
    } else {
      SoundEngine.wrong();
    }
  };

  const useGadget = (name) => {
    if ((player.gadgets[name] || 0) <= 0 || isProcessing || isStudying) return;
    SoundEngine.buy();
    setPlayer(prev => ({ ...prev, gadgets: { ...prev.gadgets, [name]: prev.gadgets[name] - 1 } }));
    
    if (name === "記憶吐司") {
      setAnsText(phonicsProblem.target.toUpperCase());
    }
    else if (name === "任意門") submitAnswer(phonicsProblem.target);
    else if (name === "竹蜻蜓") { setPlayer(p => ({ ...p, level: Math.max(1, p.level - 1) })); generateProblem(); }
    else if (name === "時光機") { setPlayer(p => ({ ...p, level: Math.max(1, p.level - 4) })); generateProblem(); }
    else if (name === "縮小燈") { 
        setPhonicsProblem({ typeName: "縮小特效題", word: "cat", prefix: "c", target: "a", suffix: "t", level: 1 }); 
        setAnsText('');
        setTimeout(() => playWord("cat"), 500);
    }
    else if (name === "隱形斗篷") { setCloakMode(5); generateProblem(5); }
  };

  // ==========================================
  // 共用 Header
  // ==========================================
  const Header = () => (
    <div className="shrink-0 bg-white/95 backdrop-blur-sm border-b shadow-sm z-50 px-2 py-1 md:px-3 md:py-1.5 flex flex-col gap-0.5 md:gap-1">
      <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-500 px-1">
        <span>今日: 對 {player.stats.todayCorrect} / 錯 {player.stats.todayWrong} <span className="text-blue-500 ml-1 md:ml-2">⏱ {formatTime(player.stats.todayTime)}</span></span>
        <div className="flex gap-2 md:gap-4">
          <span>總計: 對 {player.stats.totalCorrect}</span>
          <span className="text-yellow-500">⭐ Lv.{player.level}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-1 md:gap-2 overflow-x-auto scrollbar-hide shrink-0 pb-0.5">
          {view !== 'home' && <button onClick={() => changeView('home')} className="bg-sky-50 hover:bg-sky-100 text-sky-700 px-2 py-1 md:px-3 rounded-md md:rounded-lg font-bold text-[10px] md:text-sm border border-sky-100 active:scale-95 whitespace-nowrap shadow-sm">🏠 操場</button>}
          {view !== 'game' && view !== 'home' && <button onClick={() => changeView('game')} className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-2 py-1 md:px-3 rounded-md md:rounded-lg font-bold text-[10px] md:text-sm border border-yellow-100 active:scale-95 whitespace-nowrap shadow-sm">📝 回特訓</button>}
          {view !== 'shop' && <button onClick={() => changeView('shop')} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 md:px-3 rounded-md md:rounded-lg font-bold text-[10px] md:text-sm border border-blue-100 active:scale-95 whitespace-nowrap shadow-sm">🛍️ 商店</button>}
          {view !== 'cabinet' && <button onClick={() => changeView('cabinet')} className="bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 md:px-3 rounded-md md:rounded-lg font-bold text-[10px] md:text-sm border border-green-100 active:scale-95 whitespace-nowrap shadow-sm">🏆 道具</button>}
          <button onClick={toggleFullScreen} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 md:px-3 rounded-md md:rounded-lg font-bold text-[10px] md:text-sm border border-slate-200 active:scale-95 whitespace-nowrap shadow-sm">📺 全螢幕</button>
          <button onClick={toggleMusic} className={`px-2 py-1 md:px-3 rounded-md md:rounded-lg font-bold text-[10px] md:text-sm border active:scale-95 whitespace-nowrap ${isMusicOn ? 'bg-green-100 border-green-300' : 'bg-gray-50 border-gray-200'}`}>{isMusicOn ? '🎵 ON' : '🔇 OFF'}</button>
          <button onClick={toggleVoice} className={`px-2 py-1 md:px-3 rounded-md md:rounded-lg font-bold text-[10px] md:text-sm border active:scale-95 whitespace-nowrap ${isVoiceOn ? 'bg-purple-100 border-purple-300' : 'bg-gray-50 border-gray-200'}`}>{isVoiceOn ? '🗣️ ON' : '🤫 OFF'}</button>
        </div>
        <div className="text-xl md:text-2xl font-black text-orange-600 pl-1 shrink-0 drop-shadow-sm">🥞 {player.dorayaki}</div>
      </div>
    </div>
  );

  if (view === 'home') {
    return (
      <div className="fixed inset-0 flex flex-col bg-sky-100 overflow-hidden font-sans select-none">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 relative">
          <button onClick={() => { if(window.confirm("確定重新開始嗎？等級將會重置！")) { setPlayer({ level: 1, xp: 0, dorayaki: 0, gadgets: {}, flowers: [], stats: { ...DEFAULT_STATS } }); setCloakMode(0); } }} 
                  className="absolute top-4 right-4 bg-slate-200 text-slate-500 py-1.5 px-3 rounded-xl font-bold text-sm shadow-sm active:scale-95 z-20">
            🔄 重新開始
          </button>
          <h1 className="text-5xl md:text-7xl font-black text-blue-800 text-center drop-shadow-sm z-10">🚪 自然發音特訓</h1>
          <p className="text-sm md:text-base font-bold text-blue-400 mb-2">{APP_VERSION}</p>
          <p className="text-xl md:text-3xl text-blue-600 font-bold mb-4 z-10">從 Lv.1 邁向 Lv.100，拼出正確發音賺銅鑼燒！</p>
          <div className="w-full max-w-lg z-10 mt-4">
            <button onClick={() => { generateProblem(); setView('game'); SoundEngine.unlockAudio(); }} 
                    className="w-full bg-yellow-400 py-8 rounded-[40px] text-4xl md:text-5xl font-black text-blue-900 shadow-2xl border-b-[10px] border-yellow-600 active:border-b-0 active:translate-y-2 transition-all">
              📢 開始聽音辨字
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'shop' || view === 'cabinet') {
    const isShop = view === 'shop';
    return (
      <div className={`fixed inset-0 flex flex-col ${isShop ? 'bg-blue-50' : 'bg-yellow-50'} overflow-hidden select-none`}>
        <Header />
        <div className="p-4 flex flex-col items-center flex-1 min-h-0">
          <h2 className="text-4xl md:text-5xl font-black mb-4">{isShop ? '🛍️ 百寶袋商店' : '🏆 四次元道具櫃'}</h2>
          {isShop && (
            <div className="flex gap-4 mb-4">
              <button onClick={() => setShopTab('gadgets')} className={`px-8 py-3 rounded-full text-xl font-bold shadow-sm ${shopTab === 'gadgets' ? 'bg-blue-500 text-white scale-105' : 'bg-white border-2 border-blue-200 text-blue-500'}`}>🎒 實用道具</button>
              <button onClick={() => setShopTab('flowers')} className={`px-8 py-3 rounded-full text-xl font-bold shadow-sm ${shopTab === 'flowers' ? 'bg-pink-500 text-white scale-105' : 'bg-white border-2 border-pink-200 text-pink-500'}`}>🌸 草地花卉</button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto w-full max-w-5xl px-2 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(isShop ? (shopTab === 'gadgets' ? GADGETS : FLOWERS) : GADGETS).map(item => {
                const count = isShop ? (shopTab === 'gadgets' ? (player.gadgets[item.name]||0) : player.flowers.filter(f=>f.icon===item.icon).length) : (player.gadgets[item.name]||0);
                return (
                  <div key={item.name} className="bg-white p-5 md:p-6 rounded-3xl border-4 border-gray-100 flex items-center gap-4 shadow-sm">
                    <span className="text-6xl md:text-7xl">{isShop || count > 0 ? item.icon : '🔒'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-2xl md:text-3xl font-bold text-gray-800 truncate mb-1">{isShop || count > 0 ? item.name : '未知'}</div>
                      {isShop && shopTab === 'gadgets' && <div className="text-sm md:text-base text-gray-500 font-medium leading-tight mb-2 line-clamp-2">{item.desc}</div>}
                      <div className="text-blue-500 font-bold text-base">已擁有: {count}</div>
                    </div>
                    {isShop && <button onClick={() => buyItem(item, shopTab === 'flowers')} className="bg-yellow-400 px-6 py-4 rounded-2xl font-black text-2xl border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1">{item.cost} 🥞</button>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 遊戲主畫面
  // ==========================================
  return (
    <div className="fixed inset-0 flex flex-col bg-sky-50 overflow-hidden select-none touch-manipulation">
      <Header />

      <div className="relative flex-1 min-h-[30vh] flex flex-row gap-2 md:gap-3 bg-green-100 p-1.5 md:p-2 z-10 overflow-hidden">
        
        {/* 背景花朵 */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {player.flowers.map((f, i) => (
            <div key={i} className="absolute pointer-events-none z-0" style={{ left: `${f.x}%`, top: `${f.y}%`, transform: 'translate(-50%, -50%)' }}>
              <div className="relative inline-block">
                <span className="text-4xl md:text-6xl opacity-90 drop-shadow-md">{f.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 左半邊：角色對話 + 🎒 背包區 */}
        <div className="flex-1 flex flex-col justify-between pt-1 z-20 shrink-0 h-full max-w-[50%]">
          <div className="flex flex-col items-center">
            <div className="text-green-800 bg-white/90 px-2 py-0.5 md:py-1 rounded-full font-bold text-[10px] md:text-xs shadow-sm backdrop-blur-sm z-20 mb-1.5 md:mb-2 text-center leading-tight">
              📝 {phonicsProblem.typeName} (Lv.{player.level})
            </div>
            <div className="flex flex-col items-center z-20">
              <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full border-[3px] md:border-4 border-white shadow-md overflow-hidden flex items-center justify-center ${currentChar.color}`}>
                {currentChar.image && !imageError ? (
                  <img src={currentChar.image} alt="" className="w-full h-full object-cover" onError={() => setImageError(true)} />
                ) : <span className="text-4xl md:text-5xl">{currentChar.icon}</span>}
              </div>
              <div className={`mt-0.5 text-xs md:text-base font-black ${currentChar.textColor} drop-shadow-md`}>{currentChar.name}</div>
            </div>
            <div className={`mt-1.5 md:mt-2 bg-white/95 backdrop-blur-sm p-1.5 md:p-3 rounded-[15px] border-[2px] md:border-[3px] ${currentChar.borderColor} shadow-sm w-full flex items-center justify-center text-center z-20 min-h-[50px]`}>
              <p className="text-[11px] md:text-sm font-bold text-gray-800 leading-snug">
                {isStudying ? "現在是讀書時間，看完記得關閉參考書才能繼續測驗喔！" : (feedbackMsg || currentMsg)}
              </p>
            </div>
          </div>
          
          <div className="w-full mt-2 bg-blue-900/40 p-1.5 md:p-2 rounded-xl border border-blue-500/50 flex flex-col gap-1">
            <span className="text-yellow-300 font-bold text-[11px] md:text-sm px-1 shrink-0">🎒點擊使用道具:</span>
            <div className="overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-1.5 pb-1 w-full">
              {GADGETS.map(g => {
                const count = player.gadgets[g.name] || 0;
                if (count <= 0) return null;
                return (
                  <button key={g.name} onClick={() => useGadget(g.name)} disabled={isStudying} className={`bg-white px-1.5 md:px-2 py-0.5 rounded flex flex-col items-center justify-center shadow shrink-0 active:scale-95 min-w-[50px] md:min-w-[70px] ${isStudying ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-0.5 mb-[1px]">
                      <span className="text-sm md:text-lg">{g.icon}</span>
                      <span className="font-bold text-blue-800 text-[9px] md:text-xs">{g.name}</span>
                    </div>
                    <span className="bg-orange-100 text-orange-600 px-1 rounded font-bold text-[8px] md:text-[10px]">剩:{count}</span>
                  </button>
                );
              })}
              {Object.values(player.gadgets).every(c => !c || c <= 0) && (
                <span className="text-blue-200 text-[10px] md:text-xs py-1 px-1">空的...快去商店看看！</span>
              )}
            </div>
          </div>
        </div>

        {/* 右半邊：自然發音參考書 (取代畫布) */}
        <div className="flex-1 bg-amber-50 z-30 flex flex-col shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] rounded-xl border-2 border-amber-700 overflow-hidden relative">
          <div className="flex justify-between items-center px-2 py-1 bg-amber-200 border-b border-amber-300 h-8 md:h-10 shrink-0">
            <span className="font-bold text-amber-900 text-xs md:text-sm">📚 自然發音參考書</span>
            <button 
                onClick={() => {
                  SoundEngine.pop();
                  setIsStudying(!isStudying);
                  if(!isStudying && activeGroup === null) setActiveGroup(0); // 預設打開第一章
                }} 
                className={`px-3 py-1 rounded-md font-bold text-[10px] md:text-xs shadow-sm border active:scale-95 transition-all ${isStudying ? 'bg-red-500 text-white border-red-600' : 'bg-green-500 text-white border-green-600 animate-pulse'}`}>
                {isStudying ? '❌ 關閉參考書' : '📖 打開參考書'}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto w-full p-2 relative scrollbar-hide">
            {!isStudying ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-100/90 gap-3 p-4 text-center">
                   <div className="text-6xl md:text-8xl">📔</div>
                   <div className="text-amber-800 font-bold text-sm md:text-base">參考書已合上，請專心測驗！</div>
                   <div className="text-amber-600 font-bold text-xs md:text-sm">若忘記規則，可點擊上方按鈕翻閱。</div>
               </div>
            ) : (
               <div className="flex flex-col gap-2 pb-4">
                  {PHONICS_GROUPS.map((group, idx) => (
                      <div key={idx} className={`border-2 rounded-lg overflow-hidden transition-all ${group.color} ${activeGroup === idx ? 'shadow-md' : 'opacity-80'}`}>
                          <div onClick={() => { SoundEngine.pop(); setActiveGroup(activeGroup === idx ? null : idx); }} 
                               className="px-3 py-2 font-black cursor-pointer flex justify-between items-center bg-white/50">
                              <span className="text-xs md:text-sm">{group.title}</span>
                              <span>{activeGroup === idx ? '▲' : '▼'}</span>
                          </div>
                          {activeGroup === idx && (
                              <div className="p-2 md:p-3 bg-white flex flex-col items-center gap-2">
                                  {/* 發音規則教學區塊 */}
                                  <div className="bg-orange-50 border border-orange-200 p-2 rounded-lg text-sm md:text-base text-slate-700 w-full flex items-start gap-2 shadow-inner">
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); SoundEngine.speak(group.teachingMsg, 'zh-TW'); }} 
                                          className="shrink-0 bg-orange-500 hover:bg-orange-400 text-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center active:scale-90 transition-transform shadow-md text-sm md:text-lg"
                                      >
                                          🔊
                                      </button>
                                      <div className="flex flex-col">
                                          <span className="font-black text-orange-800 text-xs md:text-sm mb-0.5">發音秘訣：</span>
                                          <span className="font-bold leading-snug">{group.teachingMsg}</span>
                                      </div>
                                  </div>
                                  
                                  {/* 單字按鈕區塊 */}
                                  <div className="flex flex-wrap gap-2 justify-center w-full mt-1">
                                      {PHONICS_DB.filter(p => p.level >= group.range[0] && p.level <= group.range[1]).map((wordObj, wIdx) => (
                                          <button 
                                              key={wIdx} 
                                              onClick={() => playWord(wordObj.word)}
                                              className="bg-slate-100 border border-slate-300 rounded px-2 py-1 flex flex-col items-center active:bg-slate-200 active:scale-95 min-w-[60px]"
                                          >
                                              <span className="text-xs text-slate-500 font-bold mb-0.5">{wordObj.target}</span>
                                              <span className="text-sm md:text-base font-black text-slate-800 tracking-wider">{wordObj.word}</span>
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  ))}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部作答區：語音播放 + 填空題 + QWERTY鍵盤 (加入讀書遮罩) */}
      <div className="shrink-0 bg-blue-600 p-2 md:p-3 rounded-t-[15px] shadow-[0_-3px_15px_rgba(0,0,0,0.2)] flex flex-col items-center gap-2 z-40 border-t-[3px] border-blue-400 relative">
        
        {/* 讀書模式的互斥遮罩 */}
        {isStudying && (
            <div className="absolute inset-0 bg-slate-900/70 z-50 rounded-t-[12px] flex flex-col items-center justify-center backdrop-blur-[2px]">
                <span className="text-5xl md:text-6xl mb-2">🛑</span>
                <span className="text-white font-black text-lg md:text-2xl drop-shadow-md">閱讀模式中，不可答題</span>
                <span className="text-yellow-300 font-bold text-sm mt-1">請先「關閉參考書」即可恢復測驗</span>
            </div>
        )}

        <div className="w-full flex flex-col items-center justify-center gap-2 md:gap-3 max-w-4xl">
          
          {/* 題目與作答框 */}
          <div className="bg-blue-800/60 p-2 md:p-3 rounded-lg flex flex-nowrap items-center justify-center text-4xl md:text-6xl font-black text-yellow-300 gap-2 md:gap-3 border-2 border-blue-500 shadow-inner w-full">
            {/* 播放英文聲音按鈕 */}
            <button onClick={() => playWord()} disabled={isStudying} className="bg-orange-500 hover:bg-orange-400 text-white rounded-full p-2 md:p-3 shadow-lg active:scale-90 transition-transform mr-2 disabled:opacity-50">
                🔊
            </button>

            {/* 字首 */}
            <span className="lowercase">{phonicsProblem.prefix}</span>
            
            {/* 填空區 */}
            <div className={`h-12 md:h-16 rounded-md md:rounded-lg flex items-center justify-center text-blue-900 shadow-inner overflow-hidden relative border-[3px] md:border-[4px] bg-yellow-100 border-yellow-400 transition-all px-2`}
                 style={{ minWidth: `${Math.max(2, phonicsProblem.target?.length || 2) * 1.5}rem` }}>
              <span className="text-4xl md:text-6xl lowercase tracking-widest">{ansText.toLowerCase()}</span>
              {!isStudying && ansText.length < (phonicsProblem.target?.length || 1) && (
                <div className="absolute right-1 w-1 h-3/4 bg-blue-500 animate-ping opacity-75"></div>
              )}
            </div>

            {/* 字尾 */}
            <span className="lowercase">{phonicsProblem.suffix}</span>
          </div>

          {/* QWERTY 全鍵盤 */}
          <div className="flex flex-col gap-1.5 md:gap-2 bg-blue-500/40 p-2 md:p-3 rounded-lg w-full">
            {KEYBOARD_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className={`flex justify-center gap-1 md:gap-2 w-full ${rowIndex === 1 ? 'px-4' : ''}`}>
                {row.map(key => (
                  <button 
                    key={key} 
                    onClick={() => handleKeyPress(key)} 
                    disabled={isStudying}
                    className={`h-10 md:h-14 rounded-md text-xl md:text-3xl font-black shadow-sm active:scale-90 transition-transform flex items-center justify-center flex-1
                      ${key === '⌫' ? 'bg-red-400 text-white max-w-[60px] md:max-w-[80px]' : 'bg-white text-blue-900 hover:bg-blue-50'}`}
                  >
                    {key}
                  </button>
                ))}
                {/* 第三列加上確認按鈕 */}
                {rowIndex === 2 && (
                    <button 
                        onClick={() => submitAnswer()} 
                        disabled={isProcessing || isStudying}
                        className="h-10 md:h-14 bg-yellow-400 rounded-md text-xl md:text-3xl font-black text-blue-900 shadow-sm active:scale-95 transition-transform flex items-center justify-center flex-1 max-w-[60px] md:max-w-[80px] border-b-[3px] md:border-b-[4px] border-yellow-600 active:border-b-0"
                    >
                        ✅
                    </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}