export class TransactionError extends Error {
    constructor(
      public readonly description: string
    ) {
      super(description);
    }
  }
  