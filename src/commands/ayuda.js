module.exports = {
  async execute({ reply }) {
    await reply(
      [
        "🎮 *GLITCHGANG BOT*",
        "",
        "*Comandos disponibles*",
        "!torneos — torneos abiertos",
        "!torneo <id> — detalle de torneo",
        "!equipos — equipos registrados",
        "!equipo <nombre> — detalle de equipo",
        "!perfil — tu perfil vinculado",
        "!partida — tu próxima partida",
        "!partidas — tus partidas",
        "!checkin — hacer check-in",
        "!bracket — bracket de tu próxima partida",
        "!discord — Discord de tu próxima partida",
        "!reglas — reglas del torneo",
        "!ranking — ranking demo",
        "!soporte — contacto con staff"
      ].join("\n")
    );
  }
};
