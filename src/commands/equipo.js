const gg = require("../services/glitchgangApi");

module.exports = {
  async execute({ args, reply }) {
    if (!args.length) return reply("⚡ *USO*: !equipo <nombre>\n\nEjemplo: !equipo Team Nova");

    const team = await gg.getTeam(args.join(" "));

    if (!team) return reply("❌ *EQUIPO NO ENCONTRADO*\n\nRevisa: !equipos");

    const membersList = (team.members || []).length 
      ? "\n*👥 Jugadores:*\n" + (team.members || []).map((m) => `  • ${m}`).join("\n")
      : "";

    await reply(
      [
        "═════════════════════════════════════",
        `🛡️ *${team.name.toUpperCase()}*`,
        "═════════════════════════════════════",
        "",
        `🎮 *Juego:* ${team.game}`,
        `📍 *Región:* ${team.region || "Sin región"}`,
        `💪 *Estado:* ${team.status || "activo"}`,
        membersList,
        "",
        "═════════════════════════════════════"
      ].filter(l => l).join("\n")
    );
  }
};
