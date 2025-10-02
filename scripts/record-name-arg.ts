export function getRecordNameArg(command: string): string {
  const recordName = process.argv[2];
  if (!recordName) {
    console.error("Error: recordName is required as an argument");
    console.error(`Usage: npm run ${command} <recordName>`);
    process.exit(1);
  }
  return recordName;
}
