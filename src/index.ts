import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON bodies
app.use(express.json());

// A simple test route
app.get('/', (req: Request, res: Response) => {
  res.send('BiteSpeed Identity Reconciliation API is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});