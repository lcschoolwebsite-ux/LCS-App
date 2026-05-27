export default function Table({
  columns,
  headers,
  data,
  renderRow,
  loading,
  emptyMessage = "No records found",
  pagination,
  onPageChange
}) {
  if (loading) {
    return (
      <div style={s.empty}>
        <div style={s.emptyIcon}><i className="fa-solid fa-circle-notch fa-spin"></i></div>
        <p>Loading records...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={s.empty}>
        <div style={s.emptyIcon}><i className="fa-regular fa-folder-open"></i></div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Support both new 'columns' API and old 'headers' API
  const tableHeaders = columns ? columns.map(c => c.label) : headers;
  const page = pagination?.page || 1;
  const limit = pagination?.limit || data.length;
  const total = pagination?.total ?? data.length;
  const totalPages = pagination?.totalPages || 1;
  const renderedCount = data.length;
  const start = total === 0 || renderedCount === 0 ? 0 : Math.min(((page - 1) * limit) + 1, total);
  const end = start === 0 ? 0 : Math.min(start + renderedCount - 1, total);
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div style={s.wrapper}>
      <table style={s.table}>
        <thead>
          <tr style={s.headerRow}>
            {tableHeaders.map((header, i) => (
              <th key={i} style={s.th}>
                {header} <i className="fa-solid fa-sort" style={{ opacity: 0.3, marginLeft: '4px', fontSize: '0.7rem' }}></i>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={s.row} className="table-row">
              {columns ? (
                columns.map((col, j) => (
                  <td key={j} style={s.td}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))
              ) : (
                renderRow(row)
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div style={s.pagination}>
        <span style={s.pageInfo}>Showing {start} to {end} of {total} entries</span>
        <div style={s.pageBtns}>
          <button
            style={{ ...s.pageBtn, ...(canGoPrev ? {} : s.disabledBtn) }}
            disabled={!canGoPrev}
            onClick={() => onPageChange?.(page - 1)}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button style={{ ...s.pageBtn, ...s.activePageBtn }}>{page}</button>
          <span style={s.pageInfo}>Page {page} of {totalPages}</span>
          <button
            style={{ ...s.pageBtn, ...(canGoNext ? {} : s.disabledBtn) }}
            disabled={!canGoNext}
            onClick={() => onPageChange?.(page + 1)}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    width: "100%",
    background: "var(--white)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "var(--shadow-md)",
    border: "1px solid var(--border)"
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  headerRow: { background: "linear-gradient(135deg, var(--navy-dark), var(--navy))" },
  th: {
    padding: "14px 20px",
    color: "rgba(255,255,255,0.9)",
    fontFamily: "var(--font-body)",
    fontSize: "0.78rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    cursor: "pointer"
  },
  row: { borderBottom: "1px solid #f0ebe0", transition: "var(--transition)" },
  td: { padding: "14px 20px", fontSize: "0.9rem", color: "var(--text)" },
  pagination: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #f0ebe0", background: "var(--white)" },
  pageInfo: { fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" },
  pageBtns: { display: "flex", gap: "0.25rem" },
  pageBtn: { padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "6px", background: "var(--white)", color: "var(--navy)", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" },
  disabledBtn: { opacity: 0.45, cursor: "not-allowed" },
  activePageBtn: { background: "var(--navy)", color: "var(--white)", borderColor: "var(--navy)" },
  empty: {
    border: "2px dashed var(--border)",
    background: "rgba(14, 107, 107, 0.02)",
    borderRadius: "16px",
    padding: "60px 20px",
    textAlign: "center",
    color: "var(--text-muted)",
    fontWeight: "600",
    fontSize: "1rem"
  },
  emptyIcon: { fontSize: "2.5rem", color: "var(--navy)", opacity: 0.5, marginBottom: "1rem" }
};
