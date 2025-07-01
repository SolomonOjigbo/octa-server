// Middleware to validate request bodies
export const validate = (schema: any) => {
    return (req: any, res: any, next: any) => {
        const { error } = schema.validate(req.body);
        if (error) {
        return res.status(400).json({ message: error.message });
        }
        next();
    };
    }