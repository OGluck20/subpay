let dataInitialized = false;

function toggleBodyScroll(enable) {
    document.body.style.overflow = enable ? 'auto' : 'hidden';
}

document.addEventListener('DOMContentLoaded', function() {
    // Debug log
    console.log('Dashboard.js loaded');

    // Check if user is logged in
    if (!localStorage.getItem('token') || !localStorage.getItem('user_id')) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize only the components we're currently using
    initializeHamburger();
    initializeWallet();
    loadUserData();
    loadTransactions();
    initializeModals();
    initializeQuickActions();
    initializeAirtimePurchase();

    // Remove or comment out unused initializations
    // initializeDataPurchase();
    // initializeBillsPayment();

    // Update the click handlers for referral links
    document.querySelectorAll('.referral-link, [data-action="referral"]').forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            showReferralModal();
        });
    });
});

// Hamburger and Sidebar Navigation
function initializeHamburger() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    const closeButton = document.querySelector('.close-sidebar');
    const logoutLinks = document.querySelectorAll('.logout-link');

    menuToggle?.addEventListener('click', () => {
        sidebar?.classList.add('active');
        if (overlay) overlay.style.display = 'block';
    });

    closeButton?.addEventListener('click', () => {
        sidebar?.classList.remove('active');
        if (overlay) overlay.style.display = 'none';
    });

    overlay?.addEventListener('click', () => {
        sidebar?.classList.remove('active');
        overlay.style.display = 'none';
    });

    // Handle logout
    logoutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    });
}

// Wallet Functionality
function initializeWallet() {
    const hideBalanceBtn = document.getElementById('hideBalanceBtn');
    const balanceAmount = document.getElementById('balanceAmount');
    const fundWalletBtns = document.querySelectorAll('.primary-btn');
    const transferBtns = document.querySelectorAll('.secondary-btn');

    // Balance visibility toggle
    hideBalanceBtn?.addEventListener('click', () => {
        const isHidden = balanceAmount.classList.toggle('hidden');
        localStorage.setItem('hideBalance', isHidden);
        hideBalanceBtn.innerHTML = isHidden ? 
            '****<i class="fas fa-eye"></i>' : 
            '<i class="fas fa-eye-slash"></i>';
    });

    // Initialize balance visibility state
    if (localStorage.getItem('hideBalance') === 'true') {
        balanceAmount?.classList.add('hidden');
        if (hideBalanceBtn) {
            hideBalanceBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }

    // Fund wallet buttons
    fundWalletBtns.forEach(btn => {
        btn.addEventListener('click', () => showModal('fundWalletModal'));
    });

    // Transfer buttons
    transferBtns.forEach(btn => {
        btn.addEventListener('click', () => showModal('transferModal'));
    });
}

// User Data Loading
function loadUserData() {
    const name = localStorage.getItem('name');
    const balance = localStorage.getItem('balance');
    const email = localStorage.getItem('email');

    // Update greeting
    const greetingElement = document.querySelector('.greeting h3');
    if (greetingElement) {
        greetingElement.textContent = `Welcome back, ${name || 'User'}`;
    }

    // Update balance
    const balanceElement = document.getElementById('balanceAmount');
    if (balanceElement) {
        const formattedBalance = parseFloat(balance || 0).toLocaleString();
        balanceElement.textContent = `₦${formattedBalance}`;
    }
}

// Transaction History
function loadTransactions() {
    const transactionsList = document.getElementById('transactionsList');
    const noTransactions = document.getElementById('noTransactions');
    
    if (!transactionsList || !noTransactions) return;

    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    fetch(`handlers/transaction_handler.php?userId=${userId}`)
        .then(response => response.json())
        .then(data => {
            console.log('ALL TRANSACTION DATA:', data);
            
            if (data.status === 'success' && data.transactions && data.transactions.length > 0) {
                noTransactions.style.display = 'none';
                const transactionsHTML = data.transactions.map(transaction => {
                    const amount = parseFloat(transaction.amount).toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });

                    // Check for credit transactions
                    const isCredit = transaction.type === 'credit';
                    
                    // Add a plus sign for credits, minus for debits
                    const amountDisplay = isCredit ? `₦${amount}` : `-₦${amount}`;
                    const amountClass = isCredit ? 'credit' : 'debit';

                    return `
                        <div class="transaction-item">
                            <div class="transaction-details">
                                <span class="transaction-type">${transaction.purpose || transaction.type}</span>
                                <span class="transaction-amount ${amountClass}">${amountDisplay}</span>
                                ${transaction.phone_number ? `<span class="transaction-phone">${transaction.phone_number}</span>` : ''}
                                <span class="transaction-date">${formatDate(transaction.created_at)}</span>
                                <span class="transaction-status ${transaction.status.toLowerCase()}">${transaction.status}</span>
                            </div>
                        </div>
                    `;
                }).join('');
                
                transactionsList.innerHTML = transactionsHTML;
                transactionsList.style.display = 'block';
            } else {
                noTransactions.style.display = 'flex';
                transactionsList.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error loading transactions:', error);
        });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Modal Handling
function initializeModals() {
    const modals = document.querySelectorAll('.modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const overlay = document.querySelector('.overlay');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal.id);
        });
    });

    overlay?.addEventListener('click', () => {
        modals.forEach(modal => {
            closeModal(modal.id);
        });
    });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.querySelector('.overlay');
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        toggleBodyScroll(true);
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        toggleBodyScroll(false);
    }
}

// Event listeners for modal close buttons
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking the close button or outside the modal
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            closeModal(modalId);
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
});

// Utility Functions
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return dateString;
    }
}

function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <div class="toast-text">
                <span class="toast-title">${title}</span>
                <span class="toast-message">${message}</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Payment Functions
function initiatePayment() {
    const amount = document.getElementById('amount').value;
    if (!amount || amount < 100) {
        showToast('error', 'Error', 'Please enter a valid amount (minimum ₦100)');
        return;
    }

    FlutterwaveCheckout({
        public_key: "FLWPUBK_TEST-74dda7811de1cc8855436e6eb18d5ab5-X",
        tx_ref: "FUND_" + Date.now(),
        amount: amount,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
            email: localStorage.getItem('email'),
            phone_number: "",
            name: localStorage.getItem('name'),
        },
        customizations: {
            title: "Fund Wallet",
            description: "Wallet funding",
            logo: "path/to/your/logo.png",
        },
        callback: handleFlutterwaveResponse
    });
}

async function handleFlutterwaveResponse(response) {
    try {
        console.log('Flutterwave Response:', response);
        
        if (response.status === "successful" || response.status === "completed") {
            showToast('info', 'Processing', 'Verifying payment...');

            const formData = new FormData();
            formData.append('user_id', localStorage.getItem('user_id'));
            formData.append('amount', response.amount);
            formData.append('reference', response.transaction_id);
            formData.append('flw_ref', response.flw_ref);
            formData.append('tx_ref', response.tx_ref);

            const fundResponse = await fetch('handlers/fund_wallet.php', {
                method: 'POST',
                body: formData
            });

            const result = await fundResponse.json();
            console.log('Backend Response:', result);

            if (result.status === 'success') {
                localStorage.setItem('balance', result.balance);
                if (result.transactions) {
                    localStorage.setItem('transactions', JSON.stringify(result.transactions));
                }
                
                loadUserData();
                loadTransactions();
                showToast('success', 'Success', 'Wallet funded successfully!');
                closeModal('fundWalletModal');
            }
        }
    } catch (error) {
        console.error('Transaction error:', error);
        showToast('error', 'Error', error.message || 'Failed to process payment');
    }
}

// Quick Actions
function initializeQuickActions() {
    // Data Purchase Modal
    const dataCard = document.querySelector('.action-card[data-action="data"]');
    dataCard?.addEventListener('click', () => {
        showDataModal();
    });

    // Airtime Purchase Modal
    const airtimeCard = document.querySelector('.action-card[data-action="airtime"]');
    airtimeCard?.addEventListener('click', () => {
        showAirtimeModal();
    });

    // Bills Payment Modal
    const billsCard = document.querySelector('.action-card[data-action="bills"]');
    billsCard?.addEventListener('click', () => {
        showBillsModal();
    });

    // Referral Page
    const referralCard = document.querySelector('.action-card[data-action="referral"]');
    referralCard?.addEventListener('click', () => {
        window.location.href = 'referral.html';
    });
}

// Modal Show Functions
function showDataModal() {
    const dataModal = document.getElementById('dataModal');
    const overlay = document.querySelector('.overlay');
    
    if (dataModal && overlay) {
        dataModal.style.display = 'flex';
        overlay.style.display = 'block';
        toggleBodyScroll(true);
        
        // Initialize data purchase functionality
        initializeDataPurchase();
    }
}

function showAirtimeModal() {
    const modal = document.getElementById('airtimeModal');
    const overlay = document.querySelector('.overlay');
    
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        
        // Reset form if exists
        const form = document.getElementById('airtime-purchase-form');
        form?.reset();
        
        // Add close handlers
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn?.addEventListener('click', () => closeModal('airtimeModal'));
        
        overlay.addEventListener('click', () => closeModal('airtimeModal'));
    }
}

function showBillsModal() {
    const modal = document.getElementById('billsModal');
    const overlay = document.querySelector('.overlay');
    
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        
        // Reset form if exists
        const form = modal.querySelector('form');
        form?.reset();
        
        // Reset provider selection
        const providerSelect = document.getElementById('service-provider');
        if (providerSelect) {
            providerSelect.innerHTML = '<option value="">Select bill type first</option>';
            providerSelect.disabled = true;
        }
    }
}

// Data purchase initialization
function initializeDataPurchase() {
    const form = document.getElementById('data-purchase-form');
    const networkInputs = document.querySelectorAll('input[name="network"]');
    const planSelect = document.getElementById('data-plan');
    
    if (!form || !networkInputs.length || !planSelect) {
        console.error('Required elements for data purchase not found');
        return;
    }

    // Network selection handler
    networkInputs.forEach(input => {
        input.addEventListener('change', async function() {
            const network = this.value;
            console.log('Network selected:', network);
            await loadDataPlans(network);
        });
    });

    // Plan selection handler
    planSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const amountField = document.getElementById('data-amount');
        if (selectedOption && selectedOption.value && amountField) {
            const amount = selectedOption.getAttribute('data-price');
            amountField.value = amount;
        }
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted');

        const userId = localStorage.getItem('user_id');
        if (!userId) {
            showToast('error', 'Error', 'Please login again');
            window.location.href = 'login.html';
            return;
        }

        const formData = new FormData(this);
        const network = formData.get('network');
        const phone = formData.get('phone');
        const plan = formData.get('plan');
        const amount = formData.get('amount');
        const submitBtn = this.querySelector('button[type="submit"]');
        
        console.log('Submitting data:', { userId, network, phone, plan, amount });

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            const requestData = {
                userId: userId,  // Added userId here
                network: network,
                phoneNumber: phone,
                plan: plan,
                amount: amount,
                requestID: Date.now() + Math.random().toString(36).substring(7)
            };

            console.log('Sending request:', requestData);

            const response = await fetch('handlers/process_data_purchase.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            console.log('Server response:', result);

            if (result.status === 'success') {
                showToast('success', 'Success', result.message || 'Purchase successful');
                closeModal('dataModal');
                if (result.data?.balance) {
                    updateBalance(result.data.balance);
                }
                loadTransactions();
                this.reset();
            } else {
                throw new Error(result.message || 'Transaction failed');
            }

        } catch (error) {
            console.error('Purchase error:', error);
            showToast('error', 'Error', error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Purchase Data';
        }
    });

    console.log('Data purchase form initialized');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDataPurchase();
});

// Add loading indicator to HTML
document.addEventListener('DOMContentLoaded', function() {
    // Create loading indicator if it doesn't exist
    if (!document.getElementById('smeLoadingIndicator')) {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'smeLoadingIndicator';
        loadingIndicator.style.display = 'none';
        loadingIndicator.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <p>Initializing payment system...</p>
            </div>
        `;
        document.body.appendChild(loadingIndicator);
    }
});

// Add some CSS for the loading indicator
const style = document.createElement('style');
style.textContent = `
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
    }

    .loading-overlay p {
        color: white;
        margin: 0;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Remove VTPASS_NETWORKS and replace with Gsubz network codes
const GSUBZ_NETWORKS = {
    'mtn': 'mtn',
    'glo': 'glo',
    'airtel': 'airtel',
    '9mobile': '9mobile'
};

// Initialize Airtime Purchase functionality
function initializeAirtimePurchase() {
    const form = document.getElementById('airtime-purchase-form');
    if (!form) {
        console.error('Airtime form not found');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        try {
            const formData = new FormData(form);
            const amount = formData.get('amount');
            const phone = formData.get('phone-number');
            const network = formData.get('network');
            
            // Convert network to Gsubz format if needed
            const networkCode = GSUBZ_NETWORKS[network];
            console.log('Raw network value:', network);
            console.log('Network code:', networkCode);
            
            if (!networkCode) {
                throw new Error(`Invalid network selected: ${network}`);
            }

            // Show loading state
            const submitBtn = form.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            const response = await fetch('handlers/process_airtime.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: localStorage.getItem('user_id'),
                    amount: amount,
                    phone: phone,
                    network: networkCode
                })
            });

            const responseText = await response.text();
            console.log('Raw server response:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                throw new Error('Invalid response from server');
            }

            if (result.status === 'success') {
                // Update balance and show success message
                if (result.data?.balance) {
                    updateBalance(result.data.balance);
                }
                
                showToast('success', 'Success', 'Airtime purchased successfully!');
                closeModal('airtimeModal');
                form.reset();
            } else {
                throw new Error(result.message || 'Transaction failed');
            }

        } catch (error) {
            console.error('Purchase error:', error);
            showToast('error', 'Error', error.message);
        } finally {
            const submitBtn = form.querySelector('.submit-btn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Purchase Airtime';
        }
    });
}


async function handleAirtimePurchase(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const response = await fetch('handlers/process_airtime.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: localStorage.getItem('user_id'),
                network: formData.get('network'),
                phone: formData.get('phone-number'),
                amount: formData.get('amount')
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Update balance display
            if (result.data?.balance) {
                updateBalance(result.data.balance);
            }

            // Update transaction history if it's visible
            if (typeof loadTransactionHistory === 'function') {
                loadTransactionHistory();
            }

            showToast('success', 'Success', 'Airtime purchase successful!');
            closeModal('airtimeModal');
            form.reset();
        } else {
            throw new Error(result.message || 'Transaction failed');
        }

    } catch (error) {
        console.error('Purchase error:', error);
        showToast('error', 'Error', error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Function to update balance display
function updateBalance(newBalance) {
    const balanceElements = document.querySelectorAll('.user-balance');
    balanceElements.forEach(element => {
        element.textContent = '' + newBalance.toLocaleString();
    });
}

// Function to load transaction history
function loadTransactionHistory() {
    fetch('handlers/get_transactions.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateTransactionTable(data.transactions);
            }
        })
        .catch(error => console.error('Error loading transactions:', error));
}

// Function to fetch data plans from Gsubz
async function fetchDataPlans(network) {
    try {
        const response = await fetch('handlers/get_data_plans.php', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch plans');
        }

        const result = await response.json();
        
        if (result.status === 'success') {
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to load plans');
        }
    } catch (error) {
        console.error('Error loading plans:', error);
        showToast('error', 'Error', 'Failed to load data plans');
        return null;
    }
}

// Function to load data plans based on selected network
async function loadDataPlans(network) {
    const planSelect = document.getElementById('data-plan');
    planSelect.innerHTML = '<option value="">Loading plans...</option>';
    planSelect.disabled = true;

    try {
        // Updated service codes based on GSUBZ API
        const serviceMap = {
            'mtn': 'mtncg',      // MTN Data
            'glo': 'glo_data',      // Glo Data
            'airtel': 'airtel_cg',  // Airtel Corporate Gifting
            '9mobile': 'etisalat_data' // 9mobile Data
        };
        const serviceCode = serviceMap[network];
        
        if (!serviceCode) {
            throw new Error('Invalid network selected');
        }

        // console.log('Fetching plans for network:', network, 'Service code:', serviceCode);
        
        const response = await fetch('handlers/get_plans.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ service: serviceCode })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        // console.log('API Response:', result);
        
        planSelect.innerHTML = '<option value="">Select Data Plan</option>';
        
        if (result.status === 'success' && result.plans && Array.isArray(result.plans)) {
            // Sort plans by price
            const plans = result.plans.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            
            if (plans.length === 0) {
                planSelect.innerHTML = '<option value="">No plans available</option>';
                return;
            }

            plans.forEach(plan => {
                planSelect.innerHTML += `
                    <option value="${plan.value}" 
                            data-price="${plan.price}">
                        ${plan.displayName} - ₦${parseFloat(plan.price).toLocaleString()}
                    </option>
                `;
            });
        } else if (result.status === 'error') {
            throw new Error(result.message || 'Failed to load plans');
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading plans:', error);
        planSelect.innerHTML = '<option value="">Failed to load plans</option>';
        showToast('error', 'Error', error.message || 'Failed to load data plans');
    } finally {
        planSelect.disabled = false;
    }
}

// Event listener setup (keep this part unchanged)
document.addEventListener('DOMContentLoaded', function() {
    const networkRadios = document.querySelectorAll('input[name="network"]');
    networkRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                loadDataPlans(e.target.value);
            }
        });
    });
});

// Function to handle data purchase form submission
async function handleDataPurchase(e) {
    e.preventDefault();
    
    // Get userId from localStorage first
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        showToast('error', 'Error', 'Please login again');
        window.location.href = 'login.html';
        return;
    }
    
    const form = e.target;
    const formData = new FormData(form);
    const planSelect = document.getElementById('data-plan');
    const selectedOption = planSelect.options[planSelect.selectedIndex];
    const network = formData.get('network');

    // Debug log at the start
    console.log('Initial form data:', {
        userId,
        network,
        phone: formData.get('phone'),
        plan: selectedOption?.value,
        price: selectedOption?.dataset.price
    });

    if (!selectedOption || !selectedOption.value) {
        showToast('error', 'Error', 'Please select a data plan');
        return;
    }

    const phone = formData.get('phone');
    const price = selectedOption.dataset.price;
    const plan = selectedOption.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const serviceMap = {
            'mtn': 'mtn_cg',
            'glo': 'glo_cg',
            'airtel': 'airtel_cg',
            '9mobile': '9mobile_cg'
        };
        
        const serviceID = serviceMap[network];

        if (!serviceID) {
            throw new Error('Invalid network selected');
        }

        // Construct request data with both GSUBZ fields and our userId
        const requestData = {
            // GSUBZ required fields
            serviceID: serviceID,
            phone: phone,
            amount: price,
            plan: plan,
            requestID: Date.now() + Math.random().toString(36).substring(7),
            api: 'ap_7b1896948907b9299ee7129ede348e13',
            // Our additional field for database operations
            userId: userId
        };

        // Log the constructed request data
        console.log('Constructed request data:', requestData);

        // Make the request
        const response = await fetch('handlers/process_data_purchase.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer ap_7b1896948907b9299ee7129ede348e13'
            },
            body: JSON.stringify(requestData)
        });

        const responseText = await response.text();
        console.log('Raw server response:', responseText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
        }

        const result = JSON.parse(responseText);
        console.log('Payment Response:', result);

        if (result.status === 'success') {
            showToast('success', 'Success', result.message || 'Transaction successful');
            closeModal('dataModal');
            if (result.data?.balance) {
                updateBalance(result.data.balance);
            }
            loadTransactions();
        } else {
            throw new Error(result.message || 'Transaction failed');
        }

    } catch (error) {
        console.error('Purchase error:', error);
        showToast('error', 'Error', error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Make sure the form is properly initialized
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('data-purchase-form');
    if (form) {
        form.addEventListener('submit', handleDataPurchase);
        console.log('Data purchase form handler initialized');
    } else {
        console.error('Data purchase form not found');
    }
});

// Function to update user balance display
function updateBalance(newBalance) {
    const balanceElement = document.querySelector('.balance-amount');
    if (balanceElement) {
        balanceElement.textContent = '₦' + newBalance.toLocaleString();
    }
}

// Function to add transaction to history
function addTransactionToHistory(transaction) {
    const historyTable = document.querySelector('.transaction-history tbody');
    if (!historyTable) return;

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${transaction.reference}</td>
        <td>${transaction.network.toUpperCase()} Airtime</td>
        <td>₦${transaction.amount}</td>
        <td>${transaction.phone}</td>
        <td class="text-success">Successful</td>
        <td>${new Date().toLocaleString()}</td>
    `;
    
    // Insert at the beginning of the table
    historyTable.insertBefore(row, historyTable.firstChild);
}

// Update the form submission handler
document.getElementById('airtime-purchase-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const network = document.querySelector('input[name="network"]:checked');
        if (!network) {
            throw new Error('Please select a network');
        }

        const networkCode = network.value;
        const phoneNumber = document.getElementById('phone-number').value;
        const amount = document.getElementById('amount').value;

        // Basic validation
        if (!phoneNumber || phoneNumber.length !== 11) {
            throw new Error('Please enter a valid 11-digit phone number');
        }

        if (!amount || amount < 50) {
            throw new Error('Minimum amount is ₦50');
        }

        const formData = {
            userId: localStorage.getItem('user_id'), // Get actual user ID from storage
            amount: amount,
            phone: phoneNumber,
            network: networkCode
        };

        const response = await fetch('handlers/process_airtime.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const responseData = await response.json();
        
        if (responseData.status === 'success') {
            // Update balance in localStorage and UI
            if (responseData.data.balance) {
                localStorage.setItem('balance', responseData.data.balance);
                const balanceElement = document.getElementById('balanceAmount');
                if (balanceElement) {
                    balanceElement.textContent = `₦${parseFloat(responseData.data.balance).toLocaleString()}`;
                }
            }

            // Add new transaction to history
            const newTransaction = {
                type: 'airtime',
                network: networkCode,
                amount: amount,
                phone: phoneNumber,
                status: 'success',
                created_at: new Date().toISOString()
            };

            // Update transactions in localStorage
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            transactions.unshift(newTransaction); // Add to beginning of array
            localStorage.setItem('transactions', JSON.stringify(transactions));

            // Refresh transaction display
            loadTransactions();
            
            // Show success message
            showToast('success', 'Success', responseData.message);
            
            // Reset form and close modal
            this.reset();
            const modal = document.getElementById('airtimeModal');
            const overlay = document.querySelector('.overlay');
            if (modal) modal.style.display = 'none';
            if (overlay) overlay.style.display = 'none';
        } else {
            throw new Error(responseData.message || 'Transaction failed');
        }

    } catch (error) {
        console.log('Purchase error:', error);
        showToast('error', 'Error', error.message);
    }
});

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}

// Update your transaction display logic
function displayTransaction(transaction) {
    // Check if the transaction is a credit (wallet funding)
    const isCredit = transaction.type === 'credit' || 
                   (transaction.purpose?.toLowerCase().includes('fund'));
    
    const transactionHTML = `
        <div class="transaction-item">
            <div class="transaction-details">
                <div class="transaction-type">
                    ${transaction.description || 'Wallet Funding'}
                </div>
                <div class="transaction-date">
                    ${transaction.date}
                </div>
                <div class="transaction-status ${transaction.status.toLowerCase()}">
                    ${transaction.status}
                </div>
                <div class="transaction-amount ${isCredit ? 'credit' : 'debit'}">
                    ₦${transaction.amount.toLocaleString()}
                </div>
            </div>
        </div>
    `;
    
    return transactionHTML;
}

// Add this function to set up the data modal
function showDataModal() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        showToast('error', 'Error', 'Please login again');
        window.location.href = 'login.html';
        return;
    }
    
    // Set the userId in the hidden field
    document.getElementById('data-user-id').value = userId;
    
    // Show the modal
    document.getElementById('dataModal').style.display = 'block';
    document.querySelector('.overlay').style.display = 'block';
}

async function makePayment(requestData) {
    console.log('makePayment version: 1.0.1');
    console.log('makePayment called with:', requestData);
    
    try {
        const serviceMap = {
            'glo': 'glo_data',
            'mtn': 'mtncg',
            'airtel': 'airtel_cg',
            '9mobile': 'etisalat_data'
        };

        console.log('Service mapping for network:', {
            network: requestData.network,
            mappedService: serviceMap[requestData.network]
        });

        const serviceID = serviceMap[requestData.network];
        if (!serviceID) {
            console.error('Network mapping failed:', {
                providedNetwork: requestData.network,
                availableNetworks: Object.keys(serviceMap)
            });
            throw new Error('Invalid network selected');
        }

        const formData = new FormData();
        formData.append('serviceID', serviceID);
        formData.append('phone', requestData.phoneNumber);
        formData.append('plan', requestData.plan);
        formData.append('amount', requestData.amount);
        formData.append('requestID', requestData.requestID);
        formData.append('userId', requestData.userId);
        formData.append('api', 'ap_7b1896948907b9299ee7129ede348e13');

        // Debug log the actual form data
        const formDataDebug = {};
        for (let [key, value] of formData.entries()) {
            formDataDebug[key] = value;
        }
        console.log('Actual form data being sent:', formDataDebug);

        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
            const response = await fetch('handlers/process_data_purchase.php', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeout);

            const responseText = await response.text();
            console.log('Raw server response:', responseText);

            if (!responseText.trim()) {
                // Start polling for transaction status
                return await pollTransactionStatus(requestData.requestID);
            }

            let result = JSON.parse(responseText);
            
            // Add handling for GSUBZ success status
            if (result.status === 'Success') {
                return {
                    status: 'success',
                    message: result.delivery_message || 'Transaction successful',
                    data: {
                        balance: result['Final Balance'],
                        transactionId: result['Transaction ID']
                    }
                };
            }
            
            if (result.status === 'processing' || result.status === 'pending') {
                // Start polling for transaction status
                return await pollTransactionStatus(requestData.requestID);
            }

            return result;

        } catch (error) {
            if (error.name === 'AbortError') {
                // Start polling if the request timed out
                return await pollTransactionStatus(requestData.requestID);
            }
            throw error;
        }

    } catch (error) {
        console.error('Payment processing error:', error);
        throw error;
    }
}

// Add polling function to check transaction status
async function pollTransactionStatus(requestID, attempts = 0) {
    if (attempts >= 10) { // Max 10 attempts (50 seconds total)
        throw new Error('Transaction is taking longer than expected. Please check your transaction history for updates.');
    }

    try {
        const response = await fetch('handlers/check_transaction.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requestID: requestID
            })
        });

        const result = await response.json();
        console.log('Poll result:', result);

        if (result.status === 'success' || result.status === 'failed') {
            return result;
        }

        // Wait 5 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await pollTransactionStatus(requestID, attempts + 1);

    } catch (error) {
        console.error('Error polling transaction status:', error);
        throw error;
    }
}

function initializeDataPurchase() {
    const form = document.getElementById('data-purchase-form');
    if (!form) {
        console.error('Data purchase form not found');
        return;
    }

    // Remove existing listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        try {
            // Get userId first
            const userId = localStorage.getItem('user_id');
            if (!userId) {
                throw new Error('Please login again');
            }

            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            // Get form data with debugging
            const formData = new FormData(this);
            console.log('Raw form data:', {
                network: formData.get('network'),
                phone: formData.get('phone'),
                plan: formData.get('plan'),
                amount: formData.get('amount')
            });

            // Get amount from the selected plan
            const planSelect = document.getElementById('data-plan');
            const selectedOption = planSelect.options[planSelect.selectedIndex];
            const amount = selectedOption?.getAttribute('data-price');

            const requestData = {
                userId: userId,
                network: formData.get('network'),
                phoneNumber: formData.get('phone'),
                plan: formData.get('plan'),
                amount: amount || formData.get('amount'), // Use amount from plan or form
                requestID: Date.now() + Math.random().toString(36).substring(7)
            };

            // Debug log the request data
            console.log('Request data before validation:', requestData);

            // Validate required fields
            const requiredFields = ['network', 'phoneNumber', 'plan', 'amount'];
            for (const field of requiredFields) {
                if (!requestData[field]) {
                    console.error(`Missing field: ${field}`, requestData);
                    throw new Error(`${field} is required`);
                }
            }

            console.log('Submitting request:', requestData);

            const result = await makePayment(requestData);
            console.log('Payment result:', result);

            if (result.status === 'success') {
                showToast('success', 'Success', result.message || 'Purchase successful');
                closeModal('dataModal');
                if (result.data?.balance) {
                    updateBalance(result.data.balance);
                }
                loadTransactions();
                this.reset();
            } else {
                throw new Error(result.message || 'Transaction failed');
            }

        } catch (error) {
            console.error('Purchase error:', error);
            showToast('error', 'Error', error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Purchase Data';
        }
    });

    // Initialize network change handlers
    const networkInputs = document.querySelectorAll('input[name="network"]');
    networkInputs.forEach(input => {
        input.addEventListener('change', async function() {
            const network = this.value;
            console.log('Network selected:', network);
            await loadDataPlans(network);
        });
    });

    console.log('Data purchase form initialized');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDataPurchase();
});