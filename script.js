document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector(".formulario");
    const dataInput = document.getElementById('data');
    const horarioSelect = document.getElementById('horario');
    const horarioFimInput = document.getElementById('horario_fim');
    const avisoHorarios = document.getElementById('aviso-horarios');
    const checkboxesServicos = document.querySelectorAll('input[name="servico"]');

    // URL do Webhook unificada do Make
    const URL_MAKE = "https://hook.us2.make.com/xgazkaxtc99668av76qg2cyqfe6ajowh";
    const URL_HORARIOS_OCUPADOS = URL_MAKE;
    const URL_AGENDAMENTO = URL_MAKE;

    // Guarda os horários ocupados da data escolhida
    let horariosOcupadosCache = [];

    // Durações dos serviços em minutos
    const duracoesServicos = {
        'corte': 30,
        'franja': 30,
        'penteado': 60,
        'escova': 60,
        'hidratacao': 60,
        'hidratação': 60
    };

    // ---------- Funções auxiliares ----------

    function diaDaSemana(dataValor) {
        const [ano, mes, dia] = dataValor.split('-').map(Number);
        return new Date(ano, mes - 1, dia).getDay(); // 0 = Dom ... 6 = Sáb
    }

    // Extrai "HH:MM" de um texto ISO (ex.: 2026-11-13T13:30:00-03:00) e devolve em minutos
    function extrairMinutos(valor) {
        if (!valor) return null;
        const texto = typeof valor === 'object' ? (valor.dateTime || '') : String(valor);
        const m = texto.match(/T(\d{2}):(\d{2})/);
        return m ? Number(m[1]) * 60 + Number(m[2]) : null;
    }

    // Converte a lista que vem do Make em intervalos { ini, fim } (em minutos)
    function converterIntervalos(ocupados) {
        return (ocupados || []).map(ev => {
            if (!ev) return null;
            const ini = extrairMinutos(ev.start);
            const fim = extrairMinutos(ev.end);
            return (ini === null || fim === null) ? null : { ini, fim };
        }).filter(Boolean);
    }

    // Verifica se um atendimento (inicio-fim) bate com algum horário ocupado
    function conflita(inicio, fim, intervalos) {
        return intervalos.some(i => inicio < i.fim && fim > i.ini);
    }

    function calcularDuracaoTotal() {
        let total = 0;
        checkboxesServicos.forEach(chk => {
            if (chk.checked) {
                const valor = chk.value.toLowerCase().trim();
                if (duracoesServicos[valor]) {
                    total += duracoesServicos[valor];
                }
            }
        });
        return total === 0 ? 30 : total; // Mínimo de 30 min
    }

    // Lê a resposta do Make mesmo que venha sem colchetes ou sem vírgula entre os eventos
    function interpretarResposta(texto) {
        let t = String(texto || '').trim();
        if (!t) return [];

        const extrair = (r) => {
            if (Array.isArray(r)) return r;
            if (r && typeof r === 'object') {
                if (Array.isArray(r.ocupados)) return r.ocupados;
                if (Array.isArray(r.horarios)) return r.horarios;
                if (r.start && r.end) return [r];
            }
            return [];
        };

        try {
            return extrair(JSON.parse(t));
        } catch (e) {
            try {
                t = t.replace(/}\s*,?\s*{/g, '},{');
                if (!t.startsWith('[')) t = '[' + t;
                if (!t.endsWith(']')) t = t + ']';
                return extrair(JSON.parse(t));
            } catch (e2) {
                console.error("Resposta do Make em formato inesperado:", texto);
                return [];
            }
        }
    }

    async function buscarHorariosOcupados(dataValor) {
        try {
            const response = await fetch(URL_HORARIOS_OCUPADOS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ acao: "horarios", data: dataValor })
            });
            if (!response.ok) return [];
            const texto = await response.text();
            return interpretarResposta(texto);
        } catch (error) {
            console.error("Erro ao buscar horários ocupados:", error);
        }
        return [];
    }

    // ---------- 1. Ao alterar a data ----------

    if (dataInput) {
        dataInput.addEventListener('change', async (e) => {
            const dataValor = e.target.value;
            if (!dataValor) return;

            const semana = diaDaSemana(dataValor);

            if (semana === 1 || semana === 2) {
                alert('O salão está fechado às segundas e terças-feiras. Por favor, escolha outro dia.');
                dataInput.value = '';
                horarioSelect.innerHTML = '<option value="">Selecione uma data válida</option>';
                if (avisoHorarios) avisoHorarios.textContent = '';
                if (horarioFimInput) horarioFimInput.value = '';
                return;
            }

            horarioSelect.innerHTML = '<option value="">Carregando horários...</option>';
            if (avisoHorarios) avisoHorarios.textContent = '';

            horariosOcupadosCache = await buscarHorariosOcupados(dataValor);
            gerarHorariosDisponiveis(semana, horariosOcupadosCache);
        });
    }

    // ---------- 2. Gerar horários (ocupados aparecem desativados) ----------

    function gerarHorariosDisponiveis(semana, horariosOcupados = []) {
        const horarioAtualSelecionado = horarioSelect.value;

        horarioSelect.innerHTML = '<option value="">Escolha um horário</option>';

        let horaFechamento = 19; // Quarta a Sexta
        if (semana === 6) {
            horaFechamento = 18; // Sábado
        } else if (semana === 0) {
            horaFechamento = 14; // Domingo
        }

        const duracao = calcularDuracaoTotal();
        const limiteInicio = horaFechamento * 60 - duracao;
        const intervalos = converterIntervalos(horariosOcupados);

        let totalOcupados = 0;

        for (let inicio = 9 * 60 + 30; inicio <= limiteInicio; inicio += 30) {
            const fim = inicio + duracao;
            const h = String(Math.floor(inicio / 60)).padStart(2, '0');
            const m = String(inicio % 60).padStart(2, '0');
            const horarioString = `${h}:${m}`;

            const option = document.createElement('option');
            option.value = horarioString;

            if (conflita(inicio, fim, intervalos)) {
                option.disabled = true;
                option.classList.add('horario-ocupado');
                option.textContent = `${horarioString} — Ocupado`;
                totalOcupados++;
            } else {
                option.textContent = horarioString;
            }

            horarioSelect.appendChild(option);
        }

        // Mantém o horário escolhido só se ele ainda estiver livre
        const opcaoLivre = Array.from(horarioSelect.options)
            .find(o => o.value === horarioAtualSelecionado && !o.disabled);
        horarioSelect.value = opcaoLivre ? horarioAtualSelecionado : '';

        atualizarHorarioTermino();

        if (avisoHorarios) {
            avisoHorarios.textContent = totalOcupados > 0
                ? 'Os horários marcados como "Ocupado" já estão reservados e não podem ser escolhidos.'
                : '';
        }
    }

    // ---------- 3. Horário de término ----------

    function atualizarHorarioTermino() {
        const horarioInicio = horarioSelect.value;
        if (!horarioInicio) {
            if (horarioFimInput) horarioFimInput.value = '';
            return "";
        }

        const totalMinutosServicos = calcularDuracaoTotal();
        const [h, m] = horarioInicio.split(':').map(Number);
        const totalMinutos = h * 60 + m + totalMinutosServicos;

        const novoH = Math.floor(totalMinutos / 60);
        const novoM = totalMinutos % 60;

        const horarioFimCalculado = `${String(novoH).padStart(2, '0')}:${String(novoM).padStart(2, '0')}`;
        if (horarioFimInput) {
            horarioFimInput.value = horarioFimCalculado;
        }
        return horarioFimCalculado;
    }

    if (horarioSelect) {
        horarioSelect.addEventListener('change', atualizarHorarioTermino);
    }

    // Ao mudar os serviços, recalcula a lista
    checkboxesServicos.forEach(chk => {
        chk.addEventListener('change', () => {
            if (dataInput && dataInput.value) {
                gerarHorariosDisponiveis(diaDaSemana(dataInput.value), horariosOcupadosCache);
            } else {
                atualizarHorarioTermino();
            }
        });
    });

    // ---------- 4. Envio do formulário ----------

    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();

            const servicosSelecionados = [];
            checkboxesServicos.forEach((checkbox) => {
                if (checkbox.checked) {
                    servicosSelecionados.push(checkbox.value);
                }
            });

            const horarioFimCalculado = atualizarHorarioTermino();

            const dados = {
                acao: "agendar",
                nome: document.getElementById("nome") ? document.getElementById("nome").value : "",
                telefone: document.getElementById("telefone") ? document.getElementById("telefone").value : "",
                data: document.getElementById("data") ? document.getElementById("data").value : "",
                horario: document.getElementById("horario") ? document.getElementById("horario").value : "",
                horario_fim: horarioFimCalculado || "",
                servicos: servicosSelecionados,
                pagamento: document.getElementById("pagamento") ? document.getElementById("pagamento").value : ""
            };

            // Checagem final de conflito de horários
            if (dados.data && dados.horario && horarioFimCalculado) {
                const ocupadosAgora = await buscarHorariosOcupados(dados.data);
                horariosOcupadosCache = ocupadosAgora;

                const [hi, mi] = dados.horario.split(':').map(Number);
                const [hf, mf] = horarioFimCalculado.split(':').map(Number);

                if (conflita(hi * 60 + mi, hf * 60 + mf, converterIntervalos(ocupadosAgora))) {
                    alert('Esse horário acabou de ser reservado por outra pessoa. Escolha outro horário.');
                    gerarHorariosDisponiveis(diaDaSemana(dados.data), ocupadosAgora);
                    return;
                }
            }

            try {
                const response = await fetch(URL_AGENDAMENTO, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dados)
                });

                if (response.ok) {
                    alert("Agendamento realizado com sucesso!");
                    form.reset();
                    horariosOcupadosCache = [];
                    if (horarioSelect) {
                        horarioSelect.innerHTML = '<option value="">Selecione a data primeiro</option>';
                    }
                    if (avisoHorarios) avisoHorarios.textContent = '';
                    if (horarioFimInput) horarioFimInput.value = '';
                } else {
                    alert("Ocorreu um erro ao enviar o agendamento. Tente novamente.");
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                alert("Erro de conexão com o servidor.");
            }
        });
    }
});