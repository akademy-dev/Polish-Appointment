import type { StructureResolver } from "sanity/structure";

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.documentTypeListItem("employee").title("Employees"),
      S.documentTypeListItem("customer").title("Customers"),
      S.documentTypeListItem("service").title("Services"),
      S.documentTypeListItem("category").title("Categories"),
    ]);
