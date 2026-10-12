const API_URL = 'http://localhost:3000';

let cursosCache = [];
let alunosCache = [];

// Elementos DOM
const listaCursos = document.getElementById('lista-cursos');
const listaAlunos = document.getElementById('lista-alunos');
const selectAlunoCurso = document.getElementById('aluno-curso-id');
const toast = document.getElementById('toast');

// Modais
const modalCurso = document.getElementById('modal-curso');
const modalAluno = document.getElementById('modal-aluno');
const modalParticipantes = document.getElementById('modal-participantes');

document.addEventListener('DOMContentLoaded', () => {
  recarregarTudo();
});

async function recarregarTudo() {
  await carregarCursos();
  await carregarAlunos();
}

/* ==========================================
   ALERTA / TOAST TEMPORIZADO (2 segundos)
   ========================================== */
let toastTimeout;
function mostrarErroToast(mensagem) {
  clearTimeout(toastTimeout);
  toast.textContent = mensagem;
  toast.style.display = 'block';

  toastTimeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 2000);
}

/* ==========================================
   CURSOS
   ========================================== */
async function carregarCursos() {
  try {
    const res = await fetch(`${API_URL}/cursos`);
    cursosCache = await res.json();

    listaCursos.innerHTML = '';
    cursosCache.forEach(curso => {
      const li = document.createElement('li');
      li.className = 'item-linha';
      li.innerHTML = `
        <div class="item-info">
          <span class="item-nome">${curso.nome}</span>
        </div>
        <div class="item-acoes">
          <button class="btn-acao ver" onclick="verParticipantes('${curso.id}', '${curso.nome}')">Participantes</button>
          <button class="btn-acao editar" onclick="abrirModalCurso('${curso.id}')">Editar</button>
          <button class="btn-acao eliminar" onclick="eliminarCurso('${curso.id}')">Eliminar</button>
        </div>
      `;
      listaCursos.appendChild(li);
    });

    atualizarSelectCursos();
  } catch (err) {
    console.error('Erro ao carregar cursos:', err);
  }
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
  const form = document.getElementById('form-curso');
  const titulo = document.getElementById('modal-curso-titulo');
  form.reset();

  if (id) {
    const curso = cursosCache.find(c => String(c.id) === String(id));
    titulo.textContent = 'Editar Curso';
    document.getElementById('curso-id').value = curso.id;
    document.getElementById('curso-nome').value = curso.nome;
  } else {
    titulo.textContent = 'Novo Curso';
    document.getElementById('curso-id').value = '';
  }

  modalCurso.showModal();
}

document.getElementById('form-curso').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('curso-id').value;
  const nome = document.getElementById('curso-nome').value;

  const metodo = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/cursos/${id}` : `${API_URL}/cursos`;

  const res = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome })
  });

  if (res.ok) {
    modalCurso.close();
    recarregarTudo();
  }
});

async function eliminarCurso(id) {
  const res = await fetch(`${API_URL}/cursos/${id}`, { method: 'DELETE' });

  // Se o backend impedir por ter alunos associados
  if (res.status === 409 || res.status === 400) {
    const body = await res.json();
    mostrarErroToast(body.mensagem || 'Não pode apagar um curso com alunos inscritos!');
    return;
  }

  if (res.ok) {
    recarregarTudo();
  }
}

async function verParticipantes(cursoId, nomeCurso) {
  document.getElementById('modal-participantes-titulo').textContent = `Alunos em ${nomeCurso}`;
  const lista = document.getElementById('lista-participantes');
  lista.innerHTML = '<li>A carregar...</li>';
  modalParticipantes.showModal();

  try {
    const res = await fetch(`${API_URL}/cursos/${cursoId}/alunos`);
    const alunos = await res.json();

    lista.innerHTML = '';
    if (alunos.length === 0) {
      lista.innerHTML = '<li>Nenhum aluno inscrito neste curso.</li>';
    } else {
      alunos.forEach(aluno => {
        const li = document.createElement('li');
        li.textContent = aluno.nome;
        lista.appendChild(li);
      });
    }
  } catch (err) {
    lista.innerHTML = '<li>Erro ao carregar participantes.</li>';
  }
}

/* ==========================================
   ALUNOS
   ========================================== */
async function carregarAlunos() {
  try {
    const res = await fetch(`${API_URL}/alunos`);
    alunosCache = await res.json();

    listaAlunos.innerHTML = '';
    alunosCache.forEach(aluno => {
      // Procura o curso pelo campo idCurso
      const curso = cursosCache.find(c => String(c.id) === String(aluno.idCurso));
      const nomeCurso = curso ? curso.nome : (aluno.idCurso ? `Curso ID #${aluno.idCurso}` : 'Sem Curso');

      const li = document.createElement('li');
      li.className = 'item-linha';
      li.innerHTML = `
        <div class="item-info">
          <span class="item-nome">${aluno.nome}</span>
          <span class="item-sub">${nomeCurso}</span>
        </div>
        <div class="item-acoes">
          <button class="btn-acao editar" onclick="abrirModalAluno('${aluno.id}')">Editar</button>
          <button class="btn-acao eliminar" onclick="eliminarAluno('${aluno.id}')">Eliminar</button>
        </div>
      `;
      listaAlunos.appendChild(li);
    });
  } catch (err) {
    console.error('Erro ao carregar alunos:', err);
  }
}

function abrirModalAluno(id = null) {
  const form = document.getElementById('form-aluno');
  const titulo = document.getElementById('modal-aluno-titulo');
  form.reset();

  if (id) {
    const aluno = alunosCache.find(a => String(a.id) === String(id));
    titulo.textContent = 'Editar Aluno';
    document.getElementById('aluno-id').value = aluno.id;
    document.getElementById('aluno-nome').value = aluno.nome;
    document.getElementById('aluno-curso-id').value = aluno.idCurso;
  } else {
    titulo.textContent = 'Novo Aluno';
    document.getElementById('aluno-id').value = '';
  }

  modalAluno.showModal();
}

document.getElementById('form-aluno').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('aluno-id').value;
  const nome = document.getElementById('aluno-nome').value;
  const idCurso = Number(document.getElementById('aluno-curso-id').value);

  const metodo = id ? 'PUT' : 'POST';
  const url = id ? `${API_URL}/alunos/${id}` : `${API_URL}/alunos`;

  const res = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, idCurso })
  });

  if (res.ok) {
    modalAluno.close();
    recarregarTudo();
  }
});

async function eliminarAluno(id) {
  const res = await fetch(`${API_URL}/alunos/${id}`, { method: 'DELETE' });
  if (res.ok) {
    recarregarTudo();
  }
}

function fecharModal(modalId) {
  document.getElementById(modalId).close();
}

// Funções globais para botões HTML inline
window.abrirModalCurso = abrirModalCurso;
window.abrirModalAluno = abrirModalAluno;
window.eliminarCurso = eliminarCurso;
window.eliminarAluno = eliminarAluno;
window.verParticipantes = verParticipantes;
window.fecharModal = fecharModal;
