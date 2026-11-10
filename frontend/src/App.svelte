<script>
  import { onMount } from 'svelte';

  const API_URL = 'https://api-escola-sir.onrender.com';

  // --- ESTADOS REATIVOS COM RUNES (Svelte 5) ---
  let cursos = $state([]);
  let alunos = $state([]);
  let filtroAlunos = $state('');
  let filtroCursos = $state('');
  let sidebarOpen = $state(false);

  // Modais de Formulário
  let modalCursoAberto = $state(false);
  let cursoEditando = $state(null);
  let cursoNomeInput = $state('');

  let modalAlunoAberto = $state(false);
  let alunoEditando = $state(null);
  let alunoNomeInput = $state('');
  let alunoApelidoInput = $state('');
  let alunoAnoCurricularInput = $state(1);
  let alunoCursoInput = $state('');

  // Modal Participantes
  let modalParticipantesAberto = $state(false);
  let cursoSelecionadoParticipantes = $state(null);
  let listaParticipantes = $state([]);
  let carregandoParticipantes = $state(false);

  // Alerta Crítico / Toast
  let warningAtivo = $state(false);
  let warningTitulo = $state('');
  let warningDesc = $state('');
  let warningTimer;

  // --- IDENTIFICAÇÃO E NOMES ---
  const getIdCurso = (a) => {
    if (!a) return '';
    if (typeof a.curso === 'object' && a.curso !== null) return String(a.curso.id || a.curso._id || '').trim();
    if (typeof a.idCurso === 'object' && a.idCurso !== null) return String(a.idCurso.id || a.idCurso._id || '').trim();
    return String(a.idCurso || a.cursoId || a.curso || a.id_curso || '').trim();
  };

  function obterNomeCurso(aluno) {
    if (aluno.nomeCurso) return aluno.nomeCurso;
    if (aluno.curso && typeof aluno.curso === 'object' && aluno.curso.nome) return aluno.curso.nome;
    if (aluno.curso && typeof aluno.curso === 'string' && isNaN(Number(aluno.curso)) && aluno.curso.length < 20) {
      return aluno.curso;
    }

    const idC = getIdCurso(aluno);
    if (!idC) return 'SEM DISCIPLINA';

    const cursoEncontrado = cursos.find(c => {
      const cId = String(c.id || c._id || '').trim();
      return cId === idC;
    });

    return cursoEncontrado ? (cursoEncontrado.nome || cursoEncontrado.nomeDoCurso) : `ID #${idC}`;
  }

  // --- ESTADOS DERIVADOS ($derived) ---
  const cursosComTotal = $derived(
    cursos.map(c => {
      const cId = String(c.id || c._id || '').trim();
      return {
        ...c,
        id: cId,
        nome: c.nome || c.nomeDoCurso || 'Sem Nome',
        totalAlunos: alunos.filter(a => getIdCurso(a) === cId).length
      };
    })
  );

  const alunosFiltrados = $derived(
    alunos.filter(a => {
      const termo = filtroAlunos.toLowerCase().trim();
      const nomeCompleto = `${a.nome || ''} ${a.apelido || ''}`.toLowerCase();
      return nomeCompleto.includes(termo) || String(a.id || a._id || '').toLowerCase().includes(termo);
    })
  );

  const cursosFiltrados = $derived(
    cursosComTotal.filter(c =>
      (c.nome && c.nome.toLowerCase().includes(filtroCursos.toLowerCase().trim())) ||
      String(c.id).toLowerCase().includes(filtroCursos.toLowerCase().trim())
    )
  );

  // --- FUNÇÕES DA API REST ---
  async function lerErro(res) {
    try {
      const dados = await res.json();
      return dados.erro || dados.message || `Erro HTTP ${res.status}`;
    } catch {
      return `Erro HTTP ${res.status}`;
    }
  }

  async function carregarDados() {
    try {
      const [resAlunos, resCursos] = await Promise.all([
        fetch(`${API_URL}/alunos`),
        fetch(`${API_URL}/cursos`)
      ]);
      if (resAlunos.ok) alunos = await resAlunos.json();
      if (resCursos.ok) cursos = await resCursos.json();
    } catch (err) {
      console.error('[ERRO] Falha ao carregar dados:', err);
    }
  }

  onMount(() => {
    carregarDados();
  });

  // --- AVISO DE EXCLUSÃO BLOQUEADA ---
  function dispararAlertaCurso(nome, codigo, total) {
    clearTimeout(warningTimer);
    warningTitulo = `${nome} (#${codigo})`;
    warningDesc = `Não é possível eliminar o curso ‘${nome}’. Existem ${total} aluno(s) matriculado(s) vinculado(s) a esta disciplina.`;
    warningAtivo = true;

    warningTimer = setTimeout(() => {
      warningAtivo = false;
    }, 2500);
  }

  // --- GESTÃO DE CURSOS ---
  function abrirModalCurso(curso = null) {
    cursoEditando = curso;
    cursoNomeInput = curso ? curso.nome : '';
    modalCursoAberto = true;
  }

  async function guardarCurso(e) {
    e.preventDefault();
    if (!cursoNomeInput.trim()) return;

    const metodo = cursoEditando ? 'PUT' : 'POST';
    const idCursoAlvo = cursoEditando?.id || cursoEditando?._id;
    const url = cursoEditando ? `${API_URL}/cursos/${idCursoAlvo}` : `${API_URL}/cursos`;

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: cursoNomeInput.trim() })
      });
      if (!res.ok) return alert(`Erro: ${await lerErro(res)}`);
      modalCursoAberto = false;
      await carregarDados();
    } catch (err) {
      alert('Erro de rede ao salvar o curso.');
    }
  }

  async function eliminarCurso(curso) {
    if (curso.totalAlunos > 0) {
      dispararAlertaCurso(curso.nome, curso.id, curso.totalAlunos);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/cursos/${curso.id}`, { method: 'DELETE' });
      if (res.status === 409) {
        dispararAlertaCurso(curso.nome, curso.id, curso.totalAlunos || 1);
        return;
      }
      if (!res.ok) return alert(`Erro: ${await lerErro(res)}`);
      await carregarDados();
    } catch (err) {
      alert('Erro de rede ao eliminar curso.');
    }
  }

  // --- GESTÃO DE ALUNOS ---
  function abrirModalAluno(aluno = null) {
    alunoEditando = aluno;
    alunoNomeInput = aluno ? (aluno.nome || '') : '';
    alunoApelidoInput = aluno ? (aluno.apelido || '') : '';
    alunoAnoCurricularInput = aluno ? (Number(aluno.anoCurricular) || 1) : 1;
    
    const fallbackCursoId = cursos[0]?.id || cursos[0]?._id || '';
    alunoCursoInput = aluno ? getIdCurso(aluno) : fallbackCursoId;
    
    modalAlunoAberto = true;
  }

  async function guardarAluno(e) {
    e.preventDefault();
    const nomeLimpo = alunoNomeInput.trim();
    const apelidoLimpo = alunoApelidoInput.trim();
    const ano = Number(alunoAnoCurricularInput);
    const cursoId = alunoCursoInput;

    if (!nomeLimpo || !apelidoLimpo) {
      return alert('Nome e Apelido são obrigatórios.');
    }
    if (!cursoId) {
      return alert('Selecione um curso para o aluno.');
    }

    const metodo = alunoEditando ? 'PUT' : 'POST';
    const idAluno = alunoEditando?.id || alunoEditando?._id;
    const url = alunoEditando ? `${API_URL}/alunos/${idAluno}` : `${API_URL}/alunos`;

    const payload = {
      nome: nomeLimpo,
      apelido: apelidoLimpo,
      anoCurricular: ano,
      idCurso: cursoId,
      cursoId: cursoId
    };

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        return alert(`Erro ao guardar: ${await lerErro(res)}`);
      }

      modalAlunoAberto = false;
      await carregarDados();
    } catch (err) {
      alert('Erro de rede ao guardar o aluno.');
    }
  }

  async function eliminarAluno(id) {
    try {
      const res = await fetch(`${API_URL}/alunos/${id}`, { method: 'DELETE' });
      if (!res.ok) return alert(`Erro: ${await lerErro(res)}`);
      await carregarDados();
    } catch (err) {
      alert('Erro de rede ao eliminar aluno.');
    }
  }

  // --- PARTICIPANTES ---
  async function abrirParticipantes(curso) {
    cursoSelecionadoParticipantes = curso;
    modalParticipantesAberto = true;
    carregandoParticipantes = true;
    listaParticipantes = [];

    try {
      const res = await fetch(`${API_URL}/cursos/${curso.id}/alunos`);
      if (res.ok) {
        listaParticipantes = await res.json();
      }
    } catch (err) {
      console.error(err);
    } finally {
      carregandoParticipantes = false;
    }
  }

  async function expulsarAluno(cursoId, alunoId, alunoNome) {
    if (!confirm(`Remover ${alunoNome} deste curso?`)) return;
    try {
      const res = await fetch(`${API_URL}/cursos/${cursoId}/alunos/${alunoId}`, { method: 'DELETE' });
      if (!res.ok) return alert(`Erro ao expulsar: ${await lerErro(res)}`);
      await carregarDados();
      listaParticipantes = listaParticipantes.filter(a => String(a.id || a._id) !== String(alunoId));
    } catch (err) {
      alert('Erro ao expulsar aluno.');
    }
  }
</script>

<!-- OVERLAY MOBILE -->
{#if sidebarOpen}
  <div
    class="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
    onclick={() => sidebarOpen = false}
    aria-hidden="true"
  ></div>
{/if}

<!-- SIDEBAR -->
<aside class="fixed left-0 top-0 h-full w-64 max-w-[80vw] bg-surface-container-lowest z-50 flex flex-col justify-between border-r border-outline-variant/30 transition-transform duration-300 {sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}">
  <div class="flex flex-col">
    <div class="h-16 px-6 flex items-center gap-2 border-b border-outline-variant/20">
      <div class="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse"></div>
      <span class="font-mono text-[13px] text-primary uppercase font-bold tracking-widest">ACADÊMICO // CRUD</span>
    </div>
    <div class="px-6 pt-4 pb-1">
      <span class="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">Navegação Central</span>
    </div>
    <nav class="flex flex-col gap-1 px-2">
      <a class="flex items-center gap-2 px-2 py-2 bg-surface-container-high text-primary font-medium shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] font-mono text-[13px] uppercase" href="#!">
        <span class="material-symbols-outlined text-[18px]">grid_view</span>Painel Geral
      </a>
    </nav>
  </div>
  <div class="p-4 border-t border-outline-variant/20 flex flex-col gap-1 font-mono text-[11px] text-on-surface-variant">
    <div class="flex items-center justify-between">
      <span class="uppercase tracking-wider">Node: SYS_ALPHA</span>
      <span class="text-primary font-bold">PORT 3000</span>
    </div>
    <div class="flex items-center gap-1">
      <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
      <span class="tracking-wider">STATUS: OPERACIONAL</span>
    </div>
  </div>
</aside>

<!-- CONTAINER PRINCIPAL -->
<div class="lg:pl-64">
  <header class="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/30 z-30 flex items-center justify-between px-4 sm:px-6 gap-2">
    <div class="flex items-center gap-2 sm:gap-4 min-w-0">
      <button type="button" class="lg:hidden w-10 h-10 shrink-0 flex items-center justify-center border border-white/30 text-white" onclick={() => sidebarOpen = !sidebarOpen} aria-label="Menu">
        <span class="material-symbols-outlined text-[22px]">menu</span>
      </button>
      <div class="flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
        <span class="hidden sm:inline">SYS</span><span class="text-outline hidden sm:inline">/</span>
        <span class="hidden sm:inline">ACADÊMICO</span><span class="text-outline hidden sm:inline">/</span>
        <span class="text-primary font-bold">PAINEL DE GESTÃO</span>
      </div>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold">
        <span class="material-symbols-outlined text-[18px]">person</span>
      </div>
    </div>
  </header>

  <!-- MAIN -->
  <main class="relative pt-20 px-4 sm:px-6 py-6 w-full min-h-screen">
    <!-- SEÇÃO DE MÉTRICAS -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="p-4 bg-[#080808] border border-white/20 flex flex-col justify-between shadow-[0_0_10px_rgba(255,255,255,0.08)]">
        <div class="flex items-center justify-between text-on-surface-variant font-mono text-[11px] uppercase">
          <span>Base Geral // Alunos</span>
          <span class="material-symbols-outlined text-primary text-[18px]">group</span>
        </div>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-3xl text-primary font-semibold font-geist">{alunos.length}</span>
          <span class="font-mono text-[11px] text-primary/80 border border-white/30 px-1 uppercase">Total Ativo</span>
        </div>
      </div>

      <div class="p-4 bg-[#080808] border border-white/20 flex flex-col justify-between shadow-[0_0_10px_rgba(255,255,255,0.08)]">
        <div class="flex items-center justify-between text-on-surface-variant font-mono text-[11px] uppercase">
          <span>Ofertas // Cursos</span>
          <span class="material-symbols-outlined text-primary text-[18px]">menu_book</span>
        </div>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-3xl text-primary font-semibold font-geist">{cursos.length}</span>
          <span class="font-mono text-[11px] text-primary/80 border border-white/30 px-1 uppercase">Disciplinas</span>
        </div>
      </div>

      <div class="p-4 bg-[#080808] border border-white/20 flex flex-col justify-between shadow-[0_0_10px_rgba(255,255,255,0.08)]">
        <div class="flex items-center justify-between text-on-surface-variant font-mono text-[11px] uppercase">
          <span>Regularidade Cadastral</span>
          <span class="material-symbols-outlined text-primary text-[18px]">verified</span>
        </div>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-3xl text-primary font-semibold font-geist">100%</span>
          <span class="font-mono text-[11px] text-primary/80 border border-white/30 px-1 uppercase">Sincronizado</span>
        </div>
      </div>

      <div class="p-4 bg-[#080808] border border-white/20 flex flex-col justify-between shadow-[0_0_10px_rgba(255,255,255,0.08)]">
        <div class="flex items-center justify-between text-on-surface-variant font-mono text-[11px] uppercase">
          <span>Auditoria Operacional</span>
          <div class="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-ping"></div>
        </div>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="text-sm font-mono text-primary font-bold">SEM FALHAS</span>
          <span class="font-mono text-[11px] text-on-surface-variant uppercase">0.12ms LAT</span>
        </div>
      </div>
    </section>

    <!-- COLUNAS DOS CRUDS -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pb-6">
      
      <!-- CARD 1: ALUNOS -->
      <div class="bg-[#080808] border-2 border-white rounded-[20px] p-5 sm:p-7 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
        <div class="flex items-center justify-between pb-4 border-b border-white/20">
          <div>
            <span class="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Painel de Alocação</span>
            <h2 class="text-xl text-primary font-bold tracking-tight uppercase">ALUNOS // REGISTROS</h2>
          </div>
          <span class="font-mono text-[12px] text-primary bg-black border border-white px-3 py-1 font-semibold">
            {alunos.length} Matriculados
          </span>
        </div>

        <div class="flex flex-col items-center justify-center my-6 py-2 border-b border-white/10">
          <button
            class="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-[0_0_18px_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95 transition-all"
            onclick={() => abrirModalAluno()}
            title="Adicionar Aluno"
          >
            <span class="material-symbols-outlined text-[28px]">add</span>
          </button>
          <span class="mt-2 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">Registrar Aluno</span>
        </div>

        <!-- LISTAGEM DE ALUNOS -->
        <div class="flex flex-col gap-2">
          {#if alunosFiltrados.length === 0}
            <div class="p-4 text-center text-neutral-500 font-mono text-xs">Nenhum aluno registado.</div>
          {:else}
            {#each alunosFiltrados as aluno (aluno.id || aluno._id)}
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black border border-white/30 hover:border-white transition-all shadow-[0_0_8px_rgba(255,255,255,0.15)]">
                <div class="flex flex-col gap-0.5 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-white font-medium truncate">{aluno.nome} {aluno.apelido || ''}</span>
                    {#if aluno.anoCurricular}
                      <span class="px-1.5 py-0.5 border border-white/30 font-mono text-[10px] text-neutral-300">{aluno.anoCurricular}º Ano</span>
                    {/if}
                  </div>
                  <div class="flex items-center gap-2 font-mono text-[11px] text-on-surface-variant">
                    <span class="text-white/90">ID #{aluno.id || aluno._id}</span>
                    <span>/</span>
                    <span class="uppercase text-white truncate font-semibold">
                      {obterNomeCurso(aluno)}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1 self-end sm:self-auto">
                  <button class="w-9 h-9 bg-white text-black flex items-center justify-center hover:bg-neutral-200 active:scale-90 transition-all" onclick={() => abrirModalAluno(aluno)} title="Editar aluno">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button class="w-9 h-9 bg-white text-black flex items-center justify-center hover:bg-[#FF3344] hover:text-white active:scale-90 transition-all" onclick={() => eliminarAluno(aluno.id || aluno._id)} title="Eliminar aluno">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <div class="mt-6 pt-4 border-t border-white/10 flex items-center gap-2">
          <span class="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            bind:value={filtroAlunos}
            class="w-full bg-black border border-white/20 px-3 py-1 font-mono text-xs text-white placeholder:text-on-surface-variant/60 focus:outline-none focus:border-white"
            placeholder="Filtrar por nome, apelido ou código..."
          />
        </div>
      </div>

      <!-- CARD 2: CURSOS -->
      <div class="bg-[#080808] border-2 border-white rounded-[20px] p-5 sm:p-7 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
        <div class="flex items-center justify-between pb-4 border-b border-white/20">
          <div>
            <span class="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Grade Acadêmica</span>
            <h2 class="text-xl text-primary font-bold tracking-tight uppercase">CURSOS // ATIVOS</h2>
          </div>
          <span class="font-mono text-[12px] text-primary bg-black border border-white px-3 py-1 font-semibold">
            {cursos.length} Cursos
          </span>
        </div>

        <div class="flex flex-col items-center justify-center my-6 py-2 border-b border-white/10">
          <button
            class="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-[0_0_18px_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95 transition-all"
            onclick={() => abrirModalCurso()}
            title="Criar Disciplina"
          >
            <span class="material-symbols-outlined text-[28px]">add</span>
          </button>
          <span class="mt-2 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">Criar Disciplina</span>
        </div>

        <!-- LISTAGEM DE CURSOS -->
        <div class="flex flex-col gap-2">
          {#if cursosFiltrados.length === 0}
            <div class="p-4 text-center text-neutral-500 font-mono text-xs">Nenhum curso registado.</div>
          {:else}
            {#each cursosFiltrados as curso (curso.id)}
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black border border-white/30 hover:border-white transition-all shadow-[0_0_8px_rgba(255,255,255,0.15)]">
                <div class="flex flex-col gap-0.5 min-w-0">
                  <span class="text-white font-medium truncate">{curso.nome}</span>
                  <div class="flex items-center gap-2 font-mono text-[11px] text-on-surface-variant">
                    <span class="text-white/90">ID #{curso.id}</span>
                    <span>/</span>
                    <span class="uppercase text-white">{curso.totalAlunos} Aluno(s) ativos</span>
                  </div>
                </div>
                <div class="flex items-center gap-1 self-end sm:self-auto">
                  <button class="px-3 h-9 bg-neutral-900 border border-white/40 text-white font-mono text-[11px] uppercase hover:bg-neutral-800 transition-colors" onclick={() => abrirParticipantes(curso)} title="Ver participantes">
                    Alunos
                  </button>
                  <button class="w-9 h-9 bg-white text-black flex items-center justify-center hover:bg-neutral-200 active:scale-90 transition-all" onclick={() => abrirModalCurso(curso)} title="Editar curso">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button class="w-9 h-9 bg-white text-black flex items-center justify-center hover:bg-[#FF3344] hover:text-white active:scale-90 transition-all" onclick={() => eliminarCurso(curso)} title="Eliminar curso">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <div class="mt-6 pt-4 border-t border-white/10 flex items-center gap-2">
          <span class="material-symbols-outlined text-on-surface-variant text-[18px]">filter_alt</span>
          <input
            bind:value={filtroCursos}
            class="w-full bg-black border border-white/20 px-3 py-1 font-mono text-xs text-white placeholder:text-on-surface-variant/60 focus:outline-none focus:border-white"
            placeholder="Filtrar curso por código ou nome..."
          />
        </div>
      </div>
    </div>

    <!-- TERMINAL FOOTER -->
    <div class="p-4 bg-[#080808] border border-white/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-10">
      <div class="flex items-center gap-4">
        <span class="material-symbols-outlined text-white text-[20px]">database</span>
        <div>
          <p class="font-mono text-xs text-white font-bold uppercase">INTEGRIDADE REFERENCIAL // ATIVADA</p>
          <p class="font-mono text-[11px] text-on-surface-variant uppercase">Restrição de chave estrangeira previne registros órfãos nas tabelas vinculadas.</p>
        </div>
      </div>
      <button class="px-4 py-2 border border-white/40 text-white font-mono text-xs uppercase hover:bg-white/10" onclick={carregarDados}>
        Recarregar Dados
      </button>
    </div>
  </main>
</div>

<!-- ALERTA CRÍTICO DE EXCLUSÃO (Canto inferior direito) -->
<aside class="fixed bottom-4 right-4 z-[60] transition-all duration-300 transform {warningAtivo ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'}">
  <div class="bg-[rgba(20,0,4,0.95)] border-2 border-[#FF3344] rounded-[14px] p-4 max-w-[380px] shadow-[0_0_25px_rgba(255,51,68,0.65)] backdrop-blur-md flex flex-col gap-2">
    <div class="flex items-start gap-2">
      <span class="material-symbols-outlined text-[#FF3344] text-[24px] animate-pulse">error</span>
      <div>
        <span class="font-mono text-[11px] text-[#FF3344] font-bold uppercase tracking-wider block">[AVISO CRÍTICO // EXCLUSÃO BLOQUEADA]</span>
        <h3 class="text-sm text-white font-bold">{warningTitulo}</h3>
      </div>
    </div>
    <p class="text-xs text-neutral-300 pl-8 leading-relaxed">{warningDesc}</p>
  </div>
</aside>

<!-- MODAL DE CURSO (Criar / Editar) -->
{#if modalCursoAberto}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <form onsubmit={guardarCurso} class="bg-[#080808] border-2 border-white rounded-[16px] p-6 max-w-md w-full text-white shadow-[0_0_30px_rgba(255,255,255,0.4)] flex flex-col gap-4">
      <div class="flex items-center justify-between border-b border-white/20 pb-3">
        <h3 class="font-geist uppercase font-bold text-lg">{cursoEditando ? 'Editar Disciplina' : 'Criar Disciplina'}</h3>
        <span class="font-mono text-[11px] text-neutral-400">CURSO // FORM</span>
      </div>
      <div class="flex flex-col gap-1.5">
        <label for="curso_nome" class="font-mono text-[11px] text-neutral-400 uppercase">Nome da Disciplina</label>
        <input id="curso_nome" bind:value={cursoNomeInput} required class="bg-black border border-white/30 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-white" />
      </div>
      <div class="flex justify-end gap-3 pt-3 border-t border-white/10">
        <button type="button" onclick={() => modalCursoAberto = false} class="px-4 py-2 border border-white/30 font-mono text-xs uppercase hover:bg-white/10">Cancelar</button>
        <button type="submit" class="px-5 py-2 bg-white text-black font-mono text-xs uppercase font-bold hover:bg-neutral-200">Guardar</button>
      </div>
    </form>
  </div>
{/if}

<!-- MODAL DE ALUNO COM APELIDO E ANO CURRICULAR -->
{#if modalAlunoAberto}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <form onsubmit={guardarAluno} class="bg-[#080808] border-2 border-white rounded-[16px] p-6 max-w-md w-full text-white shadow-[0_0_30px_rgba(255,255,255,0.4)] flex flex-col gap-4">
      <div class="flex items-center justify-between border-b border-white/20 pb-3">
        <h3 class="font-geist uppercase font-bold text-lg">{alunoEditando ? 'Editar Aluno' : 'Registrar Aluno'}</h3>
        <span class="font-mono text-[11px] text-neutral-400">ALUNO // FORM</span>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5">
          <label for="aluno_nome" class="font-mono text-[11px] text-neutral-400 uppercase">Primeiro Nome</label>
          <input id="aluno_nome" bind:value={alunoNomeInput} required placeholder="Ex: Gonçalo" class="bg-black border border-white/30 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-white" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="aluno_apelido" class="font-mono text-[11px] text-neutral-400 uppercase">Apelido</label>
          <input id="aluno_apelido" bind:value={alunoApelidoInput} required placeholder="Ex: Rodrigues" class="bg-black border border-white/30 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-white" />
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="aluno_ano" class="font-mono text-[11px] text-neutral-400 uppercase">Ano Curricular</label>
        <select id="aluno_ano" bind:value={alunoAnoCurricularInput} required class="bg-black border border-white/30 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-white">
          <option value={1}>1º Ano</option>
          <option value={2}>2º Ano</option>
          <option value={3}>3º Ano</option>
          <option value={4}>4º Ano</option>
          <option value={5}>Mestrado</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="aluno_curso" class="font-mono text-[11px] text-neutral-400 uppercase">Vincular a Curso</label>
        <select id="aluno_curso" bind:value={alunoCursoInput} required class="bg-black border border-white/30 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-white">
          <option value="" disabled>Selecione um curso...</option>
          {#each cursos as c}
            {@const cid = c.id || c._id}
            <option value={cid}>{c.nome || c.nomeDoCurso}</option>
          {/each}
        </select>
      </div>

      <div class="flex justify-end gap-3 pt-3 border-t border-white/10">
        <button type="button" onclick={() => modalAlunoAberto = false} class="px-4 py-2 border border-white/30 font-mono text-xs uppercase hover:bg-white/10">Cancelar</button>
        <button type="submit" class="px-5 py-2 bg-white text-black font-mono text-xs uppercase font-bold hover:bg-neutral-200">Guardar</button>
      </div>
    </form>
  </div>
{/if}

<!-- MODAL PARTICIPANTES -->
{#if modalParticipantesAberto}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-[#080808] border-2 border-white rounded-[16px] p-6 max-w-md w-full text-white shadow-[0_0_30px_rgba(255,255,255,0.4)] flex flex-col gap-4">
      <div class="flex items-center justify-between border-b border-white/20 pb-3">
        <h3 class="font-geist uppercase font-bold text-lg">Participantes // {cursoSelecionadoParticipantes?.nome}</h3>
        <span class="font-mono text-[11px] text-neutral-400">GET // PARTICIPANTES</span>
      </div>
      
      <div class="flex flex-col gap-2 max-h-60 overflow-y-auto font-mono text-xs">
        {#if carregandoParticipantes}
          <p class="text-neutral-500 py-2">Consultando registros...</p>
        {:else if listaParticipantes.length === 0}
          <p class="text-neutral-500 py-2">Nenhum aluno matriculado nesta disciplina.</p>
        {:else}
          {#each listaParticipantes as p (p.id || p._id)}
            <div class="p-2 bg-black border border-white/20 flex justify-between items-center">
              <div class="flex flex-col min-w-0">
                <span class="text-white font-medium truncate">{p.nome} {p.apelido || ''}</span>
                <span class="text-neutral-500">ID #{p.id || p._id}</span>
              </div>
              <button
                class="px-2 h-8 border border-[#FF3344]/60 text-[#FF3344] uppercase text-[11px] hover:bg-[#FF3344] hover:text-white transition-colors"
                onclick={() => expulsarAluno(cursoSelecionadoParticipantes.id, p.id || p._id, `${p.nome} ${p.apelido || ''}`)}
              >
                Expulsar
              </button>
            </div>
          {/each}
        {/if}
      </div>

      <div class="flex justify-end pt-3 border-t border-white/10">
        <button type="button" onclick={() => modalParticipantesAberto = false} class="px-5 py-2 bg-white text-black font-mono text-xs uppercase font-bold hover:bg-neutral-200">
          Fechar
        </button>
      </div>
    </div>
  </div>
{/if}