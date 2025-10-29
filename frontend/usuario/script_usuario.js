
try{
  const cur = localStorage.getItem('currentUser');
  if(cur){
    const u = JSON.parse(cur);
    const badge = document.getElementById('userBadge');
    if(badge){
      
      badge.innerHTML = `<div style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.03);display:flex;align-items:center;gap:8px"><div style="font-size:13px;color:var(--muted)">Olá, ${u.name}</div><button class="btn" id="btnLogoutUser" style="padding:6px 8px">Sair</button></div>`;
      const btn = document.getElementById('btnLogoutUser');
      if(btn) btn.addEventListener('click', ()=>{ localStorage.removeItem('currentUser'); window.location = '../index.html'; });
    }
  }
}catch(e){console.warn('user badge failed', e)}

let loggedUser = null; // Variável global para o usuário logado
try{
  const cur = localStorage.getItem('currentUser');
  if(!cur) { window.location = '../index.html'; }
  else {
    const u = JSON.parse(cur);
    if(!u || u.role !== 'usuario') { 
      window.location = '../index.html'; 
    } else {
      loggedUser = u; // Salva o usuário logado 
    }
  }
}catch(e){ console.warn('auth guard failed', e); window.location = '../index.html'; }

async function loadUserTickets() {
  try {
    if (!loggedUser || !loggedUser.id) {
      throw new Error('Usuário logado não tem um ID.');
    }
    
    // Chama a nova rota da API, passando o ID do usuário
    const response = await fetch(`http://localhost:3000/api/tickets/user/${loggedUser.id}`);
    if (!response.ok) {
      throw new Error('Falha ao buscar chamados do servidor.');
    }
    
    const data = await response.json();
    return data; 

  } catch (e) {
    console.warn("Falha ao carregar chamados do usuário:", e);
    alert("Erro ao carregar chamados. O backend está rodando?");
    return [];
  }
}

function renderCounts() {
  document.getElementById("openCount").innerText = tickets.filter(
    (t) => t.status === "Aberto"
  ).length;
  document.getElementById("inProgressCount").innerText = tickets.filter(
    (t) => t.status === "Em Andamento"
  ).length;
  document.getElementById("resolvedCount").innerText = tickets.filter(
    (t) => t.status === "Resolvido"
  ).length;
}

function renderTables() {
  const body = document.getElementById("ticketsBody");
  body.innerHTML = "";
  tickets
    .filter((t) => t.status !== "Resolvido")
    .forEach((t) => {
        const tr = document.createElement("tr");
        const reporter = t.reporter || loggedUser.name || ''; 
        tr.innerHTML = `
      <td>${t.id}</td>
      <td>
        <div class="ticket-row">
          <div style="width:8px;height:8px;border-radius:6px;background:#60a5fa;margin-right:8px"></div>
          <div>
            <div class="ticket-title">${t.titulo}</div>
            <div class="muted">${t.categoria} • ${reporter ? reporter + ' • ' : ''}#${t.id}</div>
          </div>
        </div>
      </td>
      <td>${t.categoria}</td>
      <td><span class="badge ${urgClass(t.urg)}">${t.urg}</span></td>
      <td>${t.status}</td>
      <td class="muted">${t.updated}</td>
    `;
        body.appendChild(tr);
    });

  const bodyAll = document.getElementById("ticketsBodyAll");
  bodyAll.innerHTML = "";
  tickets.forEach((t) => {
    const tr = document.createElement("tr");
    const reporter = t.reporter || loggedUser.name || '';
    tr.innerHTML = `
    <td>${t.id}</td>
    <td>${t.titulo}${reporter ? `<div class="muted" style="font-size:12px">${reporter}</div>` : ''}</td>
    <td>${t.categoria}</td>
    <td><span class="badge ${urgClass(t.urg)}">${t.urg}</span></td>
    <td>${t.status}</td>
    <td><button class="ghost" onclick="viewTicket(${t.id})">Visualizar</button></td>
  `;
    bodyAll.appendChild(tr);
  });

  const closed = document.getElementById("ticketsBodyClosed");
  closed.innerHTML = "";
  tickets
    .filter((t) => t.status === "Resolvido")
    .forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${t.id}</td><td>${t.titulo}</td><td>${
        t.satisf || "-"
      }/5</td><td>${t.closed || t.updated || "-"}</td>`;
      closed.appendChild(tr);
    });
}

function urgClass(u) {
  if (!u) return "";
  const urg = u.toLowerCase();
  if (urg.includes("crít")) return "urg-crit";
  if (urg.includes("alta")) return "urg-alta";
  if (urg.includes("média")) return "urg-media";
  return "urg-baixa";
}

// tabs
function switchTab(e) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  e.currentTarget.classList.add("active");
  const view = e.currentTarget.dataset.view;
  document.getElementById("view-minha-lista").style.display =
    view === "minha-lista" ? "block" : "none";
  document.getElementById("view-abertos").style.display =
    view === "abertos" ? "block" : "none";
  document.getElementById("view-resolvidos").style.display =
    view === "resolvidos" ? "block" : "none";
}

document
  .getElementById("btnOpenModal")
  .addEventListener("click", () =>
    document.getElementById("modalNew").classList.add("show")
  );
function closeModal() {
  document.getElementById("modalNew").classList.remove("show");
  document.getElementById("frmNew").reset();
  document.getElementById("iaSuggestion").style.display = "none";
}

function fakeIaPredict(title, desc) {
  const text = (title + " " + desc).toLowerCase();
  let urg = "Baixa",
    conf = 0.55,
    cat = "Software";
  if (
    text.includes("não") ||
    text.includes("erro") ||
    text.includes("falha")
  ) {
    urg = "Alta";
    conf = 0.77;
  }
  if (
    text.includes("crítico") ||
    text.includes("queda") ||
    text.includes("parado") ||
    text.includes("parou")
  ) {
    urg = "Crítica";
    conf = 0.93;
  }
  if (text.includes("roteador") || text.includes("internet"))
    cat = "Rede";
  if (
    text.includes("hd") ||
    text.includes("computador") ||
    text.includes("ligar")
  )
    cat = "Hardware";
  return { urg, cat, conf };
}

function submitTicket(e) {
  e.preventDefault();
  const title = document.getElementById("titulo").value.trim();
  const desc = document.getElementById("descricao").value.trim();
  const cat = document.getElementById("categoria").value;
  if (!title || !desc) return alert("Preencha título e descrição");
  
  const pred = fakeIaPredict(title, desc);
  
  const box = document.getElementById("iaSuggestion");
  box.style.display = "block";
  box.innerHTML = `<strong>Sugestão da IA:</strong> Categoria: <b>${
    pred.cat
  }</b> • Urgência: <b>${pred.urg}</b> (confiança ${(
    pred.conf * 100
  ).toFixed(
    0
  )}%)<div style="margin-top:8px"><button type="button" class="ghost" onclick="sendTicketToBackend('${title}','${desc}','${
    pred.cat 
  }','${
    pred.urg 
  }')">Aplicar e Enviar</button> <button type="button" class="btn" onclick="sendTicketToBackend('${title}','${desc}','${cat}','Baixa')">Enviar com categoria manual</button></div>`;
  return false;
}


async function sendTicketToBackend(title, desc, category, urg) {
    if (!loggedUser || !loggedUser.id) {
        return alert("Erro: usuário não logado. Faça login novamente.");
    }
    const userId = loggedUser.id;

    try {
        const response = await fetch('http://localhost:3000/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({
                titulo: title,
                descricao: desc,
                categoria: category,
                urg: urg,
                userId: userId 
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Chamado criado com sucesso!');
            closeModal();
            
            init(); 
        } else {
            alert('Erro ao criar chamado: ' + (data.message || 'Erro desconhecido.'));
        }

    } catch (e) {
        console.error("Erro ao enviar chamado:", e);
        alert("Erro de conexão ao criar chamado. O backend está rodando?");
    }
}

function closeViewModal() {
  document.getElementById("modalView").classList.remove("show");
  document.getElementById("viewHistory").innerHTML = "";
  document.getElementById("viewReplyText").value = "";
}

async function viewTicket(id) {
  const t = tickets.find((x) => x.id === id);
  if (!t) return alert("Chamado não encontrado");

  const modal = document.getElementById("modalView");
  modal.classList.add("show");
  
  modal.dataset.currentId = id; 

  document.getElementById("viewTitle").innerText = `#${t.id} — ${t.titulo}`;
  document.getElementById("viewMeta").innerText = `Status: ${t.status} • Categoria: ${t.categoria} • Urgência: ${t.urg}`;
  
  const historyEl = document.getElementById("viewHistory");
  historyEl.innerHTML = `<div class="history-item">Carregando histórico...</div>`;
  
  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${id}/history`);
    const historyData = await response.json();

    if (historyData.length === 0) {
      historyEl.innerHTML = `<div class="history-item">Sem histórico de interações.</div>`;
    } else {
      historyEl.innerHTML = ""; 
      historyData.forEach(item => {
        const div = document.createElement('div');
        
        const authorRole = item.author_role || 'usuario';
        div.className = `history-item role-${authorRole}`;

        const authorName = (authorRole === 'analista') ? `Analista (${item.author_name})` : `Você (${item.author_name})`;
        const date = new Date(item.created_at).toLocaleString('pt-BR');

        div.innerHTML = `
          <span class="author">${authorName}</span>
          <div class="comment-body">${item.comment}</div>
          <span class="date">${date}</span>
        `;
        historyEl.appendChild(div);
      });
      historyEl.scrollTop = historyEl.scrollHeight;
    }

  } catch (e) {
    historyEl.innerHTML = `<div class="history-item">Erro ao carregar histórico.</div>`;
    console.error(e);
  }
}

async function sendUserReply() {
  const modal = document.getElementById("modalView");
  const ticketId = modal.dataset.currentId;
  const replyText = document.getElementById("viewReplyText").value.trim();

  if (!replyText) return alert("Por favor, digite uma resposta.");
  if (!loggedUser || !loggedUser.id) return alert("Erro: usuário não logado.");

  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            analyst_id: loggedUser.id, 
            comment: replyText 
        })
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message);

    document.getElementById("viewReplyText").value = "";
    await viewTicket(ticketId); 

  } catch (e) {
    alert("Erro ao enviar resposta: " + (e.message || 'Erro desconhecido.'));
  }
}

function filterTickets() {
  const q = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const body = document.getElementById("ticketsBodyAll");
  body.innerHTML = "";
  tickets
    .filter((t) =>
      (t.titulo + " " + t.categoria).toLowerCase().includes(q)
    )
    .forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${t.id}</td><td>${t.titulo}</td><td>${
        t.categoria
      }</td><td><span class="badge ${urgClass(t.urg)}">${
        t.urg
      }</span></td><td>${
        t.status
      }</td><td><button class="ghost" onclick="viewTicket(${
        t.id
      })">Visualizar</button></td>`;
      body.appendChild(tr);
    });
}

let tickets = []; 

async function init() {
    
    tickets = await loadUserTickets(); 
    
    renderCounts();
    renderTables();
}

init();