function requireCrmAuth(req, res, next) {
  if (req.session?.crmUser) return next();

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ message: "No autenticado" });
  }

  return res.redirect("/crm/login");
}

module.exports = { requireCrmAuth };
