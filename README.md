# Chamar Robô | Robô Ecológico CIMOL

Frontend do TCC **"Robô Ecológico: Coletando Resíduos Recicláveis no CIMOL"**, do Curso Técnico em Informática da Escola Técnica Estadual Monteiro Lobato (CIMOL), Taquara/RS.

A página simula a chamada do robô sobre o mapa da escola, apresenta o projeto e permite que a comunidade escolar registre problemas e dúvidas.

| | Link | QR Code |
|---|---|---|
| Aplicação na web | https://victorcimol16.github.io/SITE-ROBO/ | <img src="docs/qr-site.png" alt="QR Code para a aplicação publicada" width="140"> |
| Repositório | https://github.com/victorcimol16/SITE-ROBO | <img src="docs/qr-repositorio.png" alt="QR Code para o repositório no GitHub" width="140"> |

## Funcionalidades

- **Chamar robô:** o marcador do robô percorre o trajeto até o usuário, o botão fica desativado durante a chamada e o estado é anunciado na tela. Nesta versão a chamada é uma simulação visual: o site ainda não se comunica com o robô.
- **Relatos (cadastrar, editar, remover):** formulário com nome, tipo (problema ou dúvida) e mensagem. Cada relato pode ser editado ou removido, e há a opção de apagar todos (com confirmação).
- **Rascunho automático:** o que está sendo digitado é salvo e volta após atualizar a página.

## Checklist dos 5 critérios de avaliação

| # | Critério | Atende? | Por quê / onde |
|---|---|---|---|
| 1 | **Deploy e funcionamento** | ✅ | Publicado no GitHub Pages. Todos os arquivos (`index.html`, `style.css`, `script.js`, `cimol.png`, `favicon.svg`) carregam com status 200, sem tela em branco nem pasta exposta. O ícone `favicon.svg` foi incluído para eliminar o erro 404 que aparecia antes. |
| 2 | **Interatividade sem recarregamento** | ✅ | O envio do formulário chama `evento.preventDefault()` (`script.js`, evento `submit`). Cadastrar, editar, remover e limpar relatos atualizam a lista via JavaScript, sem recarregar a página. Os botões de ação usam `type="button"`. |
| 3 | **Persistência de dados** | ✅ | Relatos ficam no `localStorage` (chave `chamarRobo.relatos`) e o rascunho do formulário em `chamarRobo.rascunho`. Ao apertar F5, a lista e o texto digitado reaparecem. A leitura trata dados ausentes ou corrompidos sem quebrar a página. |
| 4 | **Estabilidade do console** | ✅ | Leitura e gravação no `localStorage` protegidas com `try/catch`; nenhum erro em vermelho ao usar todos os recursos (chamada, envio vazio, cadastro, edição, remoção, limpar tudo e F5). |
| 5 | **Adaptabilidade, responsividade e acessibilidade** | ✅ | Layout em duas colunas que empilha abaixo de 820 px, sem rolagem horizontal em 320, 390 e 1280 px. HTML semântico (`header`, `main`, `section`, `footer`, `button`, `label`), mapa com `role="img"` e descrição em `aria-label`, mensagens de estado anunciadas por leitor de tela (`role="status"`, `aria-live`), botões de editar/remover com nome acessível, link "Pular para o conteúdo", foco visível, contraste revisado e respeito a `prefers-reduced-motion`. |

## Como testar (roteiro do pitch)

1. Abra o link da aplicação e pressione **F12 > Console**.
2. Clique em **Chamar robô** e acompanhe o trajeto e o estado.
3. Clique em **Enviar** com os campos vazios: aparece o aviso, sem recarregar.
4. Cadastre dois relatos, edite um e remova o outro.
5. Pressione **F5**: os relatos continuam na lista.
6. No DevTools, ative a visualização de celular (**Ctrl+Shift+M**) e confira o layout empilhado.

## Testes realizados

Testes automatizados no Google Chrome (headless) em 1280 px, 390 px e 320 px de largura, em 08/11/2026:

| Verificação | Resultado |
|---|---|
| Chamada do robô (ida e retorno) | Funcionou nas três larguras |
| Envio com campos vazios | Bloqueado com aviso |
| Cadastrar, editar e remover | Funcionou, sem recarregar a página |
| F5 | Relatos e rascunho mantidos |
| Console e requisições | Nenhum erro, nenhuma requisição com falha |
| Rolagem horizontal | Nenhuma |
| Acessibilidade (axe-core 4) | Nenhuma violação encontrada |

## Tecnologias

HTML, CSS e JavaScript puro, sem frameworks e sem servidor. Dados salvos com a Web Storage API (`localStorage`). Hospedagem no GitHub Pages.

## Estrutura

```
index.html     estrutura e conteúdo da página
style.css      aparência, layout responsivo e acessibilidade
script.js      chamada do robô e CRUD dos relatos com localStorage
cimol.png      imagem de satélite do entorno da escola (Google Maps)
favicon.svg    ícone da página
prints/        capturas usadas no trabalho escrito
docs/          QR Codes do site e do repositório
```

## Referências consultadas

- MOZILLA. Window.localStorage. MDN Web Docs. Disponível em: https://developer.mozilla.org/pt-BR/docs/Web/API/Window/localStorage
- MOZILLA. Event.preventDefault(). MDN Web Docs. Disponível em: https://developer.mozilla.org/pt-BR/docs/Web/API/Event/preventDefault
- W3C. Web Content Accessibility Guidelines (WCAG) 2.2. Disponível em: https://www.w3.org/TR/WCAG22/
- GITHUB. O que é o GitHub Pages? Disponível em: https://docs.github.com/pt/pages/getting-started-with-github-pages/what-is-github-pages

## Limitações conhecidas

- Os relatos ficam salvos apenas no navegador de quem envia; ainda não chegam à equipe do projeto.
- A chamada é simulada e depende da navegação por SLAM do robô, ainda em desenvolvimento.

Imagem do mapa: Google Maps.
