// Builds the rows the report page shows.
export function buildReport(orders) {
  return orders.map((o) => ({ id: o.id, customer: o.customer, total: o.total }));
}
