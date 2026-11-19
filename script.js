/* =========================================================
   script.js — Lógica de Dados e Persistência do Dashboard NutriVida
   ========================================================= */

const CHAVE = "nutriVidaDashboard-dados";

const formulario = document.getElementById("formulario");
const listaEl    = document.getElementById("lista");
const painel     = document.getElementById("painel");
const busca      = document.getElementById("busca");
const filtro     = document.getElementById("filtro");
const aviso      = document.getElementById("aviso");

function lerFichas(){
  const texto = localStorage.getItem(CHAVE);
  if(!texto) return [];
  try { return JSON.parse(texto); } catch(erro){ return []; }
}

function gravarFichas(fichas){
  localStorage.setItem(CHAVE, JSON.stringify(fichas));
}

function escapar(texto){
  const caixa = document.createElement("div");
  caixa.textContent = texto || "";
  return caixa.innerHTML;
}

function mostrar(){
  const fichas = lerFichas();
  const termo = busca.value.trim().toLowerCase();
  const escolhida = filtro.value;

  const visiveis = fichas.filter(function(f){
    const passaFiltro = (escolhida === "todas") || (f.tipoRefeicao === escolhida);
    const textoTodo = Object.values(f).join(" ").toLowerCase();
    const passaBusca = (termo === "") || (textoTodo.indexOf(termo) >= 0);
    return passaFiltro && passaBusca;
  });

  listaEl.innerHTML = "";

  if(visiveis.length === 0){
    listaEl.innerHTML = '<div class="vazio-msg"><p>Nenhuma refeição encontrada. Cadastre o seu plano no painel ao lado!</p></div>';
    desenharPainel(fichas);
    return;
  }

  visiveis.forEach(function(f){
    const cartao = document.createElement("article");
    cartao.className = "meal-card";
    
    let html = "";
    html += '<div class="meal-card-header">';
    html += '<h4>' + escapar(f.tituloDaAcao) + '</h4>';
    html += '<span class="badge-obj">' + escapar(f.objetivo) + '</span>';
    html += '</div>';
    
    html += '<div class="meal-meta">';
    html += '<span>🥗 ' + escapar(f.tipoRefeicao) + '</span>';
    html += '<span>🔥 ' + escapar(f.calorias) + ' kcal</span>';
    html += '</div>';

    html += '<p class="meal-body"><b>Ingredientes:</b> ' + escapar(f.oQueFoiFeito) + '</p>';
    html += '<p class="meal-body"><b>Usuário:</b> ' + escapar(f.local) + '</p>';

    html += '<footer><small>Data: ' + escapar(f.data) + '</small>' +
            '<button type="button" class="btn-delete-card" data-id="' + f.id + '">Excluir</button></footer>';
    
    cartao.innerHTML = html;
    listaEl.appendChild(cartao);
  });

  desenharPainel(fichas);
}

function desenharPainel(fichas){
  let html = "";

  const totalRefeicoes = fichas.length;
  const somaCalorias = fichas.reduce(function(acc, item){
    return acc + Number(item.calorias || 0);
  }, 0);

  html += '<div class="metric-box"><span>Refeições Cadastradas</span><b>' + totalRefeicoes + '</b></div>';
  html += '<div class="metric-box"><span>Energia Planejada</span><b>' + somaCalorias + ' kcal</b></div>';

  painel.innerHTML = html;
}

formulario.addEventListener("submit", function(evento){
  evento.preventDefault();

  const nova = {
    id: Date.now(),
    tituloDaAcao: document.getElementById("tituloDaAcao").value.trim(),
    tipoRefeicao: document.getElementById("tipoRefeicao").value,
    objetivo: document.getElementById("objetivo").value,
    calorias: Number(document.getElementById("calorias").value),
    local: document.getElementById("local").value.trim(),
    oQueFoiFeito: document.getElementById("oQueFoiFeito").value.trim(),
    data: new Date().toLocaleDateString("pt-BR")
  };

  const fichas = lerFichas();
  fichas.unshift(nova);
  gravarFichas(fichas);

  formulario.reset();
  mostrar();

  aviso.textContent = "Refeição adicionada com sucesso!";
  setTimeout(function(){ aviso.textContent = ""; }, 3000);
});

listaEl.addEventListener("click", function(evento){
  if(!evento.target.classList.contains("btn-delete-card")) return;
  const id = Number(evento.target.getAttribute("data-id"));
  const fichas = lerFichas().filter(function(f){ return f.id !== id; });
  gravarFichas(fichas);
  mostrar();
});

busca.addEventListener("input", mostrar);
filtro.addEventListener("change", mostrar);

document.getElementById("limpar").addEventListener("click", function(){
  if(confirm("Deseja apagar todos os registros salvos?")){
    localStorage.removeItem(CHAVE);
    mostrar();
  }
});

document.getElementById("exportar").addEventListener("click", function(){
  const texto = JSON.stringify(lerFichas(), null, 2);
  const arquivo = new Blob([texto], {type: "application/json"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(arquivo);
  link.download = "backup-nutrivida.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

document.getElementById("importar").addEventListener("change", function(evento){
  const arquivo = evento.target.files[0];
  if(!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = function(){
    try {
      const recebidas = JSON.parse(leitor.result);
      if(!Array.isArray(recebidas)) throw new Error("Invalido");
      gravarFichas(recebidas.concat(lerFichas()));
      mostrar();
      aviso.textContent = "Dados importados!";
    } catch(erro){
      aviso.textContent = "Arquivo de backup inválido.";
    }
  };
  leitor.readAsText(arquivo);
});

mostrar();