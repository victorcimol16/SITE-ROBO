/* =====================================================================
   RELATOS: cadastrar, editar e remover sem recarregar a página,
   com persistência no localStorage
   ===================================================================== */

const form = document.getElementById("formRelato");
const campoNome = document.getElementById("nome");
const campoTipo = document.getElementById("tipo");
const campoMensagem = document.getElementById("mensagem");
const botaoEnviar = document.getElementById("botaoEnviar");
const botaoCancelar = document.getElementById("botaoCancelar");
const aviso = document.getElementById("avisoForm");
const listaRelatos = document.getElementById("listaRelatos");
const botaoLimpar = document.getElementById("limparRelatos");

const CHAVE_STORAGE = "chamarRobo.relatos";
const CHAVE_RASCUNHO = "chamarRobo.rascunho";

// Id do relato em edição (null quando o formulário está cadastrando).
let idEmEdicao = null;

// Gera um identificador único simples para cada relato.
function novoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Versões antigas salvavam "Duvida" sem acento; normaliza na leitura.
function normalizarTipo(tipo) {
  return tipo === "Problema" ? "Problema" : "Dúvida";
}

// Lê os relatos salvos. Retorna sempre um array válido, mesmo que o dado
// esteja ausente ou corrompido, para não gerar erro no Console.
function carregarRelatos() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    const dados = bruto ? JSON.parse(bruto) : [];
    if (!Array.isArray(dados)) return [];
    return dados
      .filter(function (r) {
        return r && typeof r === "object" && r.nome && r.mensagem;
      })
      .map(function (r) {
        return {
          id: r.id || novoId(),
          nome: String(r.nome),
          tipo: normalizarTipo(r.tipo),
          mensagem: String(r.mensagem),
          data: Number(r.data) || Date.now(),
          editado: r.editado ? Number(r.editado) : null
        };
      });
  } catch (erro) {
    console.warn("Não foi possível ler os relatos salvos:", erro);
    return [];
  }
}

function salvarRelatos(relatos) {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(relatos));
    return true;
  } catch (erro) {
    console.warn("Não foi possível salvar os relatos:", erro);
    return false;
  }
}

// Rascunho: o que está digitado não se perde ao apertar F5.
function salvarRascunho() {
  if (idEmEdicao) return; // durante a edição, o dado já está salvo no relato
  try {
    const rascunho = {
      nome: campoNome.value,
      tipo: campoTipo.value,
      mensagem: campoMensagem.value
    };
    localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(rascunho));
  } catch (erro) {
    console.warn("Não foi possível salvar o rascunho:", erro);
  }
}

function limparRascunho() {
  try {
    localStorage.removeItem(CHAVE_RASCUNHO);
  } catch (erro) {
    console.warn("Não foi possível limpar o rascunho:", erro);
  }
}

function restaurarRascunho() {
  try {
    const bruto = localStorage.getItem(CHAVE_RASCUNHO);
    if (!bruto) return;
    const rascunho = JSON.parse(bruto);
    if (!rascunho || typeof rascunho !== "object") return;
    campoNome.value = rascunho.nome || "";
    campoTipo.value = normalizarTipo(rascunho.tipo);
    campoMensagem.value = rascunho.mensagem || "";
  } catch (erro) {
    console.warn("Não foi possível restaurar o rascunho:", erro);
  }
}

function formatarData(timestamp) {
  return new Date(timestamp).toLocaleString("pt-BR");
}

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = "aviso-form" + (tipo ? " " + tipo : "");
}

// Cria um botão de ação de um relato (editar ou remover).
function criarBotao(texto, classe, rotulo, aoClicar) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "botao-acao " + classe;
  b.textContent = texto;
  b.setAttribute("aria-label", rotulo);
  b.addEventListener("click", aoClicar);
  return b;
}

// Desenha a lista a partir do localStorage. Usa textContent em vez de
// innerHTML para que nada digitado pelo usuário seja interpretado como HTML.
function renderizarRelatos() {
  const relatos = carregarRelatos();
  listaRelatos.innerHTML = "";
  botaoLimpar.hidden = relatos.length === 0;

  if (relatos.length === 0) {
    const vazio = document.createElement("li");
    vazio.className = "lista-vazia";
    vazio.textContent = "Nenhum relato enviado ainda.";
    listaRelatos.appendChild(vazio);
    return;
  }

  // Mais recentes primeiro.
  relatos
    .slice()
    .reverse()
    .forEach(function (relato) {
      const item = document.createElement("li");
      const classeTipo =
        relato.tipo === "Problema" ? "tipo-problema" : "tipo-duvida";
      item.className = "relato-item " + classeTipo;
      if (relato.id === idEmEdicao) item.classList.add("em-edicao");

      const cabecalho = document.createElement("div");
      cabecalho.className = "relato-cabecalho";

      const nome = document.createElement("span");
      nome.className = "relato-nome";
      nome.textContent = relato.nome;

      const tipo = document.createElement("span");
      tipo.className = "relato-tipo";
      tipo.textContent = relato.tipo;

      cabecalho.appendChild(nome);
      cabecalho.appendChild(tipo);

      const msg = document.createElement("p");
      msg.className = "relato-msg";
      msg.textContent = relato.mensagem;

      const dataEl = document.createElement("span");
      dataEl.className = "relato-data";
      dataEl.textContent =
        formatarData(relato.data) +
        (relato.editado ? " (editado em " + formatarData(relato.editado) + ")" : "");

      const acoes = document.createElement("div");
      acoes.className = "relato-acoes";
      acoes.appendChild(
        criarBotao("Editar", "botao-editar", "Editar relato de " + relato.nome, function () {
          iniciarEdicao(relato.id);
        })
      );
      acoes.appendChild(
        criarBotao("Remover", "botao-remover", "Remover relato de " + relato.nome, function () {
          removerRelato(relato.id);
        })
      );

      item.appendChild(cabecalho);
      item.appendChild(msg);
      item.appendChild(dataEl);
      item.appendChild(acoes);
      listaRelatos.appendChild(item);
    });
}

function iniciarEdicao(id) {
  const relato = carregarRelatos().find(function (r) {
    return r.id === id;
  });
  if (!relato) return;
  idEmEdicao = id;
  campoNome.value = relato.nome;
  campoTipo.value = relato.tipo;
  campoMensagem.value = relato.mensagem;
  botaoEnviar.textContent = "Salvar alterações";
  botaoCancelar.hidden = false;
  mostrarAviso("Editando o relato de " + relato.nome + ".", "info");
  renderizarRelatos();
  campoNome.focus();
}

function encerrarEdicao() {
  idEmEdicao = null;
  form.reset();
  botaoEnviar.textContent = "Enviar";
  botaoCancelar.hidden = true;
}

function removerRelato(id) {
  const relatos = carregarRelatos();
  const restantes = relatos.filter(function (r) {
    return r.id !== id;
  });
  if (restantes.length === relatos.length) return;
  if (!salvarRelatos(restantes)) {
    mostrarAviso("Não foi possível remover. Tente novamente.", "erro");
    return;
  }
  if (id === idEmEdicao) encerrarEdicao();
  mostrarAviso("Relato removido.", "ok");
  renderizarRelatos();
  campoNome.focus();
}

// Envio do formulário: cadastra ou salva a edição, sem recarregar a página.
form.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const nome = campoNome.value.trim();
  const tipo = normalizarTipo(campoTipo.value);
  const mensagem = campoMensagem.value.trim();

  campoNome.setAttribute("aria-invalid", nome === "" ? "true" : "false");
  campoMensagem.setAttribute("aria-invalid", mensagem === "" ? "true" : "false");

  if (nome === "" || mensagem === "") {
    mostrarAviso("Preencha o nome e a mensagem.", "erro");
    (nome === "" ? campoNome : campoMensagem).focus();
    return;
  }

  const relatos = carregarRelatos();
  let textoSucesso;

  if (idEmEdicao) {
    const relato = relatos.find(function (r) {
      return r.id === idEmEdicao;
    });
    if (!relato) {
      encerrarEdicao();
      mostrarAviso("Esse relato não existe mais.", "erro");
      renderizarRelatos();
      return;
    }
    relato.nome = nome;
    relato.tipo = tipo;
    relato.mensagem = mensagem;
    relato.editado = Date.now();
    textoSucesso = "Relato atualizado!";
  } else {
    relatos.push({
      id: novoId(),
      nome: nome,
      tipo: tipo,
      mensagem: mensagem,
      data: Date.now(),
      editado: null
    });
    textoSucesso = "Relato enviado e salvo neste navegador.";
  }

  if (!salvarRelatos(relatos)) {
    mostrarAviso("Não foi possível salvar. Verifique o armazenamento do navegador.", "erro");
    return;
  }

  encerrarEdicao();
  limparRascunho();
  mostrarAviso(textoSucesso, "ok");
  renderizarRelatos();
});

botaoCancelar.addEventListener("click", function () {
  encerrarEdicao();
  restaurarRascunho();
  mostrarAviso("Edição cancelada.", "");
  renderizarRelatos();
});

botaoLimpar.addEventListener("click", function () {
  const total = carregarRelatos().length;
  if (total === 0) return;
  const ok = window.confirm(
    "Apagar todos os " + total + " relatos salvos neste navegador? Essa ação não pode ser desfeita."
  );
  if (!ok) return;
  salvarRelatos([]);
  if (idEmEdicao) encerrarEdicao();
  mostrarAviso("Todos os relatos foram apagados.", "ok");
  renderizarRelatos();
});

campoNome.addEventListener("input", salvarRascunho);
campoTipo.addEventListener("change", salvarRascunho);
campoMensagem.addEventListener("input", salvarRascunho);

// Ao carregar a página (inclusive após F5): restaura rascunho e relatos.
restaurarRascunho();
renderizarRelatos();
