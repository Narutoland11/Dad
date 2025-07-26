# Sistema de Correção Automática - Deploy Guide

## 🚀 Deploy no Netlify (Versão Demo)

### Arquivos Preparados:
- ✅ `netlify.toml` - Configuração do Netlify
- ✅ `.gitignore` - Arquivos a ignorar
- ✅ Interface completa HTML/CSS/JS
- ✅ Template Builder funcional

### Instruções de Deploy:

#### Método 1: Upload Manual
1. Comprima esta pasta em ZIP (excluindo `simple_web_app.py`)
2. Acesse https://app.netlify.com
3. Arraste o ZIP para "Deploy manually"
4. Aguarde o deploy

#### Método 2: Git Deploy
```bash
git init
git add .
git commit -m "Sistema de Correção Automática"
git remote add origin https://github.com/SEU_USUARIO/sistema-correcao.git
git push -u origin main
```

### URLs de Teste:
- **Homepage**: `/` - Dashboard principal
- **Template Builder**: `/templates/builder` - Criação de templates
- **Gestão**: `/templates` - Gerenciar templates
- **Correção**: `/correction` - Upload de provas
- **Relatórios**: `/reports` - Análises detalhadas

### Funcionalidades Disponíveis:
- ✅ Interface completa e responsiva
- ✅ Template Builder com 8 tipos de questão
- ✅ Navegação entre todas as páginas
- ✅ Dados mock para demonstração
- ✅ Design moderno e acessível

### Limitações (Versão Demo):
- ❌ Salvamento persistente (apenas localStorage)
- ❌ Processamento real de imagens
- ❌ Backend APIs (dados mock)

### Para Deploy Completo:
Use Vercel, Railway, ou Render para suporte completo ao Python backend.

## 🎯 URL de Demo:
Após o deploy, seu sistema estará disponível em:
`https://sistema-correcao-automatica.netlify.app`
