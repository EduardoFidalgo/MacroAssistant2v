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
const shortcutKeyInput = document.getElementById('shortcutKey');
const saveShortcutButton = document.getElementById('saveShortcut');
const helpShortcut = document.getElementById('helpShortcut');

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
    const filtered = Object.entries(macros).filter(([cmd, data]) => {
      if (!filterText) return true;
      const search = filterText.toLowerCase();
      const txt = typeof data === 'string' ? data : data.text;
      return cmd.toLowerCase().includes(search) || txt.toLowerCase().includes(search);
    });
    
    if (filtered.length === 0) {
      macroList.innerHTML = '<div style="text-align:center;padding:20px;color:#999;font-size:12px;">Nenhuma macro encontrada</div>';
      return;
    }
    
    filtered.forEach(([cmd, data]) => {
      // Suporta formato antigo (string) e novo (objeto)
      const txt = typeof data === 'string' ? data : data.text;
      const createdAt = data.createdAt ? new Date(data.createdAt).toLocaleString('pt-BR') : 'N/A';
      const updatedAt = data.updatedAt ? new Date(data.updatedAt).toLocaleString('pt-BR') : null;
      
      const item = document.createElement('div');
      item.className = 'macro';
      item.innerHTML = `
        <div class="macro-info">
          <div class="macro-cmd"><span class="macro-icon">›</span>${cmd}</div>
          <div class="macro-txt">${txt}</div>
          <div class="macro-dates">
            <small style="color:#999;font-size:10px;">
              Criado: ${createdAt}${updatedAt ? ` | Atualizado: ${updatedAt}` : ''}
            </small>
          </div>
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

// === CARREGAR ATALHO ===
function loadShortcut() {
  chrome.storage.local.get(['shortcutKey'], (result) => {
    const shortcut = result.shortcutKey || '>';
    shortcutKeyInput.value = shortcut;
    helpShortcut.textContent = shortcut;
  });
}

// === SALVAR ATALHO ===
function saveShortcut() {
  const key = shortcutKeyInput.value.trim();
  
  if (!key || key.length !== 1) {
    alert('Digite apenas um caractere para o atalho!');
    return;
  }
  
  chrome.storage.local.set({ shortcutKey: key }, () => {
    helpShortcut.textContent = key;
    
    // Notifica o content script sobre a mudança
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'updateShortcut', 
          shortcutKey: key 
        }).catch(() => {
          // Ignora erros de tabs que não têm o content script
        });
      });
    });
    
    alert(`Atalho atualizado para: ${key}\nRecarregue as páginas abertas para aplicar a mudança.`);
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
    
    const now = new Date().toISOString();
    const isUpdate = macros[cmd] !== undefined;
    
    // Se já existe, mantém a data de criação e adiciona data de atualização
    if (isUpdate) {
      const existingData = typeof macros[cmd] === 'string' 
        ? { text: macros[cmd], createdAt: now } 
        : macros[cmd];
      
      macros[cmd] = {
        text: txt,
        createdAt: existingData.createdAt || now,
        updatedAt: now
      };
    } else {
      // Nova macro
      macros[cmd] = {
        text: txt,
        createdAt: now
      };
    }
    
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
      
      // Converte macros antigas (string) para novo formato (objeto com timestamps)
      const now = new Date().toISOString();
      const normalizedImported = {};
      Object.entries(importedMacros).forEach(([cmd, data]) => {
        if (typeof data === 'string') {
          // Formato antigo - converte para novo
          normalizedImported[cmd] = {
            text: data,
            createdAt: now
          };
        } else {
          // Já está no novo formato
          normalizedImported[cmd] = data;
        }
      });
      
      chrome.storage.local.get(['macros'], (result) => {
        const currentMacros = result.macros || {};
        const merged = { ...currentMacros, ...normalizedImported };
        
        // Verifica limite de 300 macros
        if (Object.keys(merged).length > 300) {
          alert(`Erro: O total de macros ultrapassaria o limite de 300!\nAtual: ${Object.keys(currentMacros).length}\nImportando: ${Object.keys(normalizedImported).length}\nTotal: ${Object.keys(merged).length}`);
          return;
        }
        
        chrome.storage.local.set({ macros: merged }, () => {
          loadMacros();
          alert(`${Object.keys(normalizedImported).length} macro(s) importada(s)!`);
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
saveShortcutButton.addEventListener('click', saveShortcut);

// Busca de macros
searchInput.addEventListener('input', (e) => {
  loadMacros(e.target.value.trim());
});

// Permite apenas um caractere no campo de atalho
shortcutKeyInput.addEventListener('input', (e) => {
  if (e.target.value.length > 1) {
    e.target.value = e.target.value.slice(-1);
  }
});

// Salva atalho ao pressionar Enter
shortcutKeyInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') saveShortcut();
});

commandInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') textInput.focus();
});
textInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) addMacro();
});

document.getElementById("openDashboard").addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("opsexpender/dashboard.html")
  });
});

// === SINCRONIZAÇÃO COM O STORAGE ===
// Monitora mudanças no storage para sincronizar com o dashboard
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.macros) {
    // Recarrega as macros quando houver mudanças
    loadMacros(searchInput.value.trim());
  }
});

// === INICIALIZAR ===
loadShortcut();
loadMacros();
commandInput.focus();
