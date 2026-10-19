const express = require('express');
const router = express.Router();
const cursoController = require('../controllers/cursoController');

/**
 * @openapi
 * components:
 *   schemas:
 *     Curso:
 *       type: object
 *       required:
 *         - nome
 *       properties:
 *         id:
 *           type: string
 *           readOnly: true
 *           description: ID gerado automaticamente
 *         nome:
 *           type: string
 *           description: Nome da disciplina ou curso
 */

/**
 * @openapi
 * /cursos:
 *   get:
 *     summary: Lista todos os cursos
 *     tags:
 *       - Cursos
 *     responses:
 *       200:
 *         description: Lista de cursos devolvida com sucesso
 *   post:
 *     summary: Cria um novo curso
 *     tags:
 *       - Cursos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Curso'
 *     responses:
 *       201:
 *         description: Curso criado com sucesso
 */
router.route('/')
  .get(cursoController.getCursos)
  .post(cursoController.createCurso);

/**
 * @openapi
 * /cursos/{id}:
 *   get:
 *     summary: Obtém um curso por ID
 *     tags:
 *       - Cursos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curso encontrado
 *       404:
 *         description: Curso não encontrado
 *   put:
 *     summary: Atualiza o nome de um curso
 *     tags:
 *       - Cursos
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
 *             $ref: '#/components/schemas/Curso'
 *     responses:
 *       200:
 *         description: Curso atualizado com sucesso
 *       404:
 *         description: Curso não encontrado
 *   delete:
 *     summary: Elimina um curso
 *     tags:
 *       - Cursos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curso removido com sucesso
 *       409:
 *         description: Conflito - existem alunos vinculados ao curso
 */
router.route('/:id')
  .get(cursoController.getCursoById)
  .put(cursoController.updateCurso)
  .delete(cursoController.deleteCurso);

/**
 * @openapi
 * /cursos/{id}/alunos:
 *   get:
 *     summary: Lista todos os alunos vinculados a um curso
 *     tags:
 *       - Cursos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de alunos associados ao curso
 *       404:
 *         description: Curso não encontrado
 */
router.get('/:id/alunos', cursoController.getAlunosDoCurso);

/**
 * @openapi
 * /cursos/{id}/alunos/{alunoId}:
 *   delete:
 *     summary: Remove um aluno de um curso (o aluno fica sem curso)
 *     tags:
 *       - Cursos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: alunoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aluno removido do curso
 *       404:
 *         description: Aluno não encontrado neste curso
 */
router.delete('/:id/alunos/:alunoId', cursoController.removerAlunoDoCurso);

module.exports = router;
