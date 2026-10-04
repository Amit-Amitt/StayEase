const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        return res.status(400).json({
            message: 'Invalid request data',
            errors: result.error.issues.map(({ path, message }) => ({ path: path.join('.'), message }))
        });
    }
    req[source] = result.data;
    next();
};

module.exports = validate;
