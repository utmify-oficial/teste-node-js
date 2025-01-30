# Desafio Utmify Webhook AllOffers

## Descrição

O desafio consiste em criar um novo endpoint que receberá pedidos da plataforma **AllOffers**, realizando o mapeamento e a tradução dos dados para a estrutura da **Utmify**.
## Requisitos

### Funcionais

- **Mapeamento dos payloads:** O endpoint deve mapear os payloads recebidos de **/docs/webhooks/AllOffers** para a estrutura da Utmify.

- **Conversão de moeda:** O valor dos pedidos precisa ser convertido para **BRL**. Para isso, a classe **ConvertOrderCurrencyAction** precisa ser implementada.

- **Validação de Status:** Pedidos pagos não devem ser alterados para o status "pendente" e pedidos reembolsados não podem ser atualizados para "pagos" ou "pendentes".
### Opcionais

- **Testes:** Implementação dos testes utilizando Jest.

- **Documentação da solução:** Criar um README.md, explicando como chegou ao resultado.

## Realizado

Foi realizado o mapeamento do payload da estrutura da plataforma **AllOffers** para o endpoint **/webhooks/all-offers**. Dentro da classe **ConvertOrderCurrencyAction**, foi utilizada a **Awesome API** para a conversão de moedas, considerando a cotação do dia específico.

Também foi implementado um caso de uso responsável pela busca e validação do estado da transação, impedindo a transição para estados inválidos.

Foram realizados testes utilizando **Jest**, e toda a solução foi documentada em um arquivo **README.md**.