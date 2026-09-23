import express from 'express';
import fs from 'fs/promises';
import cors from 'cors';

const app = express();
const PORT = 3000;
const DB_FILE = './bd.json';

app.use(express.json());
app.use(cors());

// Funções auxiliares para ler e escrever no ficheiro bd.json
async function lerBD() {
  try {
    const dados = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(dados);
  } catch (erro) {
    // Se o ficheiro não existir ou der erro, devolve estrutura vazia
    return { cursos: [], alunos: [] };
  }
}

async function gravarBD(dados) {
  await fs.writeFile(DB_FILE, JSON.stringify(dados, null, 2), 'utf-8');
}

/* ==========================================
   ROTAS DE CURSOS
   ========================================== */

// GET ALL CURSOS
app.get('/cursos', async (req, res) => {
  const bd = await lerBD();
  res.status(200).json(bd.cursos);
});

// GET CURSO BY ID
app.get('/cursos/:id', async (req, res) => {
  const bd = await lerBD();
  const curso = bd.cursos.find(c => String(c.id) === String(req.params.id));

  if (!curso) {
    return res.status(404).json({ mensagem: 'Curso não encontrado' });
  }

  res.status(200).json(curso);
});

// POST CURSO
app.post('/cursos', async (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).json({ mensagem: 'Nome é obrigatório' });
  }

  const bd = await lerBD();

  // Gera o próximo ID numérico
  const novoId = bd.cursos.length > 0 
    ? Math.max(...bd.cursos.map(c => Number(c.id) || 0)) + 1 
    : 1;

  const novoCurso = {
    id: novoId,
    nome
  };

  bd.cursos.push(novoCurso);
  await gravarBD(bd);

  res.status(201).json(novoCurso);
});

// PUT CURSO
app.put('/cursos/:id', async (req, res) => {
  const bd = await lerBD();
  const curso = bd.cursos.find(c => String(c.id) === String(req.params.id));

  if (!curso) {
    return res.status(404).json({ mensagem: 'Curso não encontrado' });
  }

  const { nome } = req.body;
  if (nome) curso.nome = nome;

  await gravarBD(bd);
  res.status(200).json(curso);
});

// DELETE CURSO
app.delete('/cursos/:id', async (req, res) => {
  const { id } = req.params;
  const bd = await lerBD();

  const index = bd.cursos.findIndex(c => String(c.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ mensagem: 'Curso não encontrado' });
  }

  // 1. Verificar se existem alunos associados a este curso
  const temAlunos = bd.alunos.some(a => String(a.idCurso) === String(id));
  if (temAlunos) {
    // 409 Conflict ou 400 Bad Request
    return res.status(409).json({ 
      mensagem: 'Não é possível apagar este curso porque ainda existem alunos inscritos nele.' 
    });
  }
  // 2. Se não tiver alunos, apaga normalmente
  bd.cursos.splice(index, 1);
  await gravarBD(bd);

  res.status(204).send();
});

// GET ALUNOS DE UM CURSO
app.get('/cursos/:id/alunos', async (req, res) => {
  const bd = await lerBD();
  const cursoExiste = bd.cursos.some(c => String(c.id) === String(req.params.id));

  if (!cursoExiste) {
    return res.status(404).json({ mensagem: 'Curso não encontrado' });
  }

  const alunosDoCurso = bd.alunos.filter(a => String(a.idCurso) === String(req.params.id));
  res.status(200).json(alunosDoCurso);
});

/* ==========================================
   ROTAS DE ALUNOS
   ========================================== */

// GET ALL ALUNOS
app.get('/alunos', async (req, res) => {
  const bd = await lerBD();
  res.status(200).json(bd.alunos);
});

// GET ALUNO BY ID
app.get('/alunos/:id', async (req, res) => {
  const bd = await lerBD();
  const aluno = bd.alunos.find(a => String(a.id) === String(req.params.id));

  if (!aluno) {
    return res.status(404).json({ mensagem: 'Aluno não encontrado' });
  }

  res.status(200).json(aluno);
});

// POST ALUNO
app.post('/alunos', async (req, res) => {
  const { nome, idCurso } = req.body;

  if (!nome || !idCurso) {
    return res.status(400).json({ mensagem: 'Nome e idCurso são obrigatórios' });
  }

  const bd = await lerBD();

  // Validação: verificar se o curso existe mesmo no bd.json
  const cursoExiste = bd.cursos.some(c => String(c.id) === String(idCurso));
  if (!cursoExiste) {
    return res.status(400).json({ mensagem: 'O idCurso indicado não existe' });
  }

  const novoId = bd.alunos.length > 0 
    ? Math.max(...bd.alunos.map(a => Number(a.id) || 0)) + 1 
    : 1;

  const novoAluno = {
    id: novoId,
    nome,
    idCurso: Number(idCurso)
  };

  bd.alunos.push(novoAluno);
  await gravarBD(bd);

  res.status(201).json(novoAluno);
});

// PUT ALUNO
app.put('/alunos/:id', async (req, res) => {
  const bd = await lerBD();
  const aluno = bd.alunos.find(a => String(a.id) === String(req.params.id));

  if (!aluno) {
    return res.status(404).json({ mensagem: 'Aluno não encontrado' });
  }

  const { nome, idCurso } = req.body;
  if (nome) aluno.nome = nome;
  if (idCurso) {
    const cursoExiste = bd.cursos.some(c => String(c.id) === String(idCurso));
    if (!cursoExiste) {
      return res.status(400).json({ mensagem: 'O idCurso indicado não existe' });
    }
    aluno.idCurso = Number(idCurso);
  }

  await gravarBD(bd);
  res.status(200).json(aluno);
});

// DELETE ALUNO
app.delete('/alunos/:id', async (req, res) => {
  const bd = await lerBD();
  const index = bd.alunos.findIndex(a => String(a.id) === String(req.params.id));

  if (index === -1) {
    return res.status(404).json({ mensagem: 'Aluno não encontrado' });
  }

  bd.alunos.splice(index, 1);
  await gravarBD(bd);

  res.status(204).send();
});

/* ==========================================
   ARRANQUE DO SERVIDOR
   ========================================== */
app.listen(PORT, () => {
  console.log(`Servidor ativo em http://localhost:${PORT}`);
});