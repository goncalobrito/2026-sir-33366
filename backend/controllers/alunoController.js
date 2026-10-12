const Aluno = require('../models/Aluno');

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
    const { nome, apelido, idCurso, anoCurricular } = req.body;
    const novoAluno = await Aluno.create({ nome, apelido, idCurso, anoCurricular });
    res.status(201).json(novoAluno);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateAluno = async (req, res) => {
  try {
    const alunoAtualizado = await Aluno.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!alunoAtualizado) return res.status(404).json({ message: 'Aluno não encontrado' });
    res.status(200).json(alunoAtualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
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