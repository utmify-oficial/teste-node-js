# Teste técnico para vaga de desenvolvedor - Utmify

### Conversão
Fiz uma requisição para uma API e percorri o objeto até encontrar a moeda desejada e retornei sua taxa de conversão para o Real porém não consegui utilizar a action no controller.

### Status dos pedidos
Para resolver o conflito com os status dos pedidos eu selecionei o pedido do banco de dados utilizando o orderId do payload como parametro e então comparei ambos os valores para evitar o conflito.