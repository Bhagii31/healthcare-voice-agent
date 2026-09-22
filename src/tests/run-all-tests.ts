import { unitTests } from "./unit-tests";

async function main(): Promise<void> {
  let passed = 0;
  let failed = 0;

  for (const test of unitTests) {
    try {
      await test.run();
      console.log(`  PASS  ${test.name}`);
      passed += 1;
    } catch (err) {
      console.log(`  FAIL  ${test.name}`);
      console.log(`        ${(err as Error).message}`);
      failed += 1;
    }
  }

  console.log(`\n${passed}/${unitTests.length} tests passed`);
  if (failed > 0) process.exit(1);
}

main();
