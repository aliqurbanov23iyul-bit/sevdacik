'use strict';

const $ = s => document.querySelector(s);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const storage = {
  get(k, fallback = 0) { try { return localStorage.getItem(k) || fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};

// Navbar mobile menu
const menu = $('.menu');
if (menu) {
  menu.addEventListener('click', () => {
    const open = $('nav').classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? '✕' : '☰';
  });
}
document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', () => {
    $('nav').classList.remove('open');
    if (menu) {
      menu.setAttribute('aria-expanded', 'false');
      menu.textContent = '☰';
    }
  });
});

// Scroll reveal
if ('IntersectionObserver' in window) {
  document.body.classList.add('js-ready');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Toast notification
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// Confetti burst
function confetti() {
  if (reduceMotion) return;
  for (let i = 0; i < 35; i++) {
    const p = document.createElement('span');
    p.className = 'confetti';
    p.textContent = ['♡', '✦', '🌸', '✨', '🎀', '🍒', '⭐'][i % 7];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.top = '-20px';
    p.style.color = ['#eb3573', '#ff79b0', '#ffc048', '#ff4757', '#a55eea', '#2ed573'][i % 6];
    p.style.setProperty('--dx', (Math.random() - 0.5) * 260 + 'px');
    p.style.animationDelay = Math.random() * 0.4 + 's';
    document.body.append(p);
    setTimeout(() => p.remove(), 2800);
  }
}

// Hero Kitty Interactive Dialogue (witty banter)
const greetings = [
  'Məni tutmağa\nçalışma, aşağıda\nonsuz da qaçacam :D',
  'Yenə sən? Xoş gəldin, gəl bir qucaqlayım! ♡',
  'Bu gün heç kimlə dava eləmə, Kitty icazə vermir :P',
  'Get bir kofe iç, gözlərindən yuxu tökülür :D',
  'Bütün gün bu saytda qalacaqsan deyəsən? Sevindim!',
  'Mənə çox tıkla, bəlkə qızıl verdim :D'
];
let greetingIndex = 0;
const heroKitty = $('#heroKitty');
const bubble = $('#bubble');
if (heroKitty && bubble) {
  heroKitty.addEventListener('click', () => {
    greetingIndex = (greetingIndex + 1) % greetings.length;
    bubble.innerHTML = greetings[greetingIndex].replace(/\n/g, '<br>');
    confetti();
  });
}

// ═══════════════ OYUN 1: TUT GÖRƏK ═══════════════
let catchActive = false, catchScore = 0, catchEndAt = 0, catchTimer;
let catchBest = Number(storage.get('sevda-kitty-best')) || 0;
function showBest() {
  const el = $('#best');
  if (el) el.textContent = catchBest ? 'Ən yaxşı rekordun: ' + catchBest + ' xal 🏆' : '';
}
showBest();

function moveRunner() {
  const arena = $('#arena'), runner = $('#runner');
  if (!arena || !runner) return;
  runner.style.left = (8 + Math.random() * Math.max(0, arena.clientWidth - runner.offsetWidth - 16)) + 'px';
  runner.style.top = (8 + Math.random() * Math.max(0, arena.clientHeight - runner.offsetHeight - 40)) + 'px';
}

function catchStats() {
  const left = Math.max(0, Math.ceil((catchEndAt - Date.now()) / 1000));
  $('#catchStats').textContent = catchScore + ' xal · ' + left + ' san.';
  if (left === 0) finishCatch();
}

function finishCatch() {
  if (!catchActive) return;
  catchActive = false;
  clearInterval(catchTimer);
  $('#startCatch').disabled = false;
  $('#startCatch').textContent = 'Təzədən oyna ↻';
  
  if (catchScore === 0) {
    $('.arena-hint').textContent = 'Heç tuta bilmədin? Kitty sənə gülür :P';
    toast('Yuxulusan deyəsən? Kitty səndən cəld çıxdı :D (0 xal)');
  } else if (catchScore < 8) {
    $('.arena-hint').textContent = 'Pis deyil, amma Kitty hələ də sağ-salamatdır!';
    toast('Fena deyil! ' + catchScore + ' dəfə tutdun, amma daha çox olar :D');
  } else {
    $('.arena-hint').textContent = 'Vooov! Əsl pişiktutan çıxdın ki sən! :D';
    toast('Möhtəşəm nəticə: ' + catchScore + ' dəfə tutdun! 🏆');
  }

  if (catchScore > catchBest) {
    catchBest = catchScore;
    storage.set('sevda-kitty-best', catchBest);
    showBest();
    confetti();
  }
}

$('#startCatch').addEventListener('click', () => {
  if (catchActive) return;
  catchActive = true;
  catchScore = 0;
  catchEndAt = Date.now() + 20000;
  $('#startCatch').disabled = true;
  $('.arena-hint').textContent = 'Kitty qaçır, toxun görüm!';
  moveRunner();
  catchStats();
  catchTimer = setInterval(catchStats, 200);
});

$('#runner').addEventListener('click', () => {
  if (!catchActive) {
    toast('Əvvəlcə «Gəl bura, tutdum səni!» düyməsinə bas :)');
    return;
  }
  if (Date.now() >= catchEndAt) {
    finishCatch();
    return;
  }
  catchScore++;
  moveRunner();
  catchStats();
});
window.addEventListener('resize', () => { if (catchActive) moveRunner(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && catchActive) finishCatch(); });


// ═══════════════ OYUN 2: YADDAŞ OYUNU ═══════════════
let selected = [], pairs = 0, attempts = 0, locked = false, memoryTimeout;
const symbols = ['🎀', '🌸', '🍓', '☁️', '🌷', '♡'];

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function resetMemory() {
  clearTimeout(memoryTimeout);
  selected = [];
  pairs = 0;
  attempts = 0;
  locked = false;
  $('#memoryGrid').replaceChildren();
  $('#memoryStats').textContent = '0 / 6 cüt';
  shuffle([...symbols, ...symbols]).forEach((symbol, index) => {
    const tile = document.createElement('button');
    tile.className = 'memory-tile';
    tile.textContent = '✦';
    tile.setAttribute('aria-label', 'Bağlı kart ' + (index + 1));
    tile.dataset.symbol = symbol;
    tile.addEventListener('click', () => openTile(tile));
    $('#memoryGrid').append(tile);
  });
}

function openTile(tile) {
  if (locked || tile.classList.contains('open') || tile.classList.contains('matched')) return;
  tile.classList.add('open');
  const span = document.createElement('span');
  span.textContent = tile.dataset.symbol;
  tile.replaceChildren(span);
  tile.setAttribute('aria-label', tile.dataset.symbol + ' kartı');
  selected.push(tile);
  if (selected.length < 2) return;
  attempts++;
  if (selected[0].dataset.symbol === selected[1].dataset.symbol) {
    selected.forEach(t => {
      t.classList.add('matched');
      t.disabled = true;
    });
    selected = [];
    pairs++;
    $('#memoryStats').textContent = pairs + ' / 6 cüt · ' + attempts + ' gediş';
    if (pairs === 6) {
      confetti();
      toast('Halaldır, Sevda! Yaddaşın daş kimidir, heç nəyi unutma ha! :D');
    }
  } else {
    locked = true;
    memoryTimeout = setTimeout(() => {
      selected.forEach(t => {
        t.classList.remove('open');
        t.textContent = '✦';
        t.setAttribute('aria-label', 'Bağlı kart');
      });
      selected = [];
      locked = false;
    }, 750);
  }
}

$('#resetMemory').addEventListener('click', resetMemory);
resetMemory();


// ═══════════════ SƏMİMİ VƏ ZARAFATCIL MƏKTUBLAR ═══════════════
const letters = [
  [
    'Gülümsə, dünya dağılmayıb hələ!',
    'Sevda, bilirsən nə var? Həyat bəzən adamın əsəblərini tarıma çəkir, amma sən qaşqabağını tökəndə heç nə düzəlmir, əksinə Kitty qorxur :D Bir az dərindən nəfəs al və gülümsə. Çünki sən güləndə həqiqətən ətrafdakı hər şey bir az daha gözəl və dözülən olur. Həyat sənin gülüşün qədər şirin olsun ♡'
  ],
  [
    'Əşi, heç nəyə dəyməz!',
    'İş, dərslər, gündəlik qayğılar... Boş ver bir beş dəqiqəliyə! Hər şeyi bu gün həll etmək kimi bir məcburiyyətin yoxdur. Get özünə yaxşı bir kofe ya da sevdiyin çaydan süz, ən sevdiyin mahnını qulaqlıqda ən son səsə qoy. Dünya bir az gözləsin, heç yerə qaçmır :P'
  ],
  [
    'Bu sayt niyə var?',
    'Çünki kimsə düşündü ki, Sevdanın üzündə balaca bir təbəssüm yaratmaq üçün Hello Kitty-dən daha yaxşı bəhanə ola bilməz :P Heç bir rəsmi səbəb olmadan, sırf günün şən və rəngli keçsin deyə hazırlandı. Yaxşı ki varsan, dəlisov və şirin qal həmişə ♡'
  ]
];

const dialog = $('#letterDialog');
document.querySelectorAll('[data-letter]').forEach(b => {
  b.addEventListener('click', () => {
    const [title, text] = letters[Number(b.dataset.letter)];
    $('#letterTitle').textContent = title;
    $('#letterText').textContent = text;
    dialog.showModal();
  });
});
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  }
});


// ═══════════════ KAZİNO APARATI / SLOT MACHINE 🎰 ═══════════════
(function initCasino() {
  const SYMBOLS = ['🐱', '🎀', '🍓', '🍒', '💎', '⭐', '💖', '👑', '🍀'];
  const ITEM_HEIGHT = 110;
  const STRIP_LENGTH = 28; // how many icons stacked in the reel strip

  const reels = [$('#strip0'), $('#strip1'), $('#strip2')];
  const spinBtn = $('#spinBtn');
  const slotLever = $('#slotLever');
  const statusEl = $('#slotStatus');
  const resultText = $('#slotResultText');
  const slotMachine = $('#slotMachine');

  if (!spinBtn || !reels[0]) return;

  // Funny witty predictions / fortunes
  const fortunes = [
    '🎰 Bəxtinə çıxdı: Bu gün mütləq sevdiyin şirniyyatı və ya kofeni al. Kalorilər bu günlük ləğv edildi, Kitty şəxsən zamin durur :D',
    '🎰 Taktika: Bu gün səni əsəbləşdirmək istəyən hər kəsə sadəcə baxıb gülümsə. Dəli olduğunu düşünüb uzaqlaşacaqlar, 100% yoxlanılıb!',
    '🎰 Jackpot Fikri: Bu gün heç bir ciddi qərar qəbul etmə. Sadəcə yat, seriala bax və kofe iç. Ən məntiqli həyat planı budur :P',
    '🎰 Bəxt: Gözləmədiyin adamdan ya pul, ya da çox şirin bir tərif gələcək. Cibini hazır saxla :D',
    '🎰 Ulduzlar deyir: Bu gün gözəlliyinlə dünyanı fəth edə bilərsən, amma əvvəlcə yataqdan qalxmaq lazımdır :P',
    '🎰 Kitty Fərmanı: Bu gün heç kim sənin əhvalını poza bilməz! Əks təqdirdə Kitty şəxsən hücum edəcək 🐾',
    '🎰 Fal: Bu gün hansı mağazaya girsən, bəyəndiyin şey mütləq endirimdə olacaq (inşallah :D)',
    '🎰 Məsləhət: Çox düşünmək insanı qocaldır. Kitty kimi ol: heç nə düşünmür, sadəcə şirindir :D'
  ];

  // Fill reel strips with initial randomized icons
  const reelState = [0, 0, 0];
  reels.forEach((strip, reelIdx) => {
    strip.innerHTML = '';
    for (let i = 0; i < STRIP_LENGTH; i++) {
      const div = document.createElement('div');
      div.className = 'reel-item';
      div.textContent = SYMBOLS[i % SYMBOLS.length];
      strip.appendChild(div);
    }
  });

  let spinning = false;

  // Sound effects via Web Audio API
  function playTickSound(freq = 480) {
    if (!audioContext) return;
    try {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioContext.currentTime);
      gain.gain.setValueAtTime(0.04, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + 0.09);
    } catch {}
  }

  function playJackpotSound() {
    if (!audioContext) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioContext.currentTime);
          gain.gain.setValueAtTime(0.06, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.start();
          osc.stop(audioContext.currentTime + 0.35);
        }, idx * 110);
      });
    } catch {}
  }

  function spinSlot() {
    if (spinning) return;
    spinning = true;

    // Pull lever animation
    slotLever.classList.add('pulled');
    setTimeout(() => slotLever.classList.remove('pulled'), 350);

    spinBtn.disabled = true;
    statusEl.textContent = '🎰 Fırlanır... Gözlə görək nə çıxır!';

    // Determine target symbols (give nice matching odds)
    const isJackpot = Math.random() < 0.35; // 35% chance of 3-matching jackpot!
    let targets = [];
    if (isJackpot) {
      const luckySym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      targets = [luckySym, luckySym, luckySym];
    } else {
      targets = [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ];
    }

    // Spin sound ticker
    let tickCount = 0;
    const tickerInt = setInterval(() => {
      playTickSound(380 + (tickCount % 6) * 40);
      tickCount++;
      if (tickCount > 18) clearInterval(tickerInt);
    }, 110);

    // Animate each reel with cascading stops
    const durations = [1.2, 1.7, 2.2];

    reels.forEach((strip, idx) => {
      // Find index of target symbol in the strip near the bottom
      const targetSym = targets[idx];
      // Target position in strip (towards bottom, e.g. index 20-25)
      const stopIndex = 18 + (SYMBOLS.indexOf(targetSym) % 6);
      strip.children[stopIndex].textContent = targetSym;

      const offset = stopIndex * ITEM_HEIGHT;
      strip.style.transition = `transform ${durations[idx]}s cubic-bezier(0.12, 0.85, 0.2, 1)`;
      strip.style.transform = `translateY(-${offset}px)`;

      // Clack when reel lands
      setTimeout(() => {
        playTickSound(260);
      }, durations[idx] * 1000);
    });

    // When last reel stops:
    setTimeout(() => {
      spinning = false;
      spinBtn.disabled = false;

      // Check results
      if (targets[0] === targets[1] && targets[1] === targets[2]) {
        // JACKPOT!
        statusEl.textContent = `🎉 JACKPOT! 3 dənə ${targets[0]}! Sən bu günün kraliçasısan!`;
        slotMachine.classList.add('slot-jackpot');
        setTimeout(() => slotMachine.classList.remove('slot-jackpot'), 2500);
        confetti();
        playJackpotSound();
        toast(`MÖHTƏŞƏM! 3 DƏNƏ ${targets[0]} ÇIXDI! 🎉`);
      } else if (targets[0] === targets[1] || targets[1] === targets[2] || targets[0] === targets[2]) {
        statusEl.textContent = '✨ 2 dənə eyni çıxdı! Şans səndən yanadır!';
        confetti();
      } else {
        statusEl.textContent = 'Qəşəng kombinasiyadır :D Bir də fırlat!';
      }

      // Display humorous fortune
      const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      resultText.textContent = randomFortune;

      // Reset strips smoothly after delay so they can spin again
      setTimeout(() => {
        reels.forEach((strip, i) => {
          strip.style.transition = 'none';
          strip.children[0].textContent = targets[i];
          strip.style.transform = 'translateY(0px)';
        });
      }, 3000);

    }, 2400);
  }

  spinBtn.addEventListener('click', spinSlot);
  slotLever.addEventListener('click', spinSlot);
})();


// ═══════════════ HƏDİYYƏ QUTUSU ═══════════════
$('#gift').addEventListener('click', () => {
  if ($('#gift').classList.contains('open')) return;
  $('#gift').classList.add('open');
  $('#gift').setAttribute('aria-label', 'Hədiyyə açıldı');
  $('.gift-note').textContent = 'tam sənə görə ♡';
  $('#giftMessage').hidden = false;
  confetti();
  setTimeout(() => $('#giftMessage').scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'center' }), 400);
});
$('#celebrate').addEventListener('click', confetti);


// ═══════════════ MELODİYA (SƏNƏT SƏSİ) ═══════════════
let audioContext, audioTimer, soundOn = false, noteIndex = 0;
const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46, 659.25, 783.99, 1046.5, 783.99, 587.33, 659.25, 523.25, 0];

function playNote() {
  if (!soundOn || document.hidden) return;
  const freq = melody[noteIndex++ % melody.length];
  if (!freq) return;
  const osc = audioContext.createOscillator(), gain = audioContext.createGain(), t = audioContext.currentTime;
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.045, t + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(t);
  osc.stop(t + 0.65);
}

$('#sound').addEventListener('click', async () => {
  try {
    if (!audioContext) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) { toast('Bu brauzerdə səs dəstəyi yoxdur.'); return; }
      audioContext = new Audio();
    }
    await audioContext.resume();
    soundOn = !soundOn;
    $('#sound').setAttribute('aria-pressed', String(soundOn));
    $('#sound').setAttribute('aria-label', soundOn ? 'Melodiyanı söndür' : 'Melodiyanı aç');
    if (soundOn) {
      playNote();
      audioTimer = setInterval(playNote, 430);
      toast('Şirin melodiya açıldı 🎵');
    } else {
      clearInterval(audioTimer);
      toast('Melodiya dayandırıldı');
    }
  } catch {
    toast('Səsi açmaq mümkün olmadı.');
  }
});


// ═══════════════ ULDUZ YAĞIŞI OYUNU (GAME 3) ═══════════════
(function () {
  'use strict';
  const arena    = document.getElementById('starArena');
  const player   = document.getElementById('starPlayer');
  const scoreEl  = document.getElementById('starScore');
  const livesEl  = document.getElementById('starLives');
  const timerEl  = document.getElementById('starTimer');
  const hintEl   = document.getElementById('starHint');
  const startBtn = document.getElementById('startStar');
  const statsEl  = document.getElementById('starStats');
  const bestEl   = document.getElementById('starBest');

  if (!arena) return;

  const GOOD = ['✦', '⭐', '🌟', '💛', '✨', '🍓'];
  const BAD  = ['💔', '🖤', '💀'];
  const TOTAL_TIME = 30;

  let running = false, starScore = 0, lives = 3, timeLeft = TOTAL_TIME;
  let playerX = 50, spawnInterval, tickInterval, fallers = [];
  let starBest = Number(localStorage.getItem('sevda-star-best') || 0);
  if (starBest) bestEl.textContent = 'Ən yaxşı nəticən: ' + starBest + ' xal 🏆';

  function livesStr(n) {
    let s = '';
    for (let i = 0; i < 3; i++) s += i < n ? '💖' : '🖤';
    return s;
  }

  function updateHUD() {
    scoreEl.textContent = '✦ ' + starScore;
    livesEl.textContent = livesStr(lives);
    timerEl.textContent = Math.ceil(timeLeft) + ' san';
    statsEl.textContent = starScore + ' xal · ' + lives + ' can';
  }

  function setPlayerX(pct) {
    playerX = Math.max(5, Math.min(95, pct));
    player.style.left = playerX + '%';
  }

  // Mouse move
  arena.addEventListener('mousemove', e => {
    if (!running) return;
    const rect = arena.getBoundingClientRect();
    setPlayerX(((e.clientX - rect.left) / rect.width) * 100);
  });

  // Touch move
  arena.addEventListener('touchmove', e => {
    if (!running) return;
    e.preventDefault();
    const rect = arena.getBoundingClientRect();
    setPlayerX(((e.touches[0].clientX - rect.left) / rect.width) * 100);
  }, { passive: false });

  // Keyboard navigation
  let keysDown = {};
  document.addEventListener('keydown', e => { keysDown[e.key] = true; });
  document.addEventListener('keyup',   e => { delete keysDown[e.key]; });
  function processKeys() {
    if (!running) return;
    if (keysDown['ArrowLeft'])  setPlayerX(playerX - 2.5);
    if (keysDown['ArrowRight']) setPlayerX(playerX + 2.5);
  }

  function spawnFaller() {
    if (!running) return;
    const isBad = Math.random() < 0.26;
    const pool  = isBad ? BAD : GOOD;
    const sym   = pool[Math.floor(Math.random() * pool.length)];
    const el    = document.createElement('div');
    el.className = 'falling-item' + (isBad ? ' bad' : '');
    el.textContent = sym;
    el.dataset.bad  = isBad ? '1' : '0';
    const leftPct = 5 + Math.random() * 90;
    el.style.left = leftPct + '%';
    const dur = 1.8 + Math.random() * 1.5;
    el.style.animation = 'starFall ' + dur + 's linear forwards';
    arena.appendChild(el);
    fallers.push({ el, leftPct, dur, t: Date.now() });

    el.addEventListener('animationend', () => {
      el.remove();
      fallers = fallers.filter(f => f.el !== el);
    });
  }

  function checkCollisions() {
    if (!running) return;
    processKeys();
    const arenaH = arena.clientHeight;
    const arenaW = arena.clientWidth;
    const playerW = (player.offsetWidth / arenaW) * 100;
    const playerY = arenaH - 60;

    fallers.forEach(f => {
      if (!f.el.isConnected) return;
      const elapsed = (Date.now() - f.t) / 1000;
      const progress = elapsed / f.dur;
      const itemY = progress * (arenaH + 40) - 40;

      if (itemY < playerY - 20 || itemY > playerY + 40) return;

      const itemCenterX = f.leftPct;
      const playerCenterX = playerX;
      if (Math.abs(itemCenterX - playerCenterX) < playerW + 5) {
        if (f.el.dataset.bad === '1') {
          lives = Math.max(0, lives - 1);
          arena.classList.add('star-hit');
          setTimeout(() => arena.classList.remove('star-hit'), 300);
          if (lives === 0) endGame();
        } else {
          starScore++;
        }
        f.el.remove();
        fallers = fallers.filter(x => x.el !== f.el);
        updateHUD();
      }
    });
  }

  function endGame() {
    running = false;
    clearInterval(spawnInterval);
    clearInterval(tickInterval);
    startBtn.disabled = false;
    startBtn.textContent = 'Yenidən oyna ↻';
    hintEl.textContent = lives > 0
      ? '🎉 Əhsən! ' + starScore + ' xal qazandın!'
      : '💔 Canın bitdi! Zəhərli ürəklərə toxunma demişdim axı :D (' + starScore + ' xal)';
    if (starScore > starBest) {
      starBest = starScore;
      localStorage.setItem('sevda-star-best', starBest);
      bestEl.textContent = 'Ən yaxşı nəticən: ' + starBest + ' xal 🏆';
      if (typeof confetti === 'function') confetti();
    }
    if (typeof toast === 'function') toast('Ulduz oyunu bitdi: ' + starScore + ' xal!');
    fallers.forEach(f => f.el.remove());
    fallers = [];
  }

  startBtn.addEventListener('click', () => {
    if (running) return;
    running = true;
    starScore = 0;
    lives = 3;
    timeLeft = TOTAL_TIME;
    fallers = [];
    playerX = 50;
    player.style.left = '50%';
    startBtn.disabled = true;
    startBtn.textContent = 'Oyun davam edir…';
    hintEl.textContent = 'Ulduzları və parıltıları yığ! 💫';
    updateHUD();

    spawnInterval = setInterval(spawnFaller, 650);
    tickInterval = setInterval(() => {
      checkCollisions();
      if (!running) return;
      timeLeft = Math.max(0, timeLeft - 0.1);
      timerEl.textContent = Math.ceil(timeLeft) + ' san';
      if (timeLeft <= 0) endGame();
    }, 100);
  });
})();
