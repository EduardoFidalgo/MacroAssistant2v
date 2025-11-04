// === VARIÁVEIS GLOBAIS ===
let currentInput = null;
let macroPanel = null;
let selectedIndex = 0;
let filteredMacros = [];

// === CRIAR PAINEL ===
function createMacroPanel() {
  if (macroPanel && document.body.contains(macroPanel)) return macroPanel;
  
  const panel = document.createElement('div');
  panel.id = 'macro-paste-panel';
  panel.innerHTML = `
    <input type="text" id="macro-search" placeholder="Buscar..." autocomplete="off">
    <div id="macro-list"></div>
  `;
  
  document.body.appendChild(panel);
  macroPanel = panel;
  
  panel.querySelector('#macro-search').addEventListener('input', handleSearch);
  panel.querySelector('#macro-search').addEventListener('keydown', handleKeydown);
  
  return panel;
}

// === POSICIONAR PAINEL ===
function positionPanel(element) {
  const rect = element.getBoundingClientRect();
  const panelHeight = 350; // Altura aproximada do painel (300px lista + 50px busca)
  const screenHeight = window.innerHeight;
  const screenMiddle = screenHeight / 2;
  
  // Se o input está na metade inferior da tela, abrir ACIMA
  if (rect.top > screenMiddle) {
    macroPanel.style.top = (rect.top - panelHeight - 5) + 'px';
    macroPanel.style.bottom = 'auto';
  } 
  // Se está na metade superior, abrir ABAIXO
  else {
    macroPanel.style.top = (rect.bottom + 5) + 'px';
    macroPanel.style.bottom = 'auto';
  }
  
  // Posição horizontal
  macroPanel.style.left = rect.left + 'px';
  
  // Ajustar se sair da tela horizontalmente
  setTimeout(() => {
    const panelRect = macroPanel.getBoundingClientRect();
    if (panelRect.right > window.innerWidth) {
      macroPanel.style.left = (window.innerWidth - panelRect.width - 10) + 'px';
    }
    if (panelRect.left < 0) {
      macroPanel.style.left = '10px';
    }
  }, 0);
}

// === MOSTRAR PAINEL ===
function showMacroPanel(element) {
  currentInput = element;
  
  chrome.storage.sync.get(['macros'], (result) => {
    const macros = result.macros || {};
    if (Object.keys(macros).length === 0) return;
    
    filteredMacros = Object.entries(macros);
    selectedIndex = 0;
    
    const panel = createMacroPanel();
    displayMacros();
    
    panel.style.display = 'block';
    positionPanel(element);
    
    setTimeout(() => panel.querySelector('#macro-search').focus(), 10);
  });
}

// === ESCONDER PAINEL ===
function hideMacroPanel() {
  if (macroPanel) macroPanel.style.display = 'none';
}

// === EXIBIR MACROS ===
function displayMacros() {
  const list = macroPanel.querySelector('#macro-list');
  list.innerHTML = '';
  
  if (filteredMacros.length === 0) {
    list.innerHTML = '<div class="empty">Nenhuma macro encontrada</div>';
    return;
  }
  
  filteredMacros.forEach(([cmd, txt], i) => {
    const item = document.createElement('div');
    item.className = 'macro-item' + (i === selectedIndex ? ' selected' : '');
    item.innerHTML = `<span class="cmd"><span class="icon">›</span>${cmd}</span><span class="txt">${txt.substring(0, 50)}</span>`;
    item.onclick = () => selectMacro(i);
    list.appendChild(item);
  });
}

// === ATUALIZAR SELEÇÃO ===
function updateSelection() {
  macroPanel.querySelectorAll('.macro-item').forEach((item, i) => {
    item.className = 'macro-item' + (i === selectedIndex ? ' selected' : '');
  });
}

// === BUSCAR MACROS ===
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  
  chrome.storage.sync.get(['macros'], (result) => {
    const macros = result.macros || {};
    filteredMacros = Object.entries(macros).filter(([cmd, txt]) => 
      cmd.toLowerCase().includes(query) || txt.toLowerCase().includes(query)
    );
    selectedIndex = 0;
    displayMacros();
  });
}

// === NAVEGAÇÃO COM TECLADO ===
function handleKeydown(e) {
  switch(e.key) {
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredMacros.length - 1);
      updateSelection();
      break;
    case 'ArrowUp':
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection();
      break;
    case 'Enter':
      e.preventDefault();
      selectMacro(selectedIndex);
      break;
    case 'Escape':
      e.preventDefault();
      hideMacroPanel();
      break;
  }
}

// === DIGITAÇÃO HUMANA ===
async function typeText(element, text, delay = 20) {
  if (!element || !text) return;
  
  element.focus();
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Aguardar o delay ANTES de cada caractere (exceto o primeiro)
    if (i > 0) {
      await new Promise(r => setTimeout(r, delay));
    }
    
    const beforeInput = new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: char,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(beforeInput);
    
    if (!beforeInput.defaultPrevented) {
      if (element.isContentEditable) {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents(); // Limpar seleção se houver
          const node = document.createTextNode(char);
          range.insertNode(node);
          range.setStartAfter(node);
          range.setEndAfter(node);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        const start = element.selectionStart || 0;
        const end = element.selectionEnd || 0;
        const currentValue = element.value || '';
        element.value = currentValue.substring(0, start) + char + currentValue.substring(end);
        element.selectionStart = element.selectionEnd = start + 1;
      }
      
      element.dispatchEvent(new InputEvent('input', {
        inputType: 'insertText',
        data: char,
        bubbles: true
      }));
    }
  }
}

// === SELECIONAR MACRO ===
async function selectMacro(index) {
  if (index < 0 || index >= filteredMacros.length) return;
  
  const text = filteredMacros[index][1];
  hideMacroPanel();
  
  if (currentInput && document.body.contains(currentInput)) {
    currentInput.focus();
    requestAnimationFrame(() => {
      setTimeout(() => typeText(currentInput, text, 20), 50);
    });
  }
}

// === BLOQUEAR TECLA ">" ===
function blockGreaterThan(e) {
  const t = e.target;
  if ((e.key === '>' || (e.keyCode === 190 && e.shiftKey)) &&
      (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!macroPanel || macroPanel.style.display !== 'block') {
      setTimeout(() => showMacroPanel(t), 10);
    }
  }
}

// === LISTENERS GLOBAIS ===
document.addEventListener('keydown', blockGreaterThan, true);
document.addEventListener('keypress', blockGreaterThan, true);
document.addEventListener('click', (e) => {
  if (macroPanel && macroPanel.style.display === 'block' && !macroPanel.contains(e.target)) {
    hideMacroPanel();
  }
}, true);
