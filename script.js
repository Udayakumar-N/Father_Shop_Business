// Cart management
        let cart = [];
        let selectedAutocompleteIndex = -1;
        let filteredProducts = [];
        let currentEditingBillId = null;
        let originalBillData = null;
        let salesChart = null;
        let currentViewMode = 'daily'; // 'daily' or 'monthly'
        let selectedDate = null;
        let selectedMonth = null;

        // DOM Elements
        const itemForm = document.getElementById('itemForm');
        const cartItems = document.getElementById('cartItems');
        const totalEl = document.getElementById('total');
        const completeBillBtn = document.getElementById('completeBillBtn');
        const printBillBtn = document.getElementById('printBillBtn');
        const clearCartBtn = document.getElementById('clearCartBtn');
        const billingSection = document.getElementById('billingSection');
        const dashboardSection = document.getElementById('dashboardSection');
        const stockSection = document.getElementById('stockSection');
        const itemNameInput = document.getElementById('itemName');
        const autocompleteList = document.getElementById('autocompleteList');
        const autocompleteWrapper = itemNameInput.closest('.autocomplete-wrapper');

        // Initialize
        updateCartDisplay();
        updateTotal();
        loadDashboard();

        // Show autocomplete suggestions
        function showAutocomplete(inputValue) {
            if (!inputValue || inputValue.trim().length === 0) {
                hideAutocomplete();
                return;
            }
            
            const products = getProductsFromStock();
            const searchTerm = inputValue.toLowerCase().trim();
            
            // Filter products that match
            filteredProducts = products.filter(product => 
                product.name.toLowerCase().includes(searchTerm)
            ).slice(0, 5); // Show max 5 suggestions
            
            if (filteredProducts.length === 0) {
                hideAutocomplete();
                return;
            }
            
            // Build autocomplete list
            autocompleteList.innerHTML = filteredProducts.map((product, index) => {
                const isSelected = index === selectedAutocompleteIndex ? 'selected' : '';
                return `
                    <div class="autocomplete-item ${isSelected}" data-index="${index}">
                        <div class="product-name">${highlightMatch(product.name, searchTerm)}</div>
                        <div class="product-price">Last price: ₹${product.price.toFixed(2)}</div>
                    </div>
                `;
            }).join('');
            
            autocompleteList.classList.add('active');
            
            // Add click handlers
            autocompleteList.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.getAttribute('data-index'));
                    selectAutocompleteItem(index);
                });
            });
        }

        // Highlight matching text
        function highlightMatch(text, searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            return text.replace(regex, '<strong>$1</strong>');
        }

        // Select autocomplete item
        function selectAutocompleteItem(index) {
            if (index >= 0 && index < filteredProducts.length) {
                const product = filteredProducts[index];
                itemNameInput.value = product.name;
                document.getElementById('itemPrice').value = product.price;
                document.getElementById('itemQuantity').focus();
                hideAutocomplete();
            }
        }

        // Hide autocomplete
        function hideAutocomplete() {
            autocompleteList.classList.remove('active');
            autocompleteList.innerHTML = '';
            selectedAutocompleteIndex = -1;
            filteredProducts = [];
        }

        // Autocomplete input handler
        itemNameInput.addEventListener('input', (e) => {
            const value = e.target.value;
            selectedAutocompleteIndex = -1;
            showAutocomplete(value);
        });

        // Handle keyboard navigation in autocomplete
        itemNameInput.addEventListener('keydown', (e) => {
            if (!autocompleteList.classList.contains('active')) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, filteredProducts.length - 1);
                updateAutocompleteSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, -1);
                updateAutocompleteSelection();
            } else if (e.key === 'Enter' && selectedAutocompleteIndex >= 0) {
                e.preventDefault();
                selectAutocompleteItem(selectedAutocompleteIndex);
            } else if (e.key === 'Escape') {
                hideAutocomplete();
            }
        });

        // Update autocomplete selection highlight
        function updateAutocompleteSelection() {
            autocompleteList.querySelectorAll('.autocomplete-item').forEach((item, index) => {
                if (index === selectedAutocompleteIndex) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }

        // Hide autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (!autocompleteWrapper.contains(e.target)) {
                hideAutocomplete();
            }
        });

        // Form submission
        itemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('itemName').value.trim();
            const price = parseFloat(document.getElementById('itemPrice').value);
            const quantity = parseInt(document.getElementById('itemQuantity').value);
            
            if (!name || price <= 0 || quantity <= 0) {
                alert('Please fill all fields with valid values');
                return;
            }
            
            addToCart(name, price, quantity);
            itemForm.reset();
            document.getElementById('itemQuantity').value = 1;
            itemNameInput.focus();
        });

        // Get products from localStorage (stock)
        function getProductsFromStock() {
            return JSON.parse(localStorage.getItem('products') || '[]');
        }

        // Save product to stock
        function saveProductToStock(name, price) {
            const products = getProductsFromStock();
            
            // Check if product already exists
            const existingIndex = products.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
            
            if (existingIndex >= 0) {
                // Update existing product (update price if different)
                products[existingIndex].price = price;
                products[existingIndex].lastUsed = new Date().toISOString();
                products[existingIndex].timesUsed = (products[existingIndex].timesUsed || 1) + 1;
            } else {
                // Add new product
                products.push({
                    name: name,
                    price: price,
                    lastUsed: new Date().toISOString(),
                    timesUsed: 1
                });
            }
            
            // Sort by last used (most recent first)
            products.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
            
            // Keep only last 100 products
            const limitedProducts = products.slice(0, 100);
            
            localStorage.setItem('products', JSON.stringify(limitedProducts));
            
            // Refresh stock view if visible
            if (stockSection && !stockSection.classList.contains('hidden')) {
                loadStock();
            }
        }

        // Add item to cart
        function addToCart(name, price, quantity) {
            // Save product to stock
            saveProductToStock(name, price);
            
            const item = {
                id: Date.now(),
                name,
                price,
                quantity,
                total: price * quantity
            };
            
            cart.push(item);
            updateCartDisplay();
            updateTotal();
            
            // Hide autocomplete
            hideAutocomplete();
        }

        // Remove item from cart
        function removeFromCart(id) {
            cart = cart.filter(item => item.id !== id);
            updateCartDisplay();
            updateTotal();
        }

        // Update cart display
        function updateCartDisplay() {
            if (cart.length === 0) {
                cartItems.innerHTML = '<p class="empty-cart">Cart is empty. Add items to get started.</p>';
                return;
            }
            
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-info">₹${item.price.toFixed(2)} × ${item.quantity}</div>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div class="item-total">₹${item.total.toFixed(2)}</div>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                    </div>
                </div>
            `).join('');
        }

        // Calculate and update totals
        function updateTotal() {
            const total = cart.reduce((sum, item) => sum + item.total, 0);
            totalEl.textContent = `₹${total.toFixed(2)}`;
        }

        // Complete Bill - Save to localStorage
        completeBillBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Cart is empty. Add items before completing the bill.');
                return;
            }
            
            const total = cart.reduce((sum, item) => sum + item.total, 0);
            
            const bill = {
                id: Date.now(),
                billNumber: `BILL-${Date.now()}`,
                date: new Date().toISOString(),
                items: [...cart],
                total
            };
            
            // Save to localStorage
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            bills.push(bill);
            localStorage.setItem('bills', JSON.stringify(bills));
            
            alert(`Bill ${bill.billNumber} saved successfully! Total: ₹${total.toFixed(2)}`);
            
            // Clear cart
            cart = [];
            updateCartDisplay();
            updateTotal();
            
            // Refresh dashboard if visible
            if (!dashboardSection.classList.contains('hidden')) {
                loadDashboard();
            }
        });

        // Print Bill
        printBillBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Cart is empty. Add items before printing.');
                return;
            }
            
            window.print();
        });

        // Clear Cart
        clearCartBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                return;
            }
            
            if (confirm('Are you sure you want to clear the cart?')) {
                cart = [];
                updateCartDisplay();
                updateTotal();
            }
        });

        // Show Billing Section
        function showBilling() {
            billingSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
            stockSection.classList.add('hidden');
        }

        // Show Dashboard Section
        function showDashboard() {
            billingSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            stockSection.classList.add('hidden');
            loadDashboard();
        }

        // Show Stock Section
        function showStock() {
            billingSection.classList.add('hidden');
            dashboardSection.classList.add('hidden');
            stockSection.classList.remove('hidden');
            loadStock();
        }

        // Load Stock Data
        function loadStock() {
            const products = getProductsFromStock();
            
            // Update stats
            document.getElementById('totalProducts').textContent = products.length;
            
            // Count recent products (used in last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentCount = products.filter(p => new Date(p.lastUsed) >= sevenDaysAgo).length;
            document.getElementById('recentProducts').textContent = recentCount;
            
            // Render table
            renderStockTable(products);
        }

        // Render Stock Table
        function renderStockTable(products) {
            const tableBody = document.getElementById('stockTableBody');
            const searchTerm = document.getElementById('stockSearch')?.value.toLowerCase() || '';
            
            // Filter products if search term exists
            let filteredProducts = products;
            if (searchTerm) {
                filteredProducts = products.filter(p => 
                    p.name.toLowerCase().includes(searchTerm)
                );
            }
            
            if (filteredProducts.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 30px; color: #999;">
                            ${searchTerm ? 'No products found matching your search.' : 'No products in stock yet. Add products during billing to build your inventory!'}
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Sort by last used (most recent first)
            const sortedProducts = [...filteredProducts].sort((a, b) => 
                new Date(b.lastUsed) - new Date(a.lastUsed)
            );
            
            tableBody.innerHTML = sortedProducts.map((product, index) => {
                const lastUsedDate = new Date(product.lastUsed);
                const dateStr = lastUsedDate.toLocaleDateString();
                const timeStr = lastUsedDate.toLocaleTimeString();
                // Escape single quotes and special characters for onclick
                const escapedName = product.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                
                return `
                    <tr>
                        <td class="product-name-cell">${product.name}</td>
                        <td class="product-price-cell">₹${product.price.toFixed(2)}</td>
                        <td class="product-date-cell">${dateStr}<br><small>${timeStr}</small></td>
                        <td class="product-count-cell">${product.timesUsed || 1}x</td>
                        <td>
                            <div class="stock-action-btns">
                                <button class="delete-product-btn" onclick="deleteProductFromStock(${index})" data-product-name="${escapedName}" title="Delete Product">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // Store sorted products for delete function access
            window.currentStockProducts = sortedProducts;
        }

        // Filter Stock
        function filterStock() {
            loadStock();
        }

        // Delete Product from Stock
        function deleteProductFromStock(index) {
            // Get product name from stored array
            if (!window.currentStockProducts || !window.currentStockProducts[index]) {
                alert('Product not found!');
                return;
            }
            
            const productName = window.currentStockProducts[index].name;
            
            if (!confirm(`Are you sure you want to delete "${productName}" from stock?`)) {
                return;
            }
            
            const products = getProductsFromStock();
            const updatedProducts = products.filter(p => p.name !== productName);
            localStorage.setItem('products', JSON.stringify(updatedProducts));
            
            loadStock();
            alert('Product deleted from stock!');
        }

        // Load Dashboard Data
        function loadDashboard() {
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            
            // Calculate stats
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            
            let todayTotal = 0;
            let todayCount = 0;
            let monthTotal = 0;
            let monthCount = 0;
            let allTimeTotal = 0;
            
            bills.forEach(bill => {
                const billDate = new Date(bill.date);
                allTimeTotal += bill.total;
                
                if (billDate >= monthStart) {
                    monthTotal += bill.total;
                    monthCount++;
                    
                    if (billDate >= today) {
                        todayTotal += bill.total;
                        todayCount++;
                    }
                }
            });
            
            // Update stats
            document.getElementById('todayTotal').textContent = `₹${todayTotal.toFixed(2)}`;
            document.getElementById('todayBills').textContent = `${todayCount} bill${todayCount !== 1 ? 's' : ''}`;
            
            document.getElementById('monthTotal').textContent = `₹${monthTotal.toFixed(2)}`;
            document.getElementById('monthBills').textContent = `${monthCount} bill${monthCount !== 1 ? 's' : ''}`;
            
            document.getElementById('allTimeTotal').textContent = `₹${allTimeTotal.toFixed(2)}`;
            document.getElementById('allTimeBills').textContent = `${bills.length} bill${bills.length !== 1 ? 's' : ''}`;
            
            // Initialize default view
            if (!selectedDate && !selectedMonth) {
                const today = new Date();
                selectedDate = today.toISOString().split('T')[0];
                document.getElementById('dailyDatePicker').value = selectedDate;
            }
            updateCharts(bills);
            
            // Update table
            const tableBody = document.getElementById('billsTableBody');
            if (bills.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">No bills yet</td></tr>';
            } else {
                // Sort by date (newest first) and show last 20
                const sortedBills = bills
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 20);
                
                tableBody.innerHTML = sortedBills.map(bill => {
                    const date = new Date(bill.date);
                    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    return `
                        <tr>
                            <td>${bill.billNumber}</td>
                            <td>${dateStr}</td>
                            <td>${bill.items.length} item${bill.items.length !== 1 ? 's' : ''}</td>
                            <td><strong>₹${bill.total.toFixed(2)}</strong></td>
                            <td>
                                <button class="view-bill-btn" onclick="viewBill(${bill.id})" title="View Bill">👁️</button>
                                <button class="delete-bill-btn" onclick="deleteBill(${bill.id})" title="Delete Bill">🗑️</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Delete Bill function
        function deleteBill(billId) {
            if (!confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
                return;
            }
            
            // Get all bills from localStorage
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            
            // Filter out the bill with matching id
            const updatedBills = bills.filter(bill => bill.id !== billId);
            
            // Save back to localStorage
            localStorage.setItem('bills', JSON.stringify(updatedBills));
            
            // Reload dashboard to reflect changes
            loadDashboard();
            
            alert('Bill deleted successfully!');
        }

        // View Bill function
        function viewBill(billId) {
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            const bill = bills.find(b => b.id === billId);
            
            if (!bill) {
                alert('Bill not found!');
                return;
            }
            
            // Store current bill ID and original data
            currentEditingBillId = billId;
            originalBillData = JSON.parse(JSON.stringify(bill)); // Deep copy
            
            // Reset edit mode
            resetEditMode();
            
            // Format date
            const date = new Date(bill.date);
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const timeStr = date.toLocaleTimeString();
            
            // Build bill HTML (view mode)
            renderBillView(bill, dateStr, timeStr, false);
            
            // Show modal
            document.getElementById('billViewerModal').classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        // Render bill view (view or edit mode)
        function renderBillView(bill, dateStr, timeStr, editMode) {
            const billHTML = `
                <div class="bill-viewer-header">
                    <h1>INVOICE</h1>
                    <div class="bill-number">${bill.billNumber}</div>
                    <div class="bill-date">${dateStr}<br>${timeStr}</div>
                </div>
                
                <div class="bill-viewer-items">
                    <h3>Items</h3>
                    <div class="bill-item-row header">
                        <div class="item-name">Item Name</div>
                        <div class="item-price">Price</div>
                        <div class="item-qty">Qty</div>
                        <div class="item-total">Total</div>
                        ${editMode ? '<div>Action</div>' : ''}
                    </div>
                    ${bill.items.map((item, index) => `
                        <div class="bill-item-row ${editMode ? 'editable' : ''}" data-item-index="${index}">
                            ${editMode ? `
                                <div class="item-name">
                                    <input type="text" value="${item.name}" class="edit-item-name" data-index="${index}">
                                </div>
                                <div class="item-price">
                                    <input type="number" step="0.01" value="${item.price}" class="edit-item-price" data-index="${index}">
                                </div>
                                <div class="item-qty">
                                    <input type="number" min="1" value="${item.quantity}" class="edit-item-qty" data-index="${index}">
                                </div>
                                <div class="item-total">₹${item.total.toFixed(2)}</div>
                                <div class="bill-item-actions">
                                    <button class="remove-item-btn" onclick="removeBillItem(${index})">Remove</button>
                                </div>
                            ` : `
                                <div class="item-name">${item.name}</div>
                                <div class="item-price">₹${item.price.toFixed(2)}</div>
                                <div class="item-qty">${item.quantity}</div>
                                <div class="item-total">₹${item.total.toFixed(2)}</div>
                            `}
                        </div>
                    `).join('')}
                    ${editMode ? `
                        <button class="add-item-btn" onclick="addNewBillItem()">+ Add New Item</button>
                    ` : ''}
                </div>
                
                <div class="bill-viewer-summary">
                    <div class="bill-summary-row total">
                        <span>Total Amount:</span>
                        <span id="billTotalDisplay">₹${bill.total.toFixed(2)}</span>
                    </div>
                </div>
            `;
            
            // Insert content
            document.getElementById('billViewerContent').innerHTML = billHTML;
            
            // Add event listeners for edit mode
            if (editMode) {
                attachEditListeners();
            }
        }

        // Attach event listeners for editing
        function attachEditListeners() {
            // Add change listeners to inputs
            document.querySelectorAll('.edit-item-name, .edit-item-price, .edit-item-qty').forEach(input => {
                input.addEventListener('input', () => {
                    updateBillItemTotal(input.dataset.index);
                    updateBillTotal();
                });
            });
        }

        // Update item total when price or quantity changes
        function updateBillItemTotal(index) {
            const row = document.querySelector(`.bill-item-row[data-item-index="${index}"]`);
            if (!row) return;
            
            const priceInput = row.querySelector('.edit-item-price');
            const qtyInput = row.querySelector('.edit-item-qty');
            const totalDiv = row.querySelector('.item-total');
            
            if (priceInput && qtyInput && totalDiv) {
                const price = parseFloat(priceInput.value) || 0;
                const qty = parseInt(qtyInput.value) || 1;
                const total = price * qty;
                totalDiv.textContent = `₹${total.toFixed(2)}`;
            }
        }

        // Update bill total
        function updateBillTotal() {
            const rows = document.querySelectorAll('.bill-item-row.editable[data-item-index]');
            let total = 0;
            
            rows.forEach(row => {
                const priceInput = row.querySelector('.edit-item-price');
                const qtyInput = row.querySelector('.edit-item-qty');
                
                if (priceInput && qtyInput) {
                    const price = parseFloat(priceInput.value) || 0;
                    const qty = parseInt(qtyInput.value) || 1;
                    total += price * qty;
                }
            });
            
            document.getElementById('billTotalDisplay').textContent = `₹${total.toFixed(2)}`;
        }

        // Toggle edit mode
        function toggleEditMode() {
            if (!currentEditingBillId) return;
            
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            const bill = bills.find(b => b.id === currentEditingBillId);
            
            if (!bill) return;
            
            const date = new Date(bill.date);
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const timeStr = date.toLocaleTimeString();
            
            // Switch to edit mode
            renderBillView(bill, dateStr, timeStr, true);
            
            // Show/hide buttons
            document.getElementById('editBillBtn').classList.add('hidden');
            document.getElementById('saveBillBtn').classList.remove('hidden');
            document.getElementById('cancelEditBtn').classList.remove('hidden');
            document.getElementById('closeBillBtn').classList.add('hidden');
        }

        // Cancel edit mode
        function cancelEditMode() {
            if (!originalBillData || !currentEditingBillId) return;
            
            // Reload original bill from storage
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            const bill = bills.find(b => b.id === currentEditingBillId);
            
            if (!bill) {
                closeBillViewer();
                return;
            }
            
            const date = new Date(bill.date);
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const timeStr = date.toLocaleTimeString();
            
            // Restore original view
            renderBillView(bill, dateStr, timeStr, false);
            
            // Reset original data
            originalBillData = JSON.parse(JSON.stringify(bill));
            
            // Reset buttons
            resetEditMode();
        }

        // Reset edit mode buttons
        function resetEditMode() {
            document.getElementById('editBillBtn').classList.remove('hidden');
            document.getElementById('saveBillBtn').classList.add('hidden');
            document.getElementById('cancelEditBtn').classList.add('hidden');
            document.getElementById('closeBillBtn').classList.remove('hidden');
        }

        // Remove item from bill
        function removeBillItem(index) {
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            const bill = bills.find(b => b.id === currentEditingBillId);
            
            if (!bill || !bill.items[index]) return;
            
            bill.items.splice(index, 1);
            
            // Recalculate total
            bill.total = bill.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            // Re-render
            const date = new Date(bill.date);
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const timeStr = date.toLocaleTimeString();
            
            renderBillView(bill, dateStr, timeStr, true);
        }

        // Add new item to bill
        function addNewBillItem() {
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            const bill = bills.find(b => b.id === currentEditingBillId);
            
            if (!bill) return;
            
            // Add new item
            bill.items.push({
                name: 'New Item',
                price: 0,
                quantity: 1,
                total: 0
            });
            
            // Re-render
            const date = new Date(bill.date);
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const timeStr = date.toLocaleTimeString();
            
            renderBillView(bill, dateStr, timeStr, true);
        }

        // Save bill changes
        function saveBillChanges() {
            if (!currentEditingBillId) return;
            
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            const bill = bills.find(b => b.id === currentEditingBillId);
            
            if (!bill) return;
            
            // Collect all items from inputs
            const rows = document.querySelectorAll('.bill-item-row.editable[data-item-index]');
            const updatedItems = [];
            
            rows.forEach(row => {
                const nameInput = row.querySelector('.edit-item-name');
                const priceInput = row.querySelector('.edit-item-price');
                const qtyInput = row.querySelector('.edit-item-qty');
                
                if (nameInput && priceInput && qtyInput) {
                    const name = nameInput.value.trim();
                    const price = parseFloat(priceInput.value) || 0;
                    const quantity = parseInt(qtyInput.value) || 1;
                    
                    if (name && price > 0 && quantity > 0) {
                        updatedItems.push({
                            name: name,
                            price: price,
                            quantity: quantity,
                            total: price * quantity
                        });
                    }
                }
            });
            
            if (updatedItems.length === 0) {
                alert('Bill must have at least one item!');
                return;
            }
            
            // Update bill
            bill.items = updatedItems;
            bill.total = updatedItems.reduce((sum, item) => sum + item.total, 0);
            
            // Save to localStorage
            const billIndex = bills.findIndex(b => b.id === currentEditingBillId);
            if (billIndex >= 0) {
                bills[billIndex] = bill;
                localStorage.setItem('bills', JSON.stringify(bills));
                
                // Update product stock for new/updated items
                updatedItems.forEach(item => {
                    saveProductToStock(item.name, item.price);
                });
                
                // Re-render in view mode
                const date = new Date(bill.date);
                const dateStr = date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                const timeStr = date.toLocaleTimeString();
                
                renderBillView(bill, dateStr, timeStr, false);
                resetEditMode();
                
                // Reload dashboard
                if (!dashboardSection.classList.contains('hidden')) {
                    loadDashboard();
                }
                
                alert('Bill updated successfully!');
            }
        }

        // Close Bill Viewer
        function closeBillViewer() {
            try {
                const modal = document.getElementById('billViewerModal');
                const saveBtn = document.getElementById('saveBillBtn');
                
                // If in edit mode, ask for confirmation
                if (saveBtn && !saveBtn.classList.contains('hidden')) {
                    if (!confirm('You have unsaved changes. Do you want to close without saving?')) {
                        return;
                    }
                }
                
                // Close the modal
                if (modal) {
                    modal.classList.add('hidden');
                }
                
                // Restore scrolling
                document.body.style.overflow = '';
                document.body.style.overflowX = '';
                
                // Reset state
                currentEditingBillId = null;
                originalBillData = null;
                
                // Reset buttons to default state
                resetEditMode();
            } catch (error) {
                console.error('Error closing bill viewer:', error);
                // Force close even if there's an error
                const modal = document.getElementById('billViewerModal');
                if (modal) {
                    modal.classList.add('hidden');
                    document.body.style.overflow = '';
                }
            }
        }


        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('billViewerModal');
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                // If in edit mode, cancel first
                if (!document.getElementById('saveBillBtn').classList.contains('hidden')) {
                    cancelEditMode();
                } else {
                    closeBillViewer();
                }
            }
        });

        // Close modal when clicking outside
        function setupModalCloseOnOutsideClick() {
            const modal = document.getElementById('billViewerModal');
            if (modal && !modal.hasAttribute('data-listener-attached')) {
                modal.setAttribute('data-listener-attached', 'true');
                modal.addEventListener('click', (e) => {
                    // Only close if clicking directly on the modal background, not on content
                    if (e.target === modal || e.target.id === 'billViewerModal') {
                        closeBillViewer();
                    }
                });
            }
        }

        // Setup click outside to close
        setupModalCloseOnOutsideClick();
        
        // Also try after a short delay to ensure DOM is ready
        setTimeout(setupModalCloseOnOutsideClick, 100);

        // Switch to Daily View
        function switchToDailyView() {
            currentViewMode = 'daily';
            document.getElementById('dailyViewBtn').classList.add('active');
            document.getElementById('monthlyViewBtn').classList.remove('active');
            document.getElementById('dailyControls').classList.remove('hidden');
            document.getElementById('monthlyControls').classList.add('hidden');
            
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            if (selectedDate) {
                viewDailySales();
            } else {
                const today = new Date();
                selectedDate = today.toISOString().split('T')[0];
                document.getElementById('dailyDatePicker').value = selectedDate;
                viewDailySales();
            }
        }

        // Switch to Monthly View
        function switchToMonthlyView() {
            currentViewMode = 'monthly';
            document.getElementById('monthlyViewBtn').classList.add('active');
            document.getElementById('dailyViewBtn').classList.remove('active');
            document.getElementById('monthlyControls').classList.remove('hidden');
            document.getElementById('dailyControls').classList.add('hidden');
            
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            if (selectedMonth) {
                viewMonthlySales();
            } else {
                const today = new Date();
                selectedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                document.getElementById('monthlyDatePicker').value = selectedMonth;
                viewMonthlySales();
            }
        }

        // Update Selected Date
        function updateSelectedDate() {
            selectedDate = document.getElementById('dailyDatePicker').value;
        }

        // Update Selected Month
        function updateSelectedMonth() {
            selectedMonth = document.getElementById('monthlyDatePicker').value;
        }

        // Select Today
        function selectToday() {
            const today = new Date();
            selectedDate = today.toISOString().split('T')[0];
            document.getElementById('dailyDatePicker').value = selectedDate;
            viewDailySales();
        }

        // Select Current Month
        function selectCurrentMonth() {
            const today = new Date();
            selectedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            document.getElementById('monthlyDatePicker').value = selectedMonth;
            viewMonthlySales();
        }

        // View Daily Sales
        function viewDailySales() {
            if (!selectedDate) {
                updateSelectedDate();
            }
            
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            const dailyData = getDailySalesDataForDate(bills, selectedDate);
            const periodData = getPeriodSalesData(bills, selectedDate, 'daily');
            
            updatePeriodSummary(periodData, selectedDate, 'daily');
            renderChart(dailyData, 'Daily Sales', 'day');
        }

        // View Monthly Sales
        function viewMonthlySales() {
            if (!selectedMonth) {
                updateSelectedMonth();
            }
            
            const bills = JSON.parse(localStorage.getItem('bills') || '[]');
            const monthlyData = getMonthlySalesDataForMonth(bills, selectedMonth);
            const periodData = getPeriodSalesData(bills, selectedMonth, 'monthly');
            
            updatePeriodSummary(periodData, selectedMonth, 'monthly');
            renderChart(monthlyData, 'Monthly Sales', 'month');
        }

        // Update Period Summary
        function updatePeriodSummary(data, period, type) {
            const periodLabel = type === 'daily' 
                ? formatDateLabel(period)
                : formatMonthLabel(period);
            
            document.getElementById('periodLabel').textContent = `${periodLabel} Sales`;
            document.getElementById('periodAmount').textContent = `₹${data.total.toFixed(2)}`;
            document.getElementById('periodCount').textContent = `${data.count} bill${data.count !== 1 ? 's' : ''}`;
        }

        // Format Date Label
        function formatDateLabel(dateStr) {
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        // Format Month Label
        function formatMonthLabel(monthStr) {
            const [year, month] = monthStr.split('-');
            const date = new Date(year, parseInt(month) - 1, 1);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }

        // Get Period Sales Data
        function getPeriodSalesData(bills, period, type) {
            let filteredBills = [];
            
            if (type === 'daily') {
                const date = new Date(period + 'T00:00:00');
                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);
                
                filteredBills = bills.filter(bill => {
                    const billDate = new Date(bill.date);
                    return billDate >= date && billDate < nextDay;
                });
            } else {
                const [year, month] = period.split('-');
                const date = new Date(year, parseInt(month) - 1, 1);
                const nextMonth = new Date(date);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                
                filteredBills = bills.filter(bill => {
                    const billDate = new Date(bill.date);
                    return billDate >= date && billDate < nextMonth;
                });
            }
            
            return {
                total: filteredBills.reduce((sum, bill) => sum + bill.total, 0),
                count: filteredBills.length
            };
        }

        // Get Daily Sales Data for Specific Date (7 days around)
        function getDailySalesDataForDate(bills, dateStr) {
            const selectedDate = new Date(dateStr + 'T00:00:00');
            const labels = [];
            const values = [];
            
            // Get 7 days: 3 days before, selected day, 3 days after
            for (let i = -3; i <= 3; i++) {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() + i);
                date.setHours(0, 0, 0, 0);
                
                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);
                
                // Format label
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = date.getDate();
                const month = date.toLocaleDateString('en-US', { month: 'short' });
                labels.push(`${dayName} ${dayNum} ${month}`);
                
                // Calculate sales for this day
                const daySales = bills
                    .filter(bill => {
                        const billDate = new Date(bill.date);
                        return billDate >= date && billDate < nextDay;
                    })
                    .reduce((sum, bill) => sum + bill.total, 0);
                
                values.push(daySales);
            }
            
            return { labels, values };
        }

        // Get Monthly Sales Data for Specific Month (6 months around)
        function getMonthlySalesDataForMonth(bills, monthStr) {
            const [year, month] = monthStr.split('-');
            const selectedMonth = new Date(year, parseInt(month) - 1, 1);
            const labels = [];
            const values = [];
            
            // Get 6 months: 3 months before, selected month, 2 months after
            for (let i = -3; i <= 2; i++) {
                const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + i, 1);
                const nextMonth = new Date(date);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                
                // Format label
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                const yearStr = date.getFullYear();
                labels.push(`${monthName} ${yearStr}`);
                
                // Calculate sales for this month
                const monthSales = bills
                    .filter(bill => {
                        const billDate = new Date(bill.date);
                        return billDate >= date && billDate < nextMonth;
                    })
                    .reduce((sum, bill) => sum + bill.total, 0);
                
                values.push(monthSales);
            }
            
            return { labels, values };
        }

        // Render Chart
        function renderChart(data, title, type) {
            // Check if dashboard is visible
            if (dashboardSection.classList.contains('hidden')) {
                return;
            }
            
            // Destroy existing chart if it exists
            if (salesChart) {
                salesChart.destroy();
                salesChart = null;
            }
            
            // Update chart title
            document.getElementById('chartTitle').textContent = `📈 ${title} Chart`;
            
            // Wait a bit for DOM to be ready
            setTimeout(() => {
                const ctx = document.getElementById('salesChart');
                if (!ctx) return;
                
                salesChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: `${title} (₹)`,
                            data: data.values,
                            backgroundColor: '#FFD700',
                            borderColor: '#000',
                            borderWidth: 2,
                            borderRadius: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return '₹' + context.parsed.y.toFixed(2);
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '₹' + value.toFixed(0);
                                    },
                                    color: '#000',
                                    font: {
                                        weight: 'bold'
                                    }
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                }
                            },
                            x: {
                                ticks: {
                                    color: '#000',
                                    font: {
                                        weight: 'bold'
                                    },
                                    maxRotation: type === 'day' ? 45 : 0,
                                    minRotation: type === 'day' ? 45 : 0
                                },
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                });
            }, 100);
        }

        // Update Charts (legacy function for compatibility)
        function updateCharts(bills) {
            if (dashboardSection.classList.contains('hidden')) {
                return;
            }
            
            // Initialize default view
            if (currentViewMode === 'daily') {
                if (!selectedDate) {
                    const today = new Date();
                    selectedDate = today.toISOString().split('T')[0];
                    document.getElementById('dailyDatePicker').value = selectedDate;
                }
                viewDailySales();
            } else {
                if (!selectedMonth) {
                    const today = new Date();
                    selectedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                    document.getElementById('monthlyDatePicker').value = selectedMonth;
                }
                viewMonthlySales();
            }
        }


        // Make functions available globally for onclick
        window.removeFromCart = removeFromCart;
        window.deleteBill = deleteBill;
        window.viewBill = viewBill;
        window.closeBillViewer = closeBillViewer;
        window.toggleEditMode = toggleEditMode;
        window.cancelEditMode = cancelEditMode;
        window.saveBillChanges = saveBillChanges;
        window.removeBillItem = removeBillItem;
        window.addNewBillItem = addNewBillItem;
        window.showBilling = showBilling;
        window.showDashboard = showDashboard;
        window.showStock = showStock;
        window.filterStock = filterStock;
        window.deleteProductFromStock = deleteProductFromStock;
        window.switchToDailyView = switchToDailyView;
        window.switchToMonthlyView = switchToMonthlyView;
        window.updateSelectedDate = updateSelectedDate;
        window.updateSelectedMonth = updateSelectedMonth;
        window.selectToday = selectToday;
        window.selectCurrentMonth = selectCurrentMonth;
        window.viewDailySales = viewDailySales;
        window.viewMonthlySales = viewMonthlySales;