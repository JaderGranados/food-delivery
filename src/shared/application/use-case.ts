export interface UseCase<Command, Output> {
  execute(input: Command): Promise<Output>;
}
