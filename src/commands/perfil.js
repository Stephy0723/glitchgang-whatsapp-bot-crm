const gg = require("../services/glitchgangApi");

module.exports = {
  async execute({ phone, reply }) {
    const user = await gg.getUserByPhone(phone);

    if (!user) {
      return reply(
        "❌ Este número todavía no está vinculado a una cuenta GlitchGang."
      );
    }

    const team = user.teamId ? await gg.getTeam(user.teamId) : null;

    await reply(
      [
        `👤 *${user.username}*`,
        `🎮 ${user.game || "Sin juego"}`,
        `🛡 Equipo: ${team?.name || "Sin equipo"}`,
        `✅ Verificado: ${user.verified ? "Sí" : "No"}`
      ].join("\n")
    );
  }
};
