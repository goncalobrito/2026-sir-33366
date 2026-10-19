const mongoose = require('mongoose');

const alunoSchema = new mongoose.Schema({
  nome: { type: String, required: [true, 'O nome é obrigatório'], trim: true },
  apelido: { type: String, default: '', trim: true },
  // Guarda o id (string) do Curso. A existência do curso é validada no controller.
  idCurso: { type: String, default: null },
  anoCurricular: { type: Number, default: 1, min: [1, 'O ano curricular deve ser >= 1'] }
}, {
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.idCurso = ret.idCurso ? String(ret.idCurso) : null;
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('Aluno', alunoSchema);
