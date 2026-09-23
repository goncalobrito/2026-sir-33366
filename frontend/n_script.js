const API_URL = 'http://localhost:3000';

let cursosCache = [];
let alunosCache = [];

// Elementos do DOM
const alunosList = document.getElementById('alunosList');
const cursosList = document.getElementById('cursosList');
const selectAlunoCurso = document.getElementById('selectAlunoCurso');

const metricTotalAlunos = document.getElementById('metricTotalAlunos');
const metricTotalCursos = document.getElementById('metricTotalCursos');
const badgeTotalAlunos = document.getElementById('badgeTotalAlunos');
const badgeTotalCursos = document.getElementById('badgeTotalCursos');

const inputFiltroAlunos = document.getElementById('inputFiltroAlunos');
const inputFiltroCursos = document.getElementById('inputFiltroCursos');

// Modais
const modalCurso = document.getElementById('modalCurso');
const modalAluno = document.getElementById('modalAluno');
const modalParticipantes = document.getElementById('modalParticipantes');

document.addEventListener('DOMContentLoaded', () => {
  recarregarTudo();

  if (inputFiltroAlunos) inputFiltroAlunos.addEventListener('input', (e) => renderizarAlunos(e.target.value));
  if (inputFiltroCursos) inputFiltroCursos.addEventListener('input', (e) => renderizarCursos(e.target.value));
});

async function recarregarTudo() {
  console.log('[DEBUG] A recarregar dados do servidor...');
  await carregarAlunos();
  await carregarCursos();
  renderizarAlunos(inputFiltroAlunos ? inputFiltroAlunos.value : '');
  renderizarCursos(inputFiltroCursos ? inputFiltroCursos.value : '');
  atualizarMetricas();
}

function atualizarMetricas() {
  if (metricTotalAlunos) metricTotalAlunos.textContent = alunosCache.length;
  if (metricTotalCursos) metricTotalCursos.textContent = cursosCache.length;
  if (badgeTotalAlunos) badgeTotalAlunos.textContent = `${alunosCache.length} Matriculados`;
  if (badgeTotalCursos) badgeTotalCursos.textContent = `${cursosCache.length} Cursos`;
}

/* ==========================================
   ALERTA CRÍTICO // TOAST (2 segundos)
   ========================================== */
let warningTimer;
function triggerCourseBlockModal(courseName, code, studentCount) {
  clearTimeout(warningTimer);
  const warning = document.getElementById('criticalDeleteWarning');
  const title = document.getElementById('warningTitle');
  const desc = document.getElementById('warningDesc');

  title.textContent = `${courseName} (#${code})`;
  desc.innerHTML = `Não é possível eliminar o curso <strong class='text-white font-semibold'>‘${courseName}’</strong>. Existem <span class='text-[#FF3344] font-bold'>${studentCount} aluno(s)</span> matriculado(s) vinculado(s) a esta disciplina.`;

  warning.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-6');
  warning.classList.add('opacity-100', 'translate-y-0');

  warningTimer = setTimeout(() => {
    dismissDeleteWarning();
  }, 2000);
}

function dismissDeleteWarning() {
  const warning = document.getElementById('criticalDeleteWarning');
  if (warning) {
    warning.classList.add('opacity-0', 'pointer-events-none', 'translate-y-6');
    warning.classList.remove('opacity-100', 'translate-y-0');
  }
}

/* ==========================================
   CURSOS
   ========================================== */
async function carregarCursos() {
  try {
    const res = await fetch(`${API_URL}/cursos`);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao obter cursos`);
    
    cursosCache = await res.json();
    console.log('[DEBUG] Cursos carregados:', cursosCache);

    // Contagem de alunos segura (calcula primeiro pela cache local de alunos, depois tenta endpoint)
    cursosCache.forEach(c => {
      const nomeFinal = c.nome || c.nomeDoCurso || 'Sem Nome';
      c.nome = nomeFinal;
      c.totalAlunos = alunosCache.filter(a => String(a.idCurso || a.cursoId) === String(c.id)).length;
    });

    renderizarCursos();
    atualizarSelectCursos();

    // Atualiza contagens reais via endpoint de forma assíncrona sem bloquear
    cursosCache.forEach(async (curso) => {
      try {
        const resAlunos = await fetch(`${API_URL}/cursos/${curso.id}/alunos`);
        if (resAlunos.ok) {
          const dados = await resAlunos.json();
          curso.totalAlunos = dados.length;
          const badgeElem = document.getElementById(`contagem-curso-${curso.id}`);
          if (badgeElem) badgeElem.textContent = `${dados.length} Aluno(s) ativos`;
        }
      } catch (e) {
        // Ignora caso a rota não esteja ativa
      }
    });

  } catch (err) {
    console.error('[ERRO] Falha ao carregar cursos:', err);
    cursosList.innerHTML = `<div class="p-3 text-red-400 font-label-code text-xs">Erro ao ligar ao backend (/cursos). Verifica a consola.</div>`;
  }
}

function renderizarCursos(filtro = '') {
  cursosList.innerHTML = '';
  const termo = filtro.toLowerCase().trim();

  const filtrados = cursosCache.filter(c => 
    (c.nome && c.nome.toLowerCase().includes(termo)) || String(c.id).includes(termo)
  );

  if (filtrados.length === 0) {
    cursosList.innerHTML = `<div class="p-4 text-center text-neutral-500 font-label-code text-xs">Nenhum curso registado.</div>`;
    return;
  }

  filtrados.forEach(curso => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-space-md bg-black border border-white/30 hover:border-white transition-all shadow-[0_0_8px_rgba(255,255,255,0.15)] group';
    item.innerHTML = `
      <div class="flex flex-col gap-0.5 min-w-0 pr-space-sm">
        <span class="font-headline-sm text-body-lg font-medium text-white truncate tracking-tight">${curso.nome}</span>
        <div class="flex items-center gap-space-sm font-label-code text-label-meta text-on-surface-variant">
          <span class="text-white/90">ID #${curso.id}</span>
          <span>/</span>
          <span id="contagem-curso-${curso.id}" class="uppercase tracking-wider text-white">${curso.totalAlunos || 0} Aluno(s) ativos</span>
        </div>
      </div>
      <div class="flex items-center gap-space-xs shrink-0">
        <button class="px-2 h-9 bg-neutral-900 border border-white/40 text-white font-label-code text-[11px] uppercase hover:bg-neutral-800 transition-colors cursor-pointer" onclick="verParticipantes('${curso.id}', '${curso.nome}')" title="Ver Participantes">
          Alunos
        </button>
        <button class="w-9 h-9 bg-white text-black flex items-center justify-center rounded-none hover:bg-neutral-200 active:scale-90 transition-transform cursor-pointer" onclick="abrirModalCurso('${curso.id}')" title="Editar ${curso.nome}">
          <span class="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button class="w-9 h-9 bg-white text-black flex items-center justify-center rounded-none hover:bg-[#FF3344] hover:text-white active:scale-90 transition-all cursor-pointer" onclick="tentarEliminarCurso('${curso.id}', '${curso.nome}', ${curso.totalAlunos || 0})" title="Eliminar Curso">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    `;
    cursosList.appendChild(item);
  });
}

function atualizarSelectCursos() {
  selectAlunoCurso.innerHTML = '<option value="">Selecione o Curso...</option>';
  cursosCache.forEach(curso => {
    const opt = document.createElement('option');
    opt.value = curso.id;
    opt.textContent = curso.nome;
    selectAlunoCurso.appendChild(opt);
  });
}

function abrirModalCurso(id = null) {
  const form = document.getElementById('formCurso');
  form.reset();

  if (id) {
    const curso = cursosCache.find(c => String(c.id) === String(id));
    document.getElementById('modalCursoTitle').textContent = 'Editar Disciplina';
    document.getElementById('inputCursoId').value = curso.id;
    document.getElementById('inputCursoNome').value = curso.nome;
  } else {
    document.getElementById('modalCursoTitle').textContent = 'Criar Disciplina';
    document.getElementById('inputCursoId').value = '';
  }

  modalCurso.showModal();
}

document.getElementById('formCurso').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('inputCursoId').value;
  const nome = document.getElementById('inputCursoNome').value;

  const metodo = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/cursos/${id}` : `${API_URL}/cursos`;

  const res = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome })
  });

  if (res.ok) {
    fecharModal('modalCurso');
    recarregarTudo();
  }
});

async function tentarEliminarCurso(id, nome, totalAlunos) {
  if (totalAlunos > 0) {
    triggerCourseBlockModal(nome, id, totalAlunos);
    return;
  }

  const res = await fetch(`${API_URL}/cursos/${id}`, { method: 'DELETE' });

  if (res.status === 409 || res.status === 400) {
    triggerCourseBlockModal(nome, id, totalAlunos || 1);
    return;
  }

  if (res.ok) {
    recarregarTudo();
  }
}

async function verParticipantes(cursoId, nomeCurso) {
  document.getElementById('modalParticipantesTitle').textContent = `Participantes // ${nomeCurso}`;
  const corpo = document.getElementById('listaParticipantesCorpo');
  corpo.innerHTML = '<li class="text-neutral-500 py-2">Consultando registros...</li>';
  modalParticipantes.showModal();

  try {
    const res = await fetch(`${API_URL}/cursos/${cursoId}/alunos`);
    const alunos = await res.json();

    corpo.innerHTML = '';
    if (alunos.length === 0) {
      corpo.innerHTML = '<li class="text-neutral-500 py-2">Nenhum aluno matriculado nesta disciplina.</li>';
    } else {
      alunos.forEach(aluno => {
        const li = document.createElement('li');
        li.className = 'p-2 bg-black border border-white/20 flex justify-between items-center';
        li.innerHTML = `<span class="text-white font-medium">${aluno.nome}</span><span class="text-neutral-500">ID #${aluno.id}</span>`;
        corpo.appendChild(li);
      });
    }
  } catch {
    corpo.innerHTML = '<li class="text-[#FF3344] py-2">Erro ao conectar com a API.</li>';
  }
}

/* ==========================================
   ALUNOS
   ========================================== */
async function carregarAlunos() {
  try {
    const res = await fetch(`${API_URL}/alunos`);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao obter alunos`);

    alunosCache = await res.json();
    console.log('[DEBUG] Alunos carregados:', alunosCache);
    renderizarAlunos();
  } catch (err) {
    console.error('[ERRO] Falha ao carregar alunos:', err);
    alunosList.innerHTML = `<div class="p-3 text-red-400 font-label-code text-xs">Erro ao ligar ao backend (/alunos). Verifica a consola.</div>`;
  }
}

function renderizarAlunos(filtro = '') {
  alunosList.innerHTML = '';
  const termo = filtro.toLowerCase().trim();

  const filtrados = alunosCache.filter(a =>
    (a.nome && a.nome.toLowerCase().includes(termo)) || String(a.id).includes(termo)
  );

  if (filtrados.length === 0) {
    alunosList.innerHTML = `<div class="p-4 text-center text-neutral-500 font-label-code text-xs">Nenhum aluno registado.</div>`;
    return;
  }

  filtrados.forEach(aluno => {
    const idC = aluno.idCurso || aluno.cursoId;
    const curso = cursosCache.find(c => String(c.id) === String(idC));
    const nomeCurso = curso ? curso.nome : (idC ? `ID #${idC}` : 'SEM DISCIPLINA');

    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-space-md bg-black border border-white/30 hover:border-white transition-all shadow-[0_0_8px_rgba(255,255,255,0.15)] group';
    item.innerHTML = `
      <div class="flex flex-col gap-0.5 min-w-0 pr-space-sm">
        <span class="font-headline-sm text-body-lg font-medium text-white truncate tracking-tight">${aluno.nome}</span>
        <div class="flex items-center gap-space-sm font-label-code text-label-meta text-on-surface-variant">
          <span class="text-white/90">ID #${aluno.id}</span>
          <span>/</span>
          <span class="uppercase tracking-wider truncate text-white">${nomeCurso}</span>
        </div>
      </div>
      <div class="flex items-center gap-space-xs shrink-0">
        <button class="w-9 h-9 bg-white text-black flex items-center justify-center rounded-none hover:bg-neutral-200 active:scale-90 transition-transform cursor-pointer" onclick="abrirModalAluno('${aluno.id}')" title="Editar ${aluno.nome}">
          <span class="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button class="w-9 h-9 bg-white text-black flex items-center justify-center rounded-none hover:bg-[#FF3344] hover:text-white active:scale-90 transition-all cursor-pointer" onclick="eliminarAluno('${aluno.id}')" title="Eliminar Aluno">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    `;
    alunosList.appendChild(item);
  });
}

function abrirModalAluno(id = null) {
  const form = document.getElementById('formAluno');
  form.reset();

  if (id) {
    const aluno = alunosCache.find(a => String(a.id) === String(id));
    document.getElementById('modalAlunoTitle').textContent = 'Editar Registro Aluno';
    document.getElementById('inputAlunoId').value = aluno.id;
    document.getElementById('inputAlunoNome').value = aluno.nome;
    document.getElementById('selectAlunoCurso').value = aluno.idCurso || aluno.cursoId;
  } else {
    document.getElementById('modalAlunoTitle').textContent = 'Registrar Aluno';
    document.getElementById('inputAlunoId').value = '';
  }

  modalAluno.showModal();
}

document.getElementById('formAluno').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('inputAlunoId').value;
  const nome = document.getElementById('inputAlunoNome').value;
  const idCurso = Number(document.getElementById('selectAlunoCurso').value);

  const metodo = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/alunos/${id}` : `${API_URL}/alunos`;

  const res = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, idCurso })
  });

  if (res.ok) {
    fecharModal('modalAluno');
    recarregarTudo();
  }
});

async function eliminarAluno(id) {
  const res = await fetch(`${API_URL}/alunos/${id}`, { method: 'DELETE' });
  if (res.ok) {
    recarregarTudo();
  }
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.close();
}

window.abrirModalCurso = abrirModalCurso;
window.abrirModalAluno = abrirModalAluno;
window.tentarEliminarCurso = tentarEliminarCurso;
window.eliminarAluno = eliminarAluno;
window.verParticipantes = verParticipantes;
window.fecharModal = fecharModal;
window.recarregarTudo = recarregarTudo;
window.dismissDeleteWarning = dismissDeleteWarning;
