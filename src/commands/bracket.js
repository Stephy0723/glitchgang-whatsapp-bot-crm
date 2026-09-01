const gg = require("../services/glitchgangApi");

module.exports = {
  async execute({ phone, reply }) {
    const match = await gg.getUpcomingMatch(phone);

    if (!match?.bracketUrl) {
      return reply("❌ No hay bracket disponible.");
    }

    await reply(`🏆 *Bracket*\n${match.bracketUrl}`);
  }
};
