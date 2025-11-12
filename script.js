// Variables globales
let vehiclesData = [];
let cart = [];
let selectedVehicle = null;

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    loadVehicles();
    setupEventListeners();
});

// Cargar vehículos desde JSON
async function loadVehicles() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json');
        if (!response.ok) throw new Error('Error al cargar los datos');
        vehiclesData = await response.json();
        displayVehicles(vehiclesData);
    } catch (error) {
        document.getElementById('productsContainer').innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger" role="alert">
                    Error al cargar los vehículos: ${error.message}
                </div>
            </div>
        `;
    } finally {
        document.getElementById('loadingSpinner').style.display = 'none';
    }
}

// Mostrar vehículos en el DOM
function displayVehicles(vehicles) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    if (vehicles.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info" role="alert">
                    No se encontraron vehículos.
                </div>
            </div>
        `;
        return;
    }

    vehicles.forEach(vehicle => {
        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <img src="${vehicle.imagen}" class="card-img-top" alt="${vehicle.marca} ${vehicle.modelo}" loading="lazy">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                    <p class="card-text">${vehicle.categoria}</p>
                    <p class="card-text">${vehicle.tipo.replace(/[^\w\s]/g, '')}</p>
                    <p class="card-text fw-bold">$${vehicle.precio_venta.toLocaleString()}</p>
                    <button class="btn btn-primary mt-auto addToCartBtn" data-codigo="${vehicle.codigo}" data-bs-toggle="modal" data-bs-target="#quantityModal">Añadir al Carrito</button>
                    <button class="btn btn-info mt-2 viewDetailsBtn" data-codigo="${vehicle.codigo}" data-bs-toggle="modal" data-bs-target="#detailModal">Ver Detalle</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Añadir listeners a los botones de detalle
    document.querySelectorAll('.viewDetailsBtn').forEach(button => {
        button.addEventListener('click', () => {
            const codigo = parseInt(button.getAttribute('data-codigo'));
            const vehicle = vehiclesData.find(v => v.codigo === codigo);
            if (vehicle) {
                showDetailModal(vehicle);
            }
        });
    });
}

// Mostrar modal de detalle
function showDetailModal(vehicle) {
    document.getElementById('detailImage').src = vehicle.imagen;
    document.getElementById('detailTitle').textContent = `${vehicle.marca} ${vehicle.modelo}`;
    document.getElementById('detailMarca').textContent = vehicle.marca;
    document.getElementById('detailModelo').textContent = vehicle.modelo;
    document.getElementById('detailCategoria').textContent = vehicle.categoria;
    document.getElementById('detailTipo').textContent = vehicle.tipo.replace(/[^\w\s]/g, '');
    document.getElementById('detailPrecio').textContent = `$${vehicle.precio_venta.toLocaleString()}`;

    // Guardar el vehículo seleccionado para el carrito
    document.getElementById('addToCartFromDetail').onclick = () => {
        selectedVehicle = vehicle;
        const quantityModal = new bootstrap.Modal(document.getElementById('quantityModal'));
        quantityModal.show();
    };
}

// Filtrar vehículos
function filterVehicles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = vehiclesData.filter(vehicle =>
        vehicle.marca.toLowerCase().includes(searchTerm) ||
        vehicle.modelo.toLowerCase().includes(searchTerm) ||
        vehicle.categoria.toLowerCase().includes(searchTerm)
    );
    displayVehicles(filtered);
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda
    document.getElementById('searchInput').addEventListener('input', filterVehicles);

    // Botón del carrito
    document.getElementById('cartButton').addEventListener('click', () => {
        const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
        cartModal.show();
        updateCartUI();
    });

    // Botón "Añadir al Carrito" en el modal de cantidad
    document.getElementById('addToCartBtn').addEventListener('click', () => {
        const quantity = parseInt(document.getElementById('quantityInput').value);
        if (quantity > 0) {
            addItemToCart(selectedVehicle, quantity);
            const quantityModal = bootstrap.Modal.getInstance(document.getElementById('quantityModal'));
            quantityModal.hide();
        } else {
            alert('La cantidad debe ser mayor que 0.');
        }
    });

    // Botón "Pagar"
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
        paymentModal.show();
    });

    // Botón "Procesar Pago"
    document.getElementById('processPaymentBtn').addEventListener('click', () => {
        const name = document.getElementById('nameInput').value;
        const card = document.getElementById('cardInput').value;

        if (name && card) {
            alert('Pago procesado con éxito. Generando factura...');
            generateInvoice();
            cart = [];
            updateCartUI();
            const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
            paymentModal.hide();
            const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            cartModal.hide();
        } else {
            alert('Por favor, completa todos los campos.');
        }
    });
}

// Añadir ítem al carrito
function addItemToCart(vehicle, quantity) {
    const existingItem = cart.find(item => item.codigo === vehicle.codigo);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            codigo: vehicle.codigo,
            marca: vehicle.marca,
            modelo: vehicle.modelo,
            precio: vehicle.precio_venta,
            quantity: quantity,
            imagen: vehicle.imagen,
            logo: vehicle.logo
        });
    }
    updateCartUI();
}

// Actualizar UI del carrito
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cartItems');
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>El carrito está vacío.</p>';
        document.getElementById('cartTotal').textContent = '$0';
        document.getElementById('cartCount').textContent = '0';
        return;
    }

    let total = 0;
    cart.forEach(item => {
        const subtotal = item.precio * item.quantity;
        total += subtotal;

        const itemElement = document.createElement('div');
        itemElement.className = 'd-flex align-items-center mb-3';
        itemElement.innerHTML = `
            <img src="${item.imagen}" alt="${item.marca} ${item.modelo}" class="me-3" style="width: 80px; height: 60px; object-fit: cover;">
            <div class="flex-grow-1">
                <h6>${item.marca} ${item.modelo}</h6>
                <p class="mb-0">Cantidad: ${item.quantity}</p>
                <p class="mb-0">Subtotal: $${subtotal.toLocaleString()}</p>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    document.getElementById('cartTotal').textContent = `$${total.toLocaleString()}`;
    document.getElementById('cartCount').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Generar factura
function generateInvoice() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('El Garage de Lis', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Factura de Compra', 105, 30, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });

    let y = 50;
    doc.setFontSize(12);
    doc.text('Detalles de la Compra:', 20, y);
    y += 10;

    cart.forEach(item => {
        doc.text(`${item.marca} ${item.modelo} - Cantidad: ${item.quantity} - Subtotal: $${(item.precio * item.quantity).toLocaleString()}`, 20, y);
        y += 10;
    });

    const total = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    doc.text(`Total: $${total.toLocaleString()}`, 20, y + 10);

    doc.save('factura_garage_de_lis.pdf');
}
