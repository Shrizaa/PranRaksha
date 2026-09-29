import { isNonTranslatable, decomposeCompoundText } from './lib/i18n/translation-service.ts'

console.log("=== Testing isNonTranslatable ===")
const tests = [
  { text: "12308760", expectedNonTranslatable: true },
  { text: "45.6%", expectedNonTranslatable: true },
  { text: "18.5204° N, 73.8567° E", expectedNonTranslatable: true },
  { text: "WH010", expectedNonTranslatable: true },
  { text: "2026-08-15", expectedNonTranslatable: true },
  { text: "https://api.example.com", expectedNonTranslatable: true },
  { text: "/api/risk-assessment", expectedNonTranslatable: true },
  { text: "km", expectedNonTranslatable: true },
  { text: "Food Packets", expectedNonTranslatable: false },
  { text: "Risk Assessment", expectedNonTranslatable: false },
  { text: "Nearest Warehouse", expectedNonTranslatable: false },
  { text: "Maharashtra Emergency Warehouse", expectedNonTranslatable: false },
]

for (const t of tests) {
  const result = isNonTranslatable(t.text)
  const passed = result === t.expectedNonTranslatable
  console.log(`${passed ? "✅ PASS" : "❌ FAIL"}: "${t.text}" -> nonTranslatable=${result} (expected ${t.expectedNonTranslatable})`)
}

console.log("\n=== Testing decomposeCompoundText ===")
const compoundTests = [
  { text: "Food Packets: 12308760", expectedCompound: true, expectedLabel: "Food Packets:", expectedVal: "12308760" },
  { text: "Distance: 8211.14 km", expectedCompound: true, expectedLabel: "Distance:", expectedVal: "8211.14 km" },
  { text: "Water Bottles: 20514600", expectedCompound: true, expectedLabel: "Water Bottles:", expectedVal: "20514600" },
  { text: "Dashboard", expectedCompound: false },
]

for (const t of compoundTests) {
  const result = decomposeCompoundText(t.text)
  const isCompPass = result.isCompound === t.expectedCompound
  console.log(`${isCompPass ? "✅ PASS" : "❌ FAIL"}: "${t.text}" -> isCompound=${result.isCompound}, label="${result.labelPart}", val="${result.valuePart?.trim()}"`)
}
