const mongoose = require('mongoose');
const Aluno = require('../models/Aluno');
const Curso = require('../models/Curso');

class ErroHttp extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Aceita idCurso (oficial) e alguns nomes alternativos que o frontend possa enviar.
// Se vier um objeto (ex.: o curso inteiro), usa o respetivo id.
const lerIdCurso = (body) => {
  let valor = body.idCurso;
  if (valor === undefined) valor = body.cursoId;
  if (valor === undefined) valor = body.curso;
  if (valor && typeof valor === 'object') valor = valor.id || valor._id;
  return valor;
};

// Devolve o id do curso (string) ou null (sem curso). Lança erro se for inválido/inexistente.
const resolverCurso = async (valor) => {
  if (valor === null || valor === '' || valor === 'null') return null;
  const id = String(valor).trim();
  if (!mongoose.isValidObjectId(id)) throw new ErroHttp(400, 'idCurso inválido');
  const existe = await Curso.exists({ _id: id });
  if (!existe) throw new ErroHttp(404, 'Curso não encontrado');
  return id;
};

const responderErro = (res, error) =>
  res.status(error.status || 400).json({ message: error.message });

exports.getAlunos = async (req, res) => {
  try {
    const alunos = await Aluno.find();
    res.status(200).json(alunos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlunoById = async (req, res) => {
  try {
    const aluno = await Aluno.findById(req.params.id);
    if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado' });
    res.status(200).json(aluno);
  } catch (error) {
    res.status(400).json({ message: 'ID inválido ou erro na procura' });
  }
};

exports.createAluno = async (req, res) => {
  try {
    const { nome, apelido, anoCurricular } = req.body;
    const idCurso = await resolverCurso(lerIdCurso(req.body) ?? null);

    const dados = { nome, idCurso };
    if (apelido !== undefined) dados.apelido = apelido;
    if (anoCurricular !== undefined) dados.anoCurricular = anoCurricular;

    const novoAluno = await Aluno.create(dados);
    res.status(201).json(novoAluno);
  } catch (error) {
    responderErro(res, error);
  }
};

exports.updateAluno = async (req, res) => {
  try {
    // Só campos permitidos (evita alterar _id, __v, etc.)
    const dados = {};
    for (const campo of ['nome', 'apelido', 'anoCurricular']) {
      if (req.body[campo] !== undefined) dados[campo] = req.body[campo];
    }

    const idCurso = lerIdCurso(req.body);
    if (idCurso !== undefined) dados.idCurso = await resolverCurso(idCurso);

    const alunoAtualizado = await Aluno.findByIdAndUpdate(
      req.params.id,
      dados,
      { new: true, runValidators: true }
    );
    if (!alunoAtualizado) return res.status(404).json({ message: 'Aluno não encontrado' });
    res.status(200).json(alunoAtualizado);
  } catch (error) {
    responderErro(res, error);
  }
};

exports.deleteAluno = async (req, res) => {
  try {
    const alunoRemovido = await Aluno.findByIdAndDelete(req.params.id);
    if (!alunoRemovido) return res.status(404).json({ message: 'Aluno não encontrado' });
    res.status(200).json({ message: 'Aluno removido com sucesso' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
