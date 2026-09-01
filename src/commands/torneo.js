const gg = require("../services/glitchgangApi");

module.exports = {
  async execute({ args, reply }) {
    const id = args[0];

    if (!id) {
      return reply("Uso: *!torneo <id>*");
    }

    const t = await gg.getTournament(id);

    if (!t) return reply("❌ Torneo no encontrado.");

    await reply(
      [
        `🏆 *${t.name}*`,
        `🎮 ${t.game}`,
        `📅 ${t.startDate}`,
        `👥 ${t.registeredTeams}/${t.maxTeams}`,
        `📌 Estado: ${t.status}`,
        t.bracketUrl ? `🔗 Bracket: ${t.bracketUrl}` : null,
        t.rulesUrl ? `📖 Reglas: ${t.rulesUrl}` : null
      ].filter(Boolean).join("\n")
    );
  }
};
