# Explicações - Teste técnico para vaga de desenvolvedor - Utmify

### Lógica de conversão de moedas
O método ```execute``` da classe ```ConvertOrderCurrencyAction``` realiza uma chamada HTTP GET a API pública do Banco Central para consultar a cotação de moedas estrangeiras (```USD``` ou ```EUR```), e então retorna o ```UtmifyValues``` com os valores ajustados para ```BRL```.

### Validação dos status dos pedidos
O método ```save``` da classe ```UtmifyOrdersRepositoryMongoose``` consulta se o pedido já existe na base de dados através de sua chave primária. Caso o pedido já exista, as regras de validação dos status dos pedidos são aplicadas e uma exceção ```TransactionError``` é lançada; essa exceção, caso ocorra, é capturada pelo ```AllOffersController``` que trata então a requisição como mal-formulada e devolve como resposta ao cliente o código HTTP 400 (Bad Request).