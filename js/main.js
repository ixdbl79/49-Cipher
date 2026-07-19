// ========================================
// 49 Cipher – Main JavaScript
// Open Source · Freedom · Shadow & Shake
// ========================================

document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // ENVIRONMENT DETECTION – Works on localhost & GitHub Pages
    // ============================================================

    const isGitHubPages = window.location.hostname.includes('github.io');
    const basePath = isGitHubPages ? '/49-Cipher' : '';

    // ============================================================
    // DETECT PAGE DEPTH – How many folders deep are we?
    // ============================================================

    const pathSegments = window.location.pathname.split('/').filter(s => s && !s.includes('.'));
    const isInSubfolder = pathSegments.length > 0 && pathSegments[0] !== '49-Cipher' && pathSegments[0] !== '';
    const depth = isInSubfolder ? '..' : '';

    // Helper function to build correct paths
    function getPath(path) {
        const cleanPath = path.replace(/^\//, '');
        // If we're in a subfolder (like pages/), prepend '..'
        if (depth) {
            return `${depth}/${cleanPath}`;
        }
        // Otherwise, use basePath if on GitHub Pages
        if (isGitHubPages && basePath) {
            return `${basePath}/${cleanPath}`;
        }
        return cleanPath;
    }

    // Helper to replace placeholders in HTML
    function replaceBasePath(html) {
        return html.replace(/\{\{BASE_PATH\}\}/g, depth ? '..' : '');
    }

    // ============================================================
    // LOGO PATH (for fallback)
    // ============================================================

    const logoPath = getPath('images/49-tr-800x800.png');

    // ============================================================
    // LOAD HEADER
    // ============================================================

    fetch(getPath('components/header.html'))
        .then(response => {
            if (!response.ok) throw new Error('Header not found');
            return response.text();
        })
        .then(data => {
            const processedData = replaceBasePath(data);
            document.getElementById('header-placeholder').innerHTML = processedData;

            // Sticky Header
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

            // Mobile Menu Toggle
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

            // Mobile Dropdown Toggle
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
                    <img 
                        src="${logoPath}" 
                        alt="49 Cipher Logo" 
                        style="margin: -4rem auto; width: 250px; display: block;"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                    >
                    <span style="display: none; color: #f59e0b; font-size: 2rem; font-weight: bold;">
                        🧩 49 Cipher
                    </span>
                </div>
            `;
        });

    // ============================================================
    // LOAD FOOTER
    // ============================================================

    fetch(getPath('components/footer.html'))
        .then(response => {
            if (!response.ok) throw new Error('Footer not found');
            return response.text();
        })
        .then(data => {
            const processedData = replaceBasePath(data);
            document.getElementById('footer-placeholder').innerHTML = processedData;

            // Fix Footer Links for Smooth Scroll
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

    // ============================================================
    // BACK TO TOP BUTTON
    // ============================================================

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