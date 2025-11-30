// ===== FUNÇÕES COMPARTILHADAS ENTRE POPUP E DASHBOARD =====
// IMPORTANTE: Todas as operações de escrita no storage disparam o evento onChanged,
// permitindo sincronização automática entre o popup e o dashboard.

// Converte formato antigo (string) para novo formato (objeto com timestamps)
function normalizeData(data) {
  if (typeof data === 'string') {
    return { text: data, createdAt: null, updatedAt: null };
  }
  return data;
}

// Extrai o texto da macro (compatível com ambos os formatos)
function getMacroText(data) {
  return typeof data === 'string' ? data : data.text;
}

// Formata data para exibição
function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  return new Date(isoDate).toLocaleString('pt-BR');
}

// Filtra macros por texto de busca
function filterMacros(macros, searchText) {
  if (!searchText) return Object.entries(macros);
  
  const search = searchText.toLowerCase();
  return Object.entries(macros).filter(([cmd, data]) => {
    const text = getMacroText(data);
    return cmd.toLowerCase().includes(search) || text.toLowerCase().includes(search);
  });
}

// Adicionar ou atualizar macro
function saveMacro(command, text, callback) {
  chrome.storage.local.get(['macros'], (result) => {
    const macros = result.macros || {};
    
    // Verifica limite de 300 macros
    if (Object.keys(macros).length >= 300 && !macros[command]) {
      callback({ success: false, error: 'Limite de 300 macros atingido! Remova algumas antes de adicionar novas.' });
      return;
    }
    
    const now = new Date().toISOString();
    const isUpdate = macros[command] !== undefined;
    
    if (isUpdate) {
      const existingData = normalizeData(macros[command]);
      macros[command] = {
        text: text,
        createdAt: existingData.createdAt || now,
        updatedAt: now
      };
    } else {
      macros[command] = {
        text: text,
        createdAt: now
      };
    }
    
    chrome.storage.local.set({ macros }, () => {
      callback({ success: true, isUpdate: isUpdate });
    });
  });
}

// Deletar macro
function deleteMacro(command, callback) {
  chrome.storage.local.get(['macros'], (result) => {
    const macros = result.macros || {};
    delete macros[command];
    chrome.storage.local.set({ macros }, () => {
      callback({ success: true });
    });
  });
}

// Exportar macros
function exportMacros(callback) {
  chrome.storage.local.get(['macros'], (result) => {
    const macros = result.macros || {};
    
    if (Object.keys(macros).length === 0) {
      callback({ success: false, error: 'Nenhuma macro para exportar!' });
      return;
    }
    
    const dataStr = JSON.stringify(macros, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macros_ops_expander_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    callback({ success: true, count: Object.keys(macros).length });
  });
}

// Importar macros
function importMacros(file, callback) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedMacros = JSON.parse(event.target.result);
      
      if (typeof importedMacros !== 'object' || Array.isArray(importedMacros)) {
        callback({ success: false, error: 'Arquivo JSON inválido!' });
        return;
      }
      
      // Converte macros antigas (string) para novo formato (objeto com timestamps)
      const now = new Date().toISOString();
      const normalizedImported = {};
      Object.entries(importedMacros).forEach(([cmd, data]) => {
        if (typeof data === 'string') {
          normalizedImported[cmd] = {
            text: data,
            createdAt: now
          };
        } else {
          normalizedImported[cmd] = data;
        }
      });
      
      chrome.storage.local.get(['macros'], (result) => {
        const currentMacros = result.macros || {};
        const merged = { ...currentMacros, ...normalizedImported };
        
        // Verifica limite de 300 macros
        if (Object.keys(merged).length > 300) {
          callback({ 
            success: false, 
            error: `Erro: O total de macros ultrapassaria o limite de 300!\nAtual: ${Object.keys(currentMacros).length}\nImportando: ${Object.keys(normalizedImported).length}\nTotal: ${Object.keys(merged).length}` 
          });
          return;
        }
        
        chrome.storage.local.set({ macros: merged }, () => {
          callback({ success: true, count: Object.keys(normalizedImported).length });
        });
      });
    } catch (err) {
      callback({ success: false, error: 'Erro ao ler arquivo JSON! Verifique se o arquivo está no formato correto.' });
    }
  };
  reader.readAsText(file);
}

// Carregar todas as macros
function loadAllMacros(callback) {
  chrome.storage.local.get(['macros'], (result) => {
    callback(result.macros || {});
  });
}

// Deletar todas as macros
function deleteAllMacros(callback) {
  chrome.storage.local.set({ macros: {} }, () => {
    callback({ success: true });
  });
}
