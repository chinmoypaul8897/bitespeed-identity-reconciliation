# 🔗 Identity Reconciliation Engine (BiteSpeed Backend Task)

A robust, fault-tolerant Node.js/TypeScript microservice designed to identify and reconcile customer profiles across multiple purchases. 

**Live API URL:** `https://bitespeed-identity-chinmoy.onrender.com/`

## 🎯 The Objective
E-commerce stores often struggle with fragmented customer data (e.g., a user checking out with different emails or phone numbers over time). This service acts as a "single source of truth," intelligently linking these fragmented interactions into one cohesive "Primary" identity with associated "Secondary" identities.

## 🚀 Tech Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **Language:** TypeScript (Strict Mode)
* **Database:** PostgreSQL (via Neon Serverless)
* **ORM:** Prisma
* **Deployment:** Render

## 🧠 System Architecture & Database Design

I utilized a **Separation of Concerns** architecture, isolating the web layer (`Controllers`) from the core graph algorithm (`Services`). The database schema is designed to recursively link secondary contacts to their oldest primary parent.

```mermaid
erDiagram
    CONTACT {
        Int id PK
        String phoneNumber "nullable"
        String email "nullable"
        Int linkedId FK "nullable"
        String linkPrecedence "primary or secondary"
        DateTime createdAt
        DateTime updatedAt
        DateTime deletedAt "nullable"
    }
    CONTACT ||--o{ CONTACT : "links to (linkedId)"
```

## ⚙️ Core Algorithm & Edge Cases Handled
The core engine treats identity reconciliation as a **Graph Traversal Problem**, actively querying for "clusters" of linked accounts and evaluating them against strict rules:

* **Rule 1 (New Customer):** If no matching email or phone exists, a new `primary` contact is created.
* **Rule 2 (New Information):** If a match is found but the request contains new data (e.g., an existing phone but a new email), a `secondary` contact is created and linked to the primary.
* **Rule 3 (The Merge):** If a request bridges two previously separate `primary` contacts (e.g., using an old email from Account A and an old phone from Account B), the system dynamically demotes the newer primary to `secondary` and re-links all child nodes to the absolute oldest primary.
* **Defensive Programming:** The API actively defends against invalid schema inputs (e.g., safely coercing integers to strings for phone numbers) and handles empty payloads with HTTP 400 Bad Request responses.

## 📡 API Specification

### `POST /identify`
Consolidates contact information based on email and/or phone number.

**Request Body:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Success Response (200 OK):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

## 📂 Project Structure
```text
├── prisma/
│   └── schema.prisma         # Database models
├── src/
│   ├── controllers/
│   │   └── identityController.ts  # HTTP Request/Response handling
│   ├── services/
│   │   └── identityService.ts     # Core Graph traversal & business logic
│   ├── db.ts                 # Prisma Singleton connection
│   └── index.ts              # Express server setup & routing
├── test.js                   # Programmatic test suite for edge cases
└── package.json
```

## 🛠️ Local Setup Instructions

### 1. Clone the repository
    git clone https://github.com/chinmoypaul8897/bitespeed-identity-reconciliation.git
    cd bitespeed-identity-reconciliation

### 2. Install dependencies
    npm install

### 3. Database Configuration
Create a `.env` file in the root directory and add your PostgreSQL connection string:
    DATABASE_URL="postgresql://username:password@your-database-host:5432/dbname"

### 4. Sync the database schema
    npx prisma db push

### 5. Start the development server
    npm run dev

## 🧪 Testing the API
A programmatic test script (`test.js`) is included in the repository to locally verify the exact edge cases outlined in the BiteSpeed requirements. 

Run the tests locally using:
    node test.js

---
*Developed by Chinmoy*