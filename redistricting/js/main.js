document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.classList.add('mobile-menu-btn');
    mobileMenuBtn.innerHTML = '☰';
    mobileMenuBtn.ariaLabel = 'Toggle navigation menu';

    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links');

    // Insert button only on small screens
    if (window.innerWidth <= 768) {
        nav.insertBefore(mobileMenuBtn, navLinks);
    }

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuBtn.innerHTML = navLinks.classList.contains('active') ? '✕' : '☰';
    });

    // Accordion Functionality
    const accordions = document.querySelectorAll('.accordion-item');

    accordions.forEach(item => {
        const header = item.querySelector('.accordion-header');

        header.addEventListener('click', () => {
            // Close others (optional - uncomment to enforce single open item)
            // accordions.forEach(otherItem => {
            //     if (otherItem !== item) otherItem.classList.remove('active');
            // });

            item.classList.toggle('active');
        });
    });
});
