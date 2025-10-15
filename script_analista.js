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
            : "view-todos";
        const viewEl = document.getElementById(viewId);
        if (viewEl) viewEl.style.display = "block";
        // quickFilters visibility: hide on 'fila', show on 'todos'
        const quick = document.getElementById('quickFilters');
        if (quick) {
          if (id === 'fila') quick.style.display = 'none';
          else if (id === 'todos') quick.style.display = 'block';
          else quick.style.display = 'none';
        }
        // if showing the 'todos' view, refresh filters
        if (id === 'todos') applyFilters();
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
        // IA card
        document.getElementById("iaCat").innerText = t.cat;
        document.getElementById("iaUrg").innerText = t.urg;
        document.getElementById("iaConf").innerText = `(${Math.round(
          t.iaConf * 100
        )}% confiança)`;
        document.getElementById("iaText").innerText = generateStandardText(t);
        // actions
        const actionsEl = document.getElementById("detailActions");
        if (actionsEl)
          actionsEl.innerHTML = `<button class="btn" onclick="applyIASuggestion()">Aplicar IA</button><button class="ghost" onclick="markPending()">Marcar Pendente</button>`;
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
      // hide quick filters by default (we start on fila)
      const quick = document.getElementById('quickFilters');
      if (quick) quick.style.display = 'none';
      showView("fila");