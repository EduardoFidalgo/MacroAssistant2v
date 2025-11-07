// === ELEMENTOS ===
const commandInput = document.getElementById('command');
const textInput = document.getElementById('text');
const addButton = document.getElementById('addMacro');
const macroList = document.getElementById('macroList');
const exportButton = document.getElementById('exportMacros');
const importButton = document.getElementById('importMacros');
const deleteAllButton = document.getElementById('deleteAll');
const fileInput = document.getElementById('fileInput');
const searchInput = document.getElementById('searchMacros');

// Armazena todas as macros para busca
let allMacros = {};

// === CARREGAR MACROS ===
function loadMacros(filterText = '') {
  chrome.storage.local.get(['macros'], (result) => {
    allMacros = result.macros || {};
    const macros = allMacros;
    macroList.innerHTML = '';
    
    if (Object.keys(macros).length === 0) {
      macroList.innerHTML = '<div style="text-align:center;padding:20px;color:#999;font-size:12px;">Nenhuma macro cadastrada</div>';
      return;
    }
    
    // Filtra as macros se houver texto de busca
    const filtered = Object.entries(macros).filter(([cmd, txt]) => {
      if (!filterText) return true;
      const search = filterText.toLowerCase();
      return cmd.toLowerCase().includes(search) || txt.toLowerCase().includes(search);
    });
    
    if (filtered.length === 0) {
      macroList.innerHTML = '<div style="text-align:center;padding:20px;color:#999;font-size:12px;">Nenhuma macro encontrada</div>';
      return;
    }
    
    filtered.forEach(([cmd, txt]) => {
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
  
  chrome.storage.local.get(['macros'], (result) => {
    const macros = result.macros || {};
    
    // Verifica limite de 300 macros
    if (Object.keys(macros).length >= 300 && !macros[cmd]) {
      alert('Limite de 300 macros atingido! Remova algumas antes de adicionar novas.');
      return;
    }
    
    macros[cmd] = txt;
    
    chrome.storage.local.set({ macros }, () => {
      commandInput.value = '';
      textInput.value = '';
      loadMacros();
      commandInput.focus();
    });
  });
}

// === DELETAR MACRO ===
function deleteMacro(cmd) {
  chrome.storage.local.get(['macros'], (result) => {
    const macros = result.macros || {};
    delete macros[cmd];
    chrome.storage.local.set({ macros }, () => {
      loadMacros(searchInput.value.trim());
    });
  });
}

// === EXPORTAR MACROS ===
function exportMacros() {
  chrome.storage.local.get(['macros'], (result) => {
    const macros = result.macros || {};
    
    if (Object.keys(macros).length === 0) {
      alert('Nenhuma macro para exportar!');
      return;
    }
    
    const dataStr = JSON.stringify(macros, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macros_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// === IMPORTAR MACROS ===
function importMacros() {
  fileInput.click();
}

function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedMacros = JSON.parse(event.target.result);
      
      if (typeof importedMacros !== 'object' || Array.isArray(importedMacros)) {
        alert('Arquivo JSON inválido!');
        return;
      }
      
      chrome.storage.local.get(['macros'], (result) => {
        const currentMacros = result.macros || {};
        const merged = { ...currentMacros, ...importedMacros };
        
        // Verifica limite de 300 macros
        if (Object.keys(merged).length > 300) {
          alert(`Erro: O total de macros ultrapassaria o limite de 300!\nAtual: ${Object.keys(currentMacros).length}\nImportando: ${Object.keys(importedMacros).length}\nTotal: ${Object.keys(merged).length}`);
          return;
        }
        
        chrome.storage.local.set({ macros: merged }, () => {
          loadMacros();
          alert(`${Object.keys(importedMacros).length} macro(s) importada(s)!`);
        });
      });
    } catch (err) {
      alert('Erro ao ler arquivo JSON!');
    }
  };
  reader.readAsText(file);
  fileInput.value = '';
}

// === EXCLUIR TODAS ===
function deleteAllMacros() {
  if (!confirm('Tem certeza que deseja excluir TODAS as macros?\nEsta ação não pode ser desfeita!')) {
    return;
  }
  
  chrome.storage.local.set({ macros: {} }, () => {
    loadMacros();
    alert('Todas as macros foram excluídas!');
  });
}

// === EVENTOS ===
addButton.addEventListener('click', addMacro);
exportButton.addEventListener('click', exportMacros);
importButton.addEventListener('click', importMacros);
deleteAllButton.addEventListener('click', deleteAllMacros);
fileInput.addEventListener('change', handleFileImport);

// Busca de macros
searchInput.addEventListener('input', (e) => {
  loadMacros(e.target.value.trim());
});

commandInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') textInput.focus();
});
textInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) addMacro();
});

// === INICIALIZAR ===
loadMacros();
commandInput.focus();
