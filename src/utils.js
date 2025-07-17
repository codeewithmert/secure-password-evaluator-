const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

function hasUpper(str) { return /[A-Z]/.test(str); }
function hasLower(str) { return /[a-z]/.test(str); }
function hasDigit(str) { return /[0-9]/.test(str); }
function hasSymbol(str) { return /[^A-Za-z0-9]/.test(str); }
function hasRepeat(str) { return /(.)\1{2,}/.test(str); }
function hasSequential(str) {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '0123456789',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm'
  ];
  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 2; i++) {
      const sub = seq.substring(i, i + 3);
      if (str.toLowerCase().includes(sub)) return true;
    }
  }
  return false;
}
function isInDictionary(str, dict) {
  if (Array.isArray(dict)) dict = new Set(dict.map(s => s.toLowerCase()));
  return dict.has(str.toLowerCase());
}
function loadCommonPasswords() {
  const file = path.join(__dirname, 'common-passwords.json');
  return new Set(JSON.parse(fs.readFileSync(file, 'utf8')));
}
function randomPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}
const dicewareWordsTR = [
  'kedi','masa','elma','güneş','araba','kitap','yaz','kış','bulut','deniz',
  'kalem','yol','şehir','dağ','çiçek','yıldız','ev','beyaz','mavi','yeşil',
  'sandalye','balkon','bahar','göl','orman','kuş','balık','göz','el','ayak'
];
const dicewareWordsEN = [
  'cat','table','apple','sun','car','book','summer','winter','cloud','sea',
  'pen','road','city','mountain','flower','star','house','white','blue','green',
  'chair','balcony','spring','lake','forest','bird','fish','eye','hand','foot'
];
function randomDicewarePassphrase({
  wordCount = 4,
  lang = 'tr',
  separator = '-',
  addSymbol = false,
  addNumber = false
} = {}) {
  const words = lang === 'en' ? dicewareWordsEN : dicewareWordsTR;
  let phrase = [];
  for (let i = 0; i < wordCount; i++) {
    phrase.push(words[Math.floor(Math.random() * words.length)]);
  }
  if (addSymbol) {
    const symbols = '!@#$%^&*';
    phrase[Math.floor(Math.random() * phrase.length)] += symbols[Math.floor(Math.random() * symbols.length)];
  }
  if (addNumber) {
    phrase[Math.floor(Math.random() * phrase.length)] += Math.floor(Math.random() * 90 + 10);
  }
  return phrase.join(separator);
}
function advancedPassword({
  length = 12,
  upper = true,
  lower = true,
  digit = true,
  symbol = true
} = {}) {
  let chars = '';
  if (upper) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (lower) chars += 'abcdefghijkmnopqrstuvwxyz';
  if (digit) chars += '23456789';
  if (symbol) chars += '!@#$%^&*';
  if (!chars) chars = 'abcdefghijkmnopqrstuvwxyz';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}
function randomPassphrase(wordCount = 4) {
  return randomDicewarePassphrase({ wordCount, lang: 'tr' });
}
function levenshtein(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
function isSimilarToPersonalInfo(password, personalInfo = [], threshold = 0.7) {
  if (!Array.isArray(personalInfo) || personalInfo.length === 0) return false;
  const lowerPass = password.toLowerCase();
  return personalInfo.some(info => {
    if (!info) return false;
    info = info.toLowerCase();
    if (lowerPass.includes(info)) return true;
    const dist = levenshtein(lowerPass, info);
    const maxLen = Math.max(lowerPass.length, info.length);
    if (maxLen === 0) return false;
    const similarity = 1 - dist / maxLen;
    return similarity >= threshold;
  });
}
function detectPatterns(password) {
  const patterns = [];
  if (/\b(19|20)\d{2}[-/.]?(0[1-9]|1[0-2])[-/.]?(0[1-9]|[12][0-9]|3[01])\b/.test(password)) {
    patterns.push('Tarih (yıl-ay-gün veya benzeri)');
  }
  if (/\b(19|20)\d{2}\b/.test(password)) {
    patterns.push('Doğum yılı');
  }
  if (/\b0?5\d{9}\b/.test(password)) {
    patterns.push('Telefon numarası');
  }
  if (/\b[1-9][0-9]{10}\b/.test(password)) {
    patterns.push('TC kimlik numarası');
  }
  if (/\b(0[1-9]|[1-7][0-9]|8[01])\b/.test(password)) {
    patterns.push('Plaka kodu');
  }
  if (/^[0-9]{6,}$/.test(password)) {
    patterns.push('Sadece rakam dizisi');
  }
  if (/^[a-zA-Z]{6,}$/.test(password)) {
    patterns.push('Sadece harf dizisi');
  }
  return patterns;
}
function estimateBruteForceTime(password) {
  let charset = 0;
  if (hasLower(password)) charset += 26;
  if (hasUpper(password)) charset += 26;
  if (hasDigit(password)) charset += 10;
  if (hasSymbol(password)) charset += 32;
  const guesses = Math.pow(charset, password.length);
  const guessesPerSecond = 1e9;
  const seconds = guesses / guessesPerSecond;
  return seconds;
}
function estimateDictionaryTime(password, dictSize = 1e7) {
  const guessesPerSecond = 1e5;
  return dictSize / guessesPerSecond;
}
function estimateRainbowTableTime(password) {
  const guessesPerSecond = 1e7;
  const hashCount = 1e9;
  return hashCount / guessesPerSecond;
}
function formatTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)} sn`;
  if (seconds < 3600) return `${Math.round(seconds/60)} dk`;
  if (seconds < 86400) return `${Math.round(seconds/3600)} saat`;
  if (seconds < 2592000) return `${Math.round(seconds/86400)} gün`;
  if (seconds < 31536000) return `${Math.round(seconds/2592000)} ay`;
  if (seconds < 315360000) return `${Math.round(seconds/31536000)} yıl`;
  return `${Math.round(seconds/31536000)}+ yıl`;
}
function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex').toUpperCase();
}
function checkPwnedPassword(password) {
  return new Promise((resolve, reject) => {
    const hash = sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const options = {
      hostname: 'api.pwnedpasswords.com',
      path: `/range/${prefix}`,
      method: 'GET',
      headers: { 'Add-Padding': 'true' }
    };
    let data = '';
    const req = https.request(options, res => {
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const found = data.split('\n').some(line => {
          const [hashSuffix, count] = line.trim().split(':');
          return hashSuffix === suffix;
        });
        resolve(found);
      });
    });
    req.on('error', reject);
    req.end();
  });
}
const offlinePwnedHashes = new Set([
  '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8', // password
  '7C4A8D09CA3762AF61E59520943DC26494F8941B', // 123456
  'B1B3773A05C0ED0176787A4F1574FF0075F7521E', // qwerty
]);
function checkOfflinePwnedPassword(password) {
  const hash = sha1(password);
  return offlinePwnedHashes.has(hash);
}

module.exports = {
  hasUpper,
  hasLower,
  hasDigit,
  hasSymbol,
  hasRepeat,
  hasSequential,
  isInDictionary,
  loadCommonPasswords,
  randomPassword,
  randomPassphrase,
  randomDicewarePassphrase,
  advancedPassword,
  levenshtein,
  isSimilarToPersonalInfo,
  detectPatterns,
  estimateBruteForceTime,
  estimateDictionaryTime,
  estimateRainbowTableTime,
  formatTime,
  sha1,
  checkPwnedPassword,
  checkOfflinePwnedPassword
}; 