import type { Challenge } from "@/types";

export const ABAP_CHALLENGES: Challenge[] = [
  // ── Beginner (abap1-abap3) ── xp: 600, passingScore: 55 ────────────────────
  {
    id: "abap1",
    week: "ABAP",
    tier: "Beginner",
    xp: 600,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Tell Me About Yourself",
    description: "Introduce yourself for an SAP ABAP Cloud Developer role.",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer opens with a classic introductory question to understand your background and motivation.",
    prompt:
      "Tell me about yourself. Structure: Current status (10 sec) \u2192 Relevant training/experience (30 sec) \u2192 Key achievement (20 sec) \u2192 Why this role (10 sec).",
    category: "abap",
    referenceAnswer: `Fresher template: "I am a Computer Science graduate who recently completed a 45-day SAP ABAP certification programme covering ABAP fundamentals through CDS views and the RAP framework. I built a miniproject including a RAP-based OData V4 service, and received distinction for my capstone. I am targeting ABAP Cloud development roles because I want to work on enterprise systems that directly impact business operations."`,
  },
  {
    id: "abap2",
    week: "ABAP",
    tier: "Beginner",
    xp: 600,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Why SAP ABAP?",
    description: "Explain your motivation for choosing SAP ABAP as a specialisation.",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer wants to understand why you chose ABAP over other technology stacks.",
    prompt: "Why SAP ABAP as your specialisation?",
    category: "abap",
    referenceAnswer: `SAP processes over 87% of global commerce \u2014 ABAP gives direct access to that ecosystem. ABAP Cloud (CDS, RAP, Clean Core) is a modern, evolving skillset \u2014 not a commodity. S/4HANA migration is the largest SAP wave in history \u2014 demand exceeds supply of skilled developers.`,
  },
  {
    id: "abap3",
    week: "ABAP",
    tier: "Beginner",
    xp: 600,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "ABAP Cloud Developer Role",
    description: "Describe the ABAP Cloud Developer role and how it differs from classic ABAP.",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer asks you to demonstrate your understanding of the modern ABAP development paradigm.",
    prompt:
      "What is the ABAP Cloud Developer role? How does it differ from classic ABAP?",
    category: "abap",
    referenceAnswer: `An ABAP Cloud Developer builds extensions using only SAP-released APIs, enforced by ATC. Restricted items: WRITE, FORM/PERFORM, INCLUDE programs, custom Function Modules, SELECT on unreleased SAP tables, dynpros. Allowed: Global Classes, CDS View Entities, BDEFs, Service Definitions, ABAP SQL with @ host variables, ABAP Unit Tests, EML (MODIFY/READ ENTITY), released SAP APIs (C1 contract). Tools: Eclipse ADT exclusively \u2014 no SE38, SE80, or SE11 GUI.`,
  },

  // ── Intermediate (abap4-abap8) ── xp: 900, passingScore: 65 ────────────────
  {
    id: "abap4",
    week: "ABAP",
    tier: "Intermediate",
    xp: 900,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Internal Table Types",
    description: "Compare STANDARD, SORTED, and HASHED internal table types.",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer tests your understanding of core ABAP data structures.",
    prompt:
      "Compare STANDARD, SORTED and HASHED internal table types.",
    category: "abap",
    referenceAnswer: `STANDARD TABLE \u2014 O(n) linear lookup, supports index access. Best for sequential processing and small tables. SORTED TABLE \u2014 O(log n) binary search, sorted order maintained. Best for ordered, read-heavy data. HASHED TABLE \u2014 O(1) hash lookup, no index access. Best for large tables with frequent primary key reads.

DATA lt_std TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
DATA lt_srt TYPE SORTED TABLE OF ty_flight WITH UNIQUE KEY carrier_id.
DATA lt_hash TYPE HASHED TABLE OF ty_flight WITH UNIQUE KEY carrier_id.`,
  },
  {
    id: "abap5",
    week: "ABAP",
    tier: "Intermediate",
    xp: 900,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Three-Table JOIN",
    description: "Write a SELECT with an INNER JOIN across three tables and explain the rules.",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer gives you a whiteboard scenario involving multi-table data retrieval.",
    prompt:
      "Write a SELECT with an INNER JOIN across three tables. What rules must you follow?",
    category: "abap",
    referenceAnswer: `SELECT c~name AS carrier_name, f~connection_id, b~bookid, b~customid
  FROM /dmo/carrier AS c
  INNER JOIN /dmo/flight AS f ON c~carrier_id = f~carrier_id
  INNER JOIN /dmo/booking AS b
    ON f~carrier_id = b~carrier_id
   AND f~connection_id = b~connection_id
  WHERE c~carrier_id = 'LH'
  INTO TABLE @DATA(lt_result).

Rules: Use table aliases (AS c) to avoid repetition. Use tilde (~) to qualify fields belonging to each aliased table. Prefix ABAP variables with @ in WHERE clause. JOINs execute as HANA code pushdown \u2014 always faster than nested SELECTs in a LOOP.`,
  },
  {
    id: "abap6",
    week: "ABAP",
    tier: "Intermediate",
    xp: 900,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "OOP in ABAP",
    description: "Explain the four pillars of OOP in ABAP with SUPER and REDEFINITION.",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer probes your object-oriented programming knowledge in the ABAP context.",
    prompt:
      "What are the four pillars of OOP in ABAP? Explain SUPER and REDEFINITION.",
    category: "abap",
    referenceAnswer: `Encapsulation \u2014 PRIVATE/PROTECTED sections hide internal state; accessed via PUBLIC methods. Inheritance \u2014 INHERITING FROM. Single inheritance only in ABAP. Polymorphism \u2014 superclass reference holds subclass object; method resolved at runtime. Abstraction \u2014 ABSTRACT classes and INTERFACES define contracts without full implementation.

CLASS lcl_cargo DEFINITION INHERITING FROM lcl_flight.
  PUBLIC SECTION.
    METHODS display REDEFINITION.
ENDCLASS.
CLASS lcl_cargo IMPLEMENTATION.
  METHOD display.
    rv_info = super->display( ) && ' [CARGO]'.
  ENDMETHOD.
ENDCLASS.

DATA lo_flight TYPE REF TO lcl_flight.
lo_flight = NEW lcl_cargo( ).       " upcast \u2014 always safe
lo_flight->display( ).              " calls lcl_cargo at runtime`,
  },
  {
    id: "abap7",
    week: "ABAP",
    tier: "Intermediate",
    xp: 900,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "CDS Virtual Data Model",
    description: "Explain the CDS Virtual Data Model (VDM) and its three layers.",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer asks about the data modelling strategy used across S/4HANA.",
    prompt:
      "What is the CDS Virtual Data Model (VDM) and its three layers?",
    category: "abap",
    referenceAnswer: `VDM is SAP's CDS view library providing stable, semantically rich data access across S/4HANA releases via the C1 release contract. Basic Interface View (ZI_ / I_) \u2014 reads one DB table. Absorbs table structure changes. @VDM.viewType: #BASIC. Composite View (ZI_ / I_) \u2014 joins multiple basic views into a complete business concept. @VDM.viewType: #COMPOSITE. Consumption View (ZC_ / C_) \u2014 tailored for one Fiori app. Uses AS PROJECTION ON. Rich @UI annotations. @VDM.viewType: #CONSUMPTION.`,
  },
  {
    id: "abap8",
    week: "ABAP",
    tier: "Intermediate",
    xp: 900,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "FOR ALL ENTRIES IN Risk",
    description: "Explain the critical risk of FOR ALL ENTRIES IN and how to mitigate it.",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer tests your awareness of a classic ABAP performance pitfall.",
    prompt:
      "What is the critical risk of FOR ALL ENTRIES IN and how do you mitigate it?",
    category: "abap",
    referenceAnswer: `If the driver internal table is empty, FOR ALL ENTRIES IN selects ALL rows from the target table \u2014 no WHERE restriction. On a large table this can select millions of rows and crash the application server.

IF lt_bookings IS NOT INITIAL.
  SELECT carrier_id, connection_id FROM /dmo/flight
    FOR ALL ENTRIES IN @lt_bookings
    WHERE carrier_id = @lt_bookings-carrier_id
    INTO TABLE @DATA(lt_flights).
ENDIF.

Additional restrictions: No ORDER BY inside FOR ALL ENTRIES. No aggregate functions (SUM, COUNT, AVG). No subqueries inside FOR ALL ENTRIES. Prefer JOIN when both tables are in the same DB context \u2014 cleaner and better HANA pushdown.`,
  },

  // ── Advanced (abap9-abap12) ── xp: 1200, passingScore: 70 ──────────────────
  {
    id: "abap9",
    week: "ABAP",
    tier: "Advanced",
    xp: 1200,
    passingScore: 70,
    maxAttempts: 3,
    status: "active",
    title: "ABAP Exception Classes",
    description: "Describe the three ABAP exception base classes and when to use each.",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer digs into your error handling strategy and exception class design.",
    prompt:
      "What are the three ABAP exception base classes and when do you use each?",
    category: "abap",
    referenceAnswer: `CX_STATIC_CHECK \u2014 caller MUST catch or declare in RAISING. Use for expected business errors (record not found, validation failure). Compile-time enforced. CX_DYNAMIC_CHECK \u2014 no compile check. Use for programming errors that should not occur in correct code (invalid arguments, violated preconditions). CX_NO_CHECK \u2014 never required. Use for fatal/system errors (out of memory) where no realistic handling is possible.

CLASS zcx_booking_failed DEFINITION
  INHERITING FROM cx_static_check FINAL.
  PUBLIC SECTION.
    INTERFACES if_t100_dyn_msg.
    METHODS constructor
      IMPORTING textid LIKE if_t100_message=>t100key OPTIONAL
                previous LIKE previous OPTIONAL
                iv_id TYPE string OPTIONAL.
ENDCLASS.

TRY.
  lo_service->create_booking( ).
CATCH zcx_booking_failed INTO DATA(lx).
  out->write( lx->get_text( ) ).
ENDTRY.`,
  },
  {
    id: "abap10",
    week: "ABAP",
    tier: "Advanced",
    xp: 1200,
    passingScore: 70,
    maxAttempts: 3,
    status: "active",
    title: "Validations and Determinations in RAP",
    description: "Explain Validations, Determinations, and EML in the RAP framework.",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer focuses on your understanding of RAP business object behaviour.",
    prompt:
      "What are Validations and Determinations in RAP? What is EML?",
    category: "abap",
    referenceAnswer: `Validation \u2014 checks data consistency, raises error if invalid. Cannot change data. Triggered on save (before commit). Determination \u2014 automatically calculates or sets field values. Can modify BO fields. Triggered on modify (create or field change). One-sentence rule: Validation = check only. Determination = set values automatically.

EML (Entity Manipulation Language) goes through the full RAP processing pipeline \u2014 validations, determinations, and business logic are all triggered. Direct SQL INSERT/UPDATE bypasses them entirely.

MODIFY ENTITY /dmo/i_booking_d
  CREATE FIELDS ( BookingID CarrierID CustomerID )
  WITH VALUE #( ( %cid = 'CID1' BookingID = '001'
                  CarrierID = 'LH' CustomerID = '1234' ) )
  REPORTED DATA(ls_rpt) FAILED DATA(ls_fail) MAPPED DATA(ls_map).
IF ls_fail IS NOT INITIAL. " handle errors
ENDIF.
COMMIT ENTITIES.`,
  },
  {
    id: "abap11",
    week: "ABAP",
    tier: "Advanced",
    xp: 1200,
    passingScore: 70,
    maxAttempts: 3,
    status: "active",
    title: "AUTHORITY-CHECK vs CDS Access Control",
    description: "Compare AUTHORITY-CHECK with CDS Access Control (DCL).",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer asks about authorisation approaches in classic versus modern ABAP.",
    prompt:
      "How does AUTHORITY-CHECK differ from CDS Access Control (DCL)?",
    category: "abap",
    referenceAnswer: `AUTHORITY-CHECK \u2014 checks whether the current user can perform a specific action. Runs only when the ABAP statement is reached. Controls program flow.

AUTHORITY-CHECK OBJECT 'S_CARRID'
  ID 'CARRID' FIELD lv_carrier_id
  ID 'ACTVT'  FIELD '03'.
IF sy-subrc <> 0.
  RAISE EXCEPTION TYPE zcx_not_authorised.
ENDIF.

CDS Access Control (DCL) \u2014 filters rows at the database level. Unauthorised rows never reach ABAP. Applies to ALL consumers of the CDS view automatically.

define role ZI_Flight {
  grant select on ZI_Flight
    where ( CarrierId ) = aspect pfcg_auth( S_CARRID, CARRID, ACTVT = '03' );
}`,
  },
  {
    id: "abap12",
    week: "ABAP",
    tier: "Advanced",
    xp: 1200,
    passingScore: 70,
    maxAttempts: 3,
    status: "active",
    title: "Optimistic Locking in RAP",
    description: "Explain Optimistic Locking in RAP and how ETag is implemented.",
    scenario:
      "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer tests your understanding of concurrency control in the RAP framework.",
    prompt:
      "What is Optimistic Locking in RAP and how is ETag implemented?",
    category: "abap",
    referenceAnswer: `Optimistic locking assumes conflicts are rare. Instead of locking the record when a user opens it, RAP records a timestamp (ETag). On save, the framework compares the current DB timestamp with the ETag \u2014 if they differ, a concurrent change is detected and the save is REJECTED.

define behavior for ZR_FlightTP
  lock master total etag LastChangedAt
{
  field ( readonly ) LastChangedAt;
}

Scenario: User A reads at 10:00 => ETag = 10:00. User B edits and saves at 10:05 => DB = 10:05. User A tries to save at 10:10 => ETag(10:00) != DB(10:05) => REJECTED.`,
  },
];
