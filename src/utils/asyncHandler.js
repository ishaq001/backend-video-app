export const asyncHandler = (fn) => async (err, req, res, next) => {
	try {
		await fn(err, req, res, next);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// same as above with promise
// const asyncHandlerPromise = (requestHandler) => (req, res, next) => {
//   Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error));
// };
