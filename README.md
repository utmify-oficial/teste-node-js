# AllOffers Controller - Processo de Desenvolvimento

## 🔍 Visão Geral

Este documento detalha o processo de criação do `AllOffersController`, desenvolvido com base no `WorldMarketController` existente, adaptando-o para atender aos requisitos específicos da plataforma AllOffers.

## 🚀 Processo de Desenvolvimento

### 1. Análise do WorldMarketController

Inicialmente, analisamos o código base para compreender:
- 📥 Estrutura de recebimento de webhooks
- 🔄 Padrões de transformação de dados
- 🔌 Integração com o sistema Utmify

### 2. Identificação de Diferenças nos Padrões

#### Padrões de Nomenclatura
```typescript
// WorldMarket (snake_case)
{
 order_id: string;
 payment_details: {
   payment_method: string;
 }
}

// AllOffers (PascalCase)
{
 OrderId: string;
 PaymentMethod: string;
}

3. Mapeamento de Equivalências

#### 🏷️ Valores Monetários

| **Descrição**             | **WorldMarket** | **AllOffers**   |
|---------------------------|----------------|-----------------|
| Total Sale Amount         | `total`        | `Valor total`   |
| User Commission           | `seller_fee`   | `Comissão`      |
| Platform Commission       | `platform_fee` | `Taxa`          |

#### 🔄 Status de Transação

| **Status**               | **WorldMarket** | **AllOffers**      |
|--------------------------|----------------|--------------------|
| Awaiting Payment        | `pending`      | `AwaitingPayment`  |
| Paid                    | `approved`     | `Paid`             |
| Refunded                | `refunded`     | `Refunded`         |

4. Separação de Responsabilidades

  4.1 Controller Original
  typescriptCopyexport class AllOffersController {
    allOffersPaymentMethodToUtmifyPaymentMethod()
    allOffersStatusToUtmifyTransactionStatus()
    allOffersProductsToUtmifyProducts()
  }

  4.2 Refatoração para Services
  typescriptCopyexport class AllOffersTransformationService {
    transformPaymentMethod()
    transformTransactionStatus()
    transformProducts()
    transformCustomer()
    transformValues()
  }

5. Implementação da Conversão de Moeda

  5.1 ConvertOrderCurrencyAction

  export class ConvertOrderCurrencyAction {
    private readonly BASE_URL = 'https://economia.awesomeapi.com.br/json/last';

    async execute(
      input: ConvertOrderCurrencyActionInput
    ): Promise<ConvertOrderCurrencyActionOutput>
  }

  5.2 Integração com AwesomeAPI

  Por que foi escolhida?

  -API gratuita e confiável
  -Atualização em tempo real
  -Suporte a múltiplas moedas
  -Documentação clara e completa

  Funcionalidades Utilizadas:

  -Conversão EUR/USD para BRL
  -Taxas de câmbio em tempo real
  -Cache para otimização

📦 Estrutura Final
Controller
export class AllOffersController {
  constructor(
    private readonly usecase: SaveUtmifyOrderUseCase,
    private readonly transformationService: AllOffersTransformationService,
    private readonly currencyConverter: ConvertOrderCurrencyAction
  ) {}

  async handle(req: Request, res: Response): Promise<Response>
}

Types
export interface AllOffersBody {
  OrderId: string;
  PaymentMethod: AllOffersPaymentMethod;
  Currency: string;
  // ...outros campos
}

🎯 Conclusão

A implementação final resultou em:

✅ Código modular e organizado
✅ Responsabilidades bem definidas
✅ Tipagem forte com TypeScript
✅ Facilidade de manutenção