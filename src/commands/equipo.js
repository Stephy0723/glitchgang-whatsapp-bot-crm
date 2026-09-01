const gg = require("../services/glitchgangApi");

module.exports = {
  async execute({ args, reply }) {
    if (!args.length) return reply("Uso: *!equipo <nombre>*");

    const team = await gg.getTeam(args.join(" "));

    if (!team) return reply("❌ Equipo no encontrado.");

    await reply(
      [
        `🛡 *${team.name}*`,
        `🎮 ${team.game}`,
        `🌎 ${team.region || "Sin región"}`,
        "",
        "*Jugadores*",
        ...(team.members || []).map((m) => `• ${m}`)
      ].join("\n")
    );
  }
};
