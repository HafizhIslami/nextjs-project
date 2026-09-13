"use client";

import React from "react";

type Column = {
  label: string;
  field: string;
};

type Row = Record<string, React.ReactNode>;

interface Props {
  data: {
    columns: Column[];
    rows: Row[];
  };
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
