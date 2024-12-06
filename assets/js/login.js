document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        try {
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

            const formData = new FormData(this);

            const response = await fetch('handlers/login_handler.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Login Response:', data); // Debug log

            if (data.status === 'success') {
                // Store user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user_id', data.user.id);
                localStorage.setItem('name', data.user.fullname);
                localStorage.setItem('email', data.user.email);
                localStorage.setItem('balance', data.balance);
                
                // Store transactions
                if (data.transactions) {
                    localStorage.setItem('transactions', JSON.stringify(data.transactions));
                }

                showToast('success', 'Success', 'Login successful');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                throw new Error(data.message || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            showToast('error', 'Error', error.message || 'Failed to login. Please try again.');
        } finally {
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Login <i class="fas fa-sign-in-alt"></i>';
        }
    });
});

// Toast notification function (if not already defined)
function showToast(type, title, message) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                       type === 'error' ? 'fa-exclamation-circle' :
                       type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
} 