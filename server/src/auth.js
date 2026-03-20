const jwt = require('jsonwebtoken');

const PASSWORD = process.env.PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '30d';

function authenticate(password) {
  if (password !== PASSWORD) {
    return null;
  }
  return jwt.sign({ authorized: true }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const decoded = verifyToken(header.slice(7));
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = decoded;
  next();
}

module.exports = { authenticate, verifyToken, authMiddleware };
