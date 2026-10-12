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
 *         - apelido
 *         - idCurso
 *         - anoCurricular
 *       properties:
 *         id:
 *           type: string
 *         nome:
 *           type: string
 *         apelido:
 *           type: string
 *         idCurso:
 *           type: string
 *         anoCurricular:
 *           type: integer
 */

/**
 * @openapi
 * /alunos:
 *   get:
 *     summary: Lista todos os alunos
 *     responses:
 *       200:
 *         description: Lista devolvida com sucesso
 *   post:
 *     summary: Adiciona um novo aluno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Aluno'
 *     responses:
 *       201:
 *         description: Aluno criado
 */
router.route('/')
  .get(alunoController.getAlunos)
  .post(alunoController.createAluno);

/**
 * @openapi
 * /alunos/{id}:
 *   get:
 *     summary: Obtém um aluno por ID
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
 *     summary: Atualiza um aluno por ID
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
 *   delete:
 *     summary: Apaga um aluno por ID
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