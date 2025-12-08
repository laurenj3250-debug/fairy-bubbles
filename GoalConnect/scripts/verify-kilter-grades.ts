/**
 * Diagnostic script to verify Kilter grade mapping
 * Shows raw difficulty values from API and what grades they map to
 */
import { createKilterBoardClient } from "../server/importers/kilter-board-client";
import { difficultyToGrade } from "../server/importers/kilter-board-parser";

const KILTER_USERNAME = process.env.KILTER_USERNAME || "laurenj3250";
const KILTER_PASSWORD = process.env.KILTER_PASSWORD || "Crumpet11!!";

async function verifyGrades() {
  const client = createKilterBoardClient();

  console.log("=== PHASE 1: Login to Kilter ===");
  const loginResult = await client.login(KILTER_USERNAME, KILTER_PASSWORD);
  console.log(`Logged in as user ID: ${loginResult.userId}`);

  console.log("\n=== PHASE 2: Fetch raw data from Kilter API ===");
  const data = await client.getUserClimbingData(loginResult.token, loginResult.userId);

  console.log(`\nRaw ascents count: ${data.ascents.length}`);
  console.log(`Raw climbs count: ${data.climbs.length}`);

  console.log("\n=== PHASE 3: Examine raw difficulty values ===");
  console.log("\nAll ascent difficulties (raw from Kilter API):");

  const difficulties: number[] = [];
  for (const ascent of data.ascents) {
    difficulties.push(ascent.difficulty);
  }

  // Sort and show all unique values
  const uniqueDifficulties = [...new Set(difficulties)].sort((a, b) => a - b);
  console.log(`Unique difficulty values: ${uniqueDifficulties.join(", ")}`);
  console.log(`Min difficulty: ${Math.min(...difficulties)}`);
  console.log(`Max difficulty: ${Math.max(...difficulties)}`);

  console.log("\n=== PHASE 4: Apply grade mapping ===");
  console.log("\nDifficulty → Grade mapping for YOUR ascents:");

  for (const diff of uniqueDifficulties) {
    const grade = difficultyToGrade(diff);
    const count = difficulties.filter(d => d === diff).length;
    console.log(`  Difficulty ${diff} → ${grade} (${count} ascents)`);
  }

  // Find max grade
  const grades = difficulties.map(d => difficultyToGrade(d));
  const gradeOrder = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12"];
  const maxGrade = grades.reduce((max, g) => {
    const maxIdx = gradeOrder.indexOf(max);
    const gIdx = gradeOrder.indexOf(g);
    return gIdx > maxIdx ? g : max;
  }, "V0");

  console.log(`\n=== RESULT ===`);
  console.log(`With new mapping, your MAX GRADE would be: ${maxGrade}`);
  console.log(`User says their max is: V3`);
  console.log(`Match: ${maxGrade === "V3" ? "✓ YES" : "✗ NO - MAPPING IS STILL WRONG"}`);
}

verifyGrades().catch(console.error);
