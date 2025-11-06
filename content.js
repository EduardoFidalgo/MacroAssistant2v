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
  
  // Atributos para garantir que fique acima de modais
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  
  // Força estilos inline com !important via cssText
  panel.style.cssText = `
    position: fixed !important;
    z-index: 2147483647 !important;
    pointer-events: auto !important;
    isolation: isolate !important;
    transform: translateZ(0) !important;
  `;
  
  panel.innerHTML = `
    <input type="text" id="macro-search" placeholder="Buscar..." autocomplete="off">
    <div id="macro-list"></div>
  `;
  
  document.body.appendChild(panel);
  macroPanel = panel;
  
  const searchInput = panel.querySelector('#macro-search');
  const macroList = panel.querySelector('#macro-list');
  
  // Handlers normais
  searchInput.addEventListener('input', handleSearch, false);
  searchInput.addEventListener('keydown', handleKeydown, false);
  
  // Log quando o input recebe foco
  searchInput.addEventListener('focus', () => {
    console.log('✅ Campo de busca FOCADO!');
  });
  
  searchInput.addEventListener('blur', () => {
    console.log('⚠️ Campo de busca PERDEU FOCO!');
  });
  
  // Impede que eventos do painel vazem para o Bird (BUBBLE PHASE)
  panel.addEventListener('click', (e) => {
    e.stopPropagation();
  }, false);
  
  panel.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  }, false);
  
  panel.addEventListener('keydown', (e) => {
    e.stopPropagation();
  }, false);
  
  panel.addEventListener('keyup', (e) => {
    e.stopPropagation();
  }, false);
  
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
  console.log('📂 showMacroPanel chamado! Element:', element?.tagName, element?.className);
  currentInput = element;
  
  chrome.storage.sync.get(['macros'], (result) => {
    const macros = result.macros || {};
    if (Object.keys(macros).length === 0) {
      console.log('⚠️ Nenhuma macro encontrada no storage');
      return;
    }
    
    console.log('✅ Macros carregadas:', Object.keys(macros).length);
    filteredMacros = Object.entries(macros);
    selectedIndex = 0;
    
    const panel = createMacroPanel();
    displayMacros();
    
    // Remove e adiciona novamente para garantir que fique por cima
    if (panel.parentElement) {
      panel.parentElement.removeChild(panel);
    }
    document.body.appendChild(panel);
    
    // Força TODOS os estilos críticos inline com !important (mais forte que CSS)
    panel.style.cssText = `
      display: block !important;
      position: fixed !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
      isolation: isolate !important;
      transform: translateZ(0) !important;
      will-change: transform !important;
      width: 420px !important;
      background: #ffffff !important;
      border: 1px solid #e5e5e5 !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08) !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      overflow: hidden !important;
      backdrop-filter: blur(10px) !important;
    `;
    
    positionPanel(element);
    
    // Foca com delay e força o foco múltiplas vezes
    setTimeout(() => {
      const searchInput = panel.querySelector('#macro-search');
      if (searchInput) {
        console.log('🎯 Focando no campo de busca...');
        searchInput.focus();
        
        // Força foco novamente após um momento
        setTimeout(() => {
          searchInput.focus();
          console.log('✅ Campo de busca focado! activeElement:', document.activeElement?.id);
        }, 10);
        
        // E mais uma vez para garantir
        setTimeout(() => {
          searchInput.focus();
        }, 50);
      }
    }, 50);
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
    
      // Handler de clique simples
    item.addEventListener('click', (e) => {
      console.log('🖱️ Click no item:', i, cmd);
      e.stopPropagation(); // Apenas bloqueia propagação, não preventDefault
      selectMacro(i);
    }, false);
    
    // Bloqueia mousedown para não vazar para fora
    item.addEventListener('mousedown', (e) => {
      console.log('🖱️ Mousedown no item:', i);
      e.stopPropagation();
    }, false);
    
    // Hover atualiza seleção
    item.addEventListener('mouseenter', () => {
      selectedIndex = i;
      updateSelection();
    });
    
    list.appendChild(item);
  });
}

// === ATUALIZAR SELEÇÃO ===
function updateSelection() {
  const items = macroPanel.querySelectorAll('.macro-item');
  items.forEach((item, i) => {
    item.className = 'macro-item' + (i === selectedIndex ? ' selected' : '');
  });
  
  // Scroll automático para o item selecionado
  scrollToSelected();
}

// === BUSCAR MACROS ===
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  console.log('🔍 Busca:', query);
  
  chrome.storage.sync.get(['macros'], (result) => {
    const macros = result.macros || {};
    filteredMacros = Object.entries(macros).filter(([cmd, txt]) => 
      cmd.toLowerCase().includes(query) || txt.toLowerCase().includes(query)
    );
    selectedIndex = 0;
    console.log('📊 Resultados filtrados:', filteredMacros.length);
    displayMacros();
  });
}

// === NAVEGAÇÃO COM TECLADO ===
function handleKeydown(e) {
  console.log('🔑 handleKeydown chamado! Tecla:', e.key, 'Target:', e.target.id || e.target.tagName);
  
  // Lista de teclas que devemos tratar
  const handled = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key);
  
  if (!handled) {
    console.log('⚠️ Tecla não tratada:', e.key);
    return;
  }
  
  console.log('✅ Tecla reconhecida:', e.key);
  e.preventDefault(); // Impede comportamento padrão
  e.stopPropagation(); // Impede propagação para fora
  
  switch(e.key) {
    case 'ArrowDown':
      selectedIndex = Math.min(selectedIndex + 1, filteredMacros.length - 1);
      updateSelection();
      console.log('⬇️ Arrow Down - selectedIndex:', selectedIndex, '/', filteredMacros.length);
      break;
    case 'ArrowUp':
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection();
      console.log('⬆️ Arrow Up - selectedIndex:', selectedIndex, '/', filteredMacros.length);
      break;
    case 'Enter':
      console.log('✨ Enter pressed - selecting macro:', selectedIndex);
      e.stopImmediatePropagation(); // Garante que nada mais capture este Enter
      selectMacro(selectedIndex);
      break;
    case 'Escape':
      console.log('🚪 Escape - fechando painel');
      hideMacroPanel();
      // Restaura foco no input original ou busca um válido
      if (currentInput && document.body.contains(currentInput)) {
        currentInput.focus();
      } else {
        const input = document.querySelector('[contenteditable="true"]') || 
                     document.querySelector('textarea') ||
                     document.querySelector('input[type="text"]');
        if (input) input.focus();
      }
      break;
    case 'Tab':
      console.log('⭾ Tab bloqueado');
      break;
  }
}

// === SCROLL PARA ITEM SELECIONADO ===
function scrollToSelected() {
  const list = macroPanel.querySelector('#macro-list');
  const items = macroPanel.querySelectorAll('.macro-item');
  const selectedItem = items[selectedIndex];
  
  if (selectedItem && list) {
    const itemTop = selectedItem.offsetTop;
    const itemBottom = itemTop + selectedItem.offsetHeight;
    const listTop = list.scrollTop;
    const listBottom = listTop + list.clientHeight;
    
    if (itemBottom > listBottom) {
      list.scrollTop = itemBottom - list.clientHeight;
    } else if (itemTop < listTop) {
      list.scrollTop = itemTop;
    }
  }
}

// ===============================
// DIGITAÇÃO ULTRA-REALISTA
// ===============================
// Simula perfeitamente uma pessoa real digitando
// Engana Slate, Quill, React, BIRD Chat com eventos de teclado completos
// ===============================

/**
 * Gera keyCode realista para cada caractere
 */
function getKeyCode(char) {
  const code = char.charCodeAt(0);
  if (char >= 'a' && char <= 'z') return char.toUpperCase().charCodeAt(0);
  if (char >= 'A' && char <= 'Z') return code;
  if (char >= '0' && char <= '9') return code;
  
  const specialKeys = {
    ' ': 32, '\n': 13, '\t': 9, '.': 190, ',': 188, ';': 186,
    ':': 186, '!': 49, '?': 191, '-': 189, '_': 189, '=': 187,
    '+': 187, '[': 219, ']': 221, '{': 219, '}': 221, '\\': 220,
    '|': 220, '/': 191, '<': 188, '>': 190, '(': 57, ')': 48,
    "'": 222, '"': 222, '`': 192, '~': 192, '@': 50, '#': 51,
    '$': 52, '%': 53, '^': 54, '&': 55, '*': 56
  };
  
  return specialKeys[char] || code;
}

/**
 * Verifica se caractere precisa de Shift
 */
function needsShift(char) {
  return /[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(char);
}

/**
 * Calcula delay realista entre teclas com variação humana avançada
 */
function getHumanDelay(baseDelay, char, prevChar, isTypingFast) {
  // Distribução gaussiana melhorada (4 valores para maior naturalidade)
  const randomFactor = (Math.random() + Math.random() + Math.random() + Math.random()) / 4;
  
  // Variação base mais ampla
  let delay = baseDelay + (baseDelay * randomFactor * 0.8);
  
  // Delays extras realistas baseados no caractere
  if (char === ' ') delay *= 1.2; // Espaços levemente mais lentos
  if (char === '.' || char === ',' || char === '!' || char === '?') delay *= 1.4; // Pontuação mais lenta
  if (char === '\n') delay *= 1.8; // Quebra de linha mais pensada
  if (char === char.toUpperCase() && /[A-Z]/.test(char) && prevChar === ' ') delay *= 1.3; // Início de frase
  
  // Padrão de digitação rápida/lenta (fadiga humana)
  if (isTypingFast) {
    delay *= 0.7; // 30% mais rápido
  } else {
    delay *= 1.15; // 15% mais lento
  }
  
  // Variação extra aleatória final
  delay += (Math.random() - 0.5) * 15;
  
  return Math.max(15, Math.floor(delay)); // Mínimo 15ms
}

/**
 * Simula "pensar" durante a digitação (pausa natural)
 */
async function thinkPause() {
  const pauseDuration = 80 + Math.random() * 180; // 80-260ms
  await new Promise(r => setTimeout(r, pauseDuration));
}

/**
 * Inserção instantânea via PASTE
 * Simula Ctrl+V para inserir todo o texto de uma vez
 */
async function typeTextHuman(element, text) {
  if (!element || !text) return;

  element.focus();
  await new Promise(r => setTimeout(r, 50));

  const isEditable = element.isContentEditable;
  const selection = window.getSelection();

  // Posiciona cursor no final
  if (isEditable && selection) {
    if (!selection.rangeCount) {
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } else if (element.setSelectionRange) {
    const len = element.value?.length || 0;
    element.setSelectionRange(len, len);
  }

  // Cria DataTransfer com o texto
  const dataTransfer = new DataTransfer();
  dataTransfer.setData('text/plain', text);
  dataTransfer.setData('text/html', text.replace(/\n/g, '<br>'));

  // Dispara evento de PASTE
  const pasteEvent = new ClipboardEvent('paste', {
    bubbles: true,
    cancelable: true,
    composed: true,
    clipboardData: dataTransfer
  });

  element.dispatchEvent(pasteEvent);

  // Aguarda processamento
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => setTimeout(r, 100));
  
  console.log('✓ Texto colado instantaneamente');
}

// ===============================
// Inserção segura de um caractere
// ===============================
function insertChar(element, char, attempt = 0) {
  const MAX_ATTEMPTS = 3; // Limite de tentativas para evitar recursão infinita
  const before = element.isContentEditable ? element.innerText : element.value;

  const beforeInput = new InputEvent("beforeinput", {
    inputType: "insertText",
    data: char,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(beforeInput);

  if (beforeInput.defaultPrevented) return;

  if (element.isContentEditable) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(char);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    element.value =
      element.value.substring(0, start) + char + element.value.substring(end);
    element.selectionStart = element.selectionEnd = start + 1;
  }

  element.dispatchEvent(
    new InputEvent("input", {
      inputType: "insertText",
      data: char,
      bubbles: true,
    })
  );

  // Garantia: reenvia se o texto não mudou (com limite de tentativas)
  const after = element.isContentEditable ? element.innerText : element.value;
  if (after === before && attempt < MAX_ATTEMPTS) {
    console.warn(`Reenvio de caractere (tentativa ${attempt + 1}/${MAX_ATTEMPTS}):`, char);
    element.focus();
    insertChar(element, char, attempt + 1);
  } else if (after === before && attempt >= MAX_ATTEMPTS) {
    console.error("Falha ao inserir caractere após múltiplas tentativas:", char);
  }
}

// === SELECIONAR MACRO ===
async function selectMacro(index) {
  console.log('🎯 selectMacro chamado! Index:', index, 'Total:', filteredMacros.length);
  
  if (index < 0 || index >= filteredMacros.length) {
    console.log('❌ Índice inválido');
    return;
  }
  
  const [cmd, text] = filteredMacros[index];
  console.log('📝 Selecionando macro:', cmd, 'Texto:', text.substring(0, 30) + '...');
  
  // SEMPRE usa currentInput guardado (nunca busca dinamicamente)
  let targetInput = currentInput;
  
  if (!targetInput || !document.body.contains(targetInput)) {
    console.log('❌ ERRO: currentInput foi perdido! Element:', currentInput?.tagName);
    console.log('🔍 Tentando recuperar o input original...');
    
    // Busca pelo DIV do Bird com classe slate-editor (visto nos logs)
    const possibleInputs = [
      document.querySelector('.slate-editor[contenteditable="true"]'),
      document.querySelector('[contenteditable="true"].slate-editor'),
      document.querySelector('[contenteditable="true"]'),
      document.querySelector('div[role="textbox"]')
    ];
    
    targetInput = possibleInputs.find(el => el !== null);
    console.log('🔍 Input recuperado:', targetInput?.tagName, targetInput?.classList?.value);
  } else {
    console.log('✅ Usando currentInput original:', targetInput?.tagName, targetInput?.classList?.value);
  }
  
  if (targetInput && document.body.contains(targetInput)) {
    console.log('✅ Input válido encontrado! Focando e inserindo texto...');
    
    // Fecha o painel DEPOIS de ter certeza que temos o input
    hideMacroPanel();
    
    // Aguarda um pouco mais antes de focar
    await new Promise(r => setTimeout(r, 150));
    
    targetInput.focus();
    console.log('🎯 Foco estabelecido em:', document.activeElement?.tagName);
    
    // Aguarda mais um momento
    await new Promise(r => setTimeout(r, 100));
    
    await typeTextHuman(targetInput, text);
    console.log('✅ Texto inserido com sucesso!');
  } else {
    console.log('❌ Nenhum input válido encontrado');
    hideMacroPanel();
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

// Listener de cliques - fecha painel ao clicar fora (mas NÃO bloqueia o clique)
document.addEventListener('mousedown', (e) => {
  if (macroPanel && macroPanel.style.display !== 'none') {
    if (!macroPanel.contains(e.target)) {
      console.log('👆 Clique fora do painel - fechando');
      hideMacroPanel();
    }
  }
  // NÃO bloqueia propagação aqui - só fecha o painel
}, false); // BUBBLE PHASE para não interferir com outros handlers

// Listener de ESC global
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && macroPanel && macroPanel.style.display !== 'none') {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    hideMacroPanel();
    if (currentInput) currentInput.focus();
  }
}, true);

document.addEventListener('mousedown', (e) => {
  if (macroPanel && macroPanel.style.display !== 'none') {
    if (macroPanel.contains(e.target)) {
      console.log('🛡️ Bloqueando mousedown para Bird');
    }
  }
}, false);

document.addEventListener('mouseup', (e) => {
  if (macroPanel && macroPanel.style.display !== 'none') {
    if (macroPanel.contains(e.target)) {
      console.log('🛡️ Bloqueando mouseup para Bird');
    }
  }
}, false);

// Para teclado, bloqueia em BUBBLE depois do handler processar
document.addEventListener('keydown', (e) => {
  if (macroPanel && macroPanel.style.display !== 'none') {
    if (macroPanel.contains(e.target)) {
      console.log('🛡️ Bloqueando keydown para Bird:', e.key);
    }
  }
}, false);

document.addEventListener('keyup', (e) => {
  if (macroPanel && macroPanel.style.display !== 'none') {
    if (macroPanel.contains(e.target)) {
      console.log('🛡️ Bloqueando keyup para Bird');
    }
  }
}, false);
