import type { AccessBody } from "@/lib/types";

/**
 * FICTIONAL access bodies.
 *
 * None of the organisations below exist. They are invented stand-ins for the
 * role that national Health Data Access Bodies play under the European Health
 * Data Space, created so the prototype can demonstrate multi-jurisdiction
 * workflows. Names, turnaround times and jurisdictions are all made up.
 */
export const ACCESS_BODIES: Record<string, AccessBody> = {
  "hdab-se": {
    id: "hdab-se",
    name: "Svea Health Data Access Authority",
    country: "Sweden",
    jurisdiction: "National — Sweden (fictional)",
    indicativeDecisionDays: 45,
  },
  "hdab-fi": {
    id: "hdab-fi",
    name: "Finnish Secondary Use Permit Office",
    country: "Finland",
    jurisdiction: "National — Finland (fictional)",
    indicativeDecisionDays: 38,
  },
  "hdab-dk": {
    id: "hdab-dk",
    name: "Danish Health Data Permit Board",
    country: "Denmark",
    jurisdiction: "National — Denmark (fictional)",
    indicativeDecisionDays: 30,
  },
  "hdab-de": {
    id: "hdab-de",
    name: "Federal Health Research Data Coordination Office",
    country: "Germany",
    jurisdiction: "Federal, with Länder consultation — Germany (fictional)",
    indicativeDecisionDays: 75,
  },
  "hdab-fr": {
    id: "hdab-fr",
    name: "National Health Data Access Commission",
    country: "France",
    jurisdiction: "National — France (fictional)",
    indicativeDecisionDays: 62,
  },
  "hdab-it": {
    id: "hdab-it",
    name: "Italian Regional Health Data Permit Consortium",
    country: "Italy",
    jurisdiction: "Regional consortium — Italy (fictional)",
    indicativeDecisionDays: 84,
  },
  "hdab-es": {
    id: "hdab-es",
    name: "Iberian Health Data Stewardship Council",
    country: "Spain",
    jurisdiction: "National with autonomous-community sign-off — Spain (fictional)",
    indicativeDecisionDays: 70,
  },
  "hdab-nl": {
    id: "hdab-nl",
    name: "Netherlands Health Data Access Bureau",
    country: "Netherlands",
    jurisdiction: "National — Netherlands (fictional)",
    indicativeDecisionDays: 40,
  },
  "hdab-ee": {
    id: "hdab-ee",
    name: "Estonian Digital Health Permit Service",
    country: "Estonia",
    jurisdiction: "National — Estonia (fictional)",
    indicativeDecisionDays: 25,
  },
  "hdab-pl": {
    id: "hdab-pl",
    name: "Vistula Health Information Access Office",
    country: "Poland",
    jurisdiction: "National — Poland (fictional)",
    indicativeDecisionDays: 90,
  },
  "hdab-pt": {
    id: "hdab-pt",
    name: "Atlantic Health Data Access Directorate",
    country: "Portugal",
    jurisdiction: "National — Portugal (fictional)",
    indicativeDecisionDays: 55,
  },
  "hdab-at": {
    id: "hdab-at",
    name: "Alpine Statistical Data Release Committee",
    country: "Austria",
    jurisdiction: "National — Austria (fictional)",
    indicativeDecisionDays: 48,
  },
  "hdab-ie": {
    id: "hdab-ie",
    name: "Irish Health Research Data Authority",
    country: "Ireland",
    jurisdiction: "National — Ireland (fictional)",
    indicativeDecisionDays: 52,
  },
  "hdab-be": {
    id: "hdab-be",
    name: "Belgian Health Data Access Platform",
    country: "Belgium",
    jurisdiction: "Federal and community level — Belgium (fictional)",
    indicativeDecisionDays: 65,
  },
};

export const ACCESS_BODY_LIST = Object.values(ACCESS_BODIES);
