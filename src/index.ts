import express from 'express';
import { identifyContact } from './controllers/identityController';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON payloads (Crucial!)
app.use(express.json());

// The exact endpoint BiteSpeed requested 
app.post('/identify', identifyContact);

// A simple health check route just so we know the server is alive
app.get('/', (req, res) => {
  res.send('BiteSpeed Identity Reconciliation API is up and running.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});