/**
 * Custom error class for API errors.
 * @class ApiError
 */
class ApiError extends Error {
	/**
	 * Constructor for ApiError.
	 * @param {number} statusCode - The HTTP status code to associate with the error.
	 * @param {string} [message="something went wrong"] - The error message.
	 * @param {Array} [errors=[]] - Additional error details.
	 * @param {string} [stack=""] - The stack trace.
	 */
	constructor(
		statusCode,
		message = "something went wrong",
		errors = [],
		stack = ""
	) {
		super(message);
		this.statusCode = statusCode;
		this.message = message;
		this.errors = errors;
		this.data = null;
		this.success = false;

		if (stack.length > 0) {
			this.stack = stack;
		} else {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export { ApiError };
