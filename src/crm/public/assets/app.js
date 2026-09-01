const state = { view: "dashboard", rows: [], editingId: null };

const schemas = {
  contacts: [
    ["username","Usuario"],["phone","Teléfono"],["game","Juego"],["teamId","ID equipo"],
    ["role","Rol"],["status","Estado"],["verified","Verificado","select",["true","false"]]
  ],
  teams: [["name","Nombre"],["game","Juego"],["region","Región"],["status","Estado"]],
  tournaments: [
    ["name","Nombre"],["game","Juego"],["status","Estado"],["startDate","Fecha"],
    ["maxTeams","Máx. equipos","number"],["registeredTeams","Registrados","number"],
    ["bracketUrl","Bracket"],["rulesUrl","Reglas"],["discordUrl","Discord"]
  ],
  matches: [
    ["tournamentId","ID torneo"],["tournamentName","Torneo"],["teamA","Equipo A"],["teamB","Equipo B"],
    ["scheduledAt","Fecha/hora"],["checkinAt","Check-in"],["status","Estado"],["discordUrl","Discord"],["bracketUrl","Bracket"]
  ],
  groups: [["name","Nombre"],["whatsappGroupId","ID WhatsApp"],["status","Estado"],["botEnabled","Bot activo","select",["true","false"]]],
  checkins: [["phone","Teléfono"],["userId","ID usuario"],["matchId","ID partida"],["status","Estado"],["source","Origen"]],
  notes: [["title","Título"],["body","Nota","textarea"],["relatedType","Tipo relacionado"],["relatedId","ID relacionado"]]
};

const titles = {
  dashboard:"Dashboard", contacts:"Usuarios", teams:"Equipos", tournaments:"Torneos",
  matches:"Partidas", groups:"Grupos WhatsApp", checkins:"Check-ins", conversations:"Conversaciones",
  commandLogs:"Comandos", notes:"Notas", settings:"Configuración"
};

async function api(path, options={}) {
  const res = await fetch(`/crm/api/${path}`, {
    headers: {"Content-Type":"application/json", ...(options.headers||{})},
    ...options
  });
  if (res.status === 401) { location.href="/crm/login"; throw new Error("No autenticado"); }
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error");
  return data;
}

function esc(v){return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function short(v,n=70){v=String(v??""); return v.length>n?v.slice(0,n)+"…":v;}
function badge(v){return `<span class="badge ${["active","open","confirmed","scheduled"].includes(String(v))?"ok":""}">${esc(v ?? "—")}</span>`;}

async function renderDashboard(){
  const d=await api("dashboard");
  const c=d.counts;
  document.querySelector("#content").innerHTML=`
    <div class="cards">
      ${[
        ["Usuarios",c.contacts],["Equipos",c.teams],["Torneos",c.tournaments],["Partidas",c.matches],
        ["Grupos",c.groups],["Check-ins",c.checkins],["Mensajes",c.conversations],["Comandos",c.commands]
      ].map(x=>`<div class="card"><small>${x[0]}</small><div class="metric">${x[1]}</div></div>`).join("")}
    </div>
    <div class="grid-2">
      <div class="panel"><h3>Próximas partidas</h3>${tableFor("matches",d.upcomingMatches,false)}</div>
      <div class="panel"><h3>Actividad del bot</h3><div class="activity">
        ${(d.recentCommands.length?d.recentCommands:[{command:"Sin actividad",phone:"—",createdAt:""}]).map(x=>
          `<div class="activity-item"><strong>!${esc(x.command)}</strong><br><small>${esc(x.phone||"")} ${esc(x.groupName||"")}</small></div>`
        ).join("")}
      </div></div>`;
}

function columnsFor(view, rows){
  const preferred={
    contacts:["username","phone","game","teamId","role","status"],
    teams:["name","game","region","status"],
    tournaments:["name","game","status","startDate","registeredTeams","maxTeams"],
    matches:["tournamentName","teamA","teamB","scheduledAt","status"],
    groups:["name","whatsappGroupId","status","botEnabled"],
    checkins:["phone","userId","matchId","status","source","checkedInAt"],
    conversations:["direction","phone","groupName","command","body","createdAt"],
    commandLogs:["command","phone","groupName","status","createdAt"],
    notes:["title","body","relatedType","relatedId","createdAt"]
  };
  return preferred[view] || Object.keys(rows[0]||{}).filter(k=>k!=="updatedAt").slice(0,7);
}

function tableFor(view, rows, actions=true){
  if(!rows?.length) return `<div class="empty">No hay registros todavía.</div>`;
  const cols=columnsFor(view,rows);
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join("")}${actions?`<th>Acciones</th>`:""}</tr></thead><tbody>
    ${rows.map(r=>`<tr>${cols.map(c=>`<td>${["status","direction"].includes(c)?badge(r[c]):esc(short(r[c]))}</td>`).join("")}
    ${actions?`<td><button class="secondary" onclick="editRow('${view}','${r.id}')">Editar</button> <button class="danger" onclick="deleteRow('${view}','${r.id}')">Eliminar</button></td>`:""}</tr>`).join("")}
  </tbody></table></div>`;
}

async function renderCollection(view){
  const rows=await api(view);
  state.rows=rows;
  const canCreate=!!schemas[view];
  document.querySelector("#content").innerHTML=`
    <div class="panel">
      <div class="toolbar"><div class="left"><input id="search" placeholder="Buscar en ${titles[view].toLowerCase()}"></div>
      ${canCreate?`<button onclick="openCreate('${view}')">+ Nuevo</button>`:""}</div>
      <div id="tableArea">${tableFor(view,rows,canCreate)}</div>
    </div>`;
  document.querySelector("#search").addEventListener("input",e=>{
    const q=e.target.value.toLowerCase();
    const filtered=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q));
    document.querySelector("#tableArea").innerHTML=tableFor(view,filtered,canCreate);
  });
}

async function renderSettings(){
  const s=await api("settings");
  document.querySelector("#content").innerHTML=`
  <div class="panel"><h3>Configuración del bot</h3>
    <div class="form-grid">
      <label>Nombre<input id="businessName" value="${esc(s.businessName||"")}"></label>
      <label>Prefijo<input id="commandPrefix" value="${esc(s.commandPrefix||"!")}"></label>
      <label class="full">Mensaje de soporte<textarea id="supportMessage">${esc(s.supportMessage||"")}</textarea></label>
    </div>
    <button id="saveSettings">Guardar configuración</button>
  </div>`;
  document.querySelector("#saveSettings").onclick=async()=>{
    await api("settings",{method:"PUT",body:JSON.stringify({
      businessName:document.querySelector("#businessName").value,
      commandPrefix:document.querySelector("#commandPrefix").value,
      supportMessage:document.querySelector("#supportMessage").value
    })});
    alert("Configuración guardada");
  };
}

async function navigate(view){
  state.view=view;
  document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  document.querySelector("#pageTitle").textContent=titles[view];
  if(view==="dashboard") return renderDashboard();
  if(view==="settings") return renderSettings();
  return renderCollection(view);
}

function renderFields(view,row={}){
  return schemas[view].map(([key,label,type="text",options])=>{
    if(type==="textarea") return `<label class="full">${label}<textarea name="${key}">${esc(row[key]??"")}</textarea></label>`;
    if(type==="select") return `<label>${label}<select name="${key}">${options.map(o=>`<option value="${o}" ${String(row[key])===o?"selected":""}>${o}</option>`).join("")}</select></label>`;
    return `<label>${label}<input name="${key}" type="${type}" value="${esc(row[key]??"")}"></label>`;
  }).join("");
}

function openCreate(view){
  state.editingId=null;
  document.querySelector("#modalTitle").textContent=`Nuevo — ${titles[view]}`;
  document.querySelector("#modalFields").innerHTML=renderFields(view,{});
  document.querySelector("#modal").showModal();
}

function editRow(view,id){
  state.editingId=id;
  const row=state.rows.find(r=>r.id===id)||{};
  document.querySelector("#modalTitle").textContent=`Editar — ${titles[view]}`;
  document.querySelector("#modalFields").innerHTML=renderFields(view,row);
  document.querySelector("#modal").showModal();
}
window.editRow=editRow; window.openCreate=openCreate;

async function deleteRow(view,id){
  if(!confirm("¿Eliminar este registro?")) return;
  await api(`${view}/${id}`,{method:"DELETE"});
  navigate(view);
}
window.deleteRow=deleteRow;

document.querySelector("#saveBtn").onclick=async()=>{
  const form=new FormData(document.querySelector("#modalForm"));
  const body=Object.fromEntries(form.entries());
  for(const k of Object.keys(body)){
    if(body[k]==="true") body[k]=true;
    if(body[k]==="false") body[k]=false;
    if(["maxTeams","registeredTeams"].includes(k)&&body[k]!=="") body[k]=Number(body[k]);
  }
  const path=state.editingId?`${state.view}/${state.editingId}`:state.view;
  const method=state.editingId?"PUT":"POST";
  await api(path,{method,body:JSON.stringify(body)});
  document.querySelector("#modal").close();
  navigate(state.view);
};

document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>navigate(b.dataset.view));
document.querySelector("#logout").onclick=async()=>{await fetch("/crm/auth/logout",{method:"POST"});location.href="/crm/login";};
navigate("dashboard");
