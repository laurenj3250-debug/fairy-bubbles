const BASE_URL = "http://localhost:5001";

async function main() {
  // Login first
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "lauren@example.com", password: "password123" }),
  });
  
  const cookies = loginRes.headers.get("set-cookie");
  console.log("Login status:", loginRes.status);
  
  // Now trigger sync
  const syncRes = await fetch(`${BASE_URL}/api/import/kilter-board/sync`, {
    method: "POST",
    headers: { Cookie: cookies || "" },
  });
  
  console.log("Sync status:", syncRes.status);
  const syncData = await syncRes.json();
  console.log("Sync response:", JSON.stringify(syncData, null, 2));
}

main().catch(console.error);
