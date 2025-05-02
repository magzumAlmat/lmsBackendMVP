const jwt = require('jsonwebtoken');

const generateJWT = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    roleId: user.roleId,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }); // Токен действителен 1 час
};

module.exports = { generateJWT };