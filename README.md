## 💻 Teste técnico para vaga de desenvolvedor - Utmify

A Utmify é uma plataforma voltada para o rastreio de vendas online, realizadas principalmente com o auxílio das plataformas de anúncios, como Meta Ads, Google Ads etc.

Para que a prestação desse serviço seja possível, faz-se estritamente necessário que haja a comunicação e o recebimento de dados das plataformas de vendas disponíveis no mercado, como a Shopify, Payt, Kiwify, Hotmart etc.

O que torna essa comunicação possível é o que conhecemos como "Webhook", que trata-se de uma maneira que as plataformas conseguem enviar informações para outras plataformas. No nosso contexto, são obtidas as informações das vendas realizadas pelos nossos clientes nas plataformas acima citadas.

Um dos desafios encontrados no momento de realizar essa obtenção de dados, é que cada sistema possui a sua própria estrutura, fazendo-se necessário que haja o correto mapeamento dos dados recebidos para o formato adotado por tal sistema.

O repositório em questão, possui um projeto já estruturado, que está configurado para receber eventos (via webhooks) de variadas plataformas (conforme implementação).

A primeira (que você deve utilizar como exemplo), é a plataforma "WorldMarket", cujos webhooks seriam enviados via método POST para a rota /webhooks/world-market e o body da requisição carrega as informações dos pedidos advindos dessa plataforma (é possível se analisar exemplos desses bodys no diretório /docs/webhooks/WorldMarket).

No controller já criado (WorldMarketController.ts), é possível se observar que a estrutura da platforma em questão está sendo mapeada para a estrutura da Utmify, salvando as informações da venda posteriormente.

<br/>

## 💻 Pré-requisitos

Antes de começar, verifique se você atendeu aos seguintes requisitos:
* Você tem uma máquina `<Windows / Linux / Mac>`
* Você instalou a versão mais recente do `NodeJS`
* Você instalou a versão mais recente do `Docker`

<br/>

## ⚙️ Instalando

Para instalar execute no terminal:

yarn:
```
yarn install
```

<br/>
<br/>

## 🚀 Rodando o projeto

Primeiramente crie um arquivo ```.env``` na raíz do projeto e adicione as seguintes variáveis de ambiente e seus respectivos valores:

```
PORT="3333"
MONGODB_URL="URL MongoDb"
EXCHANGE_API_KEY="API KEY ExchangeRate"
```
<br/>


Para rodar o projeto digite no terminal:

yarn:
```
yarn dev
```

<br/>
<br/>

## 🧪 Rodando os testes

Foram realizados testes, utilizando o jest. Para rodar os ```testes``` digite o seguinte comando no terminal:

yarn:
```
yarn test
```
<br/>
<br/>

## Features
### Converter moeda

- ✅ A classe ConvertOrderCurrencyAction converte as moedas para o formato ```BRL```.
- ✅ Faz conexão com a API ExchangeRate para buscar o valor atual das moedas.
- ✅ Caso não tenha a API KEY ou aconteça algum erro na requisição serão utilizados os valores estáticos das moedas para a conversão.


### Validação do status da transação

- ✅ Os pedidos ```PAGOS``` não podem atualizar para ```PENDENTES``` e os pedidos ```REEMBOLSADOS``` não podem atualizar para ```PAGOS``` ou ```PENDENTES```.
- ✅ Foi implementada uma validação em UtmifyOrdersRepositoryMongoose.
- ✅ Optei por definir ```Prioridade``` para cada status da transação e fazer a comparação.



<br/>



## 🚀 Tecnologias utilizadas

O projeto está desenvolvido utilizando as seguintes tecnologias:

- Typescript <img width="25px" height="25px" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" />
- NodeJS <img width="25px" height="25px" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" />
- Express <img width="25px" height="25px" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" />
- MongoDB <img width="25px" height="25px" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg" />
- Jest <img width="25px" height="25px" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jest/jest-plain.svg" />
- Swagger <img width="25px" height="25px" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swagger/swagger-original.svg" />


