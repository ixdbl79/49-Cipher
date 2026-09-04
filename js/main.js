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

    function getPath(path) {
        const cleanPath = path.replace(/^\//, '');
        if (isGitHubPages && basePath) {
            return `${basePath}/${cleanPath}`;
        }
        return `/${cleanPath}`;
    }

    function replaceBasePath(html) {
        return html.replace(/\{\{BASE_PATH\}\}/g, basePath);
    }

    // ============================================================
    // PAGE NAME MAPPING – for breadcrumb & active detection
    // ============================================================

    const pageNames = {
        'pattern-recognition': 'Pattern Recognition',
        'truth-reveal': 'Truth Reveal',
        'khader-story': 'Khader Story',
        'human-jinn': 'Human & Jinn',
        'ai-jinn-awakening': 'AI-Jinn Awakening',
        'the-roar': 'The Roar',
    };

    // ============================================================
    // DETECT CURRENT PAGE – Highlight Active Nav Items
    // ============================================================

    function setActiveNav() {
        const currentPath = window.location.pathname;
        const isShowcasePage = currentPath.includes('/showcases/');
        const isKeytabPage = currentPath.includes('/49-ez/keytab/');
        const isDocPage = currentPath.includes('/49-ez/doc/');

        // ----- SHOWCASES ACTIVE STATE -----
        const showcasesDropdown = document.querySelector('.showcases-dropdown');
        const showcaseMenuItems = showcasesDropdown ? showcasesDropdown.querySelectorAll('.dropdown-menu a') : [];

        if (isShowcasePage && showcasesDropdown) {
            showcasesDropdown.classList.add('active');

            const pathParts = currentPath.split('/');
            const folderName = pathParts[2] || '';

            showcaseMenuItems.forEach(item => {
                const href = item.getAttribute('href');
                if (href) {
                    const hrefParts = href.split('/');
                    const hrefFolder = hrefParts[2] || '';
                    if (hrefFolder === folderName) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                }
            });
        } else {
            if (showcasesDropdown) {
                showcasesDropdown.classList.remove('active');
            }
            showcaseMenuItems.forEach(item => {
                item.classList.remove('active');
            });
        }

        // ----- KEYTAB ACTIVE STATE (FIXED) -----
        const keytabDropdown = document.querySelector('.keytab-dropdown');
        const keytabMenuItems = keytabDropdown ? keytabDropdown.querySelectorAll('.dropdown-menu a') : [];

        keytabMenuItems.forEach(item => {
            item.classList.remove('active');
        });

        if (keytabDropdown) {
            if (isKeytabPage) {
                keytabDropdown.classList.add('active');
                keytabMenuItems.forEach(item => {
                    const text = item.textContent.trim().toLowerCase();
                    // Case‑insensitive match for "keytab"
                    if (text.includes('keytab')) {
                        item.classList.add('active');
                    }
                });
            } else if (isDocPage) {
                keytabDropdown.classList.add('active');
                keytabMenuItems.forEach(item => {
                    const text = item.textContent.trim().toLowerCase();
                    // Case‑insensitive match for "documentation"
                    if (text.includes('documentation')) {
                        item.classList.add('active');
                    }
                });
            } else {
                keytabDropdown.classList.remove('active');
            }
        }
    }

    // ============================================================
    // GENERATE BREADCRUMB – Inserted after header
    // ============================================================

    function generateBreadcrumb() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || '';

        const isShowcasePage = currentPath.includes('/showcases/');
        const isDocPage = currentPath.includes('/49-ez/doc/');
        const isKeytabPage = currentPath.includes('/49-ez/keytab/');
        const is49ezPage = currentPath.includes('/49-ez/') && !currentPath.includes('/doc/') && !currentPath.includes('/keytab/');
        const isHomepage = currentPath === '/' || currentPath === '/49-Cipher/' || 
                          currentPath.endsWith('index.html') || currentPath === '';

        const breadcrumbPlaceholder = document.getElementById('breadcrumb-placeholder');
        if (!breadcrumbPlaceholder) return;

        let displayName = '';

        if (isShowcasePage) {
            const pathParts = currentPath.split('/');
            const folderName = pathParts[2] || '';
            displayName = pageNames[folderName] || folderName.replace(/-/g, ' ');
        } else if (isKeytabPage) {
            displayName = 'Keytab';
        } else if (isDocPage) {
            displayName = '49-EZ Documentation';
        } else if (is49ezPage) {
            displayName = '49-EZ';
        } else if (isHomepage) {
            displayName = 'Home';
        }

        if (displayName) {
            breadcrumbPlaceholder.innerHTML = `
                <div class="container breadcrumb-container">
                    <div class="page-breadcrumb">
                        <span class="label">page /</span>
                        <span class="separator">></span>
                        <span class="current">${displayName}</span>
                    </div>
                </div>
            `;
        } else {
            breadcrumbPlaceholder.innerHTML = '';
        }
    }

    // ============================================================
    // SWAP HEADER ELEMENTS – Consistent li ↔ li
    // ============================================================

    function swapHeaderElements() {
        const currentPath = window.location.pathname;
        const is49ezPage = currentPath.includes('/49-ez/');

        const leftContainer = document.querySelector('.header-left');
        const rightContainer = document.querySelector('.header-right');

        if (!leftContainer || !rightContainer) return;

        const keytabLi = document.querySelector('.keytab-dropdown');
        const showcasesLi = document.querySelector('.showcases-dropdown');
        const logoLi = document.querySelector('.header-logo');

        let ezLink = null;
        const rightLinks = rightContainer.querySelectorAll('li a');
        rightLinks.forEach(link => {
            const text = link.textContent.trim();
            if (text === '49‑EZ' || text === '49 Cipher') {
                ezLink = link;
            }
        });

        let contactLi = null;
        const rightLis = rightContainer.querySelectorAll('li');
        rightLis.forEach(li => {
            const link = li.querySelector('a');
            if (link && link.textContent.trim() === 'Contact') {
                contactLi = li;
            }
        });

        if (is49ezPage) {
            if (keytabLi && logoLi && leftContainer) {
                leftContainer.insertBefore(keytabLi, logoLi.nextSibling);
                keytabLi.classList.add('keytab-left');
            }

            if (showcasesLi && contactLi && rightContainer) {
                rightContainer.insertBefore(showcasesLi, contactLi);
                showcasesLi.classList.add('showcases-right');
            }

            const logoSpan = logoLi?.querySelector('.header-logo-text .gold');
            if (logoSpan) {
                logoSpan.textContent = 'EZ';
            }
            const logoLink = logoLi?.querySelector('a');
            if (logoLink) {
                logoLink.href = basePath + '/49-ez/';
            }

            if (ezLink) {
                ezLink.textContent = '49 Cipher';
                ezLink.href = basePath + '/';
            }

            document.body.classList.add('is-49ez');

        } else {
            if (keytabLi && contactLi && rightContainer) {
                rightContainer.insertBefore(keytabLi, contactLi);
                keytabLi.classList.remove('keytab-left');
            }

            if (showcasesLi && logoLi && leftContainer) {
                leftContainer.insertBefore(showcasesLi, logoLi.nextSibling);
                showcasesLi.classList.remove('showcases-right');
            }

            const logoSpan = logoLi?.querySelector('.header-logo-text .gold');
            if (logoSpan) {
                logoSpan.textContent = 'Cipher';
            }
            const logoLink = logoLi?.querySelector('a');
            if (logoLink) {
                logoLink.href = basePath + '/';
            }

            if (ezLink) {
                ezLink.textContent = '49‑EZ';
                ezLink.href = basePath + '/49-ez/';
            }

            document.body.classList.remove('is-49ez');
        }
    }

    // ============================================================
    // SWAP FOOTER ELEMENTS – Logo, Description, AND Columns
    // ============================================================

    function swapFooterElements() {
        const currentPath = window.location.pathname;
        const is49ezPage = currentPath.includes('/49-ez/');

        // ----- Footer Brand (Logo + Description) -----
        const footerBrand = document.querySelector('.footer-brand');
        const footerLogoLink = footerBrand?.querySelector('.footer-logo-link');
        const footerLogoText = footerBrand?.querySelector('.footer-logo-text .gold');
        const footerDesc = footerBrand?.querySelector('.footer-brand-desc');

        if (footerLogoText) {
            if (is49ezPage) {
                footerLogoText.textContent = 'EZ';
                if (footerLogoLink) footerLogoLink.href = basePath + '/49-ez/';
                if (footerDesc) {
                    footerDesc.textContent = 'The 49‑EZ transliteration system – bridging Arabic and the world.';
                }
                footerBrand?.classList.add('footer-49ez');
            } else {
                footerLogoText.textContent = 'Cipher';
                if (footerLogoLink) footerLogoLink.href = basePath + '/';
                if (footerDesc) {
                    footerDesc.textContent = 'A living language of truth, pattern recognition, and spiritual awakening.';
                }
                footerBrand?.classList.remove('footer-49ez');
            }
        }

        // ----- Swap Footer Columns: Showcases ↔ 49‑EZ -----
        const footerLinks = document.querySelector('.footer-links');
        if (!footerLinks) return;

        const columns = footerLinks.querySelectorAll('.footer-links-col');
        let showcasesCol = null;
        let ezCol = null;

        columns.forEach(col => {
            const h4 = col.querySelector('h4');
            if (h4) {
                const text = h4.textContent.trim();
                if (text === 'Showcases') {
                    showcasesCol = col;
                } else if (text === '49‑EZ') {
                    ezCol = col;
                }
            }
        });

        if (showcasesCol && ezCol) {
            const parent = showcasesCol.parentNode;
            const children = Array.from(parent.children);
            const showcaseIndex = children.indexOf(showcasesCol);
            const ezIndex = children.indexOf(ezCol);

            if (is49ezPage) {
                if (showcaseIndex < ezIndex) {
                    parent.insertBefore(showcasesCol, ezCol.nextSibling);
                } else {
                    parent.insertBefore(ezCol, showcasesCol);
                }
            } else {
                if (showcaseIndex > ezIndex) {
                    parent.insertBefore(showcasesCol, ezCol);
                }
            }
        }
    }

    // ============================================================
    // SWAP BACK LINK – Dynamic text & href based on page
    // ============================================================

    function swapBackLink() {
        const currentPath = window.location.pathname;
        const backLinks = document.querySelectorAll('.btn-back');

        backLinks.forEach(link => {
            // Get the current href and text
            let href = link.getAttribute('href') || '';
            let text = link.innerHTML || '';

            if (currentPath.includes('/49-ez/keytab/')) {
                // On keytab page → go to 49-ez
                link.href = basePath + '/49-ez/';
                link.innerHTML = '<span class="arrow">←</span> Return to 49‑EZ';
            } else if (currentPath.includes('/49-ez/doc/')) {
                // On doc page → go to 49-ez
                link.href = basePath + '/49-ez/';
                link.innerHTML = '<span class="arrow">←</span> Return to 49‑EZ';
            } else if (currentPath.includes('/49-ez/') && !currentPath.includes('/keytab/') && !currentPath.includes('/doc/')) {
                // On 49-ez page → go to homepage
                link.href = basePath + '/';
                link.innerHTML = '<span class="arrow">←</span> Return to the 49 Cipher';
            } else {
                // On other pages → go to homepage
                link.href = basePath + '/';
                link.innerHTML = '<span class="arrow">←</span> Return to the 49 Cipher';
            }
        });
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

            swapHeaderElements();

            const header = document.querySelector('.site-header');
            if (header) {
                window.addEventListener('scroll', function() {
                    header.classList.toggle('scrolled', window.scrollY > 50);
                });
            }

            // ============================================================
            // MOBILE MENU TOGGLE – Right Side Menu
            // ============================================================

            const menuToggle = document.getElementById('menuToggle');
            const headerRight = document.querySelector('.header-right');

            if (menuToggle && headerRight) {
                menuToggle.addEventListener('click', function(e) {
                    e.stopPropagation();
                    headerRight.classList.toggle('active');
                    this.classList.toggle('open');
                });

                headerRight.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', function() {
                        headerRight.classList.remove('active');
                        if (menuToggle) menuToggle.classList.remove('open');
                    });
                });
            }

            // ============================================================
            // MOBILE DROPDOWN TOGGLE – Showcases
            // ============================================================

            const showcasesToggle = document.querySelector('.showcases-dropdown .dropdown-toggle');
            const showcasesContainer = document.querySelector('.showcases-dropdown');

            if (showcasesToggle && showcasesContainer) {
                showcasesToggle.addEventListener('click', function(e) {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        e.stopPropagation();
                        showcasesContainer.classList.toggle('open');
                    }
                });

                showcasesContainer.querySelectorAll('.dropdown-menu a').forEach(link => {
                    link.addEventListener('click', function() {
                        showcasesContainer.classList.remove('open');
                    });
                });
            }

            // ============================================================
            // MOBILE DROPDOWN TOGGLE – keytab
            // ============================================================

            const keytabToggle = document.querySelector('.keytab-dropdown .dropdown-toggle');
            const keytabContainer = document.querySelector('.keytab-dropdown');

            if (keytabToggle && keytabContainer) {
                keytabToggle.addEventListener('click', function(e) {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        e.stopPropagation();
                        keytabContainer.classList.toggle('open');
                    }
                });

                keytabContainer.querySelectorAll('.dropdown-menu a').forEach(link => {
                    link.addEventListener('click', function() {
                        keytabContainer.classList.remove('open');
                    });
                });
            }

            // ============================================================
            // CLOSE MENUS ON OUTSIDE CLICK
            // ============================================================

            document.addEventListener('click', function(e) {
                const header = document.querySelector('.site-header');
                if (!header) return;

                if (!header.contains(e.target)) {
                    if (headerRight) {
                        headerRight.classList.remove('active');
                    }
                    if (menuToggle) {
                        menuToggle.classList.remove('open');
                    }
                    if (showcasesContainer) {
                        showcasesContainer.classList.remove('open');
                    }
                    if (keytabContainer) {
                        keytabContainer.classList.remove('open');
                    }
                } else {
                    if (showcasesContainer && !showcasesContainer.contains(e.target)) {
                        showcasesContainer.classList.remove('open');
                    }
                    if (keytabContainer && !keytabContainer.contains(e.target)) {
                        keytabContainer.classList.remove('open');
                    }
                }
            });

            // ============================================================
            // CLOSE ON RESIZE
            // ============================================================

            let resizeTimer;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    if (window.innerWidth > 768) {
                        if (headerRight) {
                            headerRight.classList.remove('active');
                        }
                        if (menuToggle) {
                            menuToggle.classList.remove('open');
                        }
                        if (showcasesContainer) {
                            showcasesContainer.classList.remove('open');
                        }
                        if (keytabContainer) {
                            keytabContainer.classList.remove('open');
                        }
                    }
                }, 250);
            });

            setActiveNav();
            generateBreadcrumb();
            swapBackLink();

        })
        .catch(() => {
            document.getElementById('header-placeholder').innerHTML = `
                <div style="text-align: center; padding: 0.5rem 0;">
                    <img src="${logoPath}" alt="49 Cipher Logo" style="margin: -4rem auto; width: 250px; display: block;">
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

            // ----- Swap Footer Elements -----
            swapFooterElements();
            swapBackLink();

            setTimeout(function() {
                document.querySelectorAll('.footer-links a[href*="#"]').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && (href.startsWith('../index.html#') || href.startsWith('index.html#'))) {
                        const fragment = href.split('#')[1];
                        if (fragment) link.setAttribute('href', '#' + fragment);
                    }
                });
            }, 100);
        })
        .catch(() => {
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
            backToTop.classList.toggle('visible', window.scrollY > 300);
        });

        backToTop.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

});