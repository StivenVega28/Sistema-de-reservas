const roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware específico para cada rol
const isAdmin = roleGuard(['admin']);
const isWaiter = roleGuard(['admin', 'mesero']);
const isKitchen = roleGuard(['admin', 'cocina']);
const isDispatcher = roleGuard(['admin', 'despacho']);

module.exports = {
  roleGuard,
  isAdmin,
  isWaiter,
  isKitchen,
  isDispatcher
};
