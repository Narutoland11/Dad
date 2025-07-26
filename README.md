# Sistema de Correção Automática de Provas 📝

Um sistema avançado de correção automática de provas usando Inteligência Artificial e Visão Computacional, desenvolvido especialmente para professores que desejam automatizar o processo de correção de testes.

## 🚀 Características Principais

### ✨ Tipos de Questões Suportadas
- **Múltipla Escolha**: A, B, C, D, E (ou personalizadas)
- **Verdadeiro/Falso**: V/F, T/F, ✓/×, ou palavras completas
- **Numéricas**: Com margem de erro configurável
- **Texto Curto**: Reconhecimento de texto manuscrito básico
- **Símbolos Customizados**: ■, ●, ▲, alfabeto grego, etc.
- **Associativas**: Ligação entre colunas

### 🎯 Funcionalidades Avançadas
- **Templates Flexíveis**: Crie gabaritos personalizados com facilidade
- **Pesos Diferenciados**: Atribua pesos diferentes para cada questão
- **Múltiplas Respostas Corretas**: Questões com mais de uma alternativa válida
- **Correção Parcial**: Pontuação proporcional para respostas incompletas
- **Múltiplas Versões**: Suporte a provas A, B, C, etc.
- **Análise de Desempenho**: Estatísticas detalhadas por questão e turma

### 🔧 Processamento de Imagem Avançado
- **Correção Automática de Perspectiva**: Alinha automaticamente fotos tortas
- **Remoção de Sombras**: Melhora a qualidade de imagens com má iluminação
- **Suporte Multi-cores**: Detecta marcas em azul, preto, vermelho
- **Detecção Robusta**: Identifica círculos preenchidos, X, checkboxes
- **OCR Otimizado**: Configurações específicas para cada tipo de questão

## 📋 Requisitos do Sistema

### Dependências Python
```bash
pip install -r requirements.txt
```

### Software Adicional
- **Tesseract OCR**: [Download aqui](https://github.com/UB-Mannheim/tesseract/wiki)
- **Python 3.8+**
- **OpenCV 4.8+**

## 🛠️ Instalação

1. **Clone ou baixe o projeto**
```bash
git clone <repository-url>
cd sistema-correcao-provas
```

2. **Instale as dependências**
```bash
pip install -r requirements.txt
```

3. **Configure o Tesseract OCR**
   - Baixe e instale o Tesseract OCR
   - No Windows: Geralmente instalado em `C:\Program Files\Tesseract-OCR\tesseract.exe`
   - Configure o caminho no código se necessário

4. **Teste a instalação**
```bash
python demo.py
```

## 📚 Como Usar

### 1. Criação de Templates

```python
from template_builder import TemplateBuilder

# Criar um novo template
builder = TemplateBuilder()
template = builder.create_new_template(
    name="Prova de Matemática",
    version="A",
    created_by="Prof. João",
    instructions="Marque apenas uma alternativa"
)

# Adicionar questões múltipla escolha
builder.add_multiple_choice_question(1, ["A"], weight=1.0)
builder.add_multiple_choice_question(2, ["B"], weight=1.5)

# Adicionar questões V/F
builder.add_true_false_question(3, "V", weight=1.0)

# Adicionar questões numéricas
builder.add_numeric_question(4, 42.5, error_margin=0.5, weight=2.0)

# Configurar escala de notas
builder.set_grading_scale(passing_score=60.0)

# Salvar template
from test_corrector import TestCorrectionEngine
corrector = TestCorrectionEngine()
corrector.save_template(template, "meu_template.json")
```

### 2. Correção de Provas

```python
from test_corrector import TestCorrectionEngine

# Inicializar o corretor
corrector = TestCorrectionEngine()

# Carregar template
template = corrector.load_template("meu_template.json")

# Corrigir uma prova
result = corrector.correct_test(
    image_path="prova_aluno1.jpg",
    template_id=template.id,
    student_id="aluno_001"
)

print(f"Resultado: {result.percentage:.1f}% - Nota: {result.letter_grade}")
```

### 3. Correção em Lote

```python
# Corrigir múltiplas provas
results = corrector.correct_batch(
    image_folder="provas_turma/",
    template_id=template.id,
    student_ids=["aluno_001", "aluno_002", "aluno_003"]
)

# Gerar análise da turma
analytics = corrector.generate_class_analytics(template.id)
print(f"Média da turma: {analytics['class_statistics']['average_score']:.1f}%")
```

### 4. Relatórios e Exportação

```python
# Relatório detalhado individual
detailed_report = corrector.generate_detailed_report(result)

# Exportar resultados
corrector.export_results("resultados.json", format="json")
corrector.export_results("resultados.xlsx", format="excel")
```

## 🎨 Templates Predefinidos

O sistema inclui templates prontos para uso imediato:

```python
from template_builder import TemplateExamples

# Template básico múltipla escolha (10 questões)
basic_template = TemplateExamples.create_basic_multiple_choice()

# Template misto (múltipla escolha + V/F + numérica)
mixed_template = TemplateExamples.create_mixed_question_types()

# Template avançado (todos os tipos de questão)
advanced_template = TemplateExamples.create_advanced_template()
```

## 📊 Tipos de Análises Disponíveis

### Relatório Individual
- Pontuação total e percentual
- Nota com letra (A, B, C, D, F)
- Detalhamento por questão
- Nível de confiança da detecção
- Recomendações personalizadas

### Análise de Turma
- Estatísticas gerais (média, máximo, mínimo)
- Taxa de aprovação
- Distribuição de notas
- Análise de dificuldade por questão
- Identificação de questões problemáticas
- Recomendações pedagógicas

## 🔧 Configurações Avançadas

### Personalização de OCR
```python
# Configurar caminhos específicos
processor = AdvancedImageProcessor(
    tesseract_path="C:/Program Files/Tesseract-OCR/tesseract.exe"
)
```

### Templates de Resposta Personalizados
```python
from models import AnswerOption

# Criar opções customizadas
custom_options = [
    AnswerOption("α", ["alpha", "a", "α"]),
    AnswerOption("β", ["beta", "b", "β"]),
    AnswerOption("γ", ["gamma", "g", "γ"])
]
```

### Escalas de Nota Personalizadas
```python
builder.set_grading_scale(
    passing_score=65.0,
    letter_grades={
        "A+": 95.0,
        "A": 90.0,
        "B+": 85.0,
        "B": 80.0,
        "C+": 75.0,
        "C": 70.0,
        "D": 65.0,
        "F": 0.0
    }
)
```

## 📁 Estrutura do Projeto

```
sistema-correcao-provas/
├── models.py              # Modelos de dados (templates, questões, resultados)
├── image_processor.py     # Processamento avançado de imagens
├── test_corrector.py      # Motor principal de correção
├── template_builder.py    # Construtor interativo de templates
├── demo.py               # Demonstração completa do sistema
├── requirements.txt      # Dependências Python
├── README.md            # Este arquivo
├── templates/           # Templates salvos
├── exports/            # Resultados exportados
└── examples/           # Imagens de exemplo
```

## 🎯 Casos de Uso

### Para Professores do Ensino Fundamental
- Provas de múltipla escolha simples
- Questões V/F
- Avaliações rápidas

### Para Professores do Ensino Médio
- Provas mistas (múltipla escolha + dissertativas curtas)
- Questões com pesos diferenciados
- Múltiplas versões de prova

### Para Professores Universitários
- Avaliações complexas com diversos tipos de questão
- Análises estatísticas avançadas
- Correção parcial e pesos customizados

### Para Coordenadores Pedagógicos
- Análise de desempenho por turma
- Identificação de questões problemáticas
- Relatórios para tomada de decisão

## 🚨 Dicas de Uso

### Para Melhores Resultados
1. **Qualidade da Imagem**: Use boa iluminação e evite sombras
2. **Padronização**: Mantenha layout consistente nas provas
3. **Marcações Claras**: Oriente alunos sobre como marcar respostas
4. **Teste Primeiro**: Sempre teste com algumas provas antes do uso em larga escala

### Solução de Problemas Comuns
- **OCR não funciona**: Verifique se o Tesseract está instalado corretamente
- **Baixa precisão**: Melhore a qualidade das imagens ou ajuste parâmetros
- **Erro de perspectiva**: Tire fotos mais alinhadas ou use a correção automática

## 🔄 Atualizações Futuras

### Versão 2.0 (Planejada)
- [ ] Interface web completa
- [ ] Integração com sistemas acadêmicos
- [ ] Reconhecimento de texto manuscrito avançado
- [ ] Suporte a QR codes para identificação automática
- [ ] App mobile para captura de fotos

### Versão 2.1 (Planejada)
- [ ] Inteligência artificial para detecção de cola
- [ ] Análise de padrões de resposta
- [ ] Geração automática de questões similares
- [ ] Dashboard em tempo real

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:
1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

## 📞 Suporte

Para dúvidas, sugestões ou problemas:
- 📧 Email: suporte@sistema-correcao.com
- 💬 Issues: Use a seção Issues do GitHub
- 📚 Documentação: Consulte este README e os comentários no código

## 🙏 Agradecimentos

- OpenCV pela biblioteca de visão computacional
- Tesseract OCR pelo reconhecimento de texto
- Comunidade Python pelas excelentes bibliotecas
- Professores que testaram e deram feedback

---

**Desenvolvido com ❤️ para educadores que querem mais tempo para ensinar e menos tempo corrigindo provas!**
