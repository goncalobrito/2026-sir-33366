const mongoose = require('mongoose');

const cursoSchema = new mongoose.Schema({
  nome: { type: String, required: true }
}, {
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.nomeDoCurso = ret.nome; // compatibilidade retroativa
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('Curso', cursoSchema);