const crypto = require('crypto');

// Example: MT-9F3A21BC
module.exports = () => 'MT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
