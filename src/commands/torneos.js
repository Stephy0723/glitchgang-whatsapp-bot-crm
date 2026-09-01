const gg = require("../services/glitchgangApi");

module.exports = {
  async execute({ reply }) {
    const tournaments = await gg.getTournaments("open");

    if (!tournaments.length) {
      return reply("🎮 Actualmente no hay torneos abiertos.");
    }

    const text = tournaments.slice(0, 8).map((t, index) =>
      [
        `*${index + 1}. ${t.name}*`,
        `🎮 ${t.game}`,
        `📅 ${t.startDate}`,
        `👥 ${t.registeredTeams}/${t.maxTeams}`,
        `🆔 ${t.id}`
      ].join("\n")
    ).join("\n\n");

    await reply(`🏆 *TORNEOS GLITCHGANG*\n\n${text}`);
  }
};
