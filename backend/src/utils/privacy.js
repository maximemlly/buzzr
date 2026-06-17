function maskEmail(email) {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  const visible = local.length <= 1 ? "*" : `${local[0]}***`;
  return `${visible}@${domain}`;
}

module.exports = { maskEmail };
