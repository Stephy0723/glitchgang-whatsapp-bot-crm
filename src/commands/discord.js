const gg = require("../services/glitchgangApi");

module.exports = {
  async execute({ phone, reply }) {
    const match = await gg.getUpcomingMatch(phone);

    if (!match?.discordUrl) {
      return reply("❌ No hay Discord asignado.");
    }

    await reply(`🎙 *Discord de la partida*\n${match.discordUrl}`);
  }
};
