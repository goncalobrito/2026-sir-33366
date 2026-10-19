const express = require('express');
const router = express.Router();
const alunoController = require('../controllers/alunoController');

/**
 * @openapi
 * components:
 *   schemas:
 *     Aluno:
 *       type: object
 *       required:
 *         - nome
 *       properties:
 *         id:
 *           type: string
 *           readOnly: true
 *         nome:
 *           type: string
 *         apelido:
 *           type: string
 *         idCurso:
 *           type: string
 *           nullable: true
 *           description: ID de um curso existente (ou null para sem curso)
 *         anoCurricular:
 *           type: integer
 *           minimum: 1
 */

/**
 * @openapi
 * /alunos:
 *   get:
 *     summary: Lista todos os alunos
 *     tags:
 *       - Alunos
 *     responses:
 *       200:
 *         description: Lista devolvida com sucesso
 *   post:
 *     summary: Adiciona um novo aluno
 *     tags:
 *       - Alunos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Aluno'
 *     responses:
 *       201:
 *         description: Aluno criado
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Curso indicado não existe
 */
router.route('/')
  .get(alunoController.getAlunos)
  .post(alunoController.createAluno);

/**
 * @openapi
 * /alunos/{id}:
 *   get:
 *     summary: Obtém um aluno por ID
 *     tags:
 *       - Alunos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aluno encontrado
 *       404:
 *         description: Não encontrado
 *   put:
 *     summary: Atualiza um aluno por ID (inclui associar/alterar o curso)
 *     tags:
 *       - Alunos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Aluno'
 *     responses:
 *       200:
 *         description: Aluno atualizado
 *       404:
 *         description: Aluno ou curso não encontrado
 *   delete:
 *     summary: Apaga um aluno por ID
 *     tags:
 *       - Alunos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aluno removido
 */
router.route('/:id')
  .get(alunoController.getAlunoById)
  .put(alunoController.updateAluno)
  .delete(alunoController.deleteAluno);

module.exports = router;
