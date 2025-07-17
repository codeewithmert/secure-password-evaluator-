 # secure-password-evaluator

[![npm version](https://img.shields.io/npm/v/secure-password-evaluator.svg)](https://www.npmjs.com/package/secure-password-evaluator)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Şifrelerin güvenliğini analiz eden, puanlayan, sızmış şifreleri tespit eden ve öneriler sunan modern, gelişmiş ve esnek bir Node.js kütüphanesi.

---

## 🚀 Özellikler
- Şifreyi analiz edip puanlama (zayıf, orta, güçlü, çok güçlü)
- Uzunluk, karakter çeşitliliği, tekrar eden ve ardışık karakterler, sözlükte olup olmama
- Kişisel bilgiyle benzerlik ve gelişmiş pattern kontrolü (tarih, telefon, doğum yılı, TC kimlik no, plaka, vs.)
- Sızmış şifre kontrolü (HaveIBeenPwned API ve offline veri tabanı)
- Şifre kırılma süresi tahmini (brute-force, sözlük, rainbow table)
- Güçlü şifre ve passphrase (Diceware, gelişmiş kurallı üretici) önerileri
- Gelişmiş politika ve kural motoru (JSON/fonksiyon tabanlı, kurumsal kullanım için)
- Detaylı puanlama ve rapor (her kural için ayrı açıklama ve puan)
- Kendi sözlük ve kurallarınızı ekleyebilme
- Tamamen async, modern ve modüler API

---

## 📦 Kurulum
```sh
npm install secure-password-evaluator
```

---

## ⚡️ Hızlı Kullanım
```js
const evaluator = require('secure-password-evaluator');

(async () => {
  const result = await evaluator.evaluate('P@ssw0rd123', {
    personalInfo: ['mert', 'mert@gmail.com'],
    checkPwned: true // HaveIBeenPwned API ile sızma kontrolü
  });
  console.log(result);
})();
```

---

## 🔍 API
### evaluate(password, [options]) → Promise<Result>
Şifreyi analiz eder, puanlar ve detaylı rapor döner.

**options:**
- `minLength` (number): Minimum uzunluk (varsayılan: 8)
- `customDictionary` (array): Ek yasaklı kelime/şifre listesi
- `personalInfo` (array): Kişisel bilgi listesi (örn. ad, e-posta, kullanıcı adı)
- `checkPwned` (bool): HaveIBeenPwned API ile sızma kontrolü (varsayılan: false)
- `checkPwnedOffline` (bool): Offline hash veri tabanı ile sızma kontrolü (varsayılan: false)
- `policy` (object): Gelişmiş politika/kural motoru (JSON/fonksiyon tabanlı)

**Dönüş:**
- `score`: 0-100 arası puan
- `level`: 'zayıf', 'orta', 'güçlü', 'çok güçlü'
- `suggestions`: İyileştirme önerileri
- `report`: Detaylı analiz
- `details`: Her kural için puan ve açıklama
- `bruteForceTime`, `dictionaryTime`, `rainbowTableTime`: Kırılma süresi (saniye)
- `bruteForceTimeFormatted`, ...: Okunabilir süre
- `pwned`, `pwnedOffline`: Sızmış şifre kontrolü sonuçları

### suggest([options])
Güçlü bir şifre veya passphrase üretir.
- `options.length`: Şifre uzunluğu (varsayılan: 12)
- `options.passphrase`: true ise basit passphrase üretir
- `options.diceware`: true ise Diceware passphrase üretir (TR/EN, sembol/rakam karıştırma)
- `options.advanced`: true ise gelişmiş kurallı şifre üretir

---

## 🛡️ Gelişmiş Kullanım Örnekleri

### Gerçek Şifre Sızma Kontrolü
```js
const result = await evaluator.evaluate('password123', { checkPwned: true });
if (result.pwned) {
  console.log('UYARI: Bu şifre dünya çapında veri sızıntılarında tespit edilmiş!');
}
```

### Gelişmiş Politika/Kural Motoru
```js
const policy = {
  minScore: 60,
  rules: [
    { name: 'minLength', type: 'length', min: 10, points: 20, required: true, suggestion: 'En az 10 karakter kullanın.' },
    { name: 'noQwerty', type: 'regex', pattern: 'qwerty', points: 10, required: true, suggestion: 'QWERTY dizisi kullanmayın.' },
    { name: 'customCheck', type: 'custom', check: (pw) => !pw.includes('123'), points: 10, required: false }
  ]
};
const result = await evaluator.evaluate('qwerty123', { policy });
```

### Diceware Passphrase ve Gelişmiş Şifre Üretici
```js
console.log(evaluator.suggest({ diceware: true, lang: 'en', wordCount: 5, addSymbol: true, addNumber: true }));
console.log(evaluator.suggest({ advanced: true, length: 16, upper: true, lower: true, digit: true, symbol: true }));
```

---

## 🤝 Katkı ve Geliştirme
- PR ve issue'lara açıksınız!
- Kendi kural, sözlük veya dil desteğinizi ekleyebilirsiniz.
- Testler ve örnekler için `tests/` ve `examples/` klasörlerine bakın.

---

## 📄 Lisans
MIT

---

## 📢 İletişim & Destek
Her türlü öneri, hata bildirimi veya katkı için GitHub Issues üzerinden iletişime geçebilirsiniz. 
