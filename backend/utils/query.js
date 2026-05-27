const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeSearch = value => String(value || "").trim().slice(0, 80);

const parsePagination = query => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 25, 1), 100);

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

module.exports = {
  escapeRegex,
  normalizeSearch,
  parsePagination
};
