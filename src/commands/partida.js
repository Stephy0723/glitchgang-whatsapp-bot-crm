const gg = require("../services/glitchgangApi");
const { formatMatch } = require("../utils/formatters");

module.exports = {
  async execute({ phone, reply }) {
    const match = await gg.getUpcomingMatch(phone);

    if (!match) {
      return reply("⚔️ No tienes una próxima partida programada.");
    }

    await reply(formatMatch(match));
  }
};
