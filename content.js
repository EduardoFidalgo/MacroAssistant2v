let panel, searchInput, listEl, currentInput;
let macros = {};
let filtered = [];
let selected = 0;

(function () {
  const style = document.createElement("style");
  style.innerHTML = `
    #macro-search[data-placeholder]:empty:before {
      content: attr(data-placeholder);
      color: #888;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
})();

function getDoc() {
  const active = document.activeElement;
  if (active && active.tagName === "IFRAME" && active.contentDocument) {
    return active.contentDocument;
  }
  return document;
}

function createPanel() {
  const doc = getDoc();
  if (panel && doc.body.contains(panel)) return panel;

  panel = doc.createElement("div");
  panel.id = "macro-paste-panel";
  panel.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    width: 360px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.25);
    font-family: sans-serif;
    display: none;
    pointer-events: auto !important;
  `;

  panel.innerHTML = `
    <div id="macro-search" contenteditable="true" style="
      width:100%; padding:10px; border:none; border-bottom:1px solid #eee;
      font-size:14px; outline:none; height:40px; line-height:20px;
      font-family:sans-serif; box-sizing:border-box;
      white-space:nowrap; overflow:hidden;
    " data-placeholder="Buscar macro..."></div>
    <div id="macro-list" style="max-height:260px; overflow-y:auto;"></div>
  `;

  doc.body.appendChild(panel);

  searchInput = panel.querySelector("#macro-search");
  listEl = panel.querySelector("#macro-list");

  // 🔥 Permitir digitação normal dentro do campo
  ["compositionstart", "compositionupdate", "compositionend"].forEach(evt => {
    searchInput.addEventListener(evt, e => e.stopPropagation(), { capture: true });
  });

  ["beforeinput", "input", "keydown", "keypress"].forEach(evt => {
    searchInput.addEventListener(evt, e => e.stopPropagation());
  });

  // Impede o Bird/Slate de fechar o chat ao clicar no painel
  ["mousedown", "pointerdown", "click", "wheel"].forEach(evt => {
    panel.addEventListener(evt, e => {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, { capture: true });
  });

  // Ignorado pelo editor Slate
  searchInput.setAttribute("data-slate-ignore", "true");
  searchInput.setAttribute("role", "textbox");

  // Busca dinâmica
  searchInput.addEventListener("input", () => {
    applyFilter((searchInput.textContent || "").trim());
  });

  // Navegação
  searchInput.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selected = Math.min(selected + 1, filtered.length - 1);
      renderList();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selected = Math.max(selected - 1, 0);
      renderList();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) insertMacro(filtered[selected][1]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
    }
  });

  return panel;
}

window.addEventListener("keydown", e => {
  if (panel && panel.style.display === "block" && document.activeElement !== searchInput) {
    if (["Escape", "ArrowDown", "ArrowUp", "Enter", "Shift", "Control", "Alt", "Meta"].includes(e.key))
      return;

    e.stopPropagation();
    e.preventDefault();

    if (e.key === "Backspace") {
      searchInput.textContent = searchInput.textContent.slice(0, -1);
    } else if (e.key.length === 1) {
      searchInput.textContent += e.key;
    }

    applyFilter(searchInput.textContent.trim());
  }
}, true);

function positionPanel(el) {
  const rect = el.getBoundingClientRect();
  const panelHeight = panel.offsetHeight || 300;
  const spacing = 6;

  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;

  if (spaceBelow < panelHeight && spaceAbove > panelHeight) {
    panel.style.top = (rect.top - panelHeight - spacing) + "px";
  } else {
    panel.style.top = (rect.bottom + spacing) + "px";
  }

  panel.style.left = rect.left + "px";
  const panelRect = panel.getBoundingClientRect();
  if (panelRect.right > window.innerWidth) {
    panel.style.left = (window.innerWidth - panelRect.width - 10) + "px";
  }
  if (panelRect.left < 0) {
    panel.style.left = "10px";
  }
}

function openPanel(el) {
  currentInput = el;
  createPanel();

  chrome.storage.sync.get(["macros"], res => {
    macros = res.macros || {};
    filtered = Object.entries(macros);
    selected = 0;

    renderList();
    panel.style.display = "block";
    positionPanel(el);
    searchInput.textContent = "";

    const doc = getDoc();
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          searchInput.focus();
          const range = doc.createRange();
          const sel = doc.getSelection();
          range.selectNodeContents(searchInput);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (err) {
          console.warn("Falha ao focar campo de busca:", err);
        }
      }, 100);
    });
  });
}

function closePanel() {
  if (panel) panel.style.display = "none";
  if (currentInput) currentInput.focus();
}

function applyFilter(q) {
  q = q.toLowerCase();
  filtered = Object.entries(macros).filter(([cmd, txt]) =>
    cmd.toLowerCase().includes(q) || txt.toLowerCase().includes(q)
  );
  selected = 0;
  renderList();
}

function renderList() {
  listEl.innerHTML = "";
  if (!filtered.length) {
    listEl.innerHTML = `<div style="padding:12px; color:#666; text-align:center;">Nenhuma macro encontrada</div>`;
    return;
  }

  filtered.forEach(([cmd, text], i) => {
    let preview = text.trim();
    const maxLen = 55;
    if (preview.length > maxLen) preview = preview.slice(0, maxLen) + "...";

    const item = document.createElement("div");
    item.className = "macro-item" + (i === selected ? " selected" : "");
    item.style.cssText = `
      padding:10px 14px; cursor:pointer; border-bottom:1px solid #f5f5f5;
      background:${i === selected ? "#ffeaf6" : "white"};
    `;
    item.innerHTML = `
      <div style="font-size:14px;"> > ${cmd} </div>
      <div style="font-size:12px; color:#666; margin-top:3px; opacity:0.8;">${preview}</div>
    `;

    item.addEventListener("mousedown", e => {
      e.stopPropagation();
      insertMacro(text);
      closePanel();
    }, { capture: true });

    item.addEventListener("mouseenter", () => {
      selected = i;
      renderList();
    });

    listEl.appendChild(item);
  });
}

function insertMacro(text) {
  if (panel) panel.style.display = "none";

  requestAnimationFrame(() => {
    if (currentInput) currentInput.focus();

    requestAnimationFrame(() => {
      const doc = getDoc();

      if (currentInput && (currentInput.tagName === "INPUT" || currentInput.tagName === "TEXTAREA")) {
        const start = currentInput.selectionStart || 0;
        const end = currentInput.selectionEnd || 0;
        const val = currentInput.value || "";
        currentInput.value = val.substring(0, start) + text + val.substring(end);
        currentInput.selectionStart = currentInput.selectionEnd = start + text.length;
        currentInput.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }

      const sel = doc.getSelection();
      if (!sel || !sel.rangeCount) return;
      const target = sel.anchorNode?.parentElement || currentInput;
      if (!target) return;

      const before = new InputEvent("beforeinput", {
        inputType: "insertText",
        data: text,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      target.dispatchEvent(before);

      if (!before.defaultPrevented) {
        const range = sel.getRangeAt(0);
        const node = doc.createTextNode(text);
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        target.dispatchEvent(new InputEvent("input", { inputType: "insertText", data: text, bubbles: true }));
      }
    });
  });
}

document.addEventListener("keydown", e => {
  if (panel && e.target === searchInput) return;

  if (
    (e.key === ">" || (e.keyCode === 190 && e.shiftKey)) &&
    (
      e.target.isContentEditable ||
      e.target.tagName === "TEXTAREA" ||
      e.target.tagName === "INPUT"
    )
  ) {
    e.preventDefault();
    openPanel(e.target);
    return;
  }

  if (!panel || panel.style.display === "none") return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selected = Math.min(selected + 1, filtered.length - 1);
    renderList();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selected = Math.max(selected - 1, 0);
    renderList();
  } else if (e.key === "Enter") {
    e.preventDefault();
    insertMacro(filtered[selected][1]);
  } else if (e.key === "Escape") {
    e.preventDefault();
    closePanel();
  }
}, { capture: true });
