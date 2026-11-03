# CSV export of the report

Spec ID: 2026-10-27-csv-export
Status: approved

## Goal

A user can download the report rows as a CSV file that opens correctly in Excel.

## Acceptance criteria

- **AC-1** (event-driven) WHEN `toCsv(rows, columns)` is called with rows and an ordered list of column keys, the system shall return one header line with the keys, then one line per row with the values in column order, lines joined by `\r\n`.
- **AC-2** (event-driven) WHEN a value contains a comma, a double quote or a line break, the system shall wrap it in double quotes and double every inner double quote.
- **AC-3** (event-driven) WHEN a value is `null` or `undefined`, the system shall write an empty field.
- **AC-4** (unwanted) IF `columns` is empty, THEN the system shall throw an `Error` with the message `columns must not be empty`.

## Contracts

`toCsv(rows: object[], columns: string[]): string`, exported from `src/csv.js`.

## Traceability

| AC | How to verify |
| :- | :- |
| AC-1 | unit test `test/csv.test.js` |
| AC-2 | unit test `test/csv.test.js` |
| AC-3 | unit test `test/csv.test.js` |
| AC-4 | unit test `test/csv.test.js` |
