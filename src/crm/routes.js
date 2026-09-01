const router = require("express").Router();
const path = require("path");
const store = require("./store");
const { requireCrmAuth } = require("./auth");

const COLLECTIONS = [
  "contacts",
  "teams",
  "tournaments",
  "matches",
  "groups",
  "checkins",
  "conversations",
  "commandLogs",
  "notes"
];

router.get("/login", (req, res) => {
  if (req.session?.crmUser) return res.redirect("/crm");
  res.sendFile(path.join(process.cwd(), "src/crm/public/login.html"));
});

router.post("/auth/login", (req, res) => {
  const user = String(req.body.username || "");
  const pass = String(req.body.password || "");

  if (
    user === String(process.env.CRM_ADMIN_USER || "admin") &&
    pass === String(process.env.CRM_ADMIN_PASSWORD || "change-me-now")
  ) {
    req.session.crmUser = { username: user };
    return res.json({ ok: true });
  }

  res.status(401).json({ message: "Credenciales incorrectas" });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.use(requireCrmAuth);

router.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "src/crm/public/index.html"));
});

router.get("/api/dashboard", (_req, res) => {
  const db = store.read();

  const scheduled = db.matches.filter((m) => m.status === "scheduled");
  const pendingCheckins = scheduled.reduce((total, match) => {
    const matchCheckins = db.checkins.filter((c) => c.matchId === match.id).length;
    return total + Math.max(0, 2 - matchCheckins);
  }, 0);

  res.json({
    counts: {
      contacts: db.contacts.length,
      teams: db.teams.length,
      tournaments: db.tournaments.length,
      matches: db.matches.length,
      groups: db.groups.length,
      checkins: db.checkins.length,
      conversations: db.conversations.length,
      commands: db.commandLogs.length
    },
    pendingCheckins,
    upcomingMatches: scheduled
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
      .slice(0, 8),
    recentCommands: db.commandLogs.slice(0, 10),
    recentConversations: db.conversations.slice(0, 10)
  });
});

for (const collection of COLLECTIONS) {
  router.get(`/api/${collection}`, (_req, res) => {
    res.json(store.list(collection));
  });

  router.get(`/api/${collection}/:id`, (req, res) => {
    const item = store.get(collection, req.params.id);
    if (!item) return res.status(404).json({ message: "Registro no encontrado" });
    res.json(item);
  });

  router.post(`/api/${collection}`, (req, res) => {
    res.status(201).json(store.create(collection, req.body));
  });

  router.put(`/api/${collection}/:id`, (req, res) => {
    const item = store.update(collection, req.params.id, req.body);
    if (!item) return res.status(404).json({ message: "Registro no encontrado" });
    res.json(item);
  });

  router.delete(`/api/${collection}/:id`, (req, res) => {
    const ok = store.remove(collection, req.params.id);
    if (!ok) return res.status(404).json({ message: "Registro no encontrado" });
    res.status(204).end();
  });
}

router.get("/api/settings", (_req, res) => {
  res.json(store.read().settings || {});
});

router.put("/api/settings", (req, res) => {
  const db = store.read();
  db.settings = { ...db.settings, ...req.body };
  store.write(db);
  res.json(db.settings);
});

module.exports = router;
