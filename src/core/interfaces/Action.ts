export interface Action<Input, Output> {
  execute(input: Input): Promise<Output>;
}
