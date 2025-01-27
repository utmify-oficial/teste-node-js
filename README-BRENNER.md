# Como foi desenvolvido

* O mapeamento da AllOffers foi realizado baseado muito no que já estava feito, que era da World Market.
* Para realizar a conversão das moedas para BRL, foi utilizada uma biblioteca de terceiros na classe ConvertOrderCurrencyAction.
* Com relação ao status dos pedidos que dependendo das condições não podia ser atualizado, foi utilizado no próprio método save da classe UtmifyOrdersRepositoryMongoose, um filtro com essas condições para não deixar atualizar o pedido.