const gg = require("../services/glitchgangApi");
const { formatMatch } = require("../utils/formatters");

module.exports = {
  async execute({ phone, reply }) {
    const matches = await gg.getMatches(phone);

    if (!matches.length) {
      return reply("⚔️ No tienes partidas registradas.");
    }

    const text = matches.slice(0, 5).map(formatMatch).join("\n\n");
    await reply(`🎯 *TUS PARTIDAS*\n\n${text}`);
  }
};
