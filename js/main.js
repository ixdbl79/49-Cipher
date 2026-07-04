// ========================================
// 49 Cipher – Main JavaScript
// Open Source · Freedom · Shadow & Shake
// ========================================

document.addEventListener('DOMContentLoaded', function() {

    // ----- Load Header -----
    fetch('/components/header.html')
        .then(response => {
            if (!response.ok) throw new Error('Header not found');
            return response.text();
        })
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
        })
        .catch(() => {
            // Fallback if header fails to load
            document.getElementById('header-placeholder').innerHTML = `
                <nav class="navbar container">
                    <div class="logo"><a href="/">49 Cipher</a></div>
                    <div class="nav-links">
                        <a href="/">Home</a>
                        <a href="/49-cipher-showcase.html">Showcase 1</a>
                        <a href="/truth-reveal-showcase.html">Showcase 2</a>
                    </div>
                </nav>
            `;
        });

    // ----- Load Footer -----
    fetch('/components/footer.html')
        .then(response => {
            if (!response.ok) throw new Error('Footer not found');
            return response.text();
        })
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(() => {
            // Fallback if footer fails to load
            document.getElementById('footer-placeholder').innerHTML = `
                <div class="footer">
                    🛡️⚡📘 <strong>49 Cipher – The Criterion (Furqan / الفرقان)</strong><br>
                    <em>Open Source · Freedom · Shadow & Shake</em>
                </div>
            `;
        });

});