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

router.get("/linking", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "src/crm/public/linking.html"));
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

router.get("/api/analytics/ranking", (_req, res) => {
  const db = store.read();
  const teams = db.teams || [];
  const matches = db.matches || [];
  
  const standings = teams.map(t => {
    const teamMatches = matches.filter(m => 
      (m.teamA === t.name || m.teamB === t.name) && m.status === "completed"
    );
    const wins = teamMatches.filter(m => 
      (m.teamA === t.name && m.winner === t.name) || 
      (m.teamB === t.name && m.winner === t.name)
    ).length;
    const losses = teamMatches.length - wins;
    
    return {
      ...t,
      wins,
      losses,
      matches: teamMatches.length,
      winRate: teamMatches.length > 0 ? Math.round(wins / teamMatches.length * 100) : 0
    };
  }).sort((a, b) => b.wins - a.wins);
  
  res.json(standings);
});

router.get("/api/analytics/tournaments", (_req, res) => {
  const db = store.read();
  const tournaments = db.tournaments || [];
  const matches = db.matches || [];
  
  const stats = tournaments.map(t => {
    const tournamentMatches = matches.filter(m => m.tournamentId === t.id);
    const completed = tournamentMatches.filter(m => m.status === "completed").length;
    const scheduled = tournamentMatches.filter(m => m.status === "scheduled").length;
    
    return {
      ...t,
      totalMatches: tournamentMatches.length,
      completedMatches: completed,
      scheduledMatches: scheduled,
      completionRate: tournamentMatches.length > 0 
        ? Math.round(completed / tournamentMatches.length * 100) 
        : 0
    };
  });
  
  res.json(stats);
});

router.get("/api/analytics/summary", (_req, res) => {
  const db = store.read();
  const matches = db.matches || [];
  const tournaments = db.tournaments || [];
  
  const completed = matches.filter(m => m.status === "completed").length;
  const scheduled = matches.filter(m => m.status === "scheduled").length;
  const activeTournaments = tournaments.filter(t => t.status === "active").length;
  const finishedTournaments = tournaments.filter(t => t.status === "finished").length;
  
  res.json({
    matches: {
      total: matches.length,
      completed,
      scheduled,
      completionRate: matches.length > 0 
        ? Math.round(completed / (completed + scheduled) * 100) 
        : 0
    },
    tournaments: {
      total: tournaments.length,
      active: activeTournaments,
      finished: finishedTournaments
    }
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
