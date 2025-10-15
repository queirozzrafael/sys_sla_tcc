// Clean client-side login for prototype
(function(){
	// hard-coded credentials (demo only)
	const C = {
		analista: { name: 'Joao', email: 'joao@gmail.com', password: 'Joao123', role: 'analista' },
		usuario: { name: 'Gabriel', email: 'gabriel@gmail.com', password: 'Gabriel123', role: 'usuario' }
	};

	const $ = id => document.getElementById(id);
	const tabUser = $('tabUser');
	const tabAnalyst = $('tabAnalyst');
	const emailInput = $('email');
	const passwordInput = $('password');
	const btnTogglePwd = $('btnTogglePwd');
	const form = $('loginForm');
	const errorBox = $('loginError');

	function setActiveRole(role){
		if(!tabUser || !tabAnalyst) return;
		if(role === 'analista'){
			tabAnalyst.classList.add('active');
			tabUser.classList.remove('active');
		} else {
			tabUser.classList.add('active');
			tabAnalyst.classList.remove('active');
		}
	}

	// If already logged in, redirect automatically
	try{
		const cur = localStorage.getItem('currentUser');
		if(cur){
			const u = JSON.parse(cur);
			if(u && u.role === 'analista') window.location = 'Analista/analista.html';
			if(u && u.role === 'usuario') window.location = 'Usuario/usuario.html';
		}
	}catch(e){ console.warn('localStorage read failed', e); }

	tabUser && tabUser.addEventListener('click', () => setActiveRole('usuario'));
	tabAnalyst && tabAnalyst.addEventListener('click', () => setActiveRole('analista'));

	form && form.addEventListener('submit', function(ev){
		ev.preventDefault();
		if(errorBox) errorBox.style.display = 'none';

		const email = (emailInput && emailInput.value || '').trim().toLowerCase();
		const pass = (passwordInput && passwordInput.value || '').trim();
		const role = tabAnalyst && tabAnalyst.classList.contains('active') ? 'analista' : 'usuario';

		const candidate = role === 'analista' ? C.analista : C.usuario;
		if(!candidate || email !== (candidate.email || '').toLowerCase() || pass !== candidate.password){
			if(errorBox){ errorBox.textContent = 'Credenciais inválidas. Verifique email, senha e papel (Usuário/Analista).'; errorBox.style.display = 'block'; }
			return;
		}

		// Save minimal current user (without password)
		const safe = { name: candidate.name, email: candidate.email, role: candidate.role };
		try{ localStorage.setItem('currentUser', JSON.stringify(safe)); }catch(e){ console.warn('localStorage write failed', e); }

		// redirect
		if(safe.role === 'analista') window.location = 'Analista/analista.html';
		else window.location = 'Usuario/usuario.html';
	});

	// password visibility toggle
	if(btnTogglePwd && passwordInput){
		btnTogglePwd.addEventListener('click', function(){
			if(passwordInput.type === 'password'){
				passwordInput.type = 'text';
				btnTogglePwd.textContent = '🙈';
				btnTogglePwd.title = 'Ocultar senha';
			}else{
				passwordInput.type = 'password';
				btnTogglePwd.textContent = '👁️';
				btnTogglePwd.title = 'Mostrar senha';
			}
		});
	}


})();
