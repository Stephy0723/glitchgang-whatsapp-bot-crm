const gg = require("../services/glitchgangApi");

module.exports = {
  async execute({ phone, reply }) {
    const match = await gg.getUpcomingMatch(phone);

    if (!match) return reply("❌ No tienes un torneo activo.");

    const tournament = await gg.getTournament(match.tournamentId);

    if (!tournament?.rulesUrl) {
      return reply("📖 Las reglas todavía no están publicadas.");
    }

    await reply(`📖 *Reglamento*\n${tournament.rulesUrl}`);
  }
};
