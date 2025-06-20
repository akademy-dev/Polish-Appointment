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
      S.documentTypeListItem("appointment").title("Appointments"),
      S.documentTypeListItem("user").title("Users"),
      S.documentTypeListItem("session").title("Sessions"),
      S.documentTypeListItem("account").title("Accounts"),
      S.documentTypeListItem("verificationToken").title("Verification Tokens"),
      S.documentTypeListItem("passwordResetToken").title(
        "Password Reset Tokens",
      ),
      S.documentTypeListItem("twoFactorToken").title("Two Factor Tokens"),
      S.documentTypeListItem("twoFactorConfirmation").title(
        "Two Factor Confirmations",
      ),
    ]);
