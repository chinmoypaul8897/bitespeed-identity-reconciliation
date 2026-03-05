import { Request, Response } from 'express';
import { reconcileIdentity } from '../services/identityService';

export const identifyContact = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract the email and phoneNumber from the JSON request body [cite: 38, 39, 40]
    const { email, phoneNumber } = req.body;

    // Pass the data to our core engine
    const result = await reconcileIdentity({ email, phoneNumber });

    // Send the successful JSON response back to the client [cite: 42, 43]
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error in /identify endpoint:", error);
    
    // If the user sent completely empty data, tell them it's a Bad Request (400)
    if (error.message === "Either email or phoneNumber must be provided.") {
      res.status(400).json({ error: error.message });
      return;
    }

    // For any other unexpected crashes, send a Generic Server Error (500)
    res.status(500).json({ error: "Internal Server Error" });
  }
};