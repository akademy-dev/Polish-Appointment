#!/usr/bin/env node

/**
 * Script to convert Excel file to NDJSON format for Sanity import
 * Usage: node scripts/convert-excel-to-ndjson.js <input.xlsx> [output.ndjson]
 * 
 * This script converts an Excel file (.xlsx) to NDJSON format that can be imported
 * into Sanity using: sanity dataset import <output.ndjson> <dataset>
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: node scripts/convert-excel-to-ndjson.js <input.xlsx> [output.ndjson]');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1] || inputFile.replace(/\.(xlsx|xls)$/i, '.ndjson');

// Validate input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`Error: File not found: ${inputFile}`);
  process.exit(1);
}

// Header mapping - maps Excel column names to Sanity field names
const headerMapping = {
  // First Name variations
  'firstName': 'firstName',
  'First Name': 'firstName',
  'first_name': 'firstName',
  'Tên': 'firstName',
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
  const trimmed = header.trim();
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
  console.log(`Reading Excel file: ${inputFile}`);
  
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
    console.error(`Error: Missing required columns: ${missingFields.join(', ')}`);
    console.error('Available columns:', headers.join(', '));
    process.exit(1);
  }
  
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
        customer[field] = String(value).trim();
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
    console.error('Error: No valid customer data found in the file');
    if (errors.length > 0) {
      console.error('Errors:', errors.join('\n'));
    }
    process.exit(1);
  }
  
  // Write NDJSON file
  const ndjsonContent = documents.map(doc => JSON.stringify(doc)).join('\n');
  fs.writeFileSync(outputFile, ndjsonContent, 'utf8');
  
  console.log(`\n✅ Successfully converted ${documents.length} customers`);
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
  console.log(`      sanity dataset import ${outputFile} production`);
  console.log(`   3. Or use --replace flag to overwrite existing documents:`);
  console.log(`      sanity dataset import ${outputFile} production --replace`);
  
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}

