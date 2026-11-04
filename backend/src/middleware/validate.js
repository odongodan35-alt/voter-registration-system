export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
    return res.status(422).json({ message: 'Validation failed', errors });
  }
  req.validated = result.data;
  next();
};