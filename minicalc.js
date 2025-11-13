document.addEventListener('DOMContentLoaded', () => {
    // Find the short description paragraph to check if we're on the minicalc page
    const headerElement = document.querySelector('.p-short-description p');
    
    // Make sure we're on the right page before running the rest of the script
    if (headerElement && headerElement.className.trim().includes('minicalc')) {
        // Get the multiplier value from the p element with id "multiplier"
        const multiplierElement = document.getElementById('multiplier');
        
        // Collect dropdown 1 items
        const dropdown1Items = [];
        let i = 1;
        while (true) {
            const dropdownItem = document.getElementById(`dropdown-${i}`);
            if (!dropdownItem) break;
            dropdown1Items.push({ index: i, text: dropdownItem.textContent.trim() });
            dropdownItem.classList.add('hidden');
            i++;
        }
        
        // Check if we have multiplier element or dropdown items
        if (!multiplierElement && dropdown1Items.length === 0) {
            console.error("Couldn't find the multiplier element or dropdown items!");
            return;
        }
        
        const multiplier = multiplierElement ? (parseFloat(multiplierElement.textContent) || 1) : 1;
        
        // Get the unit from the p element with id "unit" (result unit)
        const unitElement = document.getElementById('unit');
        const unit = unitElement ? unitElement.textContent.trim() : 'ks';
        
        // Get the provided unit from the p element with id "provided_unit" (input unit)
        const providedUnitElement = document.getElementById('provided_unit');
        const providedUnit = providedUnitElement ? providedUnitElement.textContent.trim() : 'ks';
        
        // Get the description from the p element with id "description" (optional)
        const descriptionElement = document.getElementById('description');
        const description = descriptionElement ? descriptionElement.innerHTML : '';
        
        // Collect dropdown 2 items
        const dropdown2Items = [];
        let j = 1;
        while (true) {
            const dropdownItem = document.getElementById(`dropdown2-${j}`);
            if (!dropdownItem) break;
            dropdown2Items.push({ index: j, text: dropdownItem.textContent.trim() });
            dropdownItem.classList.add('hidden');
            j++;
        }
        
        // Collect all multipliers in format multiplier-n-n2
        const multiplierMap = {};
        const singleMultiplierMap = {};
        
        if (dropdown1Items.length > 0 && dropdown2Items.length > 0) {
            dropdown1Items.forEach(item1 => {
                dropdown2Items.forEach(item2 => {
                    const multElement = document.getElementById(`multiplier-${item1.index}-${item2.index}`);
                    if (multElement) {
                        multiplierMap[`${item1.index}-${item2.index}`] = parseFloat(multElement.textContent) || 1;
                        multElement.classList.add('hidden');
                    }
                });
            });
        } else if (dropdown1Items.length > 0) {
            // Single dropdown - collect multiplier-n
            dropdown1Items.forEach(item => {
                const multElement = document.getElementById(`multiplier-${item.index}`);
                if (multElement) {
                    singleMultiplierMap[item.index] = parseFloat(multElement.textContent) || 1;
                    multElement.classList.add('hidden');
                }
            });
        }
        
        // Hide all the used p elements by adding a hidden class
        if (multiplierElement) multiplierElement.classList.add('hidden');
        if (unitElement) unitElement.classList.add('hidden');
        if (providedUnitElement) providedUnitElement.classList.add('hidden');
        if (descriptionElement) descriptionElement.classList.add('hidden');
        
        // Create a container for the calculator
        const calcContainer = document.createElement('div');
        calcContainer.className = 'minicalc-container';
        calcContainer.style.cssText = 'margin: 20px 0; padding: 20px; background-color: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
        
        // Create description if available
        if (description) {
            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'minicalc-description';
            descriptionDiv.innerHTML = description;
            descriptionDiv.style.cssText = 'margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0; color: #666; font-size: 14px; line-height: 1.5;';
            calcContainer.appendChild(descriptionDiv);
        }
        
        // Create dropdowns container if dropdowns exist
        if (dropdown1Items.length > 0 || dropdown2Items.length > 0) {
            const dropdownsContainer = document.createElement('div');
            dropdownsContainer.style.cssText = 'display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap;';
            
            // Create first dropdown if items exist
            if (dropdown1Items.length > 0) {
                const dropdown1Group = document.createElement('div');
                dropdown1Group.style.cssText = 'display: flex; flex-direction: column; gap: 5px;';
                
                const dropdown1Label = document.createElement('label');
                dropdown1Label.textContent = 'Vyberte možnost 1:';
                dropdown1Label.htmlFor = 'dropdown-1';
                dropdown1Label.style.cssText = 'font-weight: 600; color: #333; font-size: 14px;';
                
                const dropdown1 = document.createElement('select');
                dropdown1.id = 'dropdown-1';
                dropdown1.style.cssText = 'padding: 10px 12px; font-size: 15px; border: 1px solid #d0d0d0; border-radius: 4px; font-family: inherit; min-width: 200px;';
                
                dropdown1Items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.index;
                    option.textContent = item.text;
                    dropdown1.appendChild(option);
                });
                
                dropdown1Group.appendChild(dropdown1Label);
                dropdown1Group.appendChild(dropdown1);
                dropdownsContainer.appendChild(dropdown1Group);
            }
            
            // Create second dropdown if items exist
            if (dropdown2Items.length > 0) {
                const dropdown2Group = document.createElement('div');
                dropdown2Group.style.cssText = 'display: flex; flex-direction: column; gap: 5px;';
                
                const dropdown2Label = document.createElement('label');
                dropdown2Label.textContent = 'Vyberte možnost 2:';
                dropdown2Label.htmlFor = 'dropdown-2';
                dropdown2Label.style.cssText = 'font-weight: 600; color: #333; font-size: 14px;';
                
                const dropdown2 = document.createElement('select');
                dropdown2.id = 'dropdown-2';
                dropdown2.style.cssText = 'padding: 10px 12px; font-size: 15px; border: 1px solid #d0d0d0; border-radius: 4px; font-family: inherit; min-width: 200px;';
                
                dropdown2Items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.index;
                    option.textContent = item.text;
                    dropdown2.appendChild(option);
                });
                
                dropdown2Group.appendChild(dropdown2Label);
                dropdown2Group.appendChild(dropdown2);
                dropdownsContainer.appendChild(dropdown2Group);
            }
            
            calcContainer.appendChild(dropdownsContainer);
        }
        
        // Create input group container
        const inputGroup = document.createElement('div');
        inputGroup.style.cssText = 'display: flex; align-items: center; flex-wrap: wrap; gap: 10px;';
        
        // Create label
        const label = document.createElement('label');
        label.textContent = 'Množství: ';
        label.htmlFor = 'calc-input';
        label.style.cssText = 'font-weight: 600; color: #333; font-size: 15px;';
        
        // Create the number input
        const numberInput = document.createElement('input');
        numberInput.type = 'number';
        numberInput.id = 'calc-input';
        numberInput.placeholder = 'Zadejte hodnotu';
        numberInput.style.cssText = 'padding: 10px 12px; font-size: 15px; width: 150px; border: 1px solid #d0d0d0; border-radius: 4px; font-family: inherit;';
        
        // Create unit label next to input
        const unitLabel = document.createElement('span');
        unitLabel.textContent = providedUnit;
        unitLabel.style.cssText = 'font-size: 15px; color: #666; font-weight: 500;';
        
        // Create calculate button
        const calcButton = document.createElement('button');
        calcButton.textContent = 'Vypočítat';
        calcButton.className = 'minicalc-button';
        calcButton.style.cssText = 'padding: 10px 24px; font-size: 15px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; transition: background-color 0.2s;';
        
        // Add hover effect for button
        calcButton.addEventListener('mouseenter', () => {
            calcButton.style.backgroundColor = '#218838';
        });
        calcButton.addEventListener('mouseleave', () => {
            calcButton.style.backgroundColor = '#28a745';
        });
        
        // Create result display
        const resultDisplay = document.createElement('div');
        resultDisplay.id = 'calc-result';
        resultDisplay.style.cssText = 'margin-top: 15px; font-size: 18px; font-weight: 600; color: #333;';
        
        // Add event listener to calculate on button click
        calcButton.addEventListener('click', (e) => {
            e.preventDefault();
            const inputValue = parseFloat(numberInput.value);
            
            if (!isNaN(inputValue)) {
                let finalMultiplier = multiplier;
                
                // If both dropdowns exist, get the multiplier from the map
                if (dropdown1Items.length > 0 && dropdown2Items.length > 0) {
                    const dropdown1 = document.getElementById('dropdown-1');
                    const dropdown2 = document.getElementById('dropdown-2');
                    const key = `${dropdown1.value}-${dropdown2.value}`;
                    finalMultiplier = multiplierMap[key] || 1;
                } else if (dropdown1Items.length > 0) {
                    // Single dropdown - use multiplier-n
                    const dropdown1 = document.getElementById('dropdown-1');
                    finalMultiplier = singleMultiplierMap[dropdown1.value] || multiplier;
                }
                
                const result = inputValue * finalMultiplier;
                resultDisplay.textContent = `Výsledek: ${result.toFixed(2)} ${unit}`;
                resultDisplay.style.color = '#28a745';
            } else {
                resultDisplay.textContent = 'Prosím zadejte platnou hodnotu';
                resultDisplay.style.color = '#dc3545';
            }
        });
        
        // Assemble the input group
        inputGroup.appendChild(label);
        inputGroup.appendChild(numberInput);
        inputGroup.appendChild(unitLabel);
        inputGroup.appendChild(calcButton);
        
        // Assemble the calculator
        calcContainer.appendChild(inputGroup);
        calcContainer.appendChild(resultDisplay);
        
        // Insert the calculator into the page (after the header element)
        headerElement.parentNode.insertBefore(calcContainer, headerElement.nextSibling);
    }
});
