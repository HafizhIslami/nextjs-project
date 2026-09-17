"use client";

import React from "react";

export type DataTableColumn = {
  label: string;
  field: string;
  sort?: "asc" | "desc";
};

export type DataTableRow = Record<string, React.ReactNode>;

export interface DataTableData {
  columns: DataTableColumn[];
  rows: DataTableRow[];
}

interface Props {
  data: DataTableData;
  className?: string;
}

const SimpleDataTable = ({ data, className }: Props) => {
  return (
    <div className={`table-responsive ${className ?? ""}`.trim()}>
      <table className="table table-bordered table-striped table-hover align-middle">
        <thead>
          <tr>
            {data.columns.map((column) => (
              <th key={column.field} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, index) => (
            <tr key={index}>
              {data.columns.map((column) => (
                <td key={column.field}>{row[column.field]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SimpleDataTable;
