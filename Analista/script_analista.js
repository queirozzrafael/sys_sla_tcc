// demo data (will load from localStorage if available)
      function defaultAnalystTickets() {
        return [
          {
            id: 27,
            user: "João Silva",
            title: "Sistema travando ao salvar",
            cat: "Software",
            urg: "Crítica",
            iaConf: 0.95,
            status: "Aberto",
            updated: "2025-10-08",
            desc: "Ao tentar salvar relatório o sistema trava e dá erro 500. Usuário não conclui trabalho.",
          },
          {
            id: 21,
            user: "Mariana",
            title: "Perda intermitente de internet",
            cat: "Rede",
            urg: "Alta",
            iaConf: 0.78,
            status: "Aberto",
            updated: "2025-10-07",
            desc: "Roteador cai várias vezes ao dia. Clientes internos não acessam recursos.",
          },
          {
            id: 14,
            user: "Carlos",
            title: "Computador não liga",
            cat: "Hardware",
            urg: "Média",
            iaConf: 0.66,
            status: "Em Andamento",
            updated: "2025-10-01",
            desc: "Ao pressionar o botão de ligar, não há resposta. LED não acende.",
          },
          {
            id: 9,
            user: "Ana",
            title: "Solicitação de acesso",
            cat: "Software",
            urg: "Baixa",
            iaConf: 0.55,
            status: "Resolvido",
            updated: "2025-09-20",
            desc: "Solicitação de permissão para módulo financeiro.",
          },
        ];
      }

      function loadAnalystTickets() {
        try {
          const raw = localStorage.getItem("analyst_tickets");
          if (raw) return JSON.parse(raw);
        } catch (e) {
          console.warn("Failed to parse analyst_tickets from localStorage", e);
        }
        const def = defaultAnalystTickets();
        localStorage.setItem("analyst_tickets", JSON.stringify(def));
        return def;
      }

      function saveAnalystTickets() {
        try {
          localStorage.setItem("analyst_tickets", JSON.stringify(tickets));
        } catch (e) {
          console.warn("Failed to save analyst_tickets", e);
        }
      }

      let tickets = loadAnalystTickets();

      // populate analyst badge and logout when logged in
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

      // Auth guard: require logged user with role 'analista'
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
        const critEl = document.getElementById("critCount"); // indicator bold
        const sidebarCrit = document.getElementById("countCrit"); // small badge in menu
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

      // compute sla violations based on 'updated' date and SLA hours (default 24h)
      function computeSLA(slaHours) {
        // simple default SLA hours (no external config)
        slaHours = slaHours || 24;
        const now = new Date();
        tickets.forEach((t) => {
          // parse date safely
          const updated = t.updated ? new Date(t.updated) : null;
          if (!updated) {
            t.slaViolated = false;
            return;
          }
          const diffHours = (now - updated) / (1000 * 60 * 60);
          // if ticket is not resolved and older than slaHours -> violated
          t.slaViolated = (t.status !== "Resolvido") && diffHours > slaHours;
        });
        // persist change to slaViolated flag
        saveAnalystTickets();
      }

      // renderStatusView removed (Status and Reports views were removed from HTML)
      

      function renderAnalystTable() {
        const body = document.getElementById("analystTable");
        body.innerHTML = "";
        // show criticals first
        // exclude resolved from the priority queue
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
            t.iaConf * 100
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
            : id === "users"
            ? "view-users"
            : "view-todos";
        const viewEl = document.getElementById(viewId);
        if (viewEl) viewEl.style.display = "block";
        // quickFilters visibility: hide on 'fila', show on 'todos'
        const quick = document.getElementById('quickFilters');
        if (quick) {
          // sidebar quick filters are not used for the full 'todos' view (we have internal filters there)
          if (id === 'fila') quick.style.display = 'none';
          else quick.style.display = 'none';
        }
        // if showing the 'todos' view, refresh filters
        if (id === 'todos') applyFilters();
        if (id === 'users') renderUsersTable();
        const detail = document.getElementById("detailPanel");
        if (detail) detail.style.display = "none";
        document.querySelectorAll(".menu-item").forEach((mi) => mi.classList.remove("active"));
        const menuItem = document.querySelector(`.menu-item[onclick="showView('${id}')"]`);
        if (menuItem) menuItem.classList.add("active");
      }

      function openDetail(id) {
        const t = tickets.find((x) => x.id === id);
        if (!t) return alert("Chamado não encontrado");
        document.getElementById("detailPanel").style.display = "block";
        document.getElementById(
          "detailTitle"
        ).innerText = `#${t.id} — ${t.title}`;
        document.getElementById(
          "detailMeta"
        ).innerText = `${t.user} • ${t.cat} • Atualizado: ${t.updated}`;
        document.getElementById("detailDesc").innerText = t.desc;
        document.getElementById("detailHistory").innerText =
          t.history || "Sem histórico registrado.";
  // IA card (ensure visible for ticket)
  const iaCard = document.getElementById('iaCard');
  if(iaCard){ iaCard.style.display = 'block'; document.getElementById("iaCat").innerText = t.cat; document.getElementById("iaUrg").innerText = t.urg; document.getElementById("iaConf").innerText = `(${Math.round(t.iaConf * 100)}% confiança)`; document.getElementById("iaText").innerText = generateStandardText(t); }
  // ensure SLA and quick response are visible
  const slaResp = document.getElementById('slaResp'); if(slaResp) slaResp.parentElement.style.display = ''; 
  const quickResp = document.getElementById('quickResp'); if(quickResp) quickResp.parentElement.style.display = '';
        // actions
        const actionsEl = document.getElementById("detailActions");
        if (actionsEl) {
          actionsEl.innerHTML = `
            <select id="detailStatusSelect" style="padding:8px;border-radius:6px;background:transparent;border:1px solid rgba(255,255,255,0.06);color:#e6eef8;margin-right:8px">
              <option>Aberto</option>
              <option>Em Andamento</option>
              <option>Resolvido</option>
              <option>Pendente</option>
            </select>
            <button class="btn" id="btnChangeStatus">Alterar status</button>
            
          `;
          // wire change status button to use the selected value
          const btn = document.getElementById('btnChangeStatus');
          if(btn){
            btn.addEventListener('click', function(){
              const sel = document.getElementById('detailStatusSelect');
              const newStatus = sel ? sel.value : null;
              if(newStatus) changeTicketStatus(t.id, newStatus);
            });
          }
          // set current status as selected
          const selInit = document.getElementById('detailStatusSelect');
          if(selInit) selInit.value = t.status || 'Aberto';
        }
        // store current id
        document.getElementById("detailPanel").dataset.current = id;
      }

      function closeDetail() {
        document.getElementById("detailPanel").style.display = "none";
        document.getElementById("quickResp").value = "";
      }

      function generateStandardText(t) {
        // simple template for demo
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
        // "Aplicar" aqui seria registrar a classificação no ticket
        t.applied = true;
        alert("Sugestão da IA aplicada ao ticket.");
        renderAnalystTable();
        computeSLA();
        saveAnalystTickets();
        refreshIndicators();
      }

      function markPending() {
        const id = parseInt(
          document.getElementById("detailPanel").dataset.current
        );
        const t = tickets.find((x) => x.id === id);
        if (!t) return;
        t.status = "Pendente";
        alert("Chamado marcado como Pendente de Revisão.");
        renderAnalystTable();
        computeSLA();
        saveAnalystTickets();
        refreshIndicators();
      }

      // ----- Ticket status management (new) -----
      function changeTicketStatus(id, status) {
        const t = tickets.find((x) => x.id === id);
        if (!t) return alert('Chamado não encontrado');
        t.status = status;
        t.updated = new Date().toISOString().slice(0,10);
        saveAnalystTickets();
        renderAnalystTable();
        computeSLA();
        refreshIndicators();
        if(document.getElementById('detailPanel').style.display === 'block'){
          openDetail(id);
        }
      }

      // ----- User management (new) -----
      function loadRegisteredUsers(){
        try{
          const raw = localStorage.getItem('registeredUsers');
          const parsed = raw ? JSON.parse(raw) : [];
          // If no users registered yet, bootstrap demo users so the admin has entries to manage
          if(!parsed || parsed.length === 0){
            const demo = [
              { name: 'Joao', email: 'joao@gmail.com', password: 'Joao123', role: 'analista' },
              { name: 'Gabriel', email: 'gabriel@gmail.com', password: 'Gabriel123', role: 'usuario' }
            ];
            try{ localStorage.setItem('registeredUsers', JSON.stringify(demo)); }catch(e){}
            return demo;
          }
          return parsed;
        }catch(e){ console.warn('failed to load users', e); return []; }
      }

      function saveRegisteredUsers(list){
        try{ localStorage.setItem('registeredUsers', JSON.stringify(list)); }catch(e){ console.warn('failed to save users', e); }
      }

      function renderUsersTable(){
        const allUsers = loadRegisteredUsers();
        // apply filters from DOM
        const qEl = document.getElementById('user_q');
        const roleEl = document.getElementById('userRoleFilter');
        const query = qEl ? qEl.value.trim().toLowerCase() : '';
        const roleFilter = roleEl ? roleEl.value : '';
        const users = allUsers.filter(u => {
          if(roleFilter && (u.role||'') !== roleFilter) return false;
          if(!query) return true;
          const needle = query;
          return ((u.name||'') + ' ' + (u.email||'')).toLowerCase().includes(needle);
        });
        const tbody = document.getElementById('usersTable');
        if(!tbody) return;
        tbody.innerHTML = '';
        users.forEach((u, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${idx+1}</td>
            <td>${u.name || '-'}</td>
            <td>${u.email || '-'}</td>
            <td>${u.role || 'usuario'}</td>
            <td></td>
          `;
          const actionTd = tr.querySelector('td:last-child');
          const btnView = document.createElement('button');
          btnView.className = 'btn';
          btnView.textContent = 'Ver';
          btnView.addEventListener('click', function(){ window.openUser(u.email); });
          actionTd.appendChild(btnView);
          tbody.appendChild(tr);
        });
      }

      // helpers exposed for onclicks
      window.changeTicketStatus = changeTicketStatus;

      window.promoteUser = function(email, newRole){
        const users = loadRegisteredUsers();
        const u = users.find(x => (x.email||'').toLowerCase() === (email||'').toLowerCase());
        if(!u) return alert('Usuário não encontrado');
        u.role = newRole;
        saveRegisteredUsers(users);
        renderUsersTable();
        alert('Papel do usuário atualizado.');
      };

      window.removeUser = function(email){
        if(!confirm('Remover usuário? Essa ação não pode ser desfeita (apenas para o protótipo).')) return;
        let users = loadRegisteredUsers();
        users = users.filter(x => (x.email||'').toLowerCase() !== (email||'').toLowerCase());
        saveRegisteredUsers(users);
        renderUsersTable();
        alert('Usuário removido.');
      };

      // apply filters UI for users
      function applyUserFilters(){
        renderUsersTable();
      }
      window.applyUserFilters = applyUserFilters;

      // open user details into the existing detail panel
      window.openUser = function(email){
        const users = loadRegisteredUsers();
        const u = users.find(x => (x.email||'').toLowerCase() === (email||'').toLowerCase());
        if(!u) return alert('Usuário não encontrado');
        const panel = document.getElementById('detailPanel');
        if(!panel) return;
        panel.style.display = 'block';
        document.getElementById('detailTitle').innerText = `Usuário — ${u.name || u.email}`;
        document.getElementById('detailMeta').innerText = `${u.email} • Papel: ${u.role || 'usuario'}`;
        document.getElementById('detailDesc').innerText = `Nome: ${u.name || '-'}\nEmail: ${u.email || '-'}\nPapel: ${u.role || 'usuario'}`;
        document.getElementById('detailHistory').innerText = u.history || 'Sem histórico.';
        const actionsEl = document.getElementById('detailActions');
        if(actionsEl) actionsEl.innerHTML = `<button class="btn" onclick="(function(){navigator.clipboard && navigator.clipboard.writeText('${u.email}'); alert('Email copiado');})()">Copiar Email</button><button class="ghost" onclick="closeDetail()">Fechar</button>`;
  // hide IA / SLA / quick response when viewing a user
  const iaCard = document.getElementById('iaCard'); if(iaCard) iaCard.style.display = 'none';
  const slaResp = document.getElementById('slaResp'); if(slaResp) slaResp.parentElement.style.display = 'none';
  const quickResp = document.getElementById('quickResp'); if(quickResp) quickResp.parentElement.style.display = 'none';
  panel.dataset.current = `user:${u.email}`;
      };

      function sendReply() {
        const id = parseInt(
          document.getElementById("detailPanel").dataset.current
        );
        const t = tickets.find((x) => x.id === id);
        const msg = document.getElementById("quickResp").value.trim();
        if (!msg) return alert("Escreva uma resposta.");
        t.history =
          (t.history || "") +
          `\n[Analista ${new Date().toISOString().slice(0, 10)}] ${msg}`;
        alert("Resposta enviada ao usuário (simulação).");
        document.getElementById("quickResp").value = "";
        renderAnalystTable();
        computeSLA();
        saveAnalystTickets();
        refreshIndicators();
      }

      function applyFilters() {
  // prefer the ticket filters embedded in the 'Todos os Chamados' view when present
  const qEl = document.getElementById('ticket_q') || document.getElementById("q");
  const urgEl = document.getElementById('ticketUrgFilter') || document.getElementById("filterUrg");
  const statusEl = document.getElementById('ticketStatusFilter') || document.getElementById("filterStatus");
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

      function bulkRefresh() {
        alert("Atualizando fila (simulação)...");
        renderAnalystTable();
        computeSLA();
        refreshIndicators();
      }

      // init
      renderAnalystTable();
      computeSLA();
      refreshIndicators();
  // ensure users table is available (bootstraps demo users if none)
  try{ renderUsersTable(); }catch(e){}
      // hide quick filters by default (we start on fila)
      const quick = document.getElementById('quickFilters');
      if (quick) quick.style.display = 'none';
      showView("fila");