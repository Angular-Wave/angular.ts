/**
 * A callback type for handling errors.
 *
 * @param exception - The exception associated with the error.
 * @param [cause] - Optional information about the context in which the error was thrown.
 */
export type ErrorHandler = (exception: Error, cause?: string) => void;
