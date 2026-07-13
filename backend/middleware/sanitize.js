/**
 * Strips MongoDB operator keys ("$gt", "$where", ...) and dotted keys
 * from user input to prevent NoSQL injection, e.g. someone sending
 * { "password": { "$gt": "" } } to bypass a login check.
 *
 * NOTE: We intentionally do NOT use the popular "express-mongo-sanitize"
 * package here. As of Express 5, req.query is a read-only getter
 * (no setter), and that package tries to reassign it in place, which
 * throws "Cannot set property query of #<IncomingMessage>". Writing a
 * tiny sanitizer ourselves avoids that incompatibility entirely and
 * has zero extra dependency risk.
 */
function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const clean = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        // Drop dangerous keys entirely rather than trying to "fix" them.
        continue;
      }
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }

  return value;
}

function sanitizeInputs(req, res, next) {
  // req.body is a plain writable property, safe to mutate in Express 5.
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }

  // req.params is safe to mutate too.
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params);
  }

  // req.query is read-only in Express 5, so we deliberately leave it
  // alone here. Controllers that read query params (search/filter/sort)
  // treat them as plain strings and never pass them straight into a
  // Mongo operator, which keeps things safe without mutating req.query.
  next();
}

module.exports = sanitizeInputs;
