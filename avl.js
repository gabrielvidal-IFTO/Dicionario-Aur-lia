// Classe que representa cada elemento (nó) na árvore AVL
class No {
    constructor(palavra, definicao) {
        this.palavra = palavra;
        this.definicao = definicao;
        this.esquerda = null;
        this.direita = null;
        this.altura = 1;
    }
}

// Estrutura principal da Árvore AVL
class ArvoreAVL {
    constructor() {
        this.raiz = null;
        this.tamanho = 0;
        this.logOpCallback = null; // Callback didático para printar logs
    }

    // Usado como Listener em Tela
    registrarLog(mensagem) {
        if (this.logOpCallback) this.logOpCallback(mensagem);
    }

    // Retorna a altura de um nó (0 se nulo)
    obterAltura(no) {
        if (!no) return 0;
        return no.altura;
    }

    // Calcula o fator de balanceamento para verificar se a árvore precisa de rotação
    obterBalanceamento(no) {
        if (!no) return 0;
        return this.obterAltura(no.esquerda) - this.obterAltura(no.direita);
    }

    // Rotação simples à direita (Destinada ao LL - Left Left Case)
    rotacaoDireita(y) {
        this.registrarLog(`   ⚡ Girando à DIREITA (Descendo o nó [${y.palavra}])`);
        const x = y.esquerda;
        const T2 = x.direita;

        // Realiza a descida da rotação
        x.direita = y;
        y.esquerda = T2;

        // Atualiza as alturas re-balanceadas
        y.altura = Math.max(this.obterAltura(y.esquerda), this.obterAltura(y.direita)) + 1;
        x.altura = Math.max(this.obterAltura(x.esquerda), this.obterAltura(x.direita)) + 1;

        return x; // Retorna a nova raiz referenciada da subárvore
    }

    // Rotação simples à esquerda (Destinada ao RR - Right Right Case)
    rotacaoEsquerda(x) {
        this.registrarLog(`   ⚡ Girando à ESQUERDA (Subindo o nó [${x.direita.palavra}])`);
        const y = x.direita;
        const T2 = y.esquerda;

        // Realiza a ascensão da rotação
        y.esquerda = x;
        x.direita = T2;

        // Atualiza as alturas
        x.altura = Math.max(this.obterAltura(x.esquerda), this.obterAltura(x.direita)) + 1;
        y.altura = Math.max(this.obterAltura(y.esquerda), this.obterAltura(y.direita)) + 1;

        return y; // Retorna a nova raiz da subárvore
    }

    // Compara strings alfabeticamente para a Árvore Binária ignorando case via localeCompare Brasil
    comparar(a, b) {
        return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    }

    // Chamada principal para inserir a palavra e definição em log(n) com balanceamento 
    inserir(palavra, definicao) {
        this.raiz = this._inserirNo(this.raiz, palavra, definicao);
    }

    // Função recursiva privada de inserção
    _inserirNo(no, palavra, definicao) {
        // 1. Passo comum de Inserção em Árvore Binária de Busca Genérica
        if (!no) {
            this.tamanho++;
            return new No(palavra, definicao);
        }

        const comparacao = this.comparar(palavra, no.palavra);

        // Se menor subárvore esquerda. Se maior subárvore direita.
        if (comparacao < 0) {
            no.esquerda = this._inserirNo(no.esquerda, palavra, definicao);
        } else if (comparacao > 0) {
            no.direita = this._inserirNo(no.direita, palavra, definicao);
        } else {
            // A palavra já está mapeada! Apenas substituímos ou atualizamos sua definição sem balancear de volta
            no.definicao = definicao;
            return no;
        }

        // 2. Atualiza os "pesos" da altura do nó pai
        no.altura = 1 + Math.max(this.obterAltura(no.esquerda), this.obterAltura(no.direita));

        // 3. Acha a força do balanceamento do trajeto atual (E vs D)
        const balanceamento = this.obterBalanceamento(no);
        
        if (balanceamento > 1 || balanceamento < -1) {
             this.registrarLog(`⚖️ Checando nó [${no.palavra}]. Fator=${balanceamento} (DESBALANCEADO!)`);
        } else { 
             this.registrarLog(`⚖️ Checando nó [${no.palavra}]. Fator=${balanceamento} (OK)`); 
        }

        // 4. Aplica os 4 perfis caso a árvore penda pros lados durante inserção

        // Caso Esquerda Esquerda (Left Left)
        if (balanceamento > 1 && this.comparar(palavra, no.esquerda.palavra) < 0) {
            this.registrarLog(`🚩 Caso LL (Esq-Esq) no nó [${no.palavra}] -> Requer Rotação Simples Direita.`);
            return this.rotacaoDireita(no);
        }

        // Caso Direita Direita (Right Right)
        if (balanceamento < -1 && this.comparar(palavra, no.direita.palavra) > 0) {
            this.registrarLog(`🚩 Caso RR (Dir-Dir) no nó [${no.palavra}] -> Requer Rotação Simples Esquerda.`);
            return this.rotacaoEsquerda(no);
        }

        // Caso Esquerda Direita (Left Right)
        if (balanceamento > 1 && this.comparar(palavra, no.esquerda.palavra) > 0) {
            this.registrarLog(`🚩 Caso LR (Esq-Dir) no nó [${no.palavra}] -> Requer Rotação Dupla (Esq->Dir).`);
            no.esquerda = this.rotacaoEsquerda(no.esquerda);
            return this.rotacaoDireita(no);
        }

        // Caso Direita Esquerda (Right Left)
        if (balanceamento < -1 && this.comparar(palavra, no.direita.palavra) < 0) {
            this.registrarLog(`🚩 Caso RL (Dir-Esq) no nó [${no.palavra}] -> Requer Rotação Dupla (Dir->Esq).`);
            no.direita = this.rotacaoDireita(no.direita);
            return this.rotacaoEsquerda(no);
        }

        return no;
    }

    // Busca valor mais ínfimo (esquerda da esquerda)
    noValorMinimo(no) {
        let atual = no;
        while (atual.esquerda) {
            atual = atual.esquerda;
        }
        return atual;
    }

    // Função pública de remoção encapsulada
    remover(palavra) {
        const tamanhoInicial = this.tamanho;
        this.raiz = this._removerNo(this.raiz, palavra);
        return tamanhoInicial > this.tamanho; // Boolean refletindo deleção autêntica
    }

    // Função privada recursiva de busca e exclusão por ramificação
    _removerNo(raiz, palavra) {
        if (!raiz) return raiz;

        const comparacao = this.comparar(palavra, raiz.palavra);

        // Se menor, continue escrutinando à esquerda
        if (comparacao < 0) {
            raiz.esquerda = this._removerNo(raiz.esquerda, palavra);
        } 
        // Se maior, vá rumo à direita
        else if (comparacao > 0) {
            raiz.direita = this._removerNo(raiz.direita, palavra);
        } 
        // Encontrou o alvo principal exato!
        else {
            this.tamanho--;
            
            // Sub-caso A: Folha Única ou apenas 1 ramo subsequente (órfão)
            if (!raiz.esquerda || !raiz.direita) {
                let temp = raiz.esquerda ? raiz.esquerda : raiz.direita;

                if (!temp) { // Raiz nula
                    temp = raiz;
                    raiz = null;
                } else {
                    raiz = temp; // Fique apenas com seu único ramo substituto do pai removido
                }
            } else {
                // Sub-caso B: A raiz que sai tinha a Árvore completa abaixa na hierarquia
                // Encontrar e isolar seu substituto sucessor pelo Em-Ordem iterativo
                let temp = this.noValorMinimo(raiz.direita);

                // Modifica o cerne das infos da raiz
                raiz.palavra = temp.palavra;
                raiz.definicao = temp.definicao;

                // Compensa tamanho simulado para expurgar a cópia no iterador lá embaixo do galho
                this.tamanho++; 
                raiz.direita = this._removerNo(raiz.direita, temp.palavra);
            }
        }

        // Se por ventura a Raiz despencou da sua estirpe final (caso A), retorne cedo null
        if (!raiz) return raiz;

        // Balanceamento Pós-remoção: Corrigir lacuna deixada
        raiz.altura = Math.max(this.obterAltura(raiz.esquerda), this.obterAltura(raiz.direita)) + 1;

        const balanceamento = this.obterBalanceamento(raiz);
        if (balanceamento > 1 || balanceamento < -1) {
             this.registrarLog(`⚖️ Checando nó [${raiz.palavra}] pós-remoção. Fator=${balanceamento} (DESBALANCEADO!)`);
        } else { 
             this.registrarLog(`⚖️ Checando nó [${raiz.palavra}] pós-remoção. Fator=${balanceamento} (OK)`); 
        }

        // Disputas dos 4 casos (mesmas propriedades da Inserção)
        if (balanceamento > 1 && this.obterBalanceamento(raiz.esquerda) >= 0) {
            this.registrarLog(`🚩 Caso LL pós-remoção em [${raiz.palavra}]. Simples à Direita.`);
            return this.rotacaoDireita(raiz);
        }
        if (balanceamento > 1 && this.obterBalanceamento(raiz.esquerda) < 0) {
            this.registrarLog(`🚩 Caso LR pós-remoção em [${raiz.palavra}]. Dupla (Esq->Dir).`);
            raiz.esquerda = this.rotacaoEsquerda(raiz.esquerda);
            return this.rotacaoDireita(raiz);
        }
        if (balanceamento < -1 && this.obterBalanceamento(raiz.direita) <= 0) {
            this.registrarLog(`🚩 Caso RR pós-remoção em [${raiz.palavra}]. Simples à Esquerda.`);
            return this.rotacaoEsquerda(raiz);
        }
        if (balanceamento < -1 && this.obterBalanceamento(raiz.direita) > 0) {
            this.registrarLog(`🚩 Caso RL pós-remoção em [${raiz.palavra}]. Dupla (Dir->Esq).`);
            raiz.direita = this.rotacaoDireita(raiz.direita);
            return this.rotacaoEsquerda(raiz);
        }

        return raiz;
    }

    // Busca pela arvore
    pesquisar(palavra) {
        let atual = this.raiz;
        while (atual) {
            const comparacao = this.comparar(palavra, atual.palavra);
            if (comparacao === 0) {
                return atual; 
            } else if (comparacao < 0) {
                atual = atual.esquerda;
            } else {
                atual = atual.direita;
            }
        }
        return null; // Não existente 
    }

    // Retorna o caminho percorrido visualmente pela árvore (útil para explicações didáticas)
    pesquisarComCaminho(palavra) {
        let atual = this.raiz;
        let caminho = [];
        
        while (atual) {
            const comparacao = this.comparar(palavra, atual.palavra);
            if (comparacao === 0) {
                caminho.push({ no: atual, status: 'encontrado' });
                return { encontrado: atual, caminho: caminho };
            } else if (comparacao < 0) {
                caminho.push({ no: atual, status: 'esquerda' });
                atual = atual.esquerda;
            } else {
                caminho.push({ no: atual, status: 'direita' });
                atual = atual.direita;
            }
        }
        return { encontrado: null, caminho: caminho };
    }

    // Calcula e rastreia o caminho exato mais profundo da árvore (para demonstrar a "Altura" graficamente)
    rastrearCaminhoMaisProfundo(atual = this.raiz) {
        if (!atual) return [];

        let pathEsq = this.rastrearCaminhoMaisProfundo(atual.esquerda);
        let pathDir = this.rastrearCaminhoMaisProfundo(atual.direita);

        if (pathEsq.length > pathDir.length) {
            return [{ no: atual, status: 'esquerda' }, ...pathEsq];
        } else if (pathDir.length > 0) {
            return [{ no: atual, status: 'direita' }, ...pathDir];
        } else {
            // Último nó folha do caminho
            return [{ no: atual, status: 'encontrado' }];
        }
    }

    /**
     *  PERCURSOS (TRAVERSALS) UTILIZANDO GERADORES `yield`.
     *  *Isso previne travar a tela em árvores incrivelmente grandes como Dicionários em vez de retornar mega Arrays 
     */

    // Percurso = Pré-ordem -> (R - E - D)
    *preOrdem(no = this.raiz) {
        if (no) {
            yield no;
            yield* this.preOrdem(no.esquerda);
            yield* this.preOrdem(no.direita);
        }
    }

    // Percurso = Em-ordem -> (E - R - D) *Essa aqui reordena as palavras alfabeticamente*
    *emOrdem(no = this.raiz) {
        if (no) {
            yield* this.emOrdem(no.esquerda);
            yield no;
            yield* this.emOrdem(no.direita);
        }
    }

    // Percurso = Pós-ordem -> (E - D - R) 
    *posOrdem(no = this.raiz) {
        if (no) {
            yield* this.posOrdem(no.esquerda);
            yield* this.posOrdem(no.direita);
            yield no;
        }
    }

    // Percurso por Amplitude -> Largura usando Filas Nível por Nível
    *amplitude() {
        if (!this.raiz) return;
        const fila = [this.raiz]; 
        while (fila.length > 0) {
            const no = fila.shift();
            yield no;
            if (no.esquerda) fila.push(no.esquerda);
            if (no.direita) fila.push(no.direita);
        }
    }
    
    // Percurso em Profundidade -> Mergulhando pelos "fundos" primeiro iterativamente via Pilha
    *profundidade() {
       if (!this.raiz) return;
       const pilha = [this.raiz];
       while (pilha.length > 0) {
           const no = pilha.pop();
           yield no;
           
           // Direita vai ser empilhada primeiro pra esquerda sair primeiro que ela devido ao LIFO
           if (no.direita) pilha.push(no.direita);
           if (no.esquerda) pilha.push(no.esquerda);
       }
    }
}