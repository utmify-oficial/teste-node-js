export class RequestError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly description: string,
    public readonly data?: { [key: string]: any },
  ) {
    super(description);
  }
}
