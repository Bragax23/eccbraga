// auth.js - Sistema de Autenticação Firebase

// Importações Firebase (já carregadas no HTML)
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { 
    ref, 
    set, 
    get 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Estado global do usuário
let currentUser = null;

// Inicializar observador de autenticação
document.addEventListener('DOMContentLoaded', function() {
    initAuthObserver();
    setupAuthForms();
});

// Observador de estado de autenticação
function initAuthObserver() {
    onAuthStateChanged(window.auth, (user) => {
        currentUser = user;
        updateUIForAuthState(user);
        
        if (user) {
            console.log('Usuário logado:', user.email);
            loadUserData(user.uid);
        } else {
            console.log('Usuário deslogado');
        }
    });
}

// Atualizar interface baseada no estado de autenticação
function updateUIForAuthState(user) {
    const userInfo = document.getElementById('user-info');
    const authButtons = document.getElementById('auth-buttons');
    const userName = document.getElementById('user-name');
    const cadastrarProdutoLink = document.getElementById('cadastrar-produto-link');
    
    if (user) {
        // Usuário logado
        if (userInfo) userInfo.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
        if (cadastrarProdutoLink) cadastrarProdutoLink.style.display = 'block';
        
        // Mostrar formulário de produtos se estiver na página de produtos
        const productFormContainer = document.getElementById('product-form-container');
        const authRequired = document.getElementById('auth-required');
        const userProductsContainer = document.getElementById('user-products-container');
        
        if (productFormContainer) productFormContainer.style.display = 'block';
        if (authRequired) authRequired.style.display = 'none';
        if (userProductsContainer) {
            userProductsContainer.style.display = 'block';
            loadUserProducts();
        }
    } else {
        // Usuário não logado
        if (userInfo) userInfo.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        if (cadastrarProdutoLink) cadastrarProdutoLink.style.display = 'none';
        
        // Ocultar formulário de produtos se estiver na página de produtos
        const productFormContainer = document.getElementById('product-form-container');
        const authRequired = document.getElementById('auth-required');
        const userProductsContainer = document.getElementById('user-products-container');
        
        if (productFormContainer) productFormContainer.style.display = 'none';
        if (authRequired) authRequired.style.display = 'block';
        if (userProductsContainer) userProductsContainer.style.display = 'none';
    }
}

// Configurar formulários de autenticação
function setupAuthForms() {
    // Formulário de cadastro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Formulário de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Manipular cadastro de usuário
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    
    // Validações
    if (password !== confirmPassword) {
        showMessage('As senhas não coincidem!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('A senha deve ter pelo menos 6 caracteres!', 'error');
        return;
    }
    
    try {
        // Criar usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
        const user = userCredential.user;
        
        // Salvar dados complementares no Realtime Database
        const userData = {
            id: user.uid,
            name: name,
            email: email,
            city: city,
            state: state,
            createdAt: new Date().toISOString()
        };
        
        await set(ref(window.database, 'users/' + user.uid), userData);
        
        showMessage('Cadastro realizado com sucesso!', 'success');
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showMessage(getErrorMessage(error.code), 'error');
    }
}

// Manipular login de usuário
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await signInWithEmailAndPassword(window.auth, email, password);
        showMessage('Login realizado com sucesso!', 'success');
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Erro no login:', error);
        showMessage(getErrorMessage(error.code), 'error');
    }
}

// Manipular logout
async function handleLogout() {
    try {
        await signOut(window.auth);
        showMessage('Logout realizado com sucesso!', 'success');
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Erro no logout:', error);
        showMessage('Erro ao fazer logout. Tente novamente.', 'error');
    }
}

// Carregar dados do usuário
async function loadUserData(userId) {
    try {
        const userRef = ref(window.database, 'users/' + userId);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log('Dados do usuário carregados:', userData);
            
            // Atualizar nome do usuário na interface
            const userName = document.getElementById('user-name');
            if (userName) {
                userName.textContent = userData.name || userData.email.split('@')[0];
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

// Obter usuário atual
function getCurrentUser() {
    return currentUser;
}

// Verificar se usuário está logado
function isUserLoggedIn() {
    return currentUser !== null;
}

// Obter mensagem de erro amigável
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Este email já está sendo usado por outra conta.',
        'auth/weak-password': 'A senha é muito fraca. Use pelo menos 6 caracteres.',
        'auth/invalid-email': 'Email inválido.',
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
        'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
        'auth/invalid-credential': 'Credenciais inválidas. Verifique email e senha.'
    };
    
    return errorMessages[errorCode] || 'Erro desconhecido. Tente novamente.';
}

// Mostrar mensagem para o usuário
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        // Ocultar mensagem após 5 segundos
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Exportar funções para uso global
window.authFunctions = {
    getCurrentUser,
    isUserLoggedIn,
    showMessage
};

