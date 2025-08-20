# Customer Import Feature

This feature allows you to import customer data from CSV or Excel files into the Polish Appointment system.

## Supported File Formats

- **CSV files** (.csv)
- **Excel files** (.xlsx, .xls)

## Required Columns

Your import file must contain the following columns:

| Column Name | Required | Description | Accepted Variations |
|-------------|----------|-------------|-------------------|
| First Name | Yes | Customer's first name | `firstName`, `First Name`, `first_name`, `Tên` |
| Last Name | Yes | Customer's last name | `lastName`, `Last Name`, `last_name`, `Họ` |
| Phone | Yes | Customer's phone number | `phone`, `Phone`, `phone_number`, `Phone Number`, `Số điện thoại` |
| Note | No | Additional notes about the customer | `note`, `Note`, `notes`, `Notes`, `Ghi chú` |

## File Format Requirements

### CSV Files
- Use comma (,) as the delimiter
- Include a header row with column names
- Enclose text in quotes if it contains commas
- Use UTF-8 encoding

### Excel Files
- Use the first worksheet
- Include a header row with column names
- Data should start from the first row

## Example CSV Format

```csv
firstName,lastName,phone,note
John,Doe,+1234567890,Regular customer
Jane,Smith,+0987654321,Prefers morning appointments
Mike,Johnson,+1122334455,Allergic to certain products
```

## Validation Rules

The import process validates the following:

1. **Required Fields**: First Name, Last Name, and Phone are mandatory
2. **Phone Format**: Phone numbers must be at least 10 digits and can include:
   - Numbers (0-9)
   - Spaces, hyphens, and parentheses
   - Plus sign (+) at the beginning
3. **Data Integrity**: Each row must have the correct number of columns

## Import Process

1. Navigate to the Customers page
2. Click the "Import" button
3. Select your CSV or Excel file
4. Review the preview (for CSV files)
5. Click "Import Customers"
6. Review the import results

## Error Handling

The import process provides detailed error messages for:

- Missing required columns
- Invalid phone number formats
- Empty required fields
- File format issues
- Database import errors

## Success/Failure Reporting

After import, you'll see:

- **Success Count**: Number of customers successfully imported
- **Error List**: Detailed list of any errors encountered
- **Partial Success**: If some records succeed while others fail

## Tips for Successful Import

1. **Use the Template**: Download the provided CSV template as a starting point
2. **Check Phone Numbers**: Ensure phone numbers are in a valid format
3. **Clean Data**: Remove any empty rows or malformed data
4. **Test with Small Files**: Start with a small file to test the format
5. **Backup Data**: Always backup existing data before large imports

## Troubleshooting

### Common Issues

1. **"Missing required headers"**: Ensure your file has the correct column names
2. **"Invalid phone number format"**: Check that phone numbers contain at least 10 digits
3. **"File is empty"**: Make sure your file contains data beyond the header row
4. **"Insufficient data columns"**: Ensure each row has the same number of columns as the header

### Getting Help

If you encounter issues:

1. Check the error messages for specific guidance
2. Verify your file format matches the requirements
3. Try importing a smaller subset of your data first
4. Use the provided template as a reference
