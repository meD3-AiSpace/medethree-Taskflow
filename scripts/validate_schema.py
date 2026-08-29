#!/usr/bin/env python3
"""
Database Schema Validator Script
Validates SQL schema files for:
1. Safety: No DROP TABLE statements
2. Naming: All tables must use snake_case
3. Structure: Every table must have an id column as PRIMARY KEY
"""

import sys
import re
import os

def validate_sql_file(file_path):
    if not os.path.isfile(file_path):
        print(f"Error: File not found: {file_path}")
        return 1

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    errors = []

    # 1. Safety Check: No DROP TABLE
    drop_table_matches = re.findall(r"\bDROP\s+TABLE\b", content, re.IGNORECASE)
    if drop_table_matches:
        errors.append("Safety Policy Violation: 'DROP TABLE' statements are strictly prohibited.")

    # 2 & 3. Parse CREATE TABLE blocks
    # Match CREATE TABLE [IF NOT EXISTS] [schema.]table_name ( ... )
    table_pattern = re.compile(
        r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*\((.*?)\);",
        re.DOTALL | re.IGNORECASE
    )

    matches = list(table_pattern.finditer(content))

    for m in matches:
        schema_name = m.group(1) or ""
        table_name = m.group(2)
        table_body = m.group(3)

        # 2. Naming Check: snake_case
        if not re.match(r"^[a-z0-9_]+$", table_name):
            errors.append(f"Naming Policy Violation: Table name '{table_name}' must use snake_case.")

        # 3. Structure Check: id column with PRIMARY KEY
        has_id_pk = False

        # Check inline id ... PRIMARY KEY
        if re.search(r"\bid\s+[^,\n]+?\bPRIMARY\s+KEY\b", table_body, re.IGNORECASE):
            has_id_pk = True
        # Check table constraint PRIMARY KEY (id)
        elif re.search(r"\bPRIMARY\s+KEY\s*\(\s*id\s*\)", table_body, re.IGNORECASE):
            has_id_pk = True

        if not has_id_pk:
            errors.append(f"Structure Policy Violation: Table '{table_name}' must have an 'id' column designated as PRIMARY KEY.")

    if errors:
        print(f"Schema Validation Failed for: {file_path}")
        for err in errors:
            print(f"  - {err}")
        return 1

    print(f"Schema Validation Passed: {file_path} complies with all policies.")
    return 0

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/validate_schema.py <path_to_sql_file>")
        sys.exit(1)

    target_file = sys.argv[1]
    exit_code = validate_sql_file(target_file)
    sys.exit(exit_code)
