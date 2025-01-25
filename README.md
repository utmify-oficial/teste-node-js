# Teste técnico para vaga de desenvolvedor - Utmify

### Introdução ao teste

A [Utmify](https://app.utmify.com.br) é uma plataforma voltada para o rastreio de vendas online, realizadas principalmente com o auxílio das plataformas de anúncios, como Meta Ads, Google Ads etc.

Para que a prestação desse serviço seja possível, faz-se estritamente necessário que haja a comunicação e o recebimento de dados das plataformas de vendas disponíveis no mercado, como a Shopify, Payt, Kiwify, Hotmart etc.

O que torna essa comunicação possível é o que conhecemos como "Webhook", que trata-se de uma maneira que as plataformas conseguem enviar informações para outras plataformas. No nosso contexto, são obtidas as informações das vendas realizadas pelos nossos clientes nas plataformas acima citadas.

Um dos desafios encontrados no momento de realizar essa obtenção de dados, é que cada sistema possui a sua própria estrutura, fazendo-se necessário que haja o correto mapeamento dos dados recebidos para o formato adotado por tal sistema.

O repositório em questão, possui um projeto já estruturado, que está configurado para receber eventos (via webhooks) de variadas plataformas (conforme implementação).

A primeira (que você deve utilizar como exemplo), é a plataforma "WorldMarket", cujos webhooks seriam enviados via método **POST** para a rota **/webhooks/world-market** e o body da requisição carrega as informações dos pedidos advindos dessa plataforma (é possível se analisar exemplos desses bodys no diretório /docs/webhooks/WorldMarket).

No controller já criado (WorldMarketController.ts), é possível se observar que a estrutura da platforma em questão está sendo mapeada para a estrutura da Utmify, salvando as informações da venda posteriormente.

### **Agora é com você!**

## Desafio

Crie um novo endpoint que receberá os pedidos da plataforma **AllOffers**, mapeando a estrutura dessa plataforma para a estrutura da Utmify. O mapeamento deve ser realizado com base nos payloads presentes no diretório **/docs/webhooks/AllOffers**.

Os pedidos da plataforma **AllOffers** podem vir nas moedas BRL, USD ou EUR, mas os valores devem ser salvos no banco de dados sempre na moeda BRL.

Algumas plataformas podem enviar pedidos em ordem incorreta. Por ex: as etapas de um pix, são: pix gerado (pendente) > pix pago > pix reembolsado (caso o cliente reembolse). Porém, é possível que ocorra de uma plataforma enviar um pix pago e posteriormente o pix gerado (atualizando incorretamente o pedido para o status anterior). Você precisará garantir que um pedido gerado não salve em cima de um pedido pago e que um pedido pago não salve em cima de um pedido reembolsado.

### Requisitos
* Todos os payloads presentes em **/docs/webhooks/AllOffers** precisam ser mapeados corretamente para a estrutura da Utmify;
* Os pedidos precisam ser salvos sempre em BRL. Para isso, foi criada a classe ConvertOrderCurrencyAction. Utilize-a para implementar a lógica de conversão;
* Os pedidos "pagos" não podem atualizar para "pendentes" e os pedidos reembolsados não podem atualizar para "pagos" ou "pendentes";
* Crie um arquivo README.md explicando como chegou a determinado resultado (opcional);
* Implemente testes com o Jest (opcional);
* Desenvolva o seu código em uma branch que inclua o seu nome (ex: feat/sandersonrafael) e ao finalizar, faça um pull request.

## Como testar o endpoint

Utilize o **Insomnia** ou **Postman** e faça uma requisição do tipo **POST** para o endpoint criado, utilizando como body da requisição algum dos payloads presentes no caminho **/docs/webhooks/AllOffers**.

## Como executar o projeto

* Crie uma conta no MongoDB Atlas, caso não possua, e gere uma string de conexão com o banco nomeado "Utmify";
* Adicione a string de conexão nas variáveis de ambiente, criando um arquivo **.env**, conforme arquivo de exemplo **.env.example**;
* Adicione a variável **PORT** conforme a sua preferência;
* Instale, caso não possua, o yarn na sua máquina;
* Execute o comando **yarn install**;
* Execute o comando **yarn dev**.

## Tecnologias utilizadas
* TypeScript;
* Express;
* MongoDB;
* Jest.
