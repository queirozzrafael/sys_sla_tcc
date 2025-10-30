(function(){
	
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

	form && form.addEventListener('submit', async function(ev){ 
    ev.preventDefault();
    if(errorBox) errorBox.style.display = 'none';

    const email = (emailInput && emailInput.value || '').trim().toLowerCase();
    const pass = (passwordInput && passwordInput.value || '').trim();
    const role = tabAnalyst && tabAnalyst.classList.contains('active') ? 'analista' : 'usuario';

    
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: pass, role: role })
        });

        const data = await response.json();

        if (!data.success) {
            if(errorBox){ errorBox.textContent = data.message || 'Credenciais inválidas.'; errorBox.style.display = 'block'; }
            return;
        }

        
        localStorage.setItem('currentUser', JSON.stringify(data.user));

        if(data.user.role === 'analista') window.location = 'Analista/analista.html';
        else window.location = 'Usuario/usuario.html';

    } catch(e) {
        console.error('Erro ao fazer login:', e);
        if(errorBox){ errorBox.textContent = 'Não foi possível conectar ao servidor. O backend está rodando?'; errorBox.style.display = 'block'; }
    }
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
