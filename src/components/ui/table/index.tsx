import React, { ReactNode } from "react";

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
  onClick?: () => void; // Optional click handler
}

// Props for TableCell
interface TableCellProps {
  children: ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td>
  className?: string; // Optional className for styling
  colSpan?: number; // Number of columns to span
  onClick?: () => void; // Optional click handler
  scope?: string; // Optional scope attribute for accessibility
}

// Props for TableHead (alias for header cells)
interface TableHeadProps {
  children: ReactNode; // Cell content
  className?: string; // Optional className for styling
  colSpan?: number; // Number of columns to span
  onClick?: () => void; // Optional click handler
  scope?: string; // Optional scope attribute for accessibility
}

// Table Component
const Table: React.FC<TableProps> = ({ children, className }) => {
  return <table className={`min-w-full  ${className}`}>{children}</table>;
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return <thead className={className}>{children}</thead>;
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return <tbody className={className}>{children}</tbody>;
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className, onClick }) => {
  return <tr className={className} onClick={onClick}>{children}</tr>;
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
  colSpan,
  onClick,
  scope,
}) => {
  const CellTag = isHeader ? "th" : "td";
  return <CellTag className={` ${className}`} colSpan={colSpan} onClick={onClick} scope={scope}>{children}</CellTag>;
};

// TableHead Component (header cell)
const TableHead: React.FC<TableHeadProps> = ({
  children,
  className,
  colSpan,
  onClick,
  scope,
}) => {
  return <th className={` ${className}`} colSpan={colSpan} onClick={onClick} scope={scope}>{children}</th>;
};

export { Table, TableHeader, TableBody, TableRow, TableCell, TableHead };
