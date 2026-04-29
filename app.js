// Definindo escopo da instância da Árvore AVL a partir da classe
const arvore = new ArvoreAVL();

document.addEventListener('DOMContentLoaded', () => {
    // Referências aos Carregadores/Dashboards Interface Web (UI)
    const telaCarregamento = document.getElementById('loading');
    const statusCarregamento = document.getElementById('loading-status');
    const displayTotalPalavras = document.getElementById('total-words');
    const displayAlturaArvore = document.getElementById('tree-height');

    // Referências do Card de Pesquisa e Output/Inout principal
    const inputPesquisar = document.getElementById('search-input');
    const caixaResultado = document.getElementById('search-result');
    const conteinerCaminhoBusca = document.getElementById('search-path-container');
    const divCaminhoBusca = document.getElementById('search-path');
    const painelImpressaoLista = document.getElementById('output-container');
    const painelBalanceamento = document.getElementById('balance-log'); // Painel Didático de Logs
    
    // Função para renderizar os logs didáticos da AVL no painel
    function desenharLog(msg, limpa = false) {
        if (!painelBalanceamento) return;
        if (limpa) painelBalanceamento.innerHTML = '';
        
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const novaLinha = document.createElement('div');
        novaLinha.innerHTML = `<span class="text-secondary">[${timestamp}]</span> ${msg}`;
        painelBalanceamento.appendChild(novaLinha);
        // Auto scroll para o fim
        painelBalanceamento.scrollTop = painelBalanceamento.scrollHeight;
    }

    // Acopla o callback na instância da classe AVL
    arvore.logOpCallback = (msg) => { desenharLog(msg); };

    // Vinculação de Botões / Listeners
    document.getElementById('btn-search').addEventListener('click', eventoPesquisaAvulsa);
    inputPesquisar.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            eventoPesquisaAvulsa();
        }
    });
    document.getElementById('btn-insert').addEventListener('click', eventoInserirNo);
    document.getElementById('btn-remove').addEventListener('click', eventoRemoverLinha);
    document.getElementById('btn-show-height').addEventListener('click', exibirCaminhoMaisLongoDaAltura);
    
    // Vinculações de iteradores da árvore: Aciona Traverser dinamicamente nos botões do card de Relatório
    document.getElementById('btn-pre-order').addEventListener('click', () => carregarPercursoNaInterface(arvore.preOrdem(), 'Pré-ordem'));
    document.getElementById('btn-in-order').addEventListener('click', () => carregarPercursoNaInterface(arvore.emOrdem(), 'Em-ordem'));
    document.getElementById('btn-post-order').addEventListener('click', () => carregarPercursoNaInterface(arvore.posOrdem(), 'Pós-ordem'));
    document.getElementById('btn-breadth').addEventListener('click', () => carregarPercursoNaInterface(arvore.amplitude(), 'Amplitude (Largura)'));
    document.getElementById('btn-depth').addEventListener('click', () => carregarPercursoNaInterface(arvore.profundidade(), 'Profundidade'));

    // Configuração gradual e assíncrona da Árvore
    // Para não congelar o Front-End da Janela rodamos o For num lote divido.
    function iniciarArvoreDeDados() {
        if (typeof dadosDicionario !== 'undefined') {
            statusCarregamento.textContent = `Carregando array base de ${dadosDicionario.length} palavras...`;
            
            // Fatiamos 100 em 100 o Dicionario json interno
            const TAMANHO_DA_LAVRA = 100;
            let indiceAtual = 0;

            function fatiarCarregamento() {
                const finalDoProcessamento = Math.min(indiceAtual + TAMANHO_DA_LAVRA, dadosDicionario.length);
                for (let i = indiceAtual; i < finalDoProcessamento; i++) {
                    const termo = dadosDicionario[i];
                    // Chama a inserção balanceadora
                    arvore.inserir(termo.word, termo.definition); 
                }
                indiceAtual = finalDoProcessamento;

                // Repassa processamento para outro relapso de frame se não finalizamos o Dictionary array
                if (indiceAtual < dadosDicionario.length) {
                    statusCarregamento.textContent = `Construindo Árvore Baseada: ${indiceAtual} processados a partir de ${dadosDicionario.length}...`;
                    requestAnimationFrame(fatiarCarregamento);
                } else {
                    atualizarValoresDashboard(); // Chegou ao fim do JSON
                    telaCarregamento.classList.add('d-none'); // Desativa Black Screen
                }
            }

            requestAnimationFrame(fatiarCarregamento);
        } else {
            statusCarregamento.textContent = 'Atenção. Falha crônica do data.js! Não há vocabulários.';
        }
    }

    iniciarArvoreDeDados();

    // Central do Dashboard Web (Cards Top)
    function atualizarValoresDashboard() {
        displayTotalPalavras.textContent = arvore.tamanho;
        // Pule na raiz e veja o quão profunda/alta ficou essa Tree após processar tudo
        displayAlturaArvore.textContent = arvore.obterAltura(arvore.raiz);
        atualizarCacheDeSugestoes(); // Renova a base local para autocomplete super-rápido (Lupa e Lixeira)
    }

    let cachePalavrasAVL = [];

    // Alimenta Array Base dinamicamente copiando o estado "atual" e vivo da Árvore
    function atualizarCacheDeSugestoes() {
        cachePalavrasAVL = [];
        for (let noAvaliado of arvore.emOrdem()) {
            cachePalavrasAVL.push(noAvaliado.palavra);
        }
    }

    // Logica Customizada de Frontend pra Autocomplete Bonito
    function inicializarAutoCompletarCustom() {
        const attachDropdownEvents = (inputId, dropdownId, actionCallback) => {
            const inputField = document.getElementById(inputId);
            const dropdownEl = document.getElementById(dropdownId);

            inputField.addEventListener('input', () => {
                const textoPesquisa = inputField.value.trim().toLowerCase();
                dropdownEl.innerHTML = '';
                dropdownEl.classList.remove('show');

                if (textoPesquisa.length === 0) return;

                const palavrasFiltradas = cachePalavrasAVL.filter(pal => pal.toLowerCase().startsWith(textoPesquisa)).slice(0, 10);
                
                if (palavrasFiltradas.length > 0) {
                    palavrasFiltradas.forEach(palavraExata => {
                        const optionItem = document.createElement('li');
                        optionItem.innerHTML = `<a class="dropdown-item" href="javascript:void(0);"><strong>${palavraExata.substring(0, textoPesquisa.length)}</strong>${palavraExata.substring(textoPesquisa.length)}</a>`;
                        optionItem.addEventListener('mousedown', () => {
                            inputField.value = palavraExata;
                            dropdownEl.classList.remove('show');
                            if (actionCallback) actionCallback();
                        });
                        dropdownEl.appendChild(optionItem);
                    });
                    dropdownEl.classList.add('show');
                }
            });

            // Fecha quando clica fora e esconde interface do DropoDown Box
            inputField.addEventListener('blur', () => {
                setTimeout(() => dropdownEl.classList.remove('show'), 200);
            });
        };

        // Associa na Lupa
        attachDropdownEvents('search-input', 'search-suggestions', eventoPesquisaAvulsa);
        // Associa na Lixeira
        attachDropdownEvents('remove-word', 'remove-suggestions');
    }

    inicializarAutoCompletarCustom();

    // Clique Botão 'Buscar'
    function eventoPesquisaAvulsa() {
        const palavraFormatada = inputPesquisar.value.trim();
        if (!palavraFormatada) return;

        // Oculta resultado anterior para a animação parecer legal
        caixaResultado.classList.add('d-none');
        conteinerCaminhoBusca.classList.add('d-none');
        divCaminhoBusca.innerHTML = ''; // Limpa caminho antigo

        // Usa a nossa nova função que retorna o caminho passo a passo
        const buscaRealizada = arvore.pesquisarComCaminho(palavraFormatada);
        const { encontrado, caminho } = buscaRealizada;
        
        conteinerCaminhoBusca.classList.remove('d-none');

        // Chama a função genérica para desenhar a animação na DIV específica da pesquisa
        renderizarCaminhoAnimado(palavraFormatada, caminho, encontrado, divCaminhoBusca, () => {
            mostrarBoxResultadoFinal(palavraFormatada, encontrado);
        });
    }

    // Renderiza a box inferior ao caminho mostrando o status da busca
    function mostrarBoxResultadoFinal(palavraOriginal, noFinalEncontrado) {
        caixaResultado.classList.remove('d-none');
        if (noFinalEncontrado) {
            caixaResultado.innerHTML = `<h4>${noFinalEncontrado.palavra}</h4><p class="mb-0">${noFinalEncontrado.definicao}</p>`;
            caixaResultado.className = "mt-3 p-3 border-start border-success border-4 rounded bg-success-subtle d-block";
        } else {
            caixaResultado.innerHTML = `<p class="mb-0 text-danger">A palavra "<strong>${palavraOriginal}</strong>" não consta ou já foi apagada.</p>`;
            caixaResultado.className = "mt-3 p-3 border-start border-danger border-4 rounded bg-danger-subtle d-block";
        }
    }

    // Clique Botão Adicionar (+)
    function eventoInserirNo() {
        const controlePalavraInput = document.getElementById('insert-word');
        const controleDefinicaoInput = document.getElementById('insert-def');
        
        const palavraFormatada = controlePalavraInput.value.trim();
        const definicaoPura = controleDefinicaoInput.value.trim();
        
        if (palavraFormatada && definicaoPura) {
            desenharLog(`--- 🌱 INSERINDO: [${palavraFormatada}] ---`, true);
            // Pega o caminho antes de inserir para simular o trajeto que a inserção vai fazer para achar o "nulo" folha
            const buscaCaminhoTeste = arvore.pesquisarComCaminho(palavraFormatada);
            const ehAtualizacao = buscaCaminhoTeste.encontrado;
            
            arvore.inserir(palavraFormatada, definicaoPura); // Injeção
            atualizarValoresDashboard(); // Força update porque agora cresceu!
            
            // Limpa text boxes
            controlePalavraInput.value = '';
            controleDefinicaoInput.value = '';
            
            // Renderiza na tela grande (Output Container)
            painelImpressaoLista.innerHTML = `<p class="text-secondary"><i class="fa-solid fa-route"></i> Calculando trajeto de Injeção: Onde acomodar "<strong>${palavraFormatada}</strong>"?</p><div id="path-insert" class="d-flex flex-wrap align-items-center mb-3"></div>`;
            const divCaminhoTemp = document.getElementById('path-insert');

            renderizarCaminhoAnimado(palavraFormatada, buscaCaminhoTeste.caminho, buscaCaminhoTeste.encontrado, divCaminhoTemp, () => {
                // Adiciona a caixa de sucesso logo abaixo do final da animação
                painelImpressaoLista.innerHTML += `<div class="word-item text-success mt-2 p-2 border-start border-success border-4 bg-success-subtle rounded">
                    <strong><i class="fa fa-check"></i> Procedimento Completo:</strong> A Palavra "<strong>${palavraFormatada}</strong>" e sua definição foram ${ehAtualizacao ? 'atualizadas e sobrescritas num Nó Existente' : 'inseridas no final deste trajeto (Nó Folha)'} com sucesso (e a árvore se rebalanceou internamente).
                </div>`;
            });

        } else {
            alert('Você não pode adentrar palavra com dados vazios no dicionário.');
        }
    }

    // Botão clique a lixeira Delete (-)
    function eventoRemoverLinha() {
        const controleExclusaoInput = document.getElementById('remove-word');
        const palavraAlvo = controleExclusaoInput.value.trim();
        
        if (palavraAlvo) {
            desenharLog(`--- 🗑️ REMOVENDO: [${palavraAlvo}] ---`, true);
            const buscaCaminhoTeste = arvore.pesquisarComCaminho(palavraAlvo);
            
            const retornoExcluirBooleano = arvore.remover(palavraAlvo); // O core remove internamente nos galhos esq/dir com In-Order Successor
            atualizarValoresDashboard(); 
            controleExclusaoInput.value = ''; // Limpar lixozinho
            
            painelImpressaoLista.innerHTML = `<p class="text-secondary"><i class="fa-solid fa-route"></i> Buscando "<strong>${palavraAlvo}</strong>" para eliminação local...</p><div id="path-remove" class="d-flex flex-wrap align-items-center mb-3"></div>`;
            const divCaminhoTemp = document.getElementById('path-remove');

            renderizarCaminhoAnimado(palavraAlvo, buscaCaminhoTeste.caminho, buscaCaminhoTeste.encontrado, divCaminhoTemp, () => {
                // Tratativa de aviso na web após animação achar a palavra
                if (retornoExcluirBooleano) {
                    painelImpressaoLista.innerHTML += `<div class="word-item text-danger mt-2 p-2 border-start border-danger border-4 bg-danger-subtle rounded">
                        <strong><i class="fa-solid fa-fire"></i> Deletada!</strong> O Nó atrelado à "<strong>${palavraAlvo}</strong>" (e seu galho) escafedeu-se! Realocamos seu filho in-order e rodamos o rebalanceamento dinâmico global.
                    </div>`;
                } else {
                    painelImpressaoLista.innerHTML += `<div class="word-item text-secondary mt-2 p-2 border border-secondary bg-light rounded">
                        <strong>Nulo:</strong> Varremos a árvore inteira e nada foi achado de "<strong>${palavraAlvo}</strong>". Nenhum delete ocorreu.
                    </div>`;
                }
            });

        } else {
            alert('Aba de exlusivos preenchida em vão.');
        }
    }

    // Ação do Botão Extra de Visualizar Caminho mais Longo (Altura)
    function exibirCaminhoMaisLongoDaAltura() {
        const trajetoProfundo = arvore.rastrearCaminhoMaisProfundo();
        
        painelImpressaoLista.innerHTML = `
            <div class="alert alert-success border border-success border-2 shadow-sm">
                <i class="fa-solid fa-arrows-up-down"></i> 
                <strong>Demonstração do Caminho Mais Profundo da Árvore AVL atual</strong><br>
                A Altura informada no sistema (${arvore.obterAltura(arvore.raiz)}) equivale ao maior número de "pulos" que o algoritmo precisaria dar da Raiz até o fundo. Abaixo está o caminho que justifica esse número:
            </div>
            <div id="path-height-demo" class="d-flex flex-wrap align-items-center mb-3"></div>
        `;
        
        const divCaminhoTemp = document.getElementById('path-height-demo');
        
        const ultimoNoEncontrado = trajetoProfundo.length > 0 ? trajetoProfundo[trajetoProfundo.length - 1].no : null;

        renderizarCaminhoAnimado('Altura', trajetoProfundo, ultimoNoEncontrado, divCaminhoTemp, () => {
            painelImpressaoLista.innerHTML += `<div class="word-item text-secondary mt-2 p-2 border-start border-secondary border-4 bg-light rounded">
                <strong><i class="fa-solid fa-flag-checkered"></i> Concluído:</strong> A ponta mais distante (Folha Crítica) é <strong>"${ultimoNoEncontrado ? ultimoNoEncontrado.palavra : 'Nula'}"</strong> no nível (altura) ${trajetoProfundo.length}. Repare se a contagem condiz com o cartão vizinho!
            </div>`;
        });
    }

    // FUNCAO GENERICA P/ ANIMAR BADGES
    function renderizarCaminhoAnimado(palavraOriginal, caminho, encontrado, divAlvo, callbackFinal) {
        if (caminho.length === 0) {
            if (callbackFinal) callbackFinal();
            return;
        }

        let delayTemporizador = 0;
        
        caminho.forEach((passo, indice) => {
            setTimeout(() => {
                const elementoPasso = document.createElement('span');
                const ehUltimoCaminhoNulo = (indice === caminho.length - 1 && encontrado === null);
                
                let iconeDirecao = '';
                let dicarSetaDescritiva = '';
                if (passo.status === 'esquerda') {
                    iconeDirecao = ' <i class="fa-solid fa-arrow-left fa-xs text-muted"></i>';
                    dicarSetaDescritiva = ' title="Alfa-menor. Fatiando pela metade a árvore e descendo à esquerda..."';
                }
                else if (passo.status === 'direita') {
                    iconeDirecao = ' <i class="fa-solid fa-arrow-right fa-xs text-muted"></i>';
                    dicarSetaDescritiva = ' title="Alfa-maior. Fatiando pela metade a árvore e descendo à direita..."';
                }
                else if (passo.status === 'encontrado') {
                    iconeDirecao = ' <i class="fa-solid fa-check fa-xs"></i>';
                    dicarSetaDescritiva = ' title="Encontrado! Bateu exatamente aqui."';
                }
                
                let classeCSSBadge = passo.status;
                if (ehUltimoCaminhoNulo) {
                    classeCSSBadge = 'nao-encontrado';
                    iconeDirecao = ' <i class="fa-solid fa-xmark fa-xs"></i> (Fim)';
                    dicarSetaDescritiva = ' title="Atingiu fim do galho/folha nula e a palavra não estava aqui."';
                }
                
                elementoPasso.className = `path-badge badge p-2 m-1 ${classeCSSBadge}`;
                elementoPasso.innerHTML = `<span ${dicarSetaDescritiva} style="cursor:help;">${passo.no.palavra} ${iconeDirecao}</span>`;
                divAlvo.appendChild(elementoPasso);
                
                setTimeout(() => elementoPasso.classList.add('show'), 50);

                if (indice === caminho.length - 1 && callbackFinal) {
                    setTimeout(callbackFinal, 400); 
                }
            }, delayTemporizador);
            
            delayTemporizador += 300; 
        });
    }

    // Iterador Geral (Pré-Em-Pos / Largura / Altura)
    function carregarPercursoNaInterface(iteratorAvulso, tituloImpressao) {
        painelImpressaoLista.innerHTML = `<p><strong>Calculando caminhos do percurso (${tituloImpressao})...</strong></p>`;
        
        // Aguarda 80ms para ver o recado anterior caso DOM de um congelamento e mostrá-la
        setTimeout(() => {
            let blocoHTML = `<h3>Percurso Gerado -> ${tituloImpressao}</h3>`;
            let quantidadeExposta = 0;
            const GARGALO_ESTOURO_MEMORIA = 200; // Impede browsers piores de capotar imprimindo string concatenada com 1.500 termos na listagem.
            
            // Para cada No descompactado sem Loop infinito provido (*yields) do arquivo `avl`
            for (let noAvaliado of iteratorAvulso) {
                blocoHTML += `<div class="word-item"><strong>${noAvaliado.palavra}</strong>: ${noAvaliado.definicao}</div>`;
                quantidadeExposta++;
                
                // Trunca na interface apenas! Ele percorreu sem limites na ram mas printar muito no document html dá memory leak visual css.
                if (quantidadeExposta >= GARGALO_ESTOURO_MEMORIA) {
                    blocoHTML += `<div class="word-item text-muted fst-italic">Exibindo os limitados exatos ${GARGALO_ESTOURO_MEMORIA} recortes iniciais de travessia gráfica.. (Volume de nós totais presentes na tela gráfica da AVL hoje é ${arvore.tamanho})</div>`;
                    break;
                }
            }
            
            if (quantidadeExposta === 0) {
                blocoHTML += '<p>Ausência profunda. Árvore sem dados (Ou varrida em Null).</p>';
            }
            
            painelImpressaoLista.innerHTML = blocoHTML;
        }, 80);
    }
});