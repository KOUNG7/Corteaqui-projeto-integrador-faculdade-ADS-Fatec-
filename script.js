document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector(".formulario");

    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault(); // Impede o envio padrão e o erro 405

            // Coleta os serviços selecionados nas checkboxes
            const servicosSelecionados = [];
            document.querySelectorAll('input[name="servico"]:checked').forEach((checkbox) => {
                servicosSelecionados.push(checkbox.value);
            });

            // Monta o objeto com os dados preenchidos no formulário
            const dados = {
                nome: document.getElementById("nome") ? document.getElementById("nome").value : "",
                telefone: document.getElementById("telefone") ? document.getElementById("telefone").value : "",
                data: document.getElementById("data") ? document.getElementById("data").value : "",
                horario: document.getElementById("horario") ? document.getElementById("horario").value : "",
                servicos: servicosSelecionados,
                pagamento: document.getElementById("pagamento") ? document.getElementById("pagamento").value : ""
            };

            try {
                // Envia os dados para o Webhook do Make.com
                const response = await fetch("https://hook.us2.make.com/oqf1r795u91dlxqv5agctce5xosi1stv", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dados)
                });

                if (response.ok) {
                    alert("Agendamento realizado com sucesso!");
                    form.reset(); // Limpa o formulário após o envio
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