const gg = require("../services/glitchgangApi");

module.exports = {
  async execute({ phone, reply }) {
    const match = await gg.getUpcomingMatch(phone);

    if (!match) {
      return reply("❌ No tienes una partida disponible para check-in.");
    }

    const result = await gg.checkIn(phone, match.id);

    await reply(
      [
        "✅ *CHECK-IN CONFIRMADO*",
        `🏆 ${match.tournamentName}`,
        `⚔️ ${match.teamA} vs ${match.teamB}`,
        `🆔 ${result.matchId}`,
        match.discordUrl ? `🎙 Discord: ${match.discordUrl}` : null
      ].filter(Boolean).join("\n")
    );
  }
};
