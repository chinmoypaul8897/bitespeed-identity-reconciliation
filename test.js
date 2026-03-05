// A simple test script to verify our /identify endpoint
const testIdentify = async (payload, stepName) => {
  try {
    const response = await fetch('http://localhost:3000/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log(`\n--- ${stepName} ---`);
    console.log("Request:", payload);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error in ${stepName}:`, error);
  }
};

const runTests = async () => {
  console.log("Starting Identity Reconciliation Tests...");

  // Scenario 1: Brand new customer
  await testIdentify(
    { email: "lorraine@hillvalley.edu", phoneNumber: "123456" }, 
    "Scenario 1: New Customer (Rule 1)"
  );

  // Scenario 2: Same phone, new email (Should create a secondary)
  await testIdentify(
    { email: "mcfly@hillvalley.edu", phoneNumber: "123456" }, 
    "Scenario 2: New Email, Known Phone (Rule 2)"
  );

  // Scenario 3: Separate new customer entirely
  await testIdentify(
    { email: "george@hillvalley.edu", phoneNumber: "919191" }, 
    "Scenario 3: Separate New Customer"
  );

  // Scenario 4: The Merge (Linking George's email with Lorraine's phone)
  await testIdentify(
    { email: "george@hillvalley.edu", phoneNumber: "123456" }, 
    "Scenario 4: Merging Primary Accounts (Rule 3)"
  );
};

runTests();