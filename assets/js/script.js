document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const dropdowns = document.querySelectorAll('.dropdown');
    const navLinks = document.getElementById('navLinks');

    // Check if we're on mobile
    const isMobile = () => window.innerWidth <= 768;

    // Sidebar functionality
    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Close nav dropdown if open on mobile
        if (isMobile()) {
            navLinks.classList.remove('active');
        }
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Mobile menu functionality
    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (isMobile()) {
                // If sidebar is open, close it first
                if (sidebar.classList.contains('active')) {
                    closeSidebar();
                }
                // Toggle nav dropdown
                navLinks.classList.toggle('active');
            } else {
                openSidebar();
            }
        });
    }

    // Dropdown functionality
    dropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('.dropdown-btn');
        
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close other dropdowns
            dropdowns.forEach(other => {
                if (other !== dropdown) {
                    other.classList.remove('active');
                }
            });
            
            dropdown.classList.toggle('active');
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
        
        if (!e.target.closest('.nav-links') && !e.target.closest('.mobile-menu')) {
            navLinks.classList.remove('active');
        }
    });

    // Sidebar event listeners
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Handle window resize
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            navLinks.classList.remove('active');
        }
    });

    // Close everything on ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
            navLinks.classList.remove('active');
            closeSidebar();
        }
    });
});