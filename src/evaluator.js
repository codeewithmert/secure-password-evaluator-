const { evaluateRules } = require('./rules');
const { randomPassword, randomPassphrase, randomDicewarePassphrase, advancedPassword } = require('./utils');

async function evaluate(password, options = {}) {
  if (typeof password !== 'string' || !password) {
    throw new Error('Şifre bir string olmalı ve boş olmamalı.');
  }
  return await evaluateRules(password, options);
}

function suggest(options = {}) {
  if (options.diceware) {
    return randomDicewarePassphrase(options);
  }
  if (options.advanced) {
    return advancedPassword(options);
  }
  if (options.passphrase) {
    const wordCount = options.wordCount || 4;
    return randomPassphrase(wordCount);
  }
  const length = options.length || 12;
  return randomPassword(length);
}

module.exports = {
  evaluate,
  suggest
}; 