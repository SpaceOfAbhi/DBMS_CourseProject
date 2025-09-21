const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.header('x-auth-token'); // Frontend must send token here
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // user ID stored in req.user
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
