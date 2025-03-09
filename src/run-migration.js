// This is a simple script to run the migration and schema update
// Run this with: node src/run-migration.js

console.log("Starting database migration and schema update...")

// First run the schema update to add missing fields
require("./database/updateSchema")

// Then run the migration script
require("./migration-script")

console.log("Migration scripts have been executed.")

