const crypto = require('crypto');
const salt = 'sunray@8492';
const number = '38';
const hash = crypto.createHash('md5').update(salt + number).digest('hex');
console.log(hash); 