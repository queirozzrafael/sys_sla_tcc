// user tickets persistence (loaded below)

// show current user (if logged in)
try{
  const cur = localStorage.getItem('currentUser');
  if(cur){
    const u = JSON.parse(cur);
    const badge = document.getElementById('userBadge');
    if(badge){
      // create a pill-like badge with a visible logout button
      badge.innerHTML = `<div style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.03);display:flex;align-items:center;gap:8px"><div style="font-size:13px;color:var(--muted)">Olá, ${u.name}</div><button class="btn" id="btnLogoutUser" style="padding:6px 8px">Sair</button></div>`;
      const btn = document.getElementById('btnLogoutUser');
      if(btn) btn.addEventListener('click', ()=>{ localStorage.removeItem('currentUser'); window.location = '../index.html'; });
    }
  }
}catch(e){console.warn('user badge failed', e)}

// Auth guard: require logged user with role 'usuario'
try{
  const cur = localStorage.getItem('currentUser');
  if(!cur) { window.location = '../index.html'; }
  else {
    const u = JSON.parse(cur);
    if(!u || u.role !== 'usuario') { window.location = '../index.html'; }
  }
}catch(e){ console.warn('auth guard failed', e); window.location = '../index.html'; }

          function defaultUserTickets(){
            return [
              {
                id: 1,
                titulo: "Não recebo e-mails",
                categoria: "Software",
                urg: "Alta",
                status: "Aberto",
                updated: "2025-10-08",
              },
              {
                id: 2,
                titulo: "Roteador caiu constantemente",
                categoria: "Rede",
                urg: "Crítica",
                status: "Aberto",
                updated: "2025-10-07",
              },
              {
                id: 3,
                titulo: "Computador sem ligar",
                categoria: "Hardware",
                urg: "Média",
                status: "Em Andamento",
                updated: "2025-10-01",
              },
              {
                id: 4,
                titulo: "Solicitação de acesso a sistema",
                categoria: "Software",
                urg: "Baixa",
                status: "Resolvido",
                updated: "2025-09-25",
                closed: "2025-09-26",
                satisf: 4,
              }
            ];
          }
          function loadUserTickets(){
            try{
              const raw = localStorage.getItem('user_tickets');
              if(raw) return JSON.parse(raw);
            }catch(e){console.warn(e)}
            const d = defaultUserTickets();
            localStorage.setItem('user_tickets', JSON.stringify(d));
            return d;
          }
          function saveUserTickets(){
            try{ localStorage.setItem('user_tickets', JSON.stringify(tickets)); }catch(e){console.warn(e)}
          }

          let tickets = loadUserTickets();

          // If there are analyst tickets, prefer mapping those that belong to the logged user
          try{
            const curRaw = localStorage.getItem('currentUser');
            if(curRaw){
              const cur = JSON.parse(curRaw);
              const rawAnalyst = localStorage.getItem('analyst_tickets');
              if(rawAnalyst){
                const analyst = JSON.parse(rawAnalyst);
                if(Array.isArray(analyst)){
                  const mine = analyst.filter(t => (t.user||'').toLowerCase().includes((cur.name||'').toLowerCase()));
                  if(mine && mine.length){
                    tickets = mine.map(t => ({
                      id: t.id,
                      titulo: t.title || t.titulo || ('Chamado ' + t.id),
                      categoria: t.cat || t.categoria || 'Outros',
                      urg: t.urg || t.urgency || 'Média',
                      status: t.status || 'Aberto',
                      updated: t.updated || (new Date().toISOString().slice(0,10)),
                      closed: t.closed,
                      satisf: t.satisf,
                      reporter: t.user || ''
                    }));
                  }
                }
              }
            }
          }catch(e){ console.warn('Failed to map analyst tickets for user view', e); }
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
              // if this ticket came from analyst_tickets mapping, it may have a 'reporter' field
              const reporter = t.reporter || t.user || '';
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
          // include reporter if available
          const reporter = t.reporter || t.user || '';
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
            }/5</td><td>${t.closed || "-"}</td>`;
            closed.appendChild(tr);
          });
      }

      function urgClass(u) {
        if (!u) return "";
        if (u.toLowerCase().includes("crít")) return "urg-crit";
        if (u.toLowerCase().includes("alta")) return "urg-alta";
        if (u.toLowerCase().includes("média")) return "urg-media";
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

      // modal
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

      // Fake IA predictor (simulação)
      function fakeIaPredict(title, desc) {
        // heurística simples para demo
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

      // submit
      function submitTicket(e) {
        e.preventDefault();
        const title = document.getElementById("titulo").value.trim();
        const desc = document.getElementById("descricao").value.trim();
        const cat = document.getElementById("categoria").value;
        if (!title || !desc) return alert("Preencha título e descrição");
        const pred = fakeIaPredict(title, desc);
        // show suggestion and ask confirm
        const box = document.getElementById("iaSuggestion");
        box.style.display = "block";
        box.innerHTML = `<strong>Sugestão da IA:</strong> Categoria: <b>${
          pred.cat
        }</b> • Urgência: <b>${pred.urg}</b> (confiança ${(
          pred.conf * 100
        ).toFixed(
          0
        )}%)<div style="margin-top:8px"><button class="ghost" onclick="applyAndClose('${title}','${desc}','${cat}','${
          pred.urg
        }')">Aplicar e Enviar</button> <button class="btn" onclick="forceSend('${title}','${desc}','${cat}')">Enviar sem aplicar IA</button></div>`;
        return false;
      }

      function applyAndClose(title, desc, category, urg) {
        // add ticket
        const id = Math.max(0, ...tickets.map((t) => t.id)) + 1;
        tickets.unshift({
          id,
          titulo: title,
          categoria: category,
          urg: urg,
          status: "Aberto",
          updated: new Date().toISOString().slice(0, 10),
        });
        renderCounts();
        renderTables();
        closeModal();
          saveUserTickets();
      }
      function forceSend(title, desc, category) {
        const id = Math.max(0, ...tickets.map((t) => t.id)) + 1;
        tickets.unshift({
          id,
          titulo: title,
          categoria: category,
          urg: "Baixa",
          status: "Aberto",
          updated: new Date().toISOString().slice(0, 10),
        });
        renderCounts();
        renderTables();
        closeModal();
          saveUserTickets();
      }

      function viewTicket(id) {
        const t = tickets.find((x) => x.id === id);
        if (!t) return alert("Chamado não encontrado");
        alert(
          `Chamado #${t.id}\nTítulo: ${t.titulo}\nCategoria: ${t.categoria}\nUrgência: ${t.urg}\nStatus: ${t.status}\nÚltima atualização: ${t.updated}`
        );
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

      // init
      renderCounts();
      renderTables();