document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".formulario");

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Coleta os dados dos inputs do seu agendamento.html
      const nome = document.getElementById("nome").value;
      const telefone = document.getElementById("telefone").value;
      const data = document.getElementById("data").value;
      const horario = document.getElementById("horario").value;
      const pagamento = document.getElementById("pagamento").value;

      // Coleta os serviços selecionados (checkboxes)
      const servicosSelecionados = [];
      document.querySelectorAll('input[name="servico"]:checked').forEach((checkbox) => {
        servicosSelecionados.push(checkbox.value);
      });

      if (servicosSelecionados.length === 0) {
        alert("Por favor, selecione pelo menos um serviço.");
        return;
      }

      const dadosAgendamento = {
        nome,
        telefone,
        data,
        horario,
        pagamento,
        servicos: servicosSelecionados.join(", ")
      };

      try {
        // Aqui você colocará a URL do Webhook do Make.com quando configurar
        const webhookUrl = 'https://hook.us2.make.com/sq8yiis3s7sfil6ttevynfwsrq8l76qw'; 

        const resposta = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(dadosAgendamento)
        });

        if (resposta.ok) {
          alert("Agendamento realizado com sucesso!");
          form.reset();
        } else {
          alert("Houve um erro ao realizar o agendamento. Tente novamente.");
        }
      } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert("Erro de conexão com o servidor de agendamento.");
      }
    });
  }
});