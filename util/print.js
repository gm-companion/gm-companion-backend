function secret(string) {
  if (string && string.length) {
    return `${string.substring(0, 4)} ... ${string.substring(string.length - 4)}`;
  }

  return '';
}

module.exports = { secret };
