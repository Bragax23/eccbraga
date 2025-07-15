// db.js - Gerenciamento do Banco de Dados Firebase

// Importações Firebase (já carregadas no HTML)
import { 
    ref, 
    push, 
    set, 
    get, 
    remove, 
    onValue,
    query,
    orderByChild,
    equalTo
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Variáveis globais
let allProducts = [];
let filteredProducts = [];
let currentFilter = 'all';
let currentSearchTerm = '';

// Inicializar funcionalidades do banco de dados
document.addEventListener('DOMContentLoaded', function() {
    setupProductForm();
    setupEditForm();
    loadAllProducts();
});

// Configurar formulário de produtos
function setupProductForm() {
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    const clearFormBtn = document.getElementById('clear-form');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearProductForm);
    }
}

// Configurar formulário de edição
function setupEditForm() {
    const editForm = document.getElementById('edit-product-form');
    if (editForm) {
        editForm.addEventListener('submit', handleProductEdit);
    }
}

// Manipular envio do formulário de produto
async function handleProductSubmit(e) {
    e.preventDefault();
    
    if (!window.authFunctions.isUserLoggedIn()) {
        window.authFunctions.showMessage('Você precisa estar logado para cadastrar produtos!', 'error');
        return;
    }
    
    const currentUser = window.authFunctions.getCurrentUser();
    
    // Coletar dados do formulário
    const productData = {
        name: document.getElementById('product-name').value,
        id: document.getElementById('product-id').value || generateProductId(),
        category: document.getElementById('category').value,
        quantity: parseInt(document.getElementById('quantity').value),
        color: document.getElementById('color').value,
        price: parseFloat(document.getElementById('price').value),
        imageUrl: document.getElementById('image-url').value || '',
        description: document.getElementById('description').value,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        // Salvar produto no Firebase
        const productsRef = ref(window.database, 'products');
        const newProductRef = push(productsRef);
        await set(newProductRef, productData);
        
        window.authFunctions.showMessage('Produto cadastrado com sucesso!', 'success');
        clearProductForm();
        loadUserProducts();
        loadAllProducts();
        
    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        window.authFunctions.showMessage('Erro ao cadastrar produto. Tente novamente.', 'error');
    }
}

// Manipular edição de produto
async function handleProductEdit(e) {
    e.preventDefault();
    
    const productKey = document.getElementById('edit-product-key').value;
    
    const updatedData = {
        name: document.getElementById('edit-product-name').value,
        category: document.getElementById('edit-category').value,
        quantity: parseInt(document.getElementById('edit-quantity').value),
        color: document.getElementById('edit-color').value,
        price: parseFloat(document.getElementById('edit-price').value),
        imageUrl: document.getElementById('edit-image-url').value || '',
        description: document.getElementById('edit-description').value,
        updatedAt: new Date().toISOString()
    };
    
    try {
        const productRef = ref(window.database, 'products/' + productKey);
        await set(productRef, { ...await getProductData(productKey), ...updatedData });
        
        window.authFunctions.showMessage('Produto atualizado com sucesso!', 'success');
        closeEditModal();
        loadUserProducts();
        loadAllProducts();
        
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        window.authFunctions.showMessage('Erro ao atualizar produto. Tente novamente.', 'error');
    }
}

// Carregar todos os produtos
function loadAllProducts() {
    const productsRef = ref(window.database, 'products');
    
    onValue(productsRef, (snapshot) => {
        allProducts = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const product = {
                    key: childSnapshot.key,
                    ...childSnapshot.val()
                };
                allProducts.push(product);
            });
        }
        
        applyFilters();
        displayProducts(filteredProducts);
    });
}

// Carregar produtos do usuário atual
function loadUserProducts() {
    const currentUser = window.authFunctions.getCurrentUser();
    if (!currentUser) return;
    
    const productsRef = ref(window.database, 'products');
    const userProductsQuery = query(productsRef, orderByChild('userId'), equalTo(currentUser.uid));
    
    onValue(userProductsQuery, (snapshot) => {
        const userProductsList = document.getElementById('user-products-list');
        if (!userProductsList) return;
        
        userProductsList.innerHTML = '';
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const product = {
                    key: childSnapshot.key,
                    ...childSnapshot.val()
                };
                
                const productCard = createUserProductCard(product);
                userProductsList.appendChild(productCard);
            });
        } else {
            userProductsList.innerHTML = '<p class="no-products">Você ainda não cadastrou nenhum produto.</p>';
        }
    });
}

// Criar card de produto para o usuário
function createUserProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <div class="product-image ${product.imageUrl ? '' : 'no-image'}">
            ${product.imageUrl ? 
                `<img src="${product.imageUrl}" alt="${product.name}" onerror="this.parentElement.innerHTML='<span>Imagem não disponível</span>'; this.parentElement.classList.add('no-image');">` : 
                '<span>Sem imagem</span>'
            }
        </div>
        <div class="product-name">${product.name}</div>
        <div class="product-category">${getCategoryName(product.category)}</div>
        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
        <div class="product-info">
            <p><strong>ID:</strong> ${product.id}</p>
            <p><strong>Quantidade:</strong> ${product.quantity}</p>
            <p><strong>Cor:</strong> ${product.color}</p>
        </div>
        <div class="product-actions">
            <button onclick="editProduct('${product.key}')" class="btn btn-secondary">Editar</button>
            <button onclick="deleteProduct('${product.key}')" class="btn btn-primary">Excluir</button>
        </div>
    `;
    
    return card;
}

// Exibir produtos na página principal
function displayProducts(products) {
    const productsContainer = document.getElementById('products-container');
    const loading = document.getElementById('loading');
    const noProducts = document.getElementById('no-products');
    
    if (!productsContainer) return;
    
    // Ocultar estados de carregamento
    if (loading) loading.style.display = 'none';
    if (noProducts) noProducts.style.display = 'none';
    
    productsContainer.innerHTML = '';
    
    if (products.length === 0) {
        if (noProducts) noProducts.style.display = 'block';
        return;
    }
    
    products.forEach(product => {
        const card = createProductCard(product);
        productsContainer.appendChild(card);
    });
}

// Criar card de produto para exibição geral
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <div class="product-image ${product.imageUrl ? '' : 'no-image'}">
            ${product.imageUrl ? 
                `<img src="${product.imageUrl}" alt="${product.name}" onerror="this.parentElement.innerHTML='<span>Imagem não disponível</span>'; this.parentElement.classList.add('no-image');">` : 
                '<span>Sem imagem</span>'
            }
        </div>
        <div class="product-name">${product.name}</div>
        <div class="product-category">${getCategoryName(product.category)}</div>
        <div class="product-price">R$ ${product.price.toFixed(2)}</div>
        <div class="product-info">
            <p><strong>Cor:</strong> ${product.color}</p>
            <p><strong>Quantidade:</strong> ${product.quantity}</p>
            <p><strong>Descrição:</strong> ${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
        </div>
        <div class="product-actions">
            <button onclick="viewProductDetails('${product.key}')" class="btn btn-secondary">Ver Detalhes</button>
            <button onclick="addToCart('${product.key}')" class="btn btn-primary">Comprar</button>
        </div>
    `;
    
    return card;
}

// Aplicar filtros
function applyFilters() {
    filteredProducts = allProducts.filter(product => {
        const matchesCategory = currentFilter === 'all' || product.category === currentFilter;
        const matchesSearch = currentSearchTerm === '' || 
            product.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(currentSearchTerm.toLowerCase());
        
        return matchesCategory && matchesSearch;
    });
}

// Filtrar por categoria
function filterByCategory(category) {
    currentFilter = category;
    
    // Atualizar botões de filtro
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`filter-${category}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    applyFilters();
    displayProducts(filteredProducts);
}

// Pesquisar produtos
function searchProducts() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        currentSearchTerm = searchInput.value;
        applyFilters();
        displayProducts(filteredProducts);
    }
}

// Editar produto
async function editProduct(productKey) {
    try {
        const productData = await getProductData(productKey);
        
        if (productData) {
            // Preencher formulário de edição
            document.getElementById('edit-product-key').value = productKey;
            document.getElementById('edit-product-name').value = productData.name;
            document.getElementById('edit-category').value = productData.category;
            document.getElementById('edit-quantity').value = productData.quantity;
            document.getElementById('edit-color').value = productData.color;
            document.getElementById('edit-price').value = productData.price;
            document.getElementById('edit-image-url').value = productData.imageUrl || '';
            document.getElementById('edit-description').value = productData.description;
            
            // Mostrar modal
            const modal = document.getElementById('edit-modal');
            if (modal) {
                modal.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar produto para edição:', error);
        window.authFunctions.showMessage('Erro ao carregar produto. Tente novamente.', 'error');
    }
}

// Excluir produto
async function deleteProduct(productKey) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            const productRef = ref(window.database, 'products/' + productKey);
            await remove(productRef);
            
            window.authFunctions.showMessage('Produto excluído com sucesso!', 'success');
            loadUserProducts();
            loadAllProducts();
            
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            window.authFunctions.showMessage('Erro ao excluir produto. Tente novamente.', 'error');
        }
    }
}

// Obter dados do produto
async function getProductData(productKey) {
    try {
        const productRef = ref(window.database, 'products/' + productKey);
        const snapshot = await get(productRef);
        
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error('Erro ao obter dados do produto:', error);
        return null;
    }
}

// Fechar modal de edição
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Limpar formulário de produto
function clearProductForm() {
    const form = document.getElementById('product-form');
    if (form) {
        form.reset();
    }
}

// Gerar ID único para produto
function generateProductId() {
    return 'PROD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Obter nome da categoria
function getCategoryName(category) {
    const categories = {
        'bikes': 'Bikes',
        'equipamentos': 'Equipamentos',
        'acessorios': 'Acessórios'
    };
    
    return categories[category] || category;
}

// Ver detalhes do produto
function viewProductDetails(productKey) {
    // Implementar modal de detalhes ou página de detalhes
    console.log('Ver detalhes do produto:', productKey);
    window.authFunctions.showMessage('Funcionalidade de detalhes em desenvolvimento!', 'info');
}

// Adicionar ao carrinho
function addToCart(productKey) {
    // Implementar funcionalidade de carrinho
    console.log('Adicionar ao carrinho:', productKey);
    window.authFunctions.showMessage('Produto adicionado ao carrinho! (Funcionalidade em desenvolvimento)', 'success');
}

// Exportar funções para uso global
window.dbFunctions = {
    filterByCategory,
    searchProducts,
    editProduct,
    deleteProduct,
    closeEditModal,
    viewProductDetails,
    addToCart
};

// Tornar funções disponíveis globalmente
window.filterByCategory = filterByCategory;
window.searchProducts = searchProducts;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.closeEditModal = closeEditModal;
window.viewProductDetails = viewProductDetails;
window.addToCart = addToCart;

