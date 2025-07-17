const evaluator = require('../secure-password-evaluator/index');

async function testEvaluate() {
  const weak = await evaluator.evaluate('123456');
  const strong = await evaluator.evaluate('G7!kzQ2@wLp9');
  console.log('Zayıf şifre:', weak);
  console.log('Güçlü şifre:', strong);
}

testEvaluate();

// Not: Eğer hata alırsanız, src/common-passwords.json dosyanızın geçerli bir JSON dizi olduğundan emin olun. 