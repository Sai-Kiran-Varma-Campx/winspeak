// ── Evaluation: per-challenge required checkpoints for ABAP challenges ────────
// Missing checkpoints -> Relevancy capped at 60, Structure at 65.
// Missing >half -> Relevancy capped at 45.

export const ABAP_CHECKPOINTS: Record<string, string[]> = {
  abap1: [
    "State current status briefly (education, recent certification)",
    "Mention relevant training or experience (SAP ABAP specific)",
    "Highlight a key achievement (project, distinction, etc.)",
    "Connect to why this specific role interests them",
  ],
  abap2: [
    "Mention SAP's market dominance (87% of global commerce or similar stat)",
    "Reference ABAP Cloud as modern and evolving (CDS, RAP, Clean Core)",
    "Mention S/4HANA migration driving demand",
  ],
  abap3: [
    "Explain that ABAP Cloud uses only SAP-released APIs",
    "List key restricted items (WRITE, FORM/PERFORM, custom FMs, etc.)",
    "List key allowed items (CDS Views, BDEFs, EML, ABAP Unit Tests)",
    "Mention Eclipse ADT as the exclusive tool",
  ],
  abap4: [
    "Describe STANDARD TABLE with O(n) lookup and index access",
    "Describe SORTED TABLE with O(log n) binary search",
    "Describe HASHED TABLE with O(1) hash lookup and no index access",
    "Provide appropriate use cases for each type",
  ],
  abap5: [
    "Demonstrate correct three-table JOIN syntax with aliases",
    "Mention use of tilde (~) for field qualification",
    "Mention @ prefix for ABAP host variables",
    "Explain JOINs as HANA code pushdown vs nested SELECTs",
  ],
  abap6: [
    "Name all four pillars: Encapsulation, Inheritance, Polymorphism, Abstraction",
    "Explain REDEFINITION for method overriding",
    "Explain SUPER for calling parent method",
    "Mention single inheritance limitation in ABAP",
  ],
  abap7: [
    "Define VDM as CDS view library with C1 release contract",
    "Describe Basic Interface View (one DB table, absorbs structure changes)",
    "Describe Composite View (joins multiple basic views)",
    "Describe Consumption View (tailored for one Fiori app, uses PROJECTION ON)",
  ],
  abap8: [
    "Explain the empty driver table risk (selects ALL rows)",
    "Show the IS NOT INITIAL check as mandatory",
    "Mention restrictions: no ORDER BY, no aggregates, no subqueries",
    "Recommend JOIN as preferred alternative",
  ],
  abap9: [
    "Describe CX_STATIC_CHECK (caller must catch, compile-time enforced)",
    "Describe CX_DYNAMIC_CHECK (no compile check, programming errors)",
    "Describe CX_NO_CHECK (fatal/system errors)",
    "Provide an example use case for each",
  ],
  abap10: [
    "Define Validation (checks data, cannot change it, triggered on save)",
    "Define Determination (sets field values, triggered on modify)",
    "Explain EML goes through full RAP pipeline",
    "Contrast with direct SQL which bypasses RAP",
  ],
  abap11: [
    "Explain AUTHORITY-CHECK as runtime program flow control",
    "Explain CDS Access Control (DCL) as database-level row filtering",
    "Contrast: DCL filters automatically for all consumers, AUTHORITY-CHECK is explicit",
    "Mention ACTVT values (03=Display, 01=Create, etc.)",
  ],
  abap12: [
    "Define optimistic locking (assumes conflicts are rare)",
    "Explain ETag as timestamp comparison mechanism",
    "Describe the conflict detection flow (read timestamp vs DB timestamp)",
    "Mention 'total etag' in behavior definition syntax",
  ],
};
