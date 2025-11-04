## 📋 GUIA DE INSTALAÇÃO - MacroPaste 2.0

### Passo 1: Gerar os Ícones PNG

1. Abra o arquivo **GERAR_ICONES.html** no seu navegador Chrome
2. Clique no botão "📥 Download Todos os Ícones" 
3. Três arquivos serão baixados: `icon16.png`, `icon48.png`, `icon128.png`
4. Mova esses arquivos para a pasta `icons/` (substitua os arquivos SVG se desejar)

### Passo 2: Carregar a Extensão no Chrome

1. Abra o Google Chrome
2. Digite na barra de endereços: `chrome://extensions/`
3. Ative o **Modo do desenvolvedor** (toggle no canto superior direito)
4. Clique em **Carregar sem compactação**
5. Selecione a pasta `MacroPaste2.0v`
6. A extensão aparecerá na lista e estará pronta para usar! 🎉

### Passo 3: Fixar a Extensão (Opcional)

1. Clique no ícone de quebra-cabeça (🧩) na barra de ferramentas do Chrome
2. Encontre "MacroPaste" na lista
3. Clique no ícone de alfinete para fixar na barra de ferramentas

### Passo 4: Começar a Usar

#### Cadastrar Macros:
1. Clique no ícone da extensão MacroPaste
2. Digite um comando (ex: `email`, `cumprimento`, `telefone`)
3. Digite o texto da macro
4. Clique em "Adicionar Macro"

#### Usar Macros:
1. Abra qualquer site (Gmail, WhatsApp Web, etc.)
2. Clique em um campo de texto
3. Digite `>` (símbolo de maior que)
4. Um painel aparecerá automaticamente! ✨
5. Use as setas ↑↓ para navegar ou digite para buscar
6. Pressione ENTER para inserir o texto

### 🎯 Exemplos de Macros Úteis

```
cumprimento → Olá! Como posso ajudar?
email → seuemail@exemplo.com
telefone → (11) 98765-4321
assinatura → Atenciosamente,\nSeu Nome\nCargo
endereco → Rua Exemplo, 123 - São Paulo, SP
obrigado → Muito obrigado pelo contato! Retornarei em breve.
```

💡 **Dica**: Não é necessário usar # no início dos comandos!

### 🔧 Solução de Problemas

**A extensão não aparece:**
- Verifique se o "Modo do desenvolvedor" está ativado
- Certifique-se de ter selecionado a pasta correta
- Recarregue a extensão clicando no botão de atualizar (🔄)

**Os ícones não aparecem:**
- Gere os ícones PNG usando o arquivo GERAR_ICONES.html
- Coloque-os na pasta `icons/`
- Recarregue a extensão

**O painel não abre ao digitar ">":**
- Atualize a página onde está tentando usar
- Verifique se a extensão está ativada em `chrome://extensions/`
- Alguns sites podem bloquear extensões (raro)

### 📱 Sites Compatíveis

A extensão funciona em praticamente todos os sites:
- ✅ Gmail
- ✅ WhatsApp Web
- ✅ Discord
- ✅ Slack
- ✅ Twitter/X
- ✅ Facebook
- ✅ LinkedIn
- ✅ Formulários em geral
- ✅ E muito mais!

### 🎨 Personalização

Você pode editar os arquivos CSS para personalizar:
- **popup.css** - Interface do gerenciador de macros
- **content.css** - Aparência do painel flutuante

### 🔄 Atualizar a Extensão

Após fazer mudanças no código:
1. Vá em `chrome://extensions/`
2. Encontre MacroPaste
3. Clique no botão de atualizar (🔄)

### 💡 Dicas de Uso

1. **Organize suas macros** com prefixos:
   - `email-` para e-mails (ex: `email-trabalho`, `email-pessoal`)
   - `tel-` para telefones (ex: `tel-casa`, `tel-celular`)
   - `txt-` para textos comuns (ex: `txt-saudacao`, `txt-despedida`)

2. **Use quebras de linha** com `\n` no texto da macro

3. **Atalhos rápidos**: Macros curtas para respostas frequentes

4. **Backup**: Exporte suas macros acessando o Chrome Storage (futuras versões terão essa função)

### 🚀 Pronto!

Agora você está pronto para usar o MacroPaste e aumentar sua produtividade! 

Qualquer dúvida, consulte o README.md ou os comentários no código.
