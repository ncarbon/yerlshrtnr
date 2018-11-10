const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = () => {
    var key = '';
    for(var i = 0; i < 7; i++) {
        key += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    return key;
}