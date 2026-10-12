const Curso = require('../models/Curso');
const Aluno = require('../models/Aluno');

exports.getCursos = async (req, res) => {
  try {
    const cursos = await Curso.find();
    res.status(200).json(cursos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCurso = async (req, res) => {
  try {
    const nome = req.body.nome || req.body.nomeDoCurso;
    const novoCurso = await Curso.create({ nome });
    res.status(201).json(novoCurso);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCurso = async (req, res) => {
  try {
    const nome = req.body.nome || req.body.nomeDoCurso;
    const curso = await Curso.findByIdAndUpdate(req.params.id, { nome }, { new: true });
    if (!curso) return res.status(404).json({ message: 'Curso não encontrado' });
    res.status(200).json(curso);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCurso = async (req, res) => {
  try {
    const totalAlunos = await Aluno.countDocuments({ idCurso: req.params.id });
    if (totalAlunos > 0) {
      return res.status(409).json({ message: 'Existem alunos matriculados neste curso.' });
    }
    const curso = await Curso.findByIdAndDelete(req.params.id);
    if (!curso) return res.status(404).json({ message: 'Curso não encontrado' });
    res.status(200).json({ message: 'Curso eliminado com sucesso' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAlunosDoCurso = async (req, res) => {
  try {
    const alunos = await Aluno.find({ idCurso: req.params.id });
    res.status(200).json(alunos);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};