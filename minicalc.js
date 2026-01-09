document.addEventListener('DOMContentLoaded', () => {
    const headerElement = document.querySelector('p.minicalc');
    if (!headerElement) return;

    // ==================== UTILITIES ====================
    const $ = (id) => document.getElementById(id);
    const hide = (el) => el?.classList.add('hidden');
    const parseNum = (val, def = 1) => parseFloat(val) || def;

    const getAndHide = (id, defaultVal = '') => {
        const el = $(id);
        if (!el) return defaultVal;
        hide(el);
        return el.innerHTML || el.textContent.trim();
    };

    const collectIndexed = (pattern, processor) => {
        const items = [];
        for (let i = 1; ; i++) {
            const el = $(pattern.replace('{n}', i));
            if (!el) break;
            const result = processor(el, i);
            if (result !== null) items.push(result);
            hide(el);
        }
        return items;
    };

    const el = (tag, props = {}, styles = '') => 
        Object.assign(document.createElement(tag), props, styles ? { style: { cssText: styles } } : {});

    // ==================== DATA COLLECTION ====================
    const dropdown1Items = collectIndexed('dropdown-{n}', (el, i) => ({ index: i, text: el.textContent.trim() }));
    const multiplierElement = $('multiplier');
    const hasRangesOnly = !dropdown1Items.length && !multiplierElement && $('range-1-min');
    const hasPackages = $('package-1');

    if (!dropdown1Items.length && !multiplierElement && !hasRangesOnly && !hasPackages) return;

    // Config
    const config = {
        unit: getAndHide('unit', 'ks'),
        providedUnit: getAndHide('provided_unit', 'ks'),
        description: getAndHide('description'),
        dropdownLabel: getAndHide('dropdown_label', 'Vyberte možnost:'),
        inputLabel: getAndHide('input_label', 'Velikost terasy: '),
        stepValue: parseNum(document.querySelector('input[name="amount"]')?.getAttribute('step'), 1),
        baseMultiplier: multiplierElement ? (hide(multiplierElement), parseNum(multiplierElement.textContent)) : 1
    };

    // Package sizes
    const packageSizes = collectIndexed('package-{n}', (el, i) => {
        const size = parseFloat(el.textContent);
        if (isNaN(size)) return null;
        const coverageEl = $(`package-${i}-coverage`);
        hide(coverageEl);
        return { size, coverage: coverageEl ? parseFloat(coverageEl.textContent) : null };
    }).sort((a, b) => b.size - a.size);

    // Multipliers
    const dropdownMultipliers = Object.fromEntries(
        dropdown1Items.map(({ index }) => {
            const el = $(`multiplier-${index}`);
            if (!el) return [index, 1];
            hide(el);
            return [index, parseNum(el.textContent)];
        }).filter(([, v]) => v !== 1 || $(`multiplier-${v}`))
    );

    // Range multipliers
    const loadRanges = (prefix) => {
        const ranges = [];
        for (let i = 1; ; i++) {
            const [minEl, maxEl, multEl] = [`${prefix}-${i}-min`, `${prefix}-${i}-max`, `multiplier-${prefix.split('-').pop()}-${i}`]
                .map($);
            if (!minEl || !maxEl || !multEl) break;
            ranges.push({
                min: parseNum(minEl.textContent, 0),
                max: parseNum(maxEl.textContent, Infinity),
                multiplier: parseNum(multEl.textContent)
            });
            [minEl, maxEl, multEl].forEach(hide);
        }
        return ranges;
    };

    const rangeMultipliers = dropdown1Items.length
        ? Object.fromEntries(
            dropdown1Items.map(({ index }) => [index, loadRanges(`range-${index}`)])
                .filter(([, ranges]) => ranges.length)
        )
        : (() => {
            const ranges = [];
            for (let i = 1; ; i++) {
                const [minEl, maxEl, multEl] = [`range-${i}-min`, `range-${i}-max`, `multiplier-${i}`].map($);
                if (!minEl || !maxEl || !multEl) break;
                ranges.push({
                    min: parseNum(minEl.textContent, 0),
                    max: parseNum(maxEl.textContent, Infinity),
                    multiplier: parseNum(multEl.textContent)
                });
                [minEl, maxEl, multEl].forEach(hide);
            }
            return ranges.length ? { 0: ranges } : {};
        })();

    // ==================== STYLES ====================
    const STYLES = {
        overlay: 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;justify-content:center;align-items:center;',
        popup: 'position:relative;background:#fff;max-width:600px;width:90%;max-height:90vh;overflow-y:auto;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);',
        closeBtn: 'position:absolute;top:15px;right:15px;background:none;border:none;font-size:24px;cursor:pointer;color:#666;padding:5px 10px;line-height:1;z-index:1;',
        container: 'padding:40px 30px 30px;',
        description: 'margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #e0e0e0;color:#666;font-size:14px;line-height:1.5;',
        dropdownGroup: 'display:flex;flex-direction:column;gap:5px;margin-bottom:15px;',
        label: 'font-weight:600;color:#333;font-size:14px;',
        select: 'padding:10px 12px;font-size:15px;border:1px solid #d0d0d0;border-radius:4px;min-width:200px;',
        inputGroup: 'display:flex;align-items:center;flex-wrap:wrap;gap:10px;',
        input: 'padding:10px 12px;font-size:15px;width:150px;border:1px solid #d0d0d0;border-radius:4px;',
        calcBtn: 'padding:10px 24px;font-size:15px;background-color:#28a745;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;transition:background-color 0.2s;',
        result: 'margin-top:15px;font-size:18px;font-weight:600;color:#333;',
        triggerBtn: 'padding:12px 30px;font-size:16px;background-color:#007bff;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;transition:background-color 0.2s;margin:10px 0;',
        unit: 'font-size:15px;color:#666;font-weight:500;',
        inputLabel: 'font-weight:600;color:#333;font-size:15px;'
    };

    // ==================== CALCULATION ====================
    const getMultiplier = (inputValue, dropdownIndex = null) => {
        if (dropdownIndex !== null) {
            const ranges = rangeMultipliers[dropdownIndex];
            if (ranges) {
                const match = ranges.find(r => inputValue >= r.min && inputValue <= r.max);
                if (match) return match.multiplier;
            }
            return dropdownMultipliers[dropdownIndex] ?? config.baseMultiplier;
        }
        if (rangeMultipliers[0]) {
            const match = rangeMultipliers[0].find(r => inputValue >= r.min && inputValue <= r.max);
            if (match) return match.multiplier;
        }
        return config.baseMultiplier;
    };

    const findOptimalPackages = (amount, hasCoverage) => {
        const packages = new Map();
        const addPackage = (size) => packages.set(size, (packages.get(size) || 0) + 1);
        
        let remaining = amount;
        const sortedAsc = [...packageSizes].reverse();
        
        if (hasCoverage) {
            while (remaining > 0) {
                const smallest = sortedAsc.find(p => p.size >= remaining);
                if (smallest) {
                    addPackage(smallest.size);
                    remaining = 0;
                } else {
                    addPackage(packageSizes[0].size);
                    remaining -= packageSizes[0].size;
                }
            }
        } else {
            for (const pkg of packageSizes) {
                const count = Math.floor(remaining / pkg.size);
                if (count > 0) {
                    packages.set(pkg.size, count);
                    remaining -= pkg.size * count;
                }
            }
            if (remaining > 0) {
                const fit = sortedAsc.find(p => p.size >= remaining) || sortedAsc[0];
                addPackage(fit.size);
            }
        }
        
        const total = [...packages].reduce((sum, [size, count]) => sum + size * count, 0);
        const list = [...packages]
            .sort((a, b) => b[0] - a[0])
            .map(([size, count]) => `${count}× ${size}${config.unit}`)
            .join(' + ');
        
        return { total, list };
    };

    const calculate = (inputValue) => {
        const dropdownIndex = dropdown1Items.length 
            ? parseInt($('dropdown-select').value) 
            : null;
        
        const multiplier = getMultiplier(inputValue, dropdownIndex);
        let result = inputValue * multiplier;
        
        if (packageSizes.length) {
            const hasCoverage = packageSizes.every(p => p.coverage !== null);
            const { total, list } = findOptimalPackages(result, hasCoverage);
            
            return {
                success: true,
                html: hasCoverage
                    ? `<div>Na nátěr potřebujete: <strong>${result.toFixed(2)}${config.unit}</strong></div>
                       <div style="margin-top:8px;font-size:14px;color:#666;">
                       <strong>Doporučená balení:</strong> ${list} = ${total}${config.unit}</div>`
                    : `<div>Potřebujete celkem: <strong>${total}${config.unit}</strong></div>
                       <div style="margin-top:8px;font-size:14px;color:#666;">
                       <strong>Doporučená balení:</strong><br>${list}</div>`
            };
        }
        
        result = Math.ceil(result);
        if (config.stepValue > 1) {
            result = Math.ceil(result / config.stepValue) * config.stepValue;
        }
        
        return { success: true, text: `Výsledek: ${result} ${config.unit}` };
    };

    // ==================== UI BUILDING ====================
    const overlay = el('div', {}, STYLES.overlay);
    const popup = el('div', {}, STYLES.popup);
    const calcContainer = el('div', {}, STYLES.container);
    const resultDisplay = el('div', {}, STYLES.result);
    
    // Close button
    const closeBtn = el('button', { textContent: '✕', type: 'button' }, STYLES.closeBtn);
    
    // Description
    if (config.description) {
        calcContainer.appendChild(el('div', { innerHTML: config.description }, STYLES.description));
    }

    // Dropdown
    if (dropdown1Items.length) {
        const group = el('div', {}, STYLES.dropdownGroup);
        const label = el('label', { textContent: config.dropdownLabel, htmlFor: 'dropdown-select' }, STYLES.label);
        const select = el('select', { id: 'dropdown-select' }, STYLES.select);
        dropdown1Items.forEach(item => 
            select.appendChild(el('option', { value: item.index, textContent: item.text }))
        );
        group.append(label, select);
        calcContainer.appendChild(group);
    }

    // Input group
    const inputGroup = el('div', {}, STYLES.inputGroup);
    const numberInput = el('input', { type: 'number', id: 'calc-input', placeholder: 'Zadejte hodnotu' }, STYLES.input);
    const calcButton = el('button', { textContent: 'Vypočítat', type: 'button' }, STYLES.calcBtn);

    inputGroup.append(
        el('label', { textContent: config.inputLabel, htmlFor: 'calc-input' }, STYLES.inputLabel),
        numberInput,
        el('span', { textContent: config.providedUnit }, STYLES.unit),
        calcButton
    );
    calcContainer.append(inputGroup, resultDisplay);
    popup.append(closeBtn, calcContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Trigger button
    const triggerBtn = el('button', { textContent: 'Kalkulačka', type: 'button' }, STYLES.triggerBtn);
    headerElement.parentNode.insertBefore(triggerBtn, headerElement.nextSibling);

    // ==================== EVENT HANDLERS ====================
    const toggleOverlay = (show) => overlay.style.display = show ? 'flex' : 'none';
    
    const hoverEffect = (el, normalColor, hoverColor) => {
        el.onmouseenter = () => el.style.backgroundColor = hoverColor;
        el.onmouseleave = () => el.style.backgroundColor = normalColor;
    };

    hoverEffect(calcButton, '#28a745', '#218838');
    hoverEffect(triggerBtn, '#007bff', '#0056b3');
    closeBtn.onmouseenter = () => closeBtn.style.color = '#000';
    closeBtn.onmouseleave = () => closeBtn.style.color = '#666';

    calcButton.addEventListener('click', () => {
        const inputValue = parseFloat(numberInput.value);
        
        if (isNaN(inputValue)) {
            resultDisplay.textContent = 'Prosím zadejte platnou hodnotu';
            resultDisplay.style.color = '#dc3545';
            return;
        }
        
        const result = calculate(inputValue);
        resultDisplay.style.color = '#28a745';
        
        if (result.html) {
            resultDisplay.innerHTML = result.html;
        } else {
            resultDisplay.textContent = result.text;
        }
    });

    triggerBtn.addEventListener('click', () => toggleOverlay(true));
    closeBtn.addEventListener('click', () => toggleOverlay(false));
    overlay.addEventListener('click', (e) => e.target === overlay && toggleOverlay(false));
});
