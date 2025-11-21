document.addEventListener('DOMContentLoaded', () => {
    const headerElement = document.querySelector('p.minicalc');
    if (!headerElement) return;

    const collectItems = (pattern, isHidden = true) => {
        const items = [];
        let i = 1;
        while (true) {
            const el = document.getElementById(pattern.replace('{n}', i));
            if (!el) break;
            items.push({ index: i, text: el.textContent.trim() });
            if (isHidden) el.classList.add('hidden');
            i++;
        }
        return items;
    };

    const getAndHide = (id, defaultVal = '') => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            return el.innerHTML || el.textContent.trim();
        }
        return defaultVal;
    };

    const dropdown1Items = collectItems('dropdown-{n}');
    const multiplierElement = document.getElementById('multiplier');
    
    // Zkontrolovat zda existují ranges (bez dropdown)
    const hasRangesOnly = !dropdown1Items.length && !multiplierElement && document.getElementById('range-1-min');
    
    // Musí existovat alespoň dropdown, ranges nebo samostatný multiplier
    if (dropdown1Items.length === 0 && !multiplierElement && !hasRangesOnly) return;

    const unit = getAndHide('unit', 'ks');
    const providedUnit = getAndHide('provided_unit', 'ks');
    const description = getAndHide('description');
    const dropdownLabel = getAndHide('dropdown_label', 'Vyberte možnost:');

    // Najít amount input a získat step hodnotu
    const amountInput = document.querySelector('input[name="amount"]');
    const stepValue = amountInput ? parseFloat(amountInput.getAttribute('step')) || 1 : 1;

    // Načtení samostatného multiplieru (pro případ bez dropdown/ranges)
    let baseMultiplier = 1;
    if (multiplierElement) {
        baseMultiplier = parseFloat(multiplierElement.textContent) || 1;
        multiplierElement.classList.add('hidden');
    }

    // Načtení dropdown multiplierů (bez ranges)
    const dropdownMultipliers = {};
    dropdown1Items.forEach(dropdownItem => {
        const multEl = document.getElementById(`multiplier-${dropdownItem.index}`);
        if (multEl) {
            dropdownMultipliers[dropdownItem.index] = parseFloat(multEl.textContent) || 1;
            multEl.classList.add('hidden');
        }
    });

    // Načtení range multiplierů (s nebo bez dropdown)
    const rangeMultipliers = {};
    if (dropdown1Items.length > 0) {
        dropdown1Items.forEach(dropdownItem => {
            const ranges = [];
            let rangeIndex = 1;
            while (true) {
                const minEl = document.getElementById(`range-${dropdownItem.index}-${rangeIndex}-min`);
                const maxEl = document.getElementById(`range-${dropdownItem.index}-${rangeIndex}-max`);
                const multEl = document.getElementById(`multiplier-${dropdownItem.index}-${rangeIndex}`);
                if (!minEl || !maxEl || !multEl) break;
                ranges.push({
                    min: parseFloat(minEl.textContent) || 0,
                    max: parseFloat(maxEl.textContent) || Infinity,
                    multiplier: parseFloat(multEl.textContent) || 1
                });
                [minEl, maxEl, multEl].forEach(el => el.classList.add('hidden'));
                rangeIndex++;
            }
            if (ranges.length > 0) rangeMultipliers[dropdownItem.index] = ranges;
        });
    } else {
        // Ranges bez dropdown (range-1-min, range-1-max, multiplier-1)
        const ranges = [];
        let rangeIndex = 1;
        while (true) {
            const minEl = document.getElementById(`range-${rangeIndex}-min`);
            const maxEl = document.getElementById(`range-${rangeIndex}-max`);
            const multEl = document.getElementById(`multiplier-${rangeIndex}`);
            if (!minEl || !maxEl || !multEl) break;
            ranges.push({
                min: parseFloat(minEl.textContent) || 0,
                max: parseFloat(maxEl.textContent) || Infinity,
                multiplier: parseFloat(multEl.textContent) || 1
            });
            [minEl, maxEl, multEl].forEach(el => el.classList.add('hidden'));
            rangeIndex++;
        }
        if (ranges.length > 0) rangeMultipliers[0] = ranges;
    }

    const el = (tag, props = {}, styles = '') => {
        const e = document.createElement(tag);
        Object.entries(props).forEach(([k, v]) => e[k] = v);
        if (styles) e.style.cssText = styles;
        return e;
    };

    const overlay = el('div', {}, 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;justify-content:center;align-items:center;');
    const popup = el('div', {}, 'position:relative;background:#fff;max-width:600px;width:90%;max-height:90vh;overflow-y:auto;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);');
    const closeBtn = el('button', { textContent: '✕' }, 'position:absolute;top:15px;right:15px;background:none;border:none;font-size:24px;cursor:pointer;color:#666;padding:5px 10px;line-height:1;z-index:1;');
    closeBtn.onmouseenter = () => closeBtn.style.color = '#000';
    closeBtn.onmouseleave = () => closeBtn.style.color = '#666';

    const calcContainer = el('div', {}, 'padding:40px 30px 30px;');
    if (description) calcContainer.appendChild(el('div', { innerHTML: description }, 'margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid #e0e0e0;color:#666;font-size:14px;line-height:1.5;'));

    if (dropdown1Items.length > 0) {
        const dropdownGroup = el('div', {}, 'display:flex;flex-direction:column;gap:5px;margin-bottom:15px;');
        const label = el('label', { textContent: dropdownLabel, htmlFor: 'dropdown-select' }, 'font-weight:600;color:#333;font-size:14px;');
        const select = el('select', { id: 'dropdown-select' }, 'padding:10px 12px;font-size:15px;border:1px solid #d0d0d0;border-radius:4px;min-width:200px;');
        dropdown1Items.forEach(item => select.appendChild(el('option', { value: item.index, textContent: item.text })));
        dropdownGroup.append(label, select);
        calcContainer.appendChild(dropdownGroup);
    }

    const inputGroup = el('div', {}, 'display:flex;align-items:center;flex-wrap:wrap;gap:10px;');
    const numberInput = el('input', { type: 'number', id: 'calc-input', placeholder: 'Zadejte hodnotu' }, 'padding:10px 12px;font-size:15px;width:150px;border:1px solid #d0d0d0;border-radius:4px;');
    const calcButton = el('button', { textContent: 'Vypočítat' }, 'padding:10px 24px;font-size:15px;background-color:#28a745;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;transition:background-color 0.2s;');
    calcButton.onmouseenter = () => calcButton.style.backgroundColor = '#218838';
    calcButton.onmouseleave = () => calcButton.style.backgroundColor = '#28a745';

    const resultDisplay = el('div', {}, 'margin-top:15px;font-size:18px;font-weight:600;color:#333;');

    calcButton.addEventListener('click', (e) => {
        e.preventDefault();
        const inputValue = parseFloat(numberInput.value);
        if (!isNaN(inputValue)) {
            let finalMultiplier = baseMultiplier;
            
            if (dropdown1Items.length > 0) {
                const selectedDropdown = parseInt(document.getElementById('dropdown-select').value);
                
                // Zkusit najít range multiplier
                const ranges = rangeMultipliers[selectedDropdown];
                if (ranges) {
                    const matchingRange = ranges.find(r => inputValue >= r.min && inputValue <= r.max);
                    if (matchingRange) {
                        finalMultiplier = matchingRange.multiplier;
                    }
                } else if (dropdownMultipliers[selectedDropdown]) {
                    // Použít dropdown multiplier (bez ranges)
                    finalMultiplier = dropdownMultipliers[selectedDropdown];
                }
            } else if (rangeMultipliers[0]) {
                // Ranges bez dropdown
                const matchingRange = rangeMultipliers[0].find(r => inputValue >= r.min && inputValue <= r.max);
                if (matchingRange) {
                    finalMultiplier = matchingRange.multiplier;
                }
            }
            
            // Vypočítat výsledek a zaokrouhlit na step
            let result = Math.ceil(inputValue * finalMultiplier);
            
            // Zaokrouhlit na nejbližší vyšší násobek step hodnoty
            if (stepValue > 1) {
                result = Math.ceil(result / stepValue) * stepValue;
            }
            
            resultDisplay.textContent = `Na terasu potřebujete přiližně: ${result} ${unit}`;
            resultDisplay.style.color = '#28a745';
        } else {
            resultDisplay.textContent = 'Prosím zadejte platnou hodnotu';
            resultDisplay.style.color = '#dc3545';
        }
    });

    inputGroup.append(
        el('label', { textContent: 'Velikost terasy: ', htmlFor: 'calc-input' }, 'font-weight:600;color:#333;font-size:15px;'),
        numberInput,
        el('span', { textContent: providedUnit }, 'font-size:15px;color:#666;font-weight:500;'),
        calcButton
    );
    calcContainer.append(inputGroup, resultDisplay);
    popup.append(closeBtn, calcContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    const triggerBtn = el('button', { textContent: 'Kalkulačka', type: 'button' }, 'padding:12px 30px;font-size:16px;background-color:#007bff;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;transition:background-color 0.2s;margin:10px 0;');
    triggerBtn.onmouseenter = () => triggerBtn.style.backgroundColor = '#0056b3';
    triggerBtn.onmouseleave = () => triggerBtn.style.backgroundColor = '#007bff';
    triggerBtn.addEventListener('click', () => overlay.style.display = 'flex');
    closeBtn.addEventListener('click', () => overlay.style.display = 'none');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });
    headerElement.parentNode.insertBefore(triggerBtn, headerElement.nextSibling);
});
