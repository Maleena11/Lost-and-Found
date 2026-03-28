// src/components/ExportButton.jsx
import { CSVLink } from "react-csv";

// Props:
// - data: array of objects to export
// - filename: the CSV file name (e.g., "employees.csv")
// - label: button text (e.g., "Export CSV")
export default function ExportButton({ data, filename, label }) {
  return (
    <CSVLink
      data={data}
      filename={filename}
      className="bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
    >
      {label}
    </CSVLink>
  );
}
