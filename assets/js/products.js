// assets/js/products.js - Debug version with better error handling

class ProductPage {
    constructor() {
        this.productData = null;
        this.selectedOptions = {};
        this.quantity = 1;
        this.currentPrice = 0;
        
        console.log('ProductPage constructor called');
        this.init();
    }

    async init() {
        try {
            console.log('Initializing product page...');
            
            // Get product slug from URL or data attribute
            this.productSlug = this.getProductSlug();
            console.log('Product slug:', this.productSlug);
            
            // Load product data
            await this.loadProductData();
            console.log('Product data loaded:', this.productData);
            
            // Hide loading message
            const loadingEl = document.querySelector('.product-loading');
            if (loadingEl) loadingEl.style.display = 'none';
            
            // Render the page
            this.renderProduct();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update SEO
            this.updateSEO();
            
            console.log('Product page initialized successfully');
            
        } catch (error) {
            console.error('Error initializing product page:', error);
            this.showError('Failed to load product data: ' + error.message);
        }
    }

    getProductSlug() {
        // Try to get from URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('product');
        
        if (slug) {
            console.log('Found slug in URL params:', slug);
            return slug;
        }
        
        // Try to get from data attribute
        const container = document.querySelector('[data-product-slug]');
        if (container) {
            console.log('Found slug in data attribute:', container.dataset.productSlug);
            return container.dataset.productSlug;
        }
        
        // Try to guess from current page URL
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        console.log('Guessed slug from filename:', filename);
        return filename;
    }

    async loadProductData() {
        try {
            console.log('Attempting to load products.json...');
            
            // Try different paths for the JSON file
            const possiblePaths = [
                '../../assets/data/products.json',
                '/assets/data/products.json',
                '../assets/data/products.json',
                'assets/data/products.json'
            ];
            
            let data = null;
            let successfulPath = null;
            
            for (const path of possiblePaths) {
                try {
                    console.log(`Trying path: ${path}`);
                    const response = await fetch(path);
                    
                    if (response.ok) {
                        data = await response.json();
                        successfulPath = path;
                        console.log(`Successfully loaded from: ${path}`);
                        break;
                    } else {
                        console.log(`Failed to load from ${path}: ${response.status} ${response.statusText}`);
                    }
                } catch (pathError) {
                    console.log(`Error loading from ${path}:`, pathError.message);
                }
            }
            
            if (!data) {
                throw new Error('Could not load products.json from any path. Make sure the file exists in assets/data/products.json');
            }
            
            // Find the specific product
            this.productData = data.products.find(p => p.slug === this.productSlug);
            
            if (!this.productData) {
                throw new Error(`Product not found: ${this.productSlug}. Available products: ${data.products.map(p => p.slug).join(', ')}`);
            }
            
            // Initialize selected options with defaults
            this.initializeOptions();
            
        } catch (error) {
            console.error('Error loading product data:', error);
            throw error;
        }
    }

    initializeOptions() {
        if (this.productData.options) {
            Object.keys(this.productData.options).forEach(optionType => {
                const options = this.productData.options[optionType];
                if (options && options.length > 0) {
                    // Select first option as default (or find one marked as default)
                    const defaultOption = options.find(opt => opt.default) || options[0];
                    this.selectedOptions[optionType] = defaultOption.value;
                }
            });
        }
        
        this.updatePrice();
    }

    renderProduct() {
        console.log('Rendering product...');
        
        this.renderBreadcrumb();
        this.renderProductImage();
        this.renderProductDetails();
        this.renderProductOptions();
        this.renderQuantityControls();
        this.renderPricing();
        this.renderAddToCartButton();
        this.renderProductSpecs();
        
        // Add animation
        const container = document.querySelector('.product-container');
        if (container) {
            container.classList.add('product-content');
        }
        
        console.log('Product rendered successfully');
    }

    renderBreadcrumb() {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <a href="../../index.html">Home</a> / 
                <a href="../../index.html#products">Products</a> / 
                ${this.productData.name}
            `;
        }
    }

    renderProductImage() {
        const imageContainer = document.querySelector('.product-image');
        if (imageContainer) {
            imageContainer.innerHTML = this.productData.image;
            imageContainer.setAttribute('data-category', this.productData.category);
        }

        // Render thumbnails
        const thumbnailsContainer = document.querySelector('.product-thumbnails');
        if (thumbnailsContainer && this.productData.images) {
            thumbnailsContainer.innerHTML = this.productData.images.map((img, index) => `
                <div class="thumbnail ${index === 0 ? 'active' : ''}" 
                     data-category="${this.productData.category}"
                     data-image="${img}">
                    ${img}
                </div>
            `).join('');
        }
    }

    renderProductDetails() {
        // Title
        const titleEl = document.querySelector('.product-title');
        if (titleEl) titleEl.textContent = this.productData.name;

        // Description
        const descEl = document.querySelector('.product-description');
        if (descEl) descEl.textContent = this.productData.description;

        // Features
        const featuresContainer = document.querySelector('.features-list');
        if (featuresContainer && this.productData.features) {
            featuresContainer.innerHTML = this.productData.features.map(feature => 
                `<li>${feature}</li>`
            ).join('');
        }

        // Stock status
        this.renderStockStatus();
    }

    renderStockStatus() {
        const stockContainer = document.querySelector('.stock-status');
        if (stockContainer) {
            const inStock = this.productData.inStock;
            const stockClass = inStock ? 'in-stock' : 'out-of-stock';
            const stockText = inStock ? 'In Stock' : 'Out of Stock';
            
            stockContainer.innerHTML = `
                <span class="stock-indicator ${stockClass}"></span>
                <span>${stockText}</span>
            `;
        }
    }

    renderProductOptions() {
        const optionsContainer = document.querySelector('.product-options');
        if (!optionsContainer || !this.productData.options) return;

        let optionsHTML = '';

        Object.keys(this.productData.options).forEach(optionType => {
            const options = this.productData.options[optionType];
            const isColorOption = optionType === 'color';
            
            optionsHTML += `
                <div class="option-section" data-option-type="${optionType}">
                    <label class="option-label">${this.capitalize(optionType)}:</label>
                    <div class="option-grid">
                        ${options.map(option => {
                            const isSelected = this.selectedOptions[optionType] === option.value;
                            const optionClass = isColorOption ? 'color-option' : 'option-item';
                            const colorClass = isColorOption ? `color-${option.value}` : '';
                            
                            return `
                                <div class="${optionClass} ${colorClass} ${isSelected ? 'selected' : ''}"
                                     data-option-type="${optionType}"
                                     data-option-value="${option.value}"
                                     ${isColorOption ? `title="${option.label}"` : ''}>
                                    ${!isColorOption ? option.label : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        optionsContainer.innerHTML = optionsHTML;
    }

    renderQuantityControls() {
        const quantityContainer = document.querySelector('.quantity-section');
        if (quantityContainer) {
            quantityContainer.innerHTML = `
                <label class="quantity-label">Quantity:</label>
                <div class="quantity-controls">
                    <button class="quantity-btn" data-action="decrease">−</button>
                    <input type="number" class="quantity-input" value="${this.quantity}" min="1" max="99">
                    <button class="quantity-btn" data-action="increase">+</button>
                </div>
            `;
        }
    }

    renderPricing() {
        const priceContainer = document.querySelector('.total-price');
        if (priceContainer) {
            const total = (this.currentPrice * this.quantity).toFixed(2);
            priceContainer.innerHTML = `Total: $${total}`;
        }

        // Price breakdown for complex pricing
        const breakdownContainer = document.querySelector('.price-breakdown');
        if (breakdownContainer && this.quantity > 1) {
            breakdownContainer.innerHTML = `$${this.currentPrice.toFixed(2)} each × ${this.quantity}`;
        }
        
        // Update main price display
        const priceEl = document.querySelector('.product-price');
        if (priceEl) {
            const priceText = this.productData.priceUnit ? 
                `$${this.currentPrice.toFixed(2)}${this.productData.priceUnit}` : 
                `$${this.currentPrice.toFixed(2)}`;
            priceEl.textContent = priceText;
        }
    }

    renderAddToCartButton() {
        const button = document.querySelector('.add-to-cart-btn');
        if (button) {
            const isInStock = this.productData.inStock;
            button.disabled = !isInStock;
            button.innerHTML = `
                <span class="btn-text">${isInStock ? 'Add to Cart' : 'Out of Stock'}</span>
                <span class="loading-spinner">⟳</span>
            `;
        }
    }

    renderProductSpecs() {
        const specsContainer = document.querySelector('.product-specs');
        if (!specsContainer) return;

        const specs = [];
        
        if (this.productData.weight) specs.push(['Weight', this.productData.weight]);
        if (this.productData.dimensions) specs.push(['Dimensions', this.productData.dimensions]);
        if (this.productData.careInstructions) specs.push(['Care', this.productData.careInstructions]);
        if (this.productData.storageInstructions) specs.push(['Storage', this.productData.storageInstructions]);
        if (this.productData.shippingInfo) specs.push(['Shipping', this.productData.shippingInfo]);

        if (specs.length > 0) {
            specsContainer.innerHTML = `
                <h3>Specifications</h3>
                <div class="specs-grid">
                    ${specs.map(([label, value]) => `
                        <div class="spec-item">
                            <span class="spec-label">${label}:</span>
                            <span class="spec-value">${value}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    setupEventListeners() {
        // Option selection
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-option-type]')) {
                this.handleOptionSelect(e.target);
            }
        });

        // Quantity controls
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quantity-btn')) {
                this.handleQuantityChange(e.target);
            }
        });

        // Quantity input
        const quantityInput = document.querySelector('.quantity-input');
        if (quantityInput) {
            quantityInput.addEventListener('input', (e) => {
                this.quantity = Math.max(1, parseInt(e.target.value) || 1);
                this.renderPricing();
            });
        }

        // Add to cart
        const addToCartBtn = document.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.handleAddToCart());
        }

        // Thumbnail clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.thumbnail')) {
                this.handleThumbnailClick(e.target);
            }
        });
    }

    handleOptionSelect(element) {
        const optionType = element.dataset.optionType;
        const optionValue = element.dataset.optionValue;

        // Update selected options
        this.selectedOptions[optionType] = optionValue;

        // Update UI
        const section = element.closest('.option-section');
        section.querySelectorAll('[data-option-value]').forEach(el => {
            el.classList.remove('selected');
        });
        element.classList.add('selected');

        // Update price if this option affects pricing
        this.updatePrice();
        this.renderPricing();
    }

    handleQuantityChange(button) {
        const action = button.dataset.action;
        const input = document.querySelector('.quantity-input');

        if (action === 'increase') {
            this.quantity = Math.min(99, this.quantity + 1);
        } else if (action === 'decrease') {
            this.quantity = Math.max(1, this.quantity - 1);
        }

        input.value = this.quantity;
        this.renderPricing();
    }

    handleThumbnailClick(thumbnail) {
        // Remove active class from all thumbnails
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked thumbnail
        thumbnail.classList.add('active');
        
        // Update main image
        const mainImage = document.querySelector('.product-image');
        const newImage = thumbnail.dataset.image;
        mainImage.innerHTML = newImage;
    }

    async handleAddToCart() {
        const button = document.querySelector('.add-to-cart-btn');
        
        try {
            // Show loading state
            button.classList.add('loading');
            button.disabled = true;

            // Create product object for cart
            const cartProduct = {
                id: this.generateProductId(),
                name: this.generateProductName(),
                price: this.currentPrice,
                quantity: this.quantity,
                image: this.productData.image,
                options: { ...this.selectedOptions }
            };

            // Add to cart using the global cart system
            if (window.FFF && window.FFF.cart) {
                window.FFF.cart.addItem(cartProduct);
            } else {
                console.log('Cart product:', cartProduct);
                alert(`Added ${cartProduct.name} to cart!`);
            }

            // Success feedback
            await this.delay(500);
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showError('Failed to add item to cart');
        } finally {
            // Reset button state
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    updatePrice() {
        // Start with base price
        let price = this.productData.price || this.productData.basePrice || 0;

        // Check if any options affect price
        if (this.productData.options) {
            Object.keys(this.selectedOptions).forEach(optionType => {
                const selectedValue = this.selectedOptions[optionType];
                const option = this.productData.options[optionType]?.find(opt => opt.value === selectedValue);
                
                if (option && option.price !== undefined) {
                    price = option.price;
                }
            });
        }

        this.currentPrice = price;
    }

    generateProductId() {
        let id = this.productData.id;
        
        // Append options to make unique ID
        Object.keys(this.selectedOptions).forEach(optionType => {
            id += `-${this.selectedOptions[optionType]}`;
        });
        
        return id;
    }

    generateProductName() {
        let name = this.productData.name;
        
        // Add options to name for clarity
        const optionLabels = [];
        Object.keys(this.selectedOptions).forEach(optionType => {
            const selectedValue = this.selectedOptions[optionType];
            const option = this.productData.options?.[optionType]?.find(opt => opt.value === selectedValue);
            if (option) {
                optionLabels.push(option.label);
            }
        });
        
        if (optionLabels.length > 0) {
            name += ` (${optionLabels.join(', ')})`;
        }
        
        return name;
    }

    updateSEO() {
        if (!this.productData.seo) return;

        // Update page title
        document.title = this.productData.seo.title;

        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = this.productData.seo.metaDescription;
    }

    showError(message) {
        console.error('Showing error:', message);
        
        const container = document.querySelector('.product-container');
        if (container) {
            container.innerHTML = `
                <div class="product-error">
                    <h2>Error Loading Product</h2>
                    <p>${message}</p>
                    <p><strong>Debug info:</strong></p>
                    <ul>
                        <li>Product slug: ${this.productSlug}</li>
                        <li>Current URL: ${window.location.href}</li>
                        <li>Check browser console for more details</li>
                    </ul>
                    <a href="../../index.html" class="btn btn-primary">Return Home</a>
                </div>
            `;
        }
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize product page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for product container...');
    
    // Only initialize if we're on a product page
    if (document.querySelector('.product-container')) {
        console.log('Product container found, initializing ProductPage...');
        new ProductPage();
    } else {
        console.log('No product container found, skipping ProductPage initialization');
    }
});

// Export for potential external use
window.ProductPage = ProductPage;