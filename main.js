document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('[data-tool]');
    const toolSections = document.querySelectorAll('.tool-section');

    // === Tool Switching Logic ===
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active from all
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            toolSections.forEach(section => section.classList.remove('active'));

            // Add active to clicked
            this.classList.add('active');

            // Show correct tool
            const toolId = this.getAttribute('data-tool');
            const targetSection = document.getElementById(toolId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // === Aspect Ratio Calculator Logic ===
    const ratioButtons = document.querySelectorAll('.ratio-btn');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    let currentRatio = '16:9';

    // Set initial active button
    const activeBtn = document.querySelector('.ratio-btn.active');
    if (activeBtn) {
        currentRatio = activeBtn.getAttribute('data-ratio');
    }

    // Handle ratio button clicks
    ratioButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            ratioButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentRatio = this.getAttribute('data-ratio');

            // Clear inputs if switching to custom
            if (currentRatio === 'custom') {
                widthInput.value = '';
                heightInput.value = '';
            } else {
                // Recalculate if one field is filled
                if (widthInput.value) {
                    calculateHeight();
                } else if (heightInput.value) {
                    calculateWidth();
                }
            }
        });
    });

    // Handle width input
    widthInput.addEventListener('input', function () {
        if (currentRatio !== 'custom') {
            calculateHeight();
        }
    });

    // Handle height input
    heightInput.addEventListener('input', function () {
        if (currentRatio !== 'custom') {
            calculateWidth();
        }
    });

    function calculateHeight() {
        const width = parseFloat(widthInput.value);
        if (isNaN(width) || width <= 0) return;

        const [numerator, denominator] = currentRatio.split(':').map(Number);
        const height = (width * denominator) / numerator;
        heightInput.value = Math.round(height * 100) / 100; // Round to 2 decimals
    }

    function calculateWidth() {
        const height = parseFloat(heightInput.value);
        if (isNaN(height) || height <= 0) return;

        const [numerator, denominator] = currentRatio.split(':').map(Number);
        const width = (height * numerator) / denominator;
        widthInput.value = Math.round(width * 100) / 100; // Round to 2 decimals
    }
});


// === Copy Button Logic ===
const copyButtons = document.querySelectorAll('.copy-btn');

copyButtons.forEach(btn => {
    btn.addEventListener('click', function () {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const value = input.value.trim();

        if (!value) return;

        // Copy to clipboard
        navigator.clipboard.writeText(value).then(() => {
            // Show feedback
            this.classList.add('copied');
            setTimeout(() => {
                this.classList.remove('copied');
            }, 1500);
        }).catch(err => {
            console.warn('Copy failed:', err);
            // Fallback for older browsers (optional)
            const tempInput = document.createElement('input');
            tempInput.value = value;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        });
    });
});
