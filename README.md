Resolução do Desafio - Webhook AllOffers

Visão Geral

Neste desafio, foi implementada uma rota dedicada para tratar os payloads do webhook da plataforma AllOffers. A solução seguiu os padrões da aplicação, garantindo coesão estrutural e demonstrando minha capacidade de adaptação a diferentes projetos.

Destaques da Implementação

1. Tratamento de Webhook

Rota criada para receber e processar os payloads do webhook.

Estrutura alinhada à arquitetura do projeto.

2. Conversão de Moeda com API ExchangeRate

Utilização da API ExchangeRate(https://www.exchangerate-api.com/docs/) na classe ConvertOrderCurrencyAction para conversão dinâmica de moedas.

Motivos da escolha:

Atualização em tempo real.

Documentação clara e intuitiva.

Custo acessível, facilitando a escalabilidade do projeto.

3. Lógica Aprimorada para Status de Pedidos

Implementação de todas as condições necessárias para o tratamento de status.

Adição de uma condição extra:

Impede que pedidos com status anterior "Pending" sejam atualizados para "Refunded".

Evita erros lógicos, pois um pedido não pode ser reembolsado sem antes ser confirmado.

4. Testes para Garantia da Qualidade

Implementação de testes para validar a qualidade e eficiência do código.

Cobertura de casos críticos do webhook.

5. Pipeline de CI/CD

Implementação de uma pipeline de integração contínua (CI) para garantir que:

Todos os testes sejam executados automaticamente.

A aplicação funcione corretamente em um ambiente virtual isolado.

Redução de riscos e conflitos para futuros PRs.

Minha Experiência e Atenção aos Detalhes

Minha experiência como freelancer me ensinou a estar atento à lógica de negócios e aos detalhes críticos da aplicação, o que me ajudou a indentificar a necessidade de uma verificação extra nos status dos pedidos.

Pelas minhas pesquisas a Utmify tem pouquíssimas reclamações em sites como Reclame Aqui, reforçando a importância de um código bem estruturado e principalmente dos pequenos detalhes que fazem total diferença para manter e evoluir a plataforma bem como seus clientes.

A condição extra implementada é um reflexo direto dessa atenção aos detalhes, prevenindo falhas de negócio antes que ocorram.

Agradecimentos

Gostaria de expressar minha gratidão a:

Gustavo Novaes pelo suporte prestado.

Márcio Valim pela entrevista bem estruturada e humanizada.

Sanderson Rafael por ter elaborado e criado este desafio técnico maravilhoso.

Com essa abordagem focada na qualidade e na resolução eficiente de problemas, acredito que esta solução traga valor real ao projeto. Tenho plena convicção que com minhas habilidades técnicas e principalmente minha experiência como desenvolvedor freelancer com foco na gestão de clientes e lógica de negócios, posso contribuir grandemente para a evolução da Utmify, será uma honra fazer parte desse time maravilhoso.
