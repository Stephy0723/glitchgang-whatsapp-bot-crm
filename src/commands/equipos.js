const gg = require("../services/glitchgangApi");

module.exports = {
  async execute({ reply }) {
    const teams = await gg.getTeams();

    await reply(
      "🛡 *EQUIPOS GLITCHGANG*\n\n" +
      teams.map((t, i) => `${i + 1}. *${t.name}* — ${t.game}`).join("\n")
    );
  }
};
