// assets/js/main.js - Shared JavaScript functionality

// Site Configuration
const SITE_CONFIG = {
    siteName: 'Fiedler Family Farmer',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 0.08, // 8% tax
    shippingRate: 5.99
};

// Cart Management
class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.updateCartDisplay();
    }

    loadCart() {
        const saved = localStorage.getItem('fff_cart');
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('fff_cart', JSON.stringify(this.items));
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += product.quantity;
        } else {
            this.items.push(product);
        }
        
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification(`Added ${product.name} to cart!`);
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
    }

    updateQuantity(productId, newQuantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getTax() {
        return this.getSubtotal() * SITE_CONFIG.taxRate;
    }

    getShipping() {
        return this.getSubtotal() > 50 ? 0 : SITE_CONFIG.shippingRate;
    }

    getTotal() {
        return this.getSubtotal() + this.getTax() + this.getShipping();
    }

    updateCartDisplay() {
        const cartCountElements = document.querySelectorAll('[data-cart-count]');
        const count = this.getItemCount();
        
        cartCountElements.forEach(element => {
            element.textContent = count;
        });

        // Update cart button text if it exists
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.innerHTML = `🛒 Cart (${count})`;
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#2f5233' : '#e53e3e'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    clear() {
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
    }
}

// Initialize cart
const cart = new ShoppingCart();

// Navigation Functions
function navigateToCart() {
    if (cart.getItemCount() === 0) {
        cart.showNotification('Your cart is empty', 'info');
        return;
    }
    
    // For now, show cart summary. Later we'll navigate to cart.html
    const cartSummary = cart.items.map(item => 
        `${item.name} x${item.quantity} - ${SITE_CONFIG.currencySymbol}${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    const total = cart.getTotal().toFixed(2);
    alert(`Cart Contents:\n${cartSummary}\n\nTotal: ${SITE_CONFIG.currencySymbol}${total}`);
}

// Smooth Scrolling
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Form Validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateRequired(value) {
    return value.trim().length > 0;
}

// SEO and Analytics
function updatePageTitle(title) {
    document.title = `${title} - ${SITE_CONFIG.siteName}`;
}

function addStructuredData(data) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
}

// URL Management
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

function updateUrl(params, replace = false) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '') {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, params[key]);
        }
    });
    
    if (replace) {
        window.history.replaceState({}, '', url);
    } else {
        window.history.pushState({}, '', url);
    }
}

// Loading States
function showLoading(element) {
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
}

function hideLoading(element) {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize smooth scrolling
    initSmoothScrolling();
    
    // Add click handler to cart buttons
    document.querySelectorAll('.cart-btn').forEach(btn => {
        btn.addEventListener('click', navigateToCart);
    });
    
    // Add animation classes to elements as they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements with animation class
    document.querySelectorAll('.card, .product-image, .hero').forEach(el => {
        observer.observe(el);
    });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export for use in other files
window.FFF = {
    cart,
    config: SITE_CONFIG,
    utils: {
        validateEmail,
        validateRequired,
        updatePageTitle,
        addStructuredData,
        getUrlParams,
        updateUrl,
        showLoading,
        hideLoading
    }
};
