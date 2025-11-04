// === ELEMENTOS ===
const commandInput = document.getElementById('command');
const textInput = document.getElementById('text');
const addButton = document.getElementById('addMacro');
const macroList = document.getElementById('macroList');

// === CARREGAR MACROS ===
function loadMacros() {
  chrome.storage.sync.get(['macros'], (result) => {
    const macros = result.macros || {};
    macroList.innerHTML = '';
    
    if (Object.keys(macros).length === 0) {
      macroList.innerHTML = '<div style="text-align:center;padding:20px;color:#999;font-size:12px;">Nenhuma macro cadastrada</div>';
      return;
    }
    
    Object.entries(macros).forEach(([cmd, txt]) => {
      const item = document.createElement('div');
      item.className = 'macro';
      item.innerHTML = `
        <div class="macro-info">
          <div class="macro-cmd"><span class="macro-icon">›</span>${cmd}</div>
          <div class="macro-txt">${txt}</div>
        </div>
        <button class="delete" data-cmd="${cmd}">Remover</button>
      `;
      macroList.appendChild(item);
    });
    
    document.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cmd = e.target.getAttribute('data-cmd');
        deleteMacro(cmd);
      });
    });
  });
}

// === ADICIONAR MACRO ===
function addMacro() {
  const cmd = commandInput.value.trim();
  const txt = textInput.value.trim();
  
  if (!cmd || !txt) {
    alert('Preencha comando e texto!');
    return;
  }
  
  chrome.storage.sync.get(['macros'], (result) => {
    const macros = result.macros || {};
    macros[cmd] = txt;
    
    chrome.storage.sync.set({ macros }, () => {
      commandInput.value = '';
      textInput.value = '';
      loadMacros();
      commandInput.focus();
    });
  });
}

// === DELETAR MACRO ===
function deleteMacro(cmd) {
  chrome.storage.sync.get(['macros'], (result) => {
    const macros = result.macros || {};
    delete macros[cmd];
    chrome.storage.sync.set({ macros }, loadMacros);
  });
}

// === EVENTOS ===
addButton.addEventListener('click', addMacro);
commandInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') textInput.focus();
});
textInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) addMacro();
});

// === INICIALIZAR ===
loadMacros();
commandInput.focus();
