(function(){
            
    const $ = id => document.getElementById(id);
    
    const tabUser = $('tabUser');
    const tabAnalyst = $('tabAnalyst');
    const nameInput = $('name');
    const emailInput = $('email');
    const passwordInput = $('password');
    const btnTogglePwd = $('btnTogglePwd');
    const form = $('registerForm');
    const errorBox = $('registerError');
    const successBox = $('registerSuccess');

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

    tabUser && tabUser.addEventListener('click', () => setActiveRole('usuario'));
    tabAnalyst && tabAnalyst.addEventListener('click', () => setActiveRole('analista'));

    form && form.addEventListener('submit', async function(ev){ 
        ev.preventDefault();
        if(errorBox) errorBox.style.display = 'none';
        if(successBox) successBox.style.display = 'none';

        const name = (nameInput && nameInput.value || '').trim();
        const email = (emailInput && emailInput.value || '').trim().toLowerCase();
        const pass = (passwordInput && passwordInput.value || '').trim();
        const role = tabAnalyst && tabAnalyst.classList.contains('active') ? 'analista' : 'usuario';

        if (!name || !email || !pass) {
            if(errorBox){ errorBox.textContent = 'Por favor, preencha nome, email e senha.'; errorBox.style.display = 'block'; }
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, email: email, password: pass, role: role })
            });

            const data = await response.json();

            if (!data.success) {
                if(errorBox){ errorBox.textContent = data.message || 'Erro ao cadastrar.'; errorBox.style.display = 'block'; }
                return;
            }
            
            form.reset();
            if(successBox) {
                successBox.textContent = 'Cadastro realizado com sucesso! Redirecionando para o login...';
                successBox.style.display = 'block';
            }
            
            setTimeout(() => {
                window.location = 'index.html';
            }, 2000);

        } catch(e) {
            console.error('Erro ao fazer cadastro:', e);
            if(errorBox){ errorBox.textContent = 'Não foi possível conectar ao servidor. O backend está rodando?'; errorBox.style.display = 'block'; }
        }
    });

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