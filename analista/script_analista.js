async function loadAnalystTickets() {
  try {
    const response = await fetch('http://localhost:3000/api/tickets/analyst');
    if (!response.ok) {
      throw new Error('Falha ao buscar chamados do servidor.');
    }
    
    const data = await response.json();
    
    return data; 

  } catch (e) {
    console.warn("Falha ao carregar chamados do backend:", e);
    alert("Erro ao carregar chamados. O backend está rodando?");
    return []; 
  }
}

let tickets = []; 

try{
  const cur = localStorage.getItem('currentUser');
  if(cur){
    const u = JSON.parse(cur);
    const badge = document.getElementById('analystBadge');
    if(badge){
      badge.innerHTML = `Analista: ${u.name} <button class="ghost" id="btnLogoutAnalyst">Sair</button>`;
      const btn = document.getElementById('btnLogoutAnalyst');
      if(btn) btn.addEventListener('click', ()=>{ localStorage.removeItem('currentUser'); window.location = '../index.html'; });
    }
  }
}catch(e){ console.warn('analyst badge failed', e); }

try{
  const cur = localStorage.getItem('currentUser');
  if(!cur) { window.location = '../index.html'; }
  else {
    const u = JSON.parse(cur);
    if(!u || u.role !== 'analista') { window.location = '../index.html'; }
  }
}catch(e){ console.warn('analyst auth guard failed', e); window.location = '../index.html'; }

function refreshIndicators() {
  const crit = tickets.filter((t) =>
    String(t.urg || "").toLowerCase().includes("crít") ||
    String(t.urg || "").toLowerCase().includes("crit")
  ).length;
  const pend = tickets.filter((t) => t.status === "Pendente").length;
  const critEl = document.getElementById("critCount"); 
  const sidebarCrit = document.getElementById("countCrit"); 
  const pendEl = document.getElementById("pendCount");
  const slaEl = document.getElementById("slaCount");
  if (critEl) {
    critEl.innerText = crit;
    critEl.style.fontWeight = "700";
    critEl.style.color = crit ? "#ffb4b4" : "#94a3b8";
  }
  if (sidebarCrit) {
    sidebarCrit.innerText = crit + " críticos";
    sidebarCrit.style.color = crit ? "#ffb4b4" : "#94a3b8";
  }
  if (pendEl) pendEl.innerText = pend;
  if (slaEl) slaEl.innerText = tickets.filter((t) => t.slaViolated).length || 0;
}

function computeSLA(slaHours) {
  slaHours = slaHours || 24;
  const now = new Date();
  tickets.forEach((t) => {
    const updated = t.updated ? new Date(t.updated) : null;
    if (!updated) {
      t.slaViolated = false;
      return;
    }
    const diffHours = (now - updated) / (1000 * 60 * 60);
    t.slaViolated = (t.status !== "Resolvido") && diffHours > slaHours;
  });
}


function renderAnalystTable() {
  const body = document.getElementById("analystTable");
  body.innerHTML = "";
  const queueTickets = tickets.filter((t) => t.status !== "Resolvido");
  const sorted = [...queueTickets].sort(
    (a, b) =>
      (b.urg === "Crítica") - (a.urg === "Crítica") || b.iaConf - a.iaConf
  );
  sorted.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${t.id}</td><td>${t.user}</td><td><b>${
      t.title
    }</b><div class="muted" style="color:var(--muted);font-size:13px">${
      t.cat
    } • ${t.status}</div></td><td><span class="badge ${
      t.urg === "Crítica" ? "urg-crit" : ""
    }">${t.urg}</span></td><td>${Math.round(
      (t.iaConf || 0.5) * 100 
    )}%</td><td><button class="btn" onclick="openDetail(${
      t.id
    })">Abrir</button></td>`;
    body.appendChild(tr);
  });

  const all = document.getElementById("analystTableAll");
  if (all) all.innerHTML = "";
  tickets.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${t.id}</td><td>${t.user}</td><td>${t.title}</td><td>${t.cat}</td><td>${t.status}</td><td><button class="ghost" onclick="openDetail(${t.id})">Abrir</button></td>`;
    if (all) all.appendChild(tr);
  });

  const pend = document.getElementById("analystPending");
  if (pend) pend.innerHTML = "";
  tickets
    .filter((t) => t.status === "Pendente")
    .forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${t.id}</td><td>${t.title}</td><td>IA sem confiança</td><td><button class="ghost" onclick="openDetail(${t.id})">Revisar</button></td>`;
      if (pend) pend.appendChild(tr);
    });
}

function showView(id) {
  document.querySelectorAll(".view").forEach((v) => (v.style.display = "none"));
  const viewId =
    id === "fila"
      ? "view-fila"
      : id === "todos"
      ? "view-todos"
      : id === "pendentes"
      ? "view-pendentes"
      : "view-todos";
  const viewEl = document.getElementById(viewId);
  if (viewEl) viewEl.style.display = "block";
  const quick = document.getElementById('quickFilters');
  if (quick) {
    if (id === 'fila') quick.style.display = 'none';
    else if (id === 'todos') quick.style.display = 'block';
    else quick.style.display = 'none';
  }
  if (id === 'todos') applyFilters();
  const detail = document.getElementById("detailPanel");
  if (detail) detail.style.display = "none";
  document.querySelectorAll(".menu-item").forEach((mi) => mi.classList.remove("active"));
  const menuItem = document.querySelector(`.menu-item[onclick="showView('${id}')"]`);
  if (menuItem) menuItem.classList.add("active");
}

async function openDetail(id) { 
  const t = tickets.find((x) => x.id === id);
  if (!t) return alert("Chamado não encontrado");

  document.getElementById("detailPanel").style.display = "block";
  document.getElementById("detailTitle").innerText = `#${t.id} — ${t.title}`;
  
  document.getElementById("detailMeta").innerText = `Status: ${t.status} • ${t.user} • ${t.cat} • Atualizado: ${t.updated}`;

  document.getElementById("detailDesc").innerText = t.desc; 

  document.getElementById("iaCat").innerText = t.cat;
  document.getElementById("iaUrg").innerText = t.urg;
  document.getElementById("iaConf").innerText = `(${Math.round((t.iaConf || 0.5) * 100)}% confiança)`;
  document.getElementById("iaText").innerText = generateStandardText(t);

  document.getElementById("detailStatus").value = t.status;

  const actionsEl = document.getElementById("detailActions");
  if (actionsEl)
    actionsEl.innerHTML = ``; 

  document.getElementById("detailPanel").dataset.current = id;

  const historyEl = document.getElementById("detailHistory");
  historyEl.innerHTML = "Carregando histórico...";

  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${id}/history`);
    const historyData = await response.json();

    if (historyData.length === 0) {
      historyEl.innerText = "Sem histórico de interações.";
      return;
    }

    historyEl.innerHTML = ""; 
    historyData.forEach(item => {
      const div = document.createElement('div');
      div.style = "padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);";
      const authorTag = item.author_role === 'analista' ? 'Analista' : 'Usuário';
      const authorName = item.author_name;
      const date = new Date(item.created_at).toLocaleString('pt-BR');

      div.innerHTML = `
        <strong style="color: ${item.author_role === 'analista' ? '#06b6d4' : '#e6eef8'}">
          ${authorTag} (${authorName})
        </strong>
        <span class="muted" style="font-size: 12px; margin-left: 8px;">${date}</span>
        <div style="margin-top: 4px;">${item.comment}</div>
      `;
      historyEl.appendChild(div);
    });

  } catch (e) {
    historyEl.innerText = "Erro ao carregar histórico.";
    console.error(e);
  }
}

function closeDetail() {
  document.getElementById("detailPanel").style.display = "none";
  document.getElementById("quickResp").value = "";
}

function generateStandardText(t) {
  if (t.cat === "Rede")
    return "Parece uma indisponibilidade de rede. Recomendo reiniciar o roteador e verificar cabos. Se persistir, abrir chamado para Nível 2.";
  if (t.cat === "Hardware")
    return "Possível falha de hardware. Solicitar avaliação física do equipamento e teste de BIOS. Agendar atendimento on-site.";
  return "Investigaremos o erro no sistema. Pedir logs e passos para reproduzir. Sugerir reinício e limpar cache antes de prosseguir.";
}

function applyIASuggestion() {
  const id = parseInt(
    document.getElementById("detailPanel").dataset.current
  );
  const t = tickets.find((x) => x.id === id);
  if (!t) return;
  t.applied = true;
  alert("Sugestão da IA aplicada ao ticket (simulação).");
}

async function updateTicketStatus() {
  const id = parseInt(document.getElementById("detailPanel").dataset.current);
  const newStatus = document.getElementById("detailStatus").value;
  const t = tickets.find((x) => x.id === id);
  
  if (!t) return alert("Erro: Chamado não encontrado.");
  if (t.status === newStatus) return alert("O chamado já está com esse status.");

  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: newStatus })
    });
    const data = await response.json();
    
    if (!data.success) throw new Error(data.message);

    t.status = newStatus; 
    alert("Status do chamado atualizado para: " + newStatus);

    document.getElementById("detailMeta").innerText = `Status: ${t.status} • ${t.user} • ${t.cat} • Atualizado: ${t.updated}`;
    renderAnalystTable(); 
    computeSLA();
    refreshIndicators();
    
  } catch (e) {
      alert("Erro ao atualizar status: " + (e.message || 'Erro desconhecido.'));
  }
}


async function sendReply() {
  const id = parseInt(document.getElementById("detailPanel").dataset.current);
  const msg = document.getElementById("quickResp").value.trim();
  if (!msg) return alert("Escreva uma resposta.");

  const cur = localStorage.getItem('currentUser');
  if (!cur) return alert("Erro: Analista não logado.");
  const u = JSON.parse(cur);
  const analystId = u.id;

  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            analyst_id: analystId, 
            comment: msg 
        })
    });
    const data = await response.json();

    if (!data.success) throw new Error(data.message);

    alert("Resposta enviada!");
    document.getElementById("quickResp").value = "";
    
    openDetail(id); 
    
  } catch (e) {
      alert("Erro ao enviar resposta: " + (e.message || 'Erro desconhecido.'));
  }
}

function applyFilters() {
  const qEl = document.getElementById("q");
  const urgEl = document.getElementById("filterUrg");
  const statusEl = document.getElementById("filterStatus");
  const query = qEl ? qEl.value.trim().toLowerCase() : "";
  const urg = urgEl ? urgEl.value : "";
  const status = statusEl ? statusEl.value : "";
  let filtered = tickets.slice();
  if (query)
    filtered = filtered.filter((t) =>
      ((t.user || "") + " " + (t.title || "")).toLowerCase().includes(query)
    );
  if (urg) filtered = filtered.filter((t) => t.urg === urg);
  if (status) filtered = filtered.filter((t) => t.status === status);
  const all = document.getElementById("analystTableAll");
  if (!all) return;
  all.innerHTML = "";
  filtered.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${t.id}</td><td>${t.user}</td><td>${t.title}</td><td>${t.cat}</td><td>${t.status}</td><td><button class="ghost" onclick="openDetail(${t.id})">Abrir</button></td>`;
    all.appendChild(tr);
  });
}

function sortBy(key) {
  if (key === "urg") {
    tickets.sort(
      (a, b) =>
        (b.urg === "Crítica") - (a.urg === "Crítica") ||
        b.iaConf - a.iaConf
    );
  } else {
    tickets.sort((a, b) => new Date(b.updated) - new Date(a.updated));
  }
  renderAnalystTable();
}

async function bulkRefresh() {
  alert("Atualizando fila (buscando dados do servidor)...");
  await init(); 
  alert("Fila atualizada!");
}

async function init() {
  tickets = await loadAnalystTickets(); 
  
  renderAnalystTable();
  computeSLA();
  refreshIndicators();
  
  const quick = document.getElementById('quickFilters');
  if (quick) quick.style.display = 'none';
  showView("fila");
}

init();