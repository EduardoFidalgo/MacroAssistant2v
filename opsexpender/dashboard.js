// ===== DASHBOARD SCRIPT =====
// Menu toggle para mobile
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

menuToggle.addEventListener('click', function() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
});

sidebarOverlay.addEventListener('click', function() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

// Dados das macros carregados do storage (chrome.storage.local)
let macrosData = {};
let currentMacroCommand = null;
let isNewMacro = false;

// Carregar macros do storage do navegador
function loadMacros() {
    loadAllMacros((macros) => {
        macrosData = macros;
        renderMacroList();
        updateMacroCount();
        
        // Não seleciona nenhuma macro por padrão - mostra empty state
        updateInterface(null, false);
    });
}

// Atualizar contador de macros
function updateMacroCount() {
    const count = Object.keys(macrosData).length;
    const maxMacros = 300;
    const macrosNavTitle = document.querySelector('.sidebar-section-title');
    if (macrosNavTitle && macrosNavTitle.textContent.includes('Macros Salvas')) {
        macrosNavTitle.textContent = `Macros Salvas (${count}/${maxMacros})`;
    }
}

// Renderizar lista de macros na sidebar a partir do cache
function renderMacroList(filterText = '') {
    const macrosContainer = document.getElementById('macrosNav');
    macrosContainer.innerHTML = '';
    
    const filtered = filterMacros(macrosData, filterText);
    
    // Ordena as macros alfabeticamente
    filtered.sort((a, b) => a[0].localeCompare(b[0]));
    
    if (filtered.length === 0) {
        macrosContainer.innerHTML = `
            <div style="padding: 1rem; text-align: center; color: rgba(255, 255, 255, 0.5); font-size: 0.85rem;">
                ${filterText ? 'Nenhuma macro encontrada' : 'Nenhuma macro salva no cache'}
            </div>
        `;
        return;
    }
    
    filtered.forEach(([command, data]) => {
        const link = document.createElement('a');
        link.className = 'nav-link';
        link.href = '#';
        link.dataset.command = command;
        
        if (command === currentMacroCommand) {
            link.classList.add('active');
        }
        
        // Mostra prévia do texto
        const text = getMacroText(data);
        const preview = text.length > 30 ? text.substring(0, 30) + '...' : text;
        
        link.innerHTML = `
            <i class="bi bi-file-text"></i>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 500;">${command}</div>
                <div style="font-size: 0.75rem; opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${preview}</div>
            </div>
        `;
        
        link.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
            
            updateInterface(command, false);
        });
        
        macrosContainer.appendChild(link);
    });
    
    // Log para debug
    const navContainer = document.getElementById('macrosNav');
    console.log(`📋 ${filtered.length} macros renderizadas`);
    console.log(`📏 Scroll info: scrollHeight=${navContainer.scrollHeight}px, clientHeight=${navContainer.clientHeight}px, hasScroll=${navContainer.scrollHeight > navContainer.clientHeight}`);
}

// Função para atualizar a interface
function updateInterface(command, isNew = false) {
    currentMacroCommand = command;
    isNewMacro = isNew;

    const macroStatus = document.getElementById('macroStatus');
    const statusText = document.getElementById('statusText');
    const macroInfo = document.getElementById('macroInfo');
    const emptyState = document.getElementById('emptyState');
    const formSection = document.getElementById('formSection');
    const btnDelete = document.getElementById('btnDelete');

    if (isNew) {
        statusText.textContent = 'Criando Nova Macro';
        macroStatus.style.display = 'inline-flex';
        macroInfo.style.display = 'none';
        formSection.style.display = 'block';
        emptyState.style.display = 'none';
        btnDelete.style.display = 'none';
        document.getElementById('titulo').value = '';
        document.getElementById('descricao').value = '';
    } else if (command && macrosData[command]) {
        const data = normalizeData(macrosData[command]);
        
        statusText.textContent = 'Editando Macro';
        macroStatus.style.display = 'inline-flex';
        macroInfo.style.display = 'flex';
        formSection.style.display = 'block';
        emptyState.style.display = 'none';
        btnDelete.style.display = 'flex';
        
        document.getElementById('macroDate').textContent = `Criada em: ${formatDate(data.createdAt)}`;
        document.getElementById('macroUpdated').textContent = `Atualizada: ${data.updatedAt ? formatDate(data.updatedAt) : 'Nunca'}`;
        document.getElementById('titulo').value = command;
        document.getElementById('descricao').value = data.text;
    } else {
        macroStatus.style.display = 'none';
        macroInfo.style.display = 'none';
        formSection.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// Gerenciar botão de adicionar macro
document.querySelector('.btn-add-macro').addEventListener('click', function () {
    document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
    updateInterface(null, true);
    
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    }
});

// Botão excluir macro do cache
document.getElementById('btnDelete').addEventListener('click', function() {
    if (!currentMacroCommand) return;
    
    if (confirm(`Tem certeza que deseja excluir a macro "${currentMacroCommand}" do cache?\n\nEsta ação não pode ser desfeita.`)) {
        deleteMacro(currentMacroCommand, (result) => {
            if (result.success) {
                // Feedback visual de sucesso
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>Excluída!</span>';
                this.style.background = '#28a745';
                this.style.borderColor = '#28a745';
                this.style.color = 'white';
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.style.background = '';
                    this.style.borderColor = '';
                    this.style.color = '';
                    loadMacros();
                    updateInterface(null, false);
                }, 1500);
            } else {
                alert('Erro ao excluir macro!');
            }
        });
    }
});

// Função auxiliar para tratar resultado do salvamento
function handleSaveResult(result, command) {
    if (result.success) {
        const action = isNewMacro ? 'criada' : 'atualizada';
        
        // Feedback visual de sucesso
        const submitBtn = document.querySelector('.btn-primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>Salva no Cache!</span>';
        submitBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
            
            loadMacros();
            currentMacroCommand = command;
            updateInterface(command, false);
            
            // Atualiza a seleção na sidebar
            setTimeout(() => {
                document.querySelectorAll('.sidebar .nav-link').forEach(l => {
                    if (l.dataset.command === command) {
                        l.classList.add('active');
                    } else {
                        l.classList.remove('active');
                    }
                });
            }, 100);
        }, 1500);
    } else {
        alert(result.error);
    }
}

// Gerenciar submit do formulário - salva no cache
document.getElementById('macroForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const command = document.getElementById('titulo').value.trim();
    const text = document.getElementById('descricao').value.trim();

    if (!command || !text) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    // Verifica se está renomeando
    if (!isNewMacro && currentMacroCommand !== command) {
        if (macrosData[command]) {
            alert(`Já existe uma macro com o comando "${command}" no cache!`);
            return;
        }
        // Remove a macro antiga se estiver renomeando
        deleteMacro(currentMacroCommand, () => {
            // Salva com o novo nome no cache
            saveMacro(command, text, (result) => {
                handleSaveResult(result, command);
            });
        });
    } else {
        // Salva normalmente no cache
        saveMacro(command, text, (result) => {
            handleSaveResult(result, command);
        });
    }
});

// Gerenciar ícone de bug report
document.getElementById('bugReport').addEventListener('click', function() {
    const bugReportUrl = 'https://github.com/EduardoFidalgo/MacroAssistant2v/issues/new';
    window.open(bugReportUrl, '_blank');
});

// Exportar macros do cache
document.getElementById('btnExport').addEventListener('click', function() {
    exportMacros((result) => {
        if (result.success) {
            // Feedback visual
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="bi bi-check-circle-fill"></i><span class="btn-text">Exportado!</span>';
            
            setTimeout(() => {
                this.innerHTML = originalText;
                alert(`${result.count} macro(s) exportada(s) do cache com sucesso!`);
            }, 1500);
        } else {
            alert(result.error);
        }
    });
});

// Importar macros para o cache
document.getElementById('btnImport').addEventListener('click', function() {
    document.getElementById('fileInputDashboard').click();
});

document.getElementById('fileInputDashboard').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    importMacros(file, (result) => {
        if (result.success) {
            // Feedback visual
            const btnImport = document.getElementById('btnImport');
            const originalText = btnImport.innerHTML;
            btnImport.innerHTML = '<i class="bi bi-check-circle-fill"></i><span class="btn-text">Importado!</span>';
            
            setTimeout(() => {
                btnImport.innerHTML = originalText;
                alert(`${result.count} macro(s) importada(s) para o cache com sucesso!`);
                loadMacros();
            }, 1500);
        } else {
            alert(result.error);
        }
    });
    
    this.value = '';
});

// Busca de macros na sidebar
document.getElementById('searchMacrosSidebar').addEventListener('input', function(e) {
    renderMacroList(e.target.value.trim());
});

// Placeholder do campo de busca
document.getElementById('searchMacrosSidebar').addEventListener('focus', function() {
    this.style.background = 'rgba(255,255,255,0.25)';
});

document.getElementById('searchMacrosSidebar').addEventListener('blur', function() {
    this.style.background = 'rgba(255,255,255,0.15)';
});

// ===== SINCRONIZAÇÃO AUTOMÁTICA COM O CACHE DO NAVEGADOR =====
// Monitora mudanças no chrome.storage.local para sincronizar em tempo real
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.macros) {
        console.log('📦 Cache atualizado - Sincronizando dashboard...');
        
        // Recarrega as macros quando houver mudanças no cache
        const searchValue = document.getElementById('searchMacrosSidebar').value.trim();
        loadAllMacros((macros) => {
            macrosData = macros;
            renderMacroList(searchValue);
            updateMacroCount();
            
            // Se a macro atual foi deletada do cache, volta para o empty state
            if (currentMacroCommand && !macrosData[currentMacroCommand]) {
                updateInterface(null, false);
            } else if (currentMacroCommand) {
                // Atualiza os dados da macro atual se ela ainda existe
                updateInterface(currentMacroCommand, false);
            }
        });
    }
});

// Inicializar carregando as macros
loadMacros();
