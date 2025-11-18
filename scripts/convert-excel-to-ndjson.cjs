#!/usr/bin/env node

/**
 * Script to convert Excel file to NDJSON format for Sanity import
 * Usage: node scripts/convert-excel-to-ndjson.cjs <input.xlsx> [output.ndjson]
 * 
 * This script converts an Excel file (.xlsx) to NDJSON format that can be imported
 * into Sanity using: sanity dataset import <output.ndjson> <dataset>
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: node scripts/convert-excel-to-ndjson.cjs <input.xlsx> [output.ndjson]');
  console.error('\nExample:');
  console.error('  node scripts/convert-excel-to-ndjson.cjs customer.xlsx customer.ndjson');
  process.exit(1);
}

let inputFile = args[0];
let outputFile = args[1] || inputFile.replace(/\.(xlsx|xls)$/i, '.ndjson');

// Resolve to absolute path if relative
if (!path.isAbsolute(inputFile)) {
  const resolvedPath = path.resolve(process.cwd(), inputFile);
  if (fs.existsSync(resolvedPath)) {
    inputFile = resolvedPath;
  } else {
    // Try to find in project root
    const projectRoot = path.resolve(__dirname, '..');
    const projectPath = path.resolve(projectRoot, inputFile);
    if (fs.existsSync(projectPath)) {
      inputFile = projectPath;
    }
  }
}

// Resolve output file to absolute path
if (!path.isAbsolute(outputFile)) {
  outputFile = path.resolve(process.cwd(), outputFile);
}

// Validate input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`\n❌ Error: File not found: ${inputFile}`);
  console.error(`\nCurrent working directory: ${process.cwd()}`);
  console.error(`\n💡 Tips:`);
  console.error(`   - Use absolute path: /full/path/to/customer.xlsx`);
  console.error(`   - Use relative path from current directory: ./customer.xlsx`);
  console.error(`   - Or place file in project root and use: customer.xlsx`);
  console.error(`\nFound Excel files in project:`);
  try {
    const projectRoot = path.resolve(__dirname, '..');
    const { execSync } = require('child_process');
    const foundFiles = execSync(`find "${projectRoot}" -name "*.xlsx" -type f 2>/dev/null | head -5`, { encoding: 'utf8' });
    if (foundFiles.trim()) {
      foundFiles.trim().split('\n').forEach(file => {
        const relativePath = path.relative(process.cwd(), file);
        console.error(`   - ${relativePath}`);
      });
    } else {
      console.error(`   (none found)`);
    }
  } catch (e) {
    // Ignore errors in finding files
  }
  process.exit(1);
}

// Header mapping - maps Excel column names to Sanity field names
const headerMapping = {
  // First Name variations
  'firstName': 'firstName',
  'First Name': 'firstName',
  'first_name': 'firstName',
  'Tên': 'firstName',
  
  // Last Name variations
  'lastName': 'lastName',
  'Last Name': 'lastName',
  'last_name': 'lastName',
  'Họ': 'lastName',
  
  // Phone variations
  'phone': 'phone',
  'Phone': 'phone',
  'phone_number': 'phone',
  'Phone Number': 'phone',
  'Số điện thoại': 'phone',
  
  // Note variations
  'note': 'note',
  'Note': 'note',
  'notes': 'note',
  'Notes': 'note',
  'Ghi chú': 'note',
};

function normalizeHeader(header) {
  const trimmed = String(header || '').trim();
  if (!trimmed) return null;
  
  // Try exact match first
  if (headerMapping[trimmed]) {
    return headerMapping[trimmed];
  }
  
  // Try case-insensitive match
  const lower = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(headerMapping)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }
  
  return null;
}

try {
  console.log(`📖 Reading Excel file: ${inputFile}`);
  
  // Read Excel file
  const workbook = XLSX.readFile(inputFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: '', // Default value for empty cells
  });
  
  if (jsonData.length < 2) {
    console.error('Error: File must contain at least a header row and one data row');
    process.exit(1);
  }
  
  // Get headers from first row
  const headers = jsonData[0].map(h => String(h || '').trim());
  console.log(`📋 Found columns: ${headers.join(', ')}`);
  
  // Map headers to Sanity fields
  const fieldMapping = {};
  headers.forEach((header, index) => {
    const field = normalizeHeader(header);
    if (field) {
      fieldMapping[index] = field;
    }
  });
  
  // Check required fields
  const requiredFields = ['firstName', 'lastName', 'phone'];
  const missingFields = requiredFields.filter(field => 
    !Object.values(fieldMapping).includes(field)
  );
  
  if (missingFields.length > 0) {
    console.error(`\n❌ Error: Missing required columns: ${missingFields.join(', ')}`);
    console.error(`Available columns: ${headers.join(', ')}`);
    console.error('\nSupported column names:');
    console.error('  - firstName: firstName, First Name, first_name, Tên');
    console.error('  - lastName: lastName, Last Name, last_name, Họ');
    console.error('  - phone: phone, Phone, phone_number, Phone Number, Số điện thoại');
    process.exit(1);
  }
  
  console.log(`✅ All required columns found`);
  
  // Process data rows
  const documents = [];
  const errors = [];
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    if (!row || row.length === 0) continue;
    
    // Map row data to Sanity document structure
    const customer = {
      _type: 'customer',
    };
    
    // Map each field
    Object.entries(fieldMapping).forEach(([colIndex, field]) => {
      const value = row[parseInt(colIndex)];
      if (value !== undefined && value !== null && value !== '') {
        let stringValue = String(value).trim();
        
        // Handle phone numbers that might be formatted as scientific notation in Excel
        if (field === 'phone') {
          // Check if it's a number in scientific notation
          if (!isNaN(value) && typeof value === 'number') {
            // Convert to string without scientific notation
            stringValue = value.toFixed(0);
          } else if (stringValue.includes('E+') || stringValue.includes('e+')) {
            // Handle scientific notation strings
            const numValue = parseFloat(stringValue);
            if (!isNaN(numValue)) {
              stringValue = numValue.toFixed(0);
            }
          }
        }
        
        customer[field] = stringValue;
      }
    });
    
    // Validate required fields
    if (!customer.firstName || !customer.lastName || !customer.phone) {
      errors.push(`Row ${i + 1}: Missing required fields (firstName, lastName, or phone)`);
      continue;
    }
    
    // Basic phone validation
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(customer.phone)) {
      errors.push(`Row ${i + 1}: Invalid phone number format: ${customer.phone}`);
      continue;
    }
    
    // Remove empty note field
    if (customer.note === '') {
      delete customer.note;
    }
    
    documents.push(customer);
  }
  
  if (documents.length === 0) {
    console.error('\n❌ Error: No valid customer data found in the file');
    if (errors.length > 0) {
      console.error('\nErrors:');
      errors.forEach(err => console.error(`  ${err}`));
    }
    process.exit(1);
  }
  
  // Write NDJSON file
  const ndjsonContent = documents.map(doc => JSON.stringify(doc)).join('\n');
  fs.writeFileSync(outputFile, ndjsonContent, 'utf8');
  
  console.log(`\n✅ Successfully converted ${documents.length} customer(s)`);
  console.log(`📄 Output file: ${outputFile}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} row(s) had errors and were skipped:`);
    errors.slice(0, 10).forEach(err => console.log(`   ${err}`));
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }
  
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Review the output file: ${outputFile}`);
  console.log(`   2. Import to Sanity using:`);
  console.log(`      npx sanity@latest dataset import ${path.basename(outputFile)} production`);
  console.log(`   3. Or use --replace flag to overwrite existing documents:`);
  console.log(`      npx sanity@latest dataset import ${path.basename(outputFile)} production --replace`);
  console.log(`\n💡 Tip: Use 'npx sanity@latest dataset import --help' for more options`);
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}

