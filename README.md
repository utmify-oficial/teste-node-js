### Como cheguei a esse resultado.

### 1. Criação do AllOffersController

Para o teste foi implementado o controlador `AllOffersController.ts`, onde o payload é preparado para ser inserido no banco de dados padrão Utmify. Foram necessárias algumas validações, como verificar se o pedido está com status "Pendente", "Pago" ou "Reembolsado", além de converter o tipo de moeda para BRL.

### 2. Implementação das Regras de Atualização de Status

As regras de atualização de status foram implementadas no método `save` do repositório `UtmifyOrdersRepositoryMongoose`:

```typescript
if (existingOrder) {
  // Check the current and new transaction status
  const currentStatus = existingOrder.transactionStatus;
  const newStatus = order.transactionStatus;

  // Implement the business rules
  if (
    (currentStatus === "paid" && newStatus === "pending") ||
    (currentStatus === "refunded" &&
      (newStatus === "paid" || newStatus === "pending"))
  ) {
    throw new Error("Invalid status transition");
  }
}
```

### 3. Adição da Lógica de Conversão de Moeda para BRL

A lógica de conversão de moeda foi adicionada na ação `ConvertOrderCurrencyAction`:

```typescript
export class ConvertOrderCurrencyAction {
  // Simulação de função que retorna a taxa de câmbio para BRL
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    const exchangeRates: { [key: string]: number } = {
      USD: 5.25, // Exemplo de taxa de câmbio de USD para BRL
      EUR: 5.7, // Exemplo de taxa de câmbio de EUR para BRL
      BRL: 1, // BRL para BRL
    };

    return exchangeRates[fromCurrency] || 1; // Retorna 1 se a moeda for BRL
  }

  // Função que executa a conversão
  async execute(
    input: ConvertOrderCurrencyActionInput
  ): Promise<ConvertOrderCurrencyActionOutput> {
    const { currency, totalSaleAmount, userCommission, platformCommission } =
      input;

    if (currency === "BRL") {
      return {
        totalSaleAmountInBRL: totalSaleAmount,
        userCommissionInBRL: userCommission,
        platformCommissionInBRL: platformCommission,
      };
    }

    const exchangeRate = await this.getExchangeRate(currency, "BRL");
    return {
      totalSaleAmountInBRL: totalSaleAmount * exchangeRate,
      userCommissionInBRL: userCommission * exchangeRate,
      platformCommissionInBRL: platformCommission * exchangeRate,
    };
  }
}
```

### Como a Lógica de Conversão Funciona

A lógica de conversão de moeda funciona da seguinte maneira:

1. **Obtenção da Taxa de Câmbio**: A função `getExchangeRate` simula a obtenção da taxa de câmbio entre a moeda de origem e o BRL (Real Brasileiro). As taxas de câmbio são armazenadas em um objeto e a função retorna a taxa correspondente à moeda de origem. Se a moeda de origem for BRL, a taxa de câmbio retornada é 1.

2. **Execução da Conversão**: A função `execute` recebe um objeto de entrada contendo a moeda, o valor total da venda, a comissão do usuário e a comissão da plataforma. Se a moeda for BRL, os valores são retornados sem alteração. Caso contrário, a função obtém a taxa de câmbio e multiplica os valores pela taxa para convertê-los para BRL.

3. **Retorno dos Valores Convertidos**: A função retorna um objeto contendo os valores convertidos para BRL, incluindo o valor total da venda, a comissão do usuário e a comissão da plataforma.

### Exemplo de Armazenamento no Banco de Dados

Os dados são armazenados no banco de dados no seguinte formato:

```json
{
  "_id": { "$oid": "67954efa90198474cabc8895" },
  "saleId": "9988776655",
  "externalWebhookId": "webhook_44556",
  "paymentMethod": "Billet",
  "platform": "AllOffers",
  "transactionStatus": "Pending",
  "products": [
    {
      "id": "prod_321",
      "name": "Wireless Headphones",
      "quantity": { "$numberInt": "1" },
      "priceInCents": { "$numberInt": "75000" }
    }
  ],
  "customer": {
    "id": "cust_3915",
    "fullName": "Ana Costa",
    "email": "ana.costa@example.com",
    "phone": "+5521987654321",
    "country": "BR"
  },
  "values": {
    "totalValueInCents": { "$numberInt": "75000" },
    "sellerValueInCents": { "$numberInt": "7500" },
    "platformValueInCents": { "$numberInt": "9000" },
    "shippingValueInCents": { "$numberInt": "0" }
  },
  "createdAt": { "$date": { "$numberLong": "1737716400000" } },
  "updatedAt": { "$date": { "$numberLong": "1737838443937" } },
  "paidAt": null,
  "refundedAt": null,
  "__v": { "$numberInt": "0" }
}
```
