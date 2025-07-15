// ui.js - Gerenciamento da Interface do Usuário

// Inicializar funcionalidades da UI
document.addEventListener('DOMContentLoaded', function() {
    setupUIInteractions();
    setupFormValidations();
    setupResponsiveMenu();
    setupSearchInput();
});

// Configurar interações da UI
function setupUIInteractions() {
    // Fechar modal ao clicar fora dele
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('edit-modal');
        if (modal && event.target === modal) {
            closeEditModal();
        }
    });
    
    // Tecla ESC para fechar modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeEditModal();
        }
    });
    
    // Smooth scroll para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Configurar validações de formulário
function setupFormValidations() {
    // Validação de confirmação de senha
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordInput = document.getElementById('password');
    
    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            if (this.value !== passwordInput.value) {
                this.setCustomValidity('As senhas não coincidem');
            } else {
                this.setCustomValidity('');
            }
        });
        
        passwordInput.addEventListener('input', function() {
            if (confirmPasswordInput.value !== this.value) {
                confirmPasswordInput.setCustomValidity('As senhas não coincidem');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        });
    }
    
    // Validação de preço
    const priceInputs = document.querySelectorAll('input[type="number"][step="0.01"]');
    priceInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.setCustomValidity('O preço deve ser maior que zero');
            } else {
                this.setCustomValidity('');
            }
        });
    });
    
    // Validação de quantidade
    const quantityInputs = document.querySelectorAll('input[type="number"]:not([step])');
    quantityInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.setCustomValidity('A quantidade deve ser maior ou igual a zero');
            } else {
                this.setCustomValidity('');
            }
        });
    });
    
    // Formatação de preço
    const priceFormatInputs = document.querySelectorAll('#price, #edit-price');
    priceFormatInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value) {
                this.value = parseFloat(this.value).toFixed(2);
            }
        });
    });
}

// Configurar menu responsivo
function setupResponsiveMenu() {
    // Criar botão de menu mobile se não existir
    const header = document.querySelector('.header .container');
    const nav = document.querySelector('.nav');
    
    if (header && nav && window.innerWidth <= 768) {
        let menuToggle = document.getElementById('menu-toggle');
        
        if (!menuToggle) {
            menuToggle = document.createElement('button');
            menuToggle.id = 'menu-toggle';
            menuToggle.className = 'menu-toggle';
            menuToggle.innerHTML = '☰';
            menuToggle.style.cssText = `
                display: none;
                background: transparent;
                border: 2px solid #ff0000;
                color: #ff0000;
                font-size: 1.5rem;
                padding: 10px;
                border-radius: 5px;
                cursor: pointer;
            `;
            
            header.insertBefore(menuToggle, nav);
            
            menuToggle.addEventListener('click', function() {
                nav.classList.toggle('nav-open');
            });
        }
    }
    
    // Atualizar menu no redimensionamento
    window.addEventListener('resize', function() {
        const menuToggle = document.getElementById('menu-toggle');
        const nav = document.querySelector('.nav');
        
        if (window.innerWidth <= 768) {
            if (menuToggle) menuToggle.style.display = 'block';
        } else {
            if (menuToggle) menuToggle.style.display = 'none';
            if (nav) nav.classList.remove('nav-open');
        }
    });
}

// Configurar campo de pesquisa
function setupSearchInput() {
    const searchInput = document.getElementById('search-input');
    
    if (searchInput) {
        // Pesquisa em tempo real
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (window.searchProducts) {
                    window.searchProducts();
                }
            }, 300);
        });
        
        // Pesquisa ao pressionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (window.searchProducts) {
                    window.searchProducts();
                }
            }
        });
    }
}

// Mostrar loading
function showLoading(elementId = 'loading') {
    const loadingElement = document.getElementById(elementId);
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

// Ocultar loading
function hideLoading(elementId = 'loading') {
    const loadingElement = document.getElementById(elementId);
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Animar elementos ao entrar na viewport
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observar cards de produtos
    document.querySelectorAll('.product-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Copiar texto para clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Texto copiado!', 'success');
        });
    } else {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Texto copiado!', 'success');
    }
}

// Mostrar notificação toast
function showNotification(message, type = 'info', duration = 3000) {
    // Remover notificação existente
    const existingNotification = document.querySelector('.toast-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `toast-notification toast-${type}`;
    notification.textContent = message;
    
    // Estilos da notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00aa00' : type === 'error' ? '#aa0000' : '#666666'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após duração especificada
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

// Validar URL de imagem
function validateImageUrl(url) {
    return new Promise((resolve) => {
        if (!url) {
            resolve(false);
            return;
        }
        
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

// Formatar moeda brasileira
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Formatar data brasileira
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Debounce para otimizar pesquisas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Verificar se elemento está visível na viewport
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Scroll suave para elemento
function scrollToElement(elementId, offset = 0) {
    const element = document.getElementById(elementId);
    if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Configurar animações de scroll quando a página carregar
window.addEventListener('load', function() {
    setTimeout(setupScrollAnimations, 500);
});

// Exportar funções para uso global
window.uiFunctions = {
    showLoading,
    hideLoading,
    showNotification,
    copyToClipboard,
    validateImageUrl,
    formatCurrency,
    formatDate,
    debounce,
    isElementInViewport,
    scrollToElement
};

