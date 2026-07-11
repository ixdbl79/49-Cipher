// ========================================
// 49 Cipher – Main JavaScript
// Open Source · Freedom · Shadow & Shake
// ========================================

document.addEventListener('DOMContentLoaded', function() {

    // ----- Load Header -----
    fetch('/49-Cipher/components/header.html')
        .then(response => {
            if (!response.ok) throw new Error('Header not found');
            return response.text();
        })
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;

            // ----- AFTER HEADER IS LOADED: Sticky Header Scroll Effect -----
            const header = document.querySelector('.site-header');
            if (header) {
                window.addEventListener('scroll', function() {
                    if (window.scrollY > 50) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                });
            }

            // ----- AFTER HEADER IS LOADED: Mobile Menu Toggle -----
            const menuToggle = document.getElementById('menuToggle');
            const headerLinks = document.querySelector('.header-links');

            if (menuToggle && headerLinks) {
                menuToggle.addEventListener('click', function() {
                    headerLinks.classList.toggle('active');
                });

                headerLinks.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', () => {
                        headerLinks.classList.remove('active');
                    });
                });
            }

            // ----- AFTER HEADER IS LOADED: Mobile Dropdown Toggle -----
            const dropdownToggles = document.querySelectorAll('.header-dropdown');
            dropdownToggles.forEach(toggle => {
                toggle.addEventListener('click', function(e) {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        this.classList.toggle('open');
                    }
                });
            });

        })
        .catch(() => {
            // FALLBACK – Logo only
            document.getElementById('header-placeholder').innerHTML = `
                <div style="text-align: center; padding: 0.5rem 0;">
                    <img src="/49-Cipher/images/49-tr-800x800.png" alt="49 Cipher Logo" style="margin: -4rem auto; width: 250px;">
                </div>
            `;
        });

    // ----- Load Footer -----
    fetch('/49-Cipher/components/footer.html')
        .then(response => {
            if (!response.ok) throw new Error('Footer not found');
            return response.text();
        })
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;

            // ----- Fix Footer Links for Smooth Scroll -----
            setTimeout(function() {
                const footerLinks = document.querySelectorAll('.footer-links a[href*="#"]');
                footerLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && (href.startsWith('../index.html#') || href.startsWith('index.html#'))) {
                        const fragment = href.split('#')[1];
                        if (fragment) {
                            link.setAttribute('href', '#' + fragment);
                        }
                    }
                });
            }, 100);

        })
        .catch(() => {
            // FALLBACK – Simple footer
            document.getElementById('footer-placeholder').innerHTML = `
                <div class="footer">
                    🛡️⚡📘 <strong>49 Cipher – The Criterion (Furqan / الفرقان)</strong><br>
                    <em>Open Source · Freedom · Shadow & Shake</em>
                </div>
            `;
        });

    // ----- Back to Top Button -----
    const backToTop = document.getElementById('backToTop');

    if (backToTop) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

});