const utils = require('./utils');

async function evaluateRules(password, options = {}) {
  const minLength = options.minLength || 8;
  const dict = options.customDictionary || utils.loadCommonPasswords();
  const personalInfo = options.personalInfo || [];
  const checkPwned = options.checkPwned || false;
  const checkPwnedOffline = options.checkPwnedOffline || false;
  const policy = options.policy || null;
  let score = 0;
  let report = [];
  let suggestions = [];
  let details = [];
  let pwned = false;
  let pwnedOffline = false;

  // Gelişmiş politika/kural motoru
  if (policy && Array.isArray(policy.rules)) {
    for (const rule of policy.rules) {
      let passed = false;
      let points = 0;
      let message = '';
      if (typeof rule.fn === 'function') {
        passed = rule.fn(password, options);
      } else if (rule.type === 'regex' && rule.pattern) {
        passed = !(new RegExp(rule.pattern).test(password));
      } else if (rule.type === 'length' && rule.min) {
        passed = password.length >= rule.min;
      } else if (rule.type === 'custom' && typeof rule.check === 'function') {
        passed = rule.check(password, options);
      }
      points = passed ? (rule.points || 0) : 0;
      if (!passed && rule.required) {
        suggestions.push(rule.suggestion || 'Şifre politika gereksinimini karşılamıyor.');
        report.push(rule.report || 'Politika gereksinimi başarısız.');
      }
      message = passed ? (rule.successMsg || 'Başarılı') : (rule.failMsg || 'Başarısız');
      details.push({ rule: rule.name || 'custom', passed, points, message });
      score += points;
    }
    // Politika ile skor sınırı
    if (policy.minScore && score < policy.minScore) {
      suggestions.push(`Şifre en az ${policy.minScore} puan almalı.`);
      report.push('Politika: Minimum skor karşılanmadı.');
    }
    // Politika ile minimum seviye
    // ... (isteğe bağlı eklenebilir)
  } else {
    // Uzunluk
    if (password.length >= minLength) {
      score += 20;
      report.push('Şifre yeterli uzunlukta.');
      details.push({rule: 'length', passed: true, points: 20, message: 'Yeterli uzunluk.'});
    } else {
      suggestions.push(`En az ${minLength} karakter kullanın.`);
      report.push('Şifre çok kısa.');
      details.push({rule: 'length', passed: false, points: 0, message: 'Çok kısa.'});
    }

    // Karakter çeşitliliği
    let diversity = 0;
    if (utils.hasUpper(password)) diversity++;
    if (utils.hasLower(password)) diversity++;
    if (utils.hasDigit(password)) diversity++;
    if (utils.hasSymbol(password)) diversity++;
    score += diversity * 10;
    details.push({rule: 'diversity', passed: diversity >= 3, points: diversity * 10, message: `Çeşitlilik: ${diversity}`});
    if (diversity < 3) suggestions.push('Büyük harf, küçük harf, rakam ve sembol çeşitliliğini artırın.');
    if (diversity >= 3) report.push('Büyük harf, küçük harf, rakam ve sembol içeriyor.');

    // Tekrar eden karakterler
    if (utils.hasRepeat(password)) {
      suggestions.push('Tekrar eden karakterlerden kaçının.');
      report.push('Tekrar eden karakterler var.');
      details.push({rule: 'repeat', passed: false, points: 0, message: 'Tekrar eden karakterler var.'});
    } else {
      score += 10;
      details.push({rule: 'repeat', passed: true, points: 10, message: 'Tekrar eden karakter yok.'});
    }

    // Ardışık karakterler
    if (utils.hasSequential(password)) {
      suggestions.push('Ardışık karakterlerden kaçının.');
      report.push('Ardışık karakterler var.');
      details.push({rule: 'sequential', passed: false, points: 0, message: 'Ardışık karakterler var.'});
    } else {
      score += 10;
      details.push({rule: 'sequential', passed: true, points: 10, message: 'Ardışık karakter yok.'});
    }

    // Sözlükte olup olmama
    if (utils.isInDictionary(password, dict)) {
      suggestions.push('Yaygın veya tahmin edilebilir bir şifre kullanmayın.');
      report.push('Şifre yaygın bir şifre.');
      details.push({rule: 'dictionary', passed: false, points: 0, message: 'Yaygın şifre.'});
      score -= 20;
    } else {
      report.push('Şifre yaygın bir şifre değildir.');
      details.push({rule: 'dictionary', passed: true, points: 0, message: 'Yaygın şifre değil.'});
    }

    // Kişisel bilgiyle benzerlik (Levenshtein dahil)
    if (utils.isSimilarToPersonalInfo(password, personalInfo)) {
      suggestions.push('Şifrenizde kişisel bilgi (ad, e-posta, kullanıcı adı) veya benzeri bir şey kullanmayın.');
      report.push('Şifre kişisel bilgiyle benzerlik gösteriyor.');
      details.push({rule: 'personalInfo', passed: false, points: 0, message: 'Kişisel bilgiyle benzerlik var.'});
      score -= 20;
    } else {
      details.push({rule: 'personalInfo', passed: true, points: 0, message: 'Kişisel bilgiyle benzerlik yok.'});
    }

    // Gelişmiş pattern tespiti
    const patterns = utils.detectPatterns(password);
    if (patterns.length > 0) {
      suggestions.push('Şifrenizde tarih, telefon, doğum yılı, TC kimlik no veya benzeri kolay tahmin edilebilir patternler kullanmayın.');
      report.push('Şifre içinde şu patternler tespit edildi: ' + patterns.join(', '));
      details.push({rule: 'patterns', passed: false, points: 0, message: 'Pattern(ler): ' + patterns.join(', ')});
      score -= 15;
    } else {
      details.push({rule: 'patterns', passed: true, points: 0, message: 'Kolay tahmin edilebilir pattern yok.'});
    }
  }

  // Sızmış şifre kontrolü (offline)
  if (checkPwnedOffline) {
    pwnedOffline = utils.checkOfflinePwnedPassword(password);
    if (pwnedOffline) {
      suggestions.push('Bu şifre daha önce veri sızıntılarında tespit edilmiş. Farklı bir şifre kullanın!');
      report.push('Şifre offline veri tabanında sızmış olarak bulundu.');
      details.push({rule: 'pwnedOffline', passed: false, points: 0, message: 'Offline sızmış şifre!'});
      score = Math.min(score, 10);
    } else {
      details.push({rule: 'pwnedOffline', passed: true, points: 0, message: 'Offline veri tabanında sızmamış.'});
    }
  }

  // Sızmış şifre kontrolü (API)
  if (checkPwned) {
    try {
      pwned = await utils.checkPwnedPassword(password);
      if (pwned) {
        suggestions.push('Bu şifre daha önce veri sızıntılarında tespit edilmiş (API). Farklı bir şifre kullanın!');
        report.push('Şifre HaveIBeenPwned API ile sızmış olarak bulundu.');
        details.push({rule: 'pwned', passed: false, points: 0, message: 'API ile sızmış şifre!'});
        score = Math.min(score, 10);
      } else {
        details.push({rule: 'pwned', passed: true, points: 0, message: 'API ile sızmamış.'});
      }
    } catch (e) {
      details.push({rule: 'pwned', passed: null, points: 0, message: 'API kontrolü başarısız: ' + e.message});
    }
  }

  // Son skor ayarı
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  // Şifre kırılma süresi tahmini
  const bruteForceTime = utils.estimateBruteForceTime(password);
  const dictionaryTime = utils.estimateDictionaryTime(password);
  const rainbowTableTime = utils.estimateRainbowTableTime(password);

  // Seviye belirleme
  let level = 'zayıf';
  if (score >= 80) level = 'çok güçlü';
  else if (score >= 60) level = 'güçlü';
  else if (score >= 40) level = 'orta';

  return {
    score,
    level,
    suggestions,
    report,
    details,
    bruteForceTime,
    bruteForceTimeFormatted: utils.formatTime(bruteForceTime),
    dictionaryTime,
    dictionaryTimeFormatted: utils.formatTime(dictionaryTime),
    rainbowTableTime,
    rainbowTableTimeFormatted: utils.formatTime(rainbowTableTime),
    pwned,
    pwnedOffline
  };
}

module.exports = { evaluateRules }; 