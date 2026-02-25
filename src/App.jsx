import React, { useState, useEffect } from 'react';

// ==========================================
// 網頁原生音效引擎
// ==========================================
const SoundEngine = {
  ctx: null,
  bgmInterval: null,
  noteIndex: 0,
  isVoiceOn: false, 
  melody: [
    [392, 0.2], [392, 0.2], [440, 0.4], [392, 0.4], [523, 0.4], [493, 0.8],
    [392, 0.2], [392, 0.2], [440, 0.4], [392, 0.4], [587, 0.4], [523, 0.8]
  ],
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  play(freq, type, duration, vol) {
    if (!this.ctx) return;
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
  pop() { this.init(); this.play(600, 'sine', 0.1, 0.05); },
  correct() {
    this.init();
    this.play(600, 'sine', 0.1, 0.1);
    setTimeout(() => this.play(800, 'sine', 0.15, 0.1), 100);
  },
  wrong() { this.init(); this.play(250, 'sawtooth', 0.3, 0.1); },
  buy() {
    this.init();
    this.play(400, 'square', 0.1, 0.05);
    setTimeout(() => this.play(600, 'square', 0.1, 0.05), 100);
    setTimeout(() => this.play(800, 'square', 0.2, 0.05), 200);
  },
  toggleBGM(enable) {
    this.init();
    if (enable) {
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
    if (!enable && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
    }
  },
  speak(text) {
    if (!this.isVoiceOn) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-TW'; 
      utterance.rate = 1.1; 
      utterance.pitch = 1.2; 
      window.speechSynthesis.speak(utterance);
    }
  }
};

// ==========================================
// 遊戲資料庫設定
// ==========================================
const CHARACTERS = [
  {
    name: "哆啦A夢", icon: "🐱", image: "doraemon.png", color: "bg-blue-500", textColor: "text-blue-500", borderColor: "border-blue-500",
    msgs: ["幫我算對這題，我就能吃到銅鑼燒囉！", "這題對你來說應該是小菜一碟吧！", "加油加油！你可以的！", "把這題當成切銅鑼燒來算就簡單了！", "只要用心，沒有解不開的數學題！"]
  },
  {
    name: "大雄", icon: "👦🏻", image: "nobita.png", color: "bg-orange-400", textColor: "text-orange-500", borderColor: "border-orange-400",
    msgs: ["嗚嗚，這題數學好難...你可以教教我嗎？", "哆啦A夢不幫我，我只能靠你了！", "快點算完，我們一起去空地玩吧！", "你好厲害！簡直是數學天才！", "如果算對了，媽媽就不會罵我了！"]
  },
  {
    name: "靜香", icon: "👧🏻", image: "shizuka.png", color: "bg-pink-400", textColor: "text-pink-500", borderColor: "border-pink-400",
    msgs: ["只要用心算，一定能找到正確答案喔！", "算對這題，我請你吃我烤的餅乾！", "我們一起把這題解開吧！", "你專心算數學的樣子很帥氣呢！", "一步一步來，不要粗心大意喔！"]
  },
  {
    name: "小夫", icon: "🦊", image: "suneo.png", color: "bg-green-500", textColor: "text-green-600", borderColor: "border-green-500",
    msgs: ["哼，這麼簡單的題目，你該不會算錯吧？", "我媽媽可是請了最好的家教教我呢！", "這種題目，我閉著眼睛都能算對！", "如果你不會，我可以勉為其難教你喔。", "算出來了嗎？讓我看看對不對！"]
  },
  {
    name: "胖虎", icon: "🦍", image: "gian.png", color: "bg-orange-600", textColor: "text-orange-700", borderColor: "border-orange-600",
    msgs: ["算對的話，我就唱歌給你聽！", "誰敢算錯，我就揍扁他！", "快點算！我們要去打棒球了！", "男子漢大丈夫，這點題目算什麼！", "拿出你的骨氣來！把答案寫上去！"]
  }
];

const GADGETS = [
  { icon: "🚁", name: "竹蜻蜓", cost: 30, desc: "降低 1 級難度，讓題目變簡單" },
  { icon: "🍞", name: "記憶吐司", cost: 50, desc: "輸入框直接浮現正確答案" },
  { icon: "🚪", name: "任意門", cost: 80, desc: "直接通過這題，並獲得銅鑼燒" },
  { icon: "🔦", name: "縮小燈", cost: 120, desc: "把這題的數字縮小到最簡單" },
  { icon: "🧥", name: "隱形斗篷", cost: 150, desc: "開啟隱形特訓！答對得80獎勵。答錯可重答，但會消耗機會！" },
  { icon: "⏰", name: "時光機", cost: 100, desc: "時光倒流！直接下降 4 級難度" }
];

// --- 新增：10 種花園花卉資料 ---
const FLOWERS = [
  { icon: "🌼", name: "小白菊", cost: 100, desc: "可愛的白色小花" },
  { icon: "🌻", name: "向日葵", cost: 120, desc: "充滿陽光的朝氣" },
  { icon: "🌷", name: "鬱金香", cost: 150, desc: "粉嫩的春天氣息" },
  { icon: "🌹", name: "紅玫瑰", cost: 180, desc: "熱情如火的美麗" },
  { icon: "🌸", name: "櫻花樹", cost: 200, desc: "隨風飄落的浪漫" },
  { icon: "🌺", name: "扶桑花", cost: 220, desc: "熱帶海島的風情" },
  { icon: "🪷", name: "粉蓮花", cost: 240, desc: "出淤泥而不染" },
  { icon: "🏵️", name: "橙金盞", cost: 260, desc: "閃耀著金黃光芒" },
  { icon: "🍀", name: "幸運草", cost: 280, desc: "帶來幸運的象徵" },
  { icon: "🍄", name: "精靈菇", cost: 300, desc: "散發著神奇魔力" }
];

const DEFAULT_STATS = {
  lastPlayDate: new Date().toDateString(),
  todayCorrect: 0, todayWrong: 0, todayTime: 0,
  totalCorrect: 0, totalWrong: 0, totalTime: 0
};

const formatTime = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}時${m}分${s}秒`;
  return `${m}分${s}秒`;
};

// ==========================================
// 主程式元件
// ==========================================
export default function App() {
  // 玩家狀態新增 flowers 陣列，儲存種植的花朵資料
  const [player, setPlayer] = useState({ 
    level: 1, xp: 0, dorayaki: 0, gadgets: {}, flowers: [], 
    stats: { ...DEFAULT_STATS } 
  });
  const [view, setView] = useState('home');
  const [shopTab, setShopTab] = useState('gadgets'); // 商店分籤: 'gadgets' | 'flowers'
  
  const [mathProblem, setMathProblem] = useState({ dividend: 0, divisor: 0, quotient: 0, typeName: "" });
  const [userAnswer, setUserAnswer] = useState('');
  const [currentChar, setCurrentChar] = useState(CHARACTERS[0]);
  const [currentMsg, setCurrentMsg] = useState("");
  const [cloakMode, setCloakMode] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [imageError, setImageError] = useState(false);
  
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [isVoiceOn, setIsVoiceOn] = useState(false);

  // 載入與跨日自動重置判斷
  useEffect(() => {
    const saved = localStorage.getItem('doraemonSave');
    if (saved) {
      let parsed = JSON.parse(saved);
      const today = new Date().toDateString();
      
      if (!parsed.stats) parsed.stats = { ...DEFAULT_STATS };
      else if (parsed.stats.lastPlayDate !== today) {
        parsed.stats = { ...parsed.stats, lastPlayDate: today, todayCorrect: 0, todayWrong: 0, todayTime: 0 };
      }
      if (!parsed.flowers) parsed.flowers = []; // 確保舊存檔能相容新功能
      setPlayer(parsed);
    }
  }, []);

  // 自動存檔
  useEffect(() => {
    localStorage.setItem('doraemonSave', JSON.stringify(player));
  }, [player]);

  // 智慧計時器
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

  // 控制音樂與語音
  useEffect(() => {
    SoundEngine.toggleBGM(isMusicOn);
    return () => SoundEngine.toggleBGM(false); 
  }, [isMusicOn]);

  useEffect(() => {
    SoundEngine.toggleVoice(isVoiceOn);
  }, [isVoiceOn]);

  const toggleMusic = () => { SoundEngine.pop(); setIsMusicOn(!isMusicOn); };
  const toggleVoice = () => { SoundEngine.pop(); setIsVoiceOn(!isVoiceOn); };
  const changeView = (newView) => { SoundEngine.pop(); setView(newView); };

  const generateProblem = (cloakRemaining = cloakMode) => {
    let divisor, quotient, typeName;
    if (cloakRemaining > 0) {
      divisor = Math.floor(Math.random() * 8) + 2; 
      quotient = Math.floor(Math.random() * 106) + 15; 
      while (divisor * quotient < 100) quotient = Math.floor(Math.random() * 106) + 15;
      typeName = `🌟 隱形特訓 (剩 ${cloakRemaining} 次機會)`;
    } else {
      const lv = player.level;
      if (lv <= 3) {
        divisor = Math.floor(Math.random() * 8) + 2;
        quotient = Math.floor(Math.random() * 8) + 2;
        typeName = "基礎九九乘法";
      } else if (lv <= 8) {
        divisor = Math.floor(Math.random() * 7) + 3;
        quotient = Math.floor(Math.random() * 10) + 11;
        typeName = "二位數 ÷ 一位數";
      } else {
        divisor = Math.floor(Math.random() * 8) + 5;
        quotient = Math.floor(Math.random() * 26) + 15;
        typeName = "大數字進階除法";
      }
    }

    setMathProblem({ dividend: divisor * quotient, divisor, quotient, typeName });
    setUserAnswer('');
    
    const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    const msg = char.msgs[Math.floor(Math.random() * char.msgs.length)];
    setCurrentChar(char);
    setCurrentMsg(msg);
    setFeedbackMsg("");
    setImageError(false);
    
    SoundEngine.speak(msg);
  };

  const startGame = () => {
    SoundEngine.pop();
    SoundEngine.speak("特訓開始！");
    generateProblem();
    setView('game');
  };

  const handleNumberClick = (num) => { SoundEngine.pop(); setUserAnswer(prev => prev + num); };
  const handleClear = () => { SoundEngine.pop(); setUserAnswer(''); };

  const checkLevelUp = (currentXp, currentLevel) => {
    let newXp = currentXp, newLevel = currentLevel, leveledUp = false;
    while (newXp >= 5) {
      newLevel += 1;
      newXp -= 5;
      leveledUp = true;
    }
    return { newXp, newLevel, leveledUp };
  };

  const submitAnswer = (forceAnswer = null) => {
    const ans = forceAnswer !== null ? forceAnswer : parseInt(userAnswer);
    if (isNaN(ans)) {
      SoundEngine.wrong();
      setFeedbackMsg("咦？要輸入數字才對喔！");
      SoundEngine.speak("咦？要輸入數字才對喔！");
      setUserAnswer('');
      return;
    }

    const isCorrect = (ans === mathProblem.quotient);

    setPlayer(prev => {
      const newStats = { ...prev.stats };
      if (isCorrect) { newStats.todayCorrect++; newStats.totalCorrect++; } 
      else { newStats.todayWrong++; newStats.totalWrong++; }
      return { ...prev, stats: newStats };
    });

    if (isCorrect) {
      let reward = cloakMode > 0 ? 80 : 5;
      let newCloak = cloakMode > 0 ? cloakMode - 1 : 0;
      setCloakMode(newCloak);

      const { newXp, newLevel, leveledUp } = checkLevelUp(player.xp + 1, player.level);
      
      setPlayer(prev => ({ ...prev, dorayaki: prev.dorayaki + reward, xp: newXp, level: newLevel }));

      if (leveledUp) {
        SoundEngine.buy();
        setFeedbackMsg(`太棒了！獲得 ${reward} 銅鑼燒！\n🎉 升級到 Lv.${newLevel}！`);
        SoundEngine.speak(`太棒了！恭喜升級到等級 ${newLevel}！`);
      } else {
        SoundEngine.correct();
        setFeedbackMsg(`太棒了！好好吃喔～\n銅鑼燒 + ${reward} 🥞`);
        SoundEngine.speak("太棒了！完全正確！");
      }
      setTimeout(() => generateProblem(newCloak), 1800);
      
    } else {
      SoundEngine.wrong();
      if (cloakMode > 0) {
        let newCloak = cloakMode - 1;
        setCloakMode(newCloak);
        if (newCloak > 0) {
          setFeedbackMsg(`哎呀算錯了！特訓剩 ${newCloak} 次機會，請重答這題！`);
          SoundEngine.speak(`哎呀，算錯了！特訓剩 ${newCloak} 次機會，請重答這題！`);
          setMathProblem(prev => ({...prev, typeName: `🌟 隱形特訓 (剩 ${newCloak} 次機會)`}));
        } else {
          setFeedbackMsg(`哎呀算錯了！隱形特訓 5 次機會已用盡！換下一題！`);
          SoundEngine.speak(`哎呀，算錯了！隱形特訓機會用盡！換下一題！`);
          setTimeout(() => generateProblem(0), 2000);
        }
      } else {
        setFeedbackMsg("哎呀，算錯了。再試一次看看！");
        SoundEngine.speak("哎呀，差一點點，再算一次看看！");
      }
      setUserAnswer('');
    }
  };

  const useGadget = (gadgetName) => {
    if ((player.gadgets[gadgetName] || 0) <= 0) return;
    SoundEngine.buy(); 
    setPlayer(prev => ({ ...prev, gadgets: { ...prev.gadgets, [gadgetName]: prev.gadgets[gadgetName] - 1 } }));

    if (gadgetName === "竹蜻蜓") {
      setPlayer(p => ({ ...p, level: Math.max(1, p.level - 1) }));
      setFeedbackMsg("🚁 竹蜻蜓發動！幫你降了一級，題目變簡單囉！");
      SoundEngine.speak("竹蜻蜓發動！題目變簡單囉！");
      setTimeout(() => generateProblem(cloakMode), 1500);
    } else if (gadgetName === "記憶吐司") {
      setUserAnswer(mathProblem.quotient.toString());
      setFeedbackMsg("🍞 記憶吐司發動！正確答案浮現在輸入框了！");
      SoundEngine.speak("記憶吐司發動！答案出現了！");
    } else if (gadgetName === "任意門") {
      setUserAnswer(mathProblem.quotient.toString());
      setFeedbackMsg("🚪 任意門發動！直接帶你通關這題！");
      SoundEngine.speak("任意門發動！過關！");
      setTimeout(() => submitAnswer(mathProblem.quotient), 1500);
    } else if (gadgetName === "縮小燈") {
      const d = Math.floor(Math.random() * 4) + 2, q = Math.floor(Math.random() * 4) + 2;
      setMathProblem(p => ({ ...p, dividend: d*q, divisor: d, quotient: q }));
      setUserAnswer('');
      setFeedbackMsg("🔦 縮小燈發動！題目的數字被縮小到最簡單了！");
      SoundEngine.speak("縮小燈發動！數字變小了！");
    } else if (gadgetName === "隱形斗篷") {
      setCloakMode(5);
      setFeedbackMsg("🧥 隱形斗篷發動！進入隱形特訓！");
      SoundEngine.speak("隱形斗篷發動！準備開始隱形特訓！");
      setTimeout(() => generateProblem(5), 2000);
    } else if (gadgetName === "時光機") {
      setPlayer(p => ({ ...p, level: Math.max(1, p.level - 4) }));
      setFeedbackMsg("⏰ 時光機發動！時光倒流 4 級！");
      SoundEngine.speak("時光機發動！時光倒流！");
      setTimeout(() => generateProblem(cloakMode), 1500);
    }
  };

  const buyGadget = (item) => {
    if (player.dorayaki >= item.cost) {
      SoundEngine.buy();
      setPlayer(prev => ({ ...prev, dorayaki: prev.dorayaki - item.cost, gadgets: { ...prev.gadgets, [item.name]: (prev.gadgets[item.name] || 0) + 1 } }));
      SoundEngine.speak(`購買成功！獲得 ${item.name}！`);
    } else {
      SoundEngine.wrong();
      SoundEngine.speak("哎呀，銅鑼燒不夠喔！");
      alert("哎呀，銅鑼燒不夠呢！");
    }
  };

  // --- 新增：購買並種植花朵 ---
  const buyFlower = (item) => {
    if (player.dorayaki >= item.cost) {
      SoundEngine.buy();
      const newFlower = {
        icon: item.icon,
        // 隨機產生 X, Y 座標，避開最邊緣與底部控制區 (控制區佔下方約 35%)
        x: Math.floor(Math.random() * 90) + 5, 
        y: Math.floor(Math.random() * 60) + 10  
      };
      setPlayer(prev => ({
        ...prev,
        dorayaki: prev.dorayaki - item.cost,
        flowers: [...(prev.flowers || []), newFlower]
      }));
      SoundEngine.speak(`太棒了！你種下了一朵 ${item.name}！`);
    } else {
      SoundEngine.wrong();
      SoundEngine.speak("哎呀，銅鑼燒不夠喔！");
      alert("哎呀，銅鑼燒不夠呢！");
    }
  };

  const resetGame = () => {
    SoundEngine.pop();
    if (window.confirm("確定要重新開始新遊戲嗎？這會清空所有的銅鑼燒、等級、道具與滿園的花朵喔！")) {
      setPlayer({ level: 1, xp: 0, dorayaki: 0, gadgets: {}, flowers: [], stats: { ...DEFAULT_STATS } });
      setCloakMode(0);
      setView('home');
    }
  };

  const HeaderBar = () => (
    <div className="shrink-0 flex flex-col z-20 relative shadow-md">
      <div className="bg-blue-100 px-4 py-1.5 flex flex-col md:flex-row justify-between text-xs md:text-sm font-bold text-slate-700 border-b-2 border-blue-200 gap-1 md:gap-0">
        <div className="flex gap-2 justify-center">
          <span className="text-blue-800">【今日戰績】</span>
          <span>🟢 答對: {player.stats.todayCorrect}</span>
          <span>🔴 答錯: {player.stats.todayWrong}</span>
          <span>⏱️ 練習: {formatTime(player.stats.todayTime)}</span>
        </div>
        <div className="flex gap-2 justify-center">
          <span className="text-blue-800">【總計生涯】</span>
          <span>🟢 答對: {player.stats.totalCorrect}</span>
          <span>🔴 答錯: {player.stats.totalWrong}</span>
          <span>⏱️ 練習: {formatTime(player.stats.totalTime)}</span>
        </div>
      </div>
      <div className="bg-white p-2.5 flex justify-between items-center overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 shrink-0">
          {view !== 'home' && (
            <button onClick={() => changeView('home')} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-2 md:px-4 rounded-xl active:scale-95 md:text-lg transition whitespace-nowrap">
              🚪 休息
            </button>
          )}
          <button onClick={toggleMusic} className={`${isMusicOn ? 'bg-green-100 text-green-700 border-green-300' : 'bg-slate-100 text-slate-500 border-slate-300'} border-2 font-bold px-3 py-2 md:px-4 rounded-xl active:scale-95 md:text-lg transition whitespace-nowrap`}>
            {isMusicOn ? '🎵 音樂: 開' : '🔇 音樂: 關'}
          </button>
          <button onClick={toggleVoice} className={`${isVoiceOn ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-slate-100 text-slate-500 border-slate-300'} border-2 font-bold px-3 py-2 md:px-4 rounded-xl active:scale-95 md:text-lg transition whitespace-nowrap`}>
            {isVoiceOn ? '🗣️ 語音: 開' : '🤫 語音: 關'}
          </button>
        </div>
        <div className="flex-1 flex justify-end gap-3 md:gap-6 text-sm md:text-xl font-bold text-slate-700 pr-2 shrink-0">
          <span>⭐ Lv.{player.level}</span>
          <span className="text-orange-500 hidden sm:inline">|</span>
          <span className="text-orange-500">🥞 {player.dorayaki}</span>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 畫面渲染：首頁
  // ==========================================
  if (view === 'home') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-sky-100 flex flex-col select-none">
        <HeaderBar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 font-sans relative">
          <button onClick={resetGame} className="absolute top-4 right-4 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded-2xl shadow-md active:scale-95 transition z-20">
            🔄 重新開始
          </button>
          <h1 className="text-4xl md:text-6xl font-extrabold text-blue-800 mb-3 drop-shadow-md text-center z-10">🚪 大雄的房間 🚪</h1>
          <p className="text-xl md:text-2xl text-blue-600 font-bold mb-6 md:mb-10 text-center z-10">解開數學題，幫哆啦A夢烤銅鑼燒吧！</p>
          
          <div className="bg-white rounded-3xl p-6 md:p-8 border-4 border-blue-400 shadow-xl w-full max-w-lg flex flex-col items-center mb-6 md:mb-10 shrink-0 z-10">
            <p className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 md:mb-6">⭐ 數學等級: {player.level}</p>
            <p className="text-2xl md:text-3xl font-bold text-orange-600 mb-6 md:mb-8">🥞 擁有的銅鑼燒: {player.dorayaki} 個</p>
            <button onClick={startGame} className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 text-3xl md:text-4xl font-black py-4 md:py-6 rounded-full shadow-lg border-b-8 border-yellow-600 active:border-b-0 active:translate-y-2 transition-all">
              ✏️ 開始除法特訓
            </button>
          </div>
          
          <div className="flex gap-4 w-full max-w-lg shrink-0 z-10">
            <button onClick={() => changeView('shop')} className="flex-1 bg-white hover:bg-slate-50 text-blue-600 text-xl md:text-2xl font-bold py-4 rounded-2xl shadow border-2 border-blue-200 active:scale-95 transition">🛍️ 百寶袋商店</button>
            <button onClick={() => changeView('cabinet')} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xl md:text-2xl font-bold py-4 rounded-2xl shadow border-2 border-red-700 active:scale-95 transition">🏆 道具展示櫃</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 畫面渲染：商店與道具櫃
  // ==========================================
  if (view === 'shop' || view === 'cabinet') {
    const isShop = view === 'shop';
    const shopItems = shopTab === 'gadgets' ? GADGETS : FLOWERS;

    return (
      <div className={`h-screen w-screen overflow-hidden ${isShop ? (shopTab === 'gadgets' ? 'bg-blue-50' : 'bg-pink-50') : 'bg-yellow-50'} flex flex-col select-none transition-colors duration-300`}>
        <HeaderBar />
        <div className="flex-1 flex flex-col items-center p-4 min-h-0 relative z-10">
          <div className="shrink-0 text-center mb-2 mt-2 w-full">
            <h1 className={`text-3xl md:text-5xl font-extrabold ${isShop ? (shopTab === 'gadgets' ? 'text-blue-700' : 'text-pink-600') : 'text-slate-800'} mb-2 transition-colors duration-300`}>
              {isShop ? '🛍️ 百寶袋商店 🛍️' : '🏆 四次元道具櫃 🏆'}
            </h1>
            <p className="text-xl md:text-2xl font-bold text-orange-600">
              {isShop ? `你有 ${player.dorayaki} 個銅鑼燒 🥞` : `收集進度：${Object.values(player.gadgets).filter(v => v > 0).length} / ${GADGETS.length}`}
            </p>

            {/* --- 新增：商店雙分籤切換 --- */}
            {isShop && (
              <div className="flex justify-center gap-4 mt-4 mb-2">
                <button onClick={() => {SoundEngine.pop(); setShopTab('gadgets');}} className={`px-6 py-2 rounded-full font-bold text-lg md:text-xl transition-all shadow-sm ${shopTab === 'gadgets' ? 'bg-blue-500 text-white scale-105' : 'bg-white text-blue-500 border-2 border-blue-200'}`}>🎒 實用道具區</button>
                <button onClick={() => {SoundEngine.pop(); setShopTab('flowers');}} className={`px-6 py-2 rounded-full font-bold text-lg md:text-xl transition-all shadow-sm ${shopTab === 'flowers' ? 'bg-pink-500 text-white scale-105' : 'bg-white text-pink-500 border-2 border-pink-200'}`}>🌸 草地花卉區</button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 w-full max-w-6xl overflow-y-auto pb-4 pt-2 px-2">
            <div className={`grid gap-4 ${isShop ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
              {isShop ? shopItems.map(item => {
                const isGadget = shopTab === 'gadgets';
                // 區分統計：道具算數量，花朵算已種植的陣列長度
                const count = isGadget ? (player.gadgets[item.name] || 0) : (player.flowers?.filter(f => f.icon === item.icon).length || 0);
                return (
                  <div key={item.name} className={`bg-white rounded-3xl p-4 md:p-6 border-4 ${isGadget ? 'border-blue-300' : 'border-pink-300'} shadow-md flex items-center gap-4`}>
                    <div className="text-5xl md:text-6xl shrink-0 drop-shadow-sm">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">{item.name}</h2>
                      <p className="text-slate-500 text-xs md:text-sm font-medium mb-1 line-clamp-2">{item.desc}</p>
                      <p className={`${isGadget ? 'text-blue-600' : 'text-pink-600'} font-bold text-sm`}>已擁有: {count} 個</p>
                    </div>
                    <button onClick={() => isGadget ? buyGadget(item) : buyFlower(item)} className={`shrink-0 ${isGadget ? 'bg-yellow-400 border-yellow-600 text-blue-900' : 'bg-pink-400 border-pink-600 text-white'} font-bold text-lg md:text-xl py-2 px-4 rounded-xl shadow-md border-b-4 active:border-b-0 active:translate-y-1`}>
                      {item.cost} 🥞
                    </button>
                  </div>
                );
              }) : GADGETS.map(item => {
                const count = player.gadgets[item.name] || 0;
                const isOwned = count > 0;
                return (
                  <div key={item.name} className={`rounded-3xl p-4 md:p-6 border-4 flex flex-col items-center text-center shadow-md ${isOwned ? 'bg-white border-yellow-400' : 'bg-slate-100 border-slate-300 opacity-60'}`}>
                    <div className="text-5xl md:text-6xl mb-2">{isOwned ? item.icon : '🔒'}</div>
                    <h2 className={`text-xl font-bold mb-1 ${isOwned ? 'text-blue-600' : 'text-slate-500'}`}>{isOwned ? item.name : '未知'}</h2>
                    <p className={`font-bold ${isOwned ? 'text-orange-500' : 'text-slate-400'}`}>持有: {count} 個</p>
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
  // 畫面渲染：遊戲主畫面 (草地特訓背景與花園)
  // ==========================================
  return (
    // 核心更改：將背景改為草地綠 bg-green-100，並設定 relative 以容納花朵絕對定位層
    <div className="h-screen w-screen overflow-hidden bg-green-100 flex flex-col select-none touch-manipulation relative">
      
      {/* --- 新增：草地花卉渲染層 (永遠在最下層 z-0) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {player.flowers?.map((f, idx) => (
          <div key={idx} className="absolute text-5xl md:text-7xl drop-shadow-md transition-transform" 
               style={{ left: `${f.x}%`, top: `${f.y}%`, transform: 'translate(-50%, -50%)' }}>
            {f.icon}
          </div>
        ))}
      </div>

      <HeaderBar />

      <div className="flex-1 min-h-0 flex flex-col md:flex-row items-center justify-center p-4 md:p-8 gap-6 md:gap-12 relative z-10">
        <div className="absolute top-2 text-green-800 bg-white/70 px-4 py-1 rounded-full font-bold text-lg md:text-xl shadow-sm backdrop-blur-sm">📝 {mathProblem.typeName}</div>
        
        <div className="flex flex-col items-center shrink-0">
          <div className={`relative w-32 h-32 md:w-56 md:h-56 ${currentChar.color} rounded-full flex items-center justify-center text-7xl md:text-9xl shadow-lg border-[6px] md:border-8 border-white overflow-hidden bg-white`}>
            {currentChar.image && !imageError ? (
              <img src={currentChar.image} alt={currentChar.name} className="absolute inset-0 w-full h-full object-cover z-10" onError={() => setImageError(true)} />
            ) : (
              <span className="relative z-0">{currentChar.icon}</span>
            )}
          </div>
          <span className={`mt-2 md:mt-4 text-2xl md:text-3xl font-black ${currentChar.textColor} drop-shadow-md`}>{currentChar.name}</span>
        </div>

        <div className={`bg-white/95 backdrop-blur-sm p-5 md:p-8 rounded-3xl border-4 ${currentChar.borderColor} shadow-xl w-full max-w-md flex items-center justify-center text-center md:text-left min-h-[120px]`}>
          <p className="text-xl md:text-3xl font-bold text-slate-800 leading-snug w-full">{feedbackMsg || currentMsg}</p>
        </div>
      </div>

      <div className="shrink-0 bg-blue-600/95 backdrop-blur-md rounded-t-3xl shadow-[0_-15px_25px_rgba(0,0,0,0.2)] p-4 flex flex-col items-center gap-4 relative z-10 border-t-4 border-blue-400">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 w-full max-w-5xl">
          
          <div className="flex items-center justify-center text-4xl md:text-6xl font-black text-yellow-300 bg-blue-800/60 px-6 py-4 rounded-3xl w-full lg:w-auto shrink-0 shadow-inner border-2 border-blue-500">
            🥞 {mathProblem.dividend} ÷ {mathProblem.divisor} = 
            <div className="ml-3 w-20 h-14 md:w-28 md:h-20 bg-yellow-50 text-slate-800 rounded-2xl flex items-center justify-center border-4 border-blue-400 shadow-inner relative overflow-hidden">
              {userAnswer}
              <div className="absolute right-2 w-1 h-3/4 bg-blue-500 animate-ping opacity-75"></div>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2 bg-blue-500 p-2 md:p-3 rounded-2xl shadow-lg shrink-0">
            {[1,2,3,4,5,6].map(n => (
              <button key={n} onClick={()=>handleNumberClick(n.toString())} className="bg-white text-blue-900 font-black text-xl md:text-2xl w-10 h-10 md:w-14 md:h-14 rounded-xl shadow active:scale-90 flex items-center justify-center">{n}</button>
            ))}
            {[7,8,9,0].map(n => (
              <button key={n} onClick={()=>handleNumberClick(n.toString())} className="bg-white text-blue-900 font-black text-xl md:text-2xl w-10 h-10 md:w-14 md:h-14 rounded-xl shadow active:scale-90 flex items-center justify-center">{n}</button>
            ))}
            <button onClick={handleClear} className="bg-red-400 text-white font-bold text-base md:text-xl col-span-2 rounded-xl shadow active:scale-90 flex items-center justify-center">清除</button>
          </div>

          <button onClick={() => submitAnswer()} className="w-full lg:w-auto bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-black text-2xl md:text-3xl px-8 py-3 md:py-4 rounded-2xl shadow-lg border-b-8 border-yellow-600 active:border-b-0 active:translate-y-2 whitespace-nowrap transition-all flex items-center justify-center">
            ✅ 烤銅鑼燒
          </button>
        </div>

        <div className="w-full max-w-5xl bg-blue-900/40 rounded-xl p-3 flex items-center gap-3 overflow-x-auto shrink-0 scrollbar-hide border border-blue-500/50">
          <span className="text-yellow-300 font-bold text-lg whitespace-nowrap shrink-0">🎒 百寶袋：</span>
          <div className="flex gap-2 w-full">
            {GADGETS.map(g => {
              const count = player.gadgets[g.name] || 0;
              if (count <= 0) return null;
              return (
                <button key={g.name} onClick={() => useGadget(g.name)} className="bg-white text-left p-2 rounded-lg shadow border-2 border-blue-300 min-w-[160px] flex-shrink-0 active:scale-95 transition">
                  <div className="font-bold text-blue-700 text-base mb-0.5">{g.icon} {g.name} <span className="text-orange-500 text-xs">(剩 {count})</span></div>
                  <div className="text-slate-500 text-[11px] leading-tight line-clamp-1">{g.desc}</div>
                </button>
              );
            })}
            {Object.values(player.gadgets).every(c => !c || c <= 0) && (
              <span className="text-blue-200 text-sm md:text-base whitespace-nowrap">空空的...遇到困難可以去商店買道具喔！</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}