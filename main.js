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


    // === CONTRAST FINDER ===
    const fgColorList = document.getElementById('fgColorList');
    const addColorBtn = document.getElementById('addColorBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsGrid = document.getElementById('resultsGrid');

    let updateTimeout;

    // Create a new color input + picker
    function createColorItem(hex = '#ffffff') {
        const item = document.createElement('div');
        item.className = 'fg-color-item';

        // Make sure hex is full format (#FFFFFF)
        if (hex.length === 4) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }

        item.innerHTML = `
    <input type="text" class="fg-color-input" value="${hex.toUpperCase()}" placeholder="#FFFFFF">
    <input type="color" class="fg-color-picker" value="${hex.toLowerCase()}">
    <button class="remove-color-btn">×</button>
  `;

        const textInput = item.querySelector('.fg-color-input');
        const colorPicker = item.querySelector('.fg-color-picker');
        const removeBtn = item.querySelector('.remove-color-btn');

        // Text → Picker
        textInput.addEventListener('input', () => {
            const clean = textInput.value.trim();
            const parsed = parseColor(clean);
            if (parsed) {
                const fullHex = rgbToHex(parsed);
                colorPicker.value = fullHex.toLowerCase();
                scheduleUpdate();
            }
        });

        // Picker → Text
        colorPicker.addEventListener('input', () => {
            textInput.value = colorPicker.value.toUpperCase();
            scheduleUpdate();
        });

        // Remove (but keep at least one)
        removeBtn.addEventListener('click', () => {
            if (fgColorList.children.length > 1) {
                item.remove();
                scheduleUpdate();
            }
        });

        return item;
    }

    // Add new color row
    addColorBtn.addEventListener('click', () => {
        fgColorList.appendChild(createColorItem());
    });

    // Debounce: wait until user stops typing
    function scheduleUpdate() {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updateResults, 400);
    }

    // Main logic: calculate & show top 5 backgrounds
    function updateResults() {
        // Get all valid foreground colors
        const fgColors = Array.from(fgColorList.querySelectorAll('.fg-color-input'))
            .map(input => parseColor(input.value))
            .filter(c => c); // Remove invalid

        if (fgColors.length === 0) {
            resultsContainer.style.display = 'none';
            return;
        }

        // Test these background colors
        const bgOptions = [
            '#000000', '#111111', '#222222', '#333333', '#444444',
            '#555555', '#666666', '#777777', '#888888', '#999999',
            '#AAAAAA', '#BBBBBB', '#CCCCCC', '#DDDDDD', '#EEEEEE', '#FFFFFF'
        ];

        // Score each background by worst-case contrast (across all fg colors)
        const scored = bgOptions.map(bgHex => {
            const bg = hexToRgb(bgHex);
            const ratios = fgColors.map(fg => getContrastRatio(fg, bg));
            const worstRatio = Math.min(...ratios); // be conservative
            return { bgHex, ratio: worstRatio };
        });

        // Sort by contrast (highest first) and take top 5
        scored.sort((a, b) => b.ratio - a.ratio);
        const top5 = scored.slice(0, 5);

        // Show results
        renderResults(top5);
        resultsContainer.style.display = 'block';
    }

    // Render results to HTML
    function renderResults(items) {
        resultsGrid.innerHTML = '';
        items.forEach(({ bgHex, ratio }) => {
            const comp = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail';
            const compClass = ratio >= 7 ? 'aaa' : ratio >= 4.5 ? 'aa' : 'fail';

            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
      <div class="bg-preview" style="background:${bgHex}; color:white">Aa</div>
      <div class="bg-hex">${bgHex}</div>
      <div class="contrast-ratio">${ratio.toFixed(2)}:1</div>
      <div class="compliance"><span class="${compClass}">${comp}</span></div>
    `;
            resultsGrid.appendChild(card);
        });
    }

    // === Helper Functions ===

    function parseColor(str) {
        str = str.trim();
        if (str.startsWith('#')) {
            if (str.length === 4) {
                str = '#' + str[1].repeat(2) + str[2].repeat(2) + str[3].repeat(2);
            }
            return hexToRgb(str);
        }
        return null;
    }

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    function rgbToHex({ r, g, b }) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    function getLuminance({ r, g, b }) {
        const rs = r / 255;
        const gs = g / 255;
        const bs = b / 255;
        const a = [rs, gs, bs].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }

    function getContrastRatio(fg, bg) {
        const lum1 = getLuminance(fg);
        const lum2 = getLuminance(bg);
        const bright = Math.max(lum1, lum2);
        const dark = Math.min(lum1, lum2);
        return (bright + 0.05) / (dark + 0.05);
    }

    // Initialize first color
    fgColorList.innerHTML = '';
    fgColorList.appendChild(createColorItem('#FFFFFF'));



    // === TYPOGRAPHY TOOL ===
    const scaleTypeRadios = document.querySelectorAll('input[name="scaleType"]');
    const baseFontSizeInput = document.getElementById('baseFontSize');
    const typographyResults = document.getElementById('typographyResults');
    const fontSizesGrid = document.getElementById('fontSizesGrid');

    const PHI = 1.61803398875;

    function updateTypographyScale() {
        const baseSize = parseFloat(baseFontSizeInput.value);
        if (isNaN(baseSize) || baseSize <= 0) {
            typographyResults.style.display = 'none';
            return;
        }

        // Get selected type
        const selectedType = document.querySelector('input[name="scaleType"]:checked').value;

        let sizes = [];

        if (selectedType === 'smallest') {
            // 5 sizes: base, base*φ, base*φ², base*φ³, base*φ⁴
            for (let i = 0; i < 5; i++) {
                sizes.push(baseSize * Math.pow(PHI, i));
            }
        } else if (selectedType === 'medium') {
            // 2 smaller, base, 2 larger → total 5
            sizes = [
                baseSize / Math.pow(PHI, 2),
                baseSize / PHI,
                baseSize,
                baseSize * PHI,
                baseSize * Math.pow(PHI, 2)
            ];
        } else if (selectedType === 'largest') {
            // 5 sizes: base/φ⁴, base/φ³, base/φ², base/φ, base
            for (let i = 4; i >= 0; i--) {
                sizes.push(baseSize / Math.pow(PHI, i));
            }
        }

        // Round to 1 decimal
        sizes = sizes.map(s => Math.round(s * 10) / 10);

        renderFontSizes(sizes);
        typographyResults.style.display = 'block';
    }

    function renderFontSizes(sizes) {
        fontSizesGrid.innerHTML = '';
        const labels = ['XS', 'S', 'M', 'L', 'XL'];

        sizes.forEach((size, i) => {
            const card = document.createElement('div');
            card.className = 'font-size-card';
            card.innerHTML = `
      <div class="font-size-value">${size}px</div>
      <div class="font-size-label">${labels[i]}</div>
      <button class="copy-size-btn" data-value="${size}px">
        <svg><use href="#icon-copy"></use></svg>
      </button>
    `;
            fontSizesGrid.appendChild(card);
        });

        // Add copy listeners to new buttons
        fontSizesGrid.querySelectorAll('.copy-size-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const value = this.getAttribute('data-value');
                navigator.clipboard.writeText(value).then(() => {
                    // Show feedback
                    this.classList.add('copied');
                    setTimeout(() => this.classList.remove('copied'), 1500);
                });
            });
        });
    }

    // Bind events
    scaleTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateTypographyScale);
    });

    baseFontSizeInput.addEventListener('input', () => {
        // Debounce not needed — small calculation
        updateTypographyScale();
    });

    // Initialize
    updateTypographyScale();


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
