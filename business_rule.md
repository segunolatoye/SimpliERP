# Business Rules & Architecture Guidelines for SimpliERP

## 1. System Architecture Principles
To ensure high availability, maintainability, and modularity, SimpliERP will adhere to the following architectural patterns:

* **Modular Monolith to Microservices**: Start as a well-structured modular monolith. Domains (HR, Finance, Inventory, CRM) must be strictly isolated at the code level (e.g., bounded contexts in Domain-Driven Design). This allows for future extraction into independent microservices if scaling demands it, without over-engineering on day one.
* **Multi-Tenancy Strategy**:
  * **Data Isolation**: Logical separation using a `tenant_id` on every table. Implement Row-Level Security (RLS) at the database level (e.g., PostgreSQL) to prevent accidental cross-tenant data leaks.
  * **Scalability**: Stateless application servers with horizontal autoscaling. Database replication with automated failover to ensure high availability.
* **API-First Design**: All frontends (React Web App, React Native/Flutter Mobile App) communicate via a unified REST or GraphQL API gateway. No server-side rendering of core business logic.
* **Event-Driven Interactions**: Use domain events for cross-module communication to reduce tight coupling. For example, an `OrderPlaced` event in the Sales module asynchronously triggers inventory reduction in the Inventory module and invoice creation in the Finance module.

## 2. Core Business Modules & Rules

### 2.1 Identity & Access Management (IAM)
* **Rule IAM-01**: All users must be authenticated via a centralized Identity Provider (IdP).
* **Rule IAM-02**: Support mandatory Multi-Factor Authentication (MFA) for administrative and financial roles.
* **Rule IAM-03**: Strict Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) must be enforced at both the API routing layer and the database layer.

### 2.2 Financial & Accounting
* **Rule FIN-01**: A strictly compliant double-entry accounting system is mandatory. Every transaction must have corresponding debit and credit entries that balance to zero.
* **Rule FIN-02**: Financial records are immutable. Corrections must be made via adjusting journal entries, never by updating or deleting historical, finalized records.
* **Rule FIN-03**: Support multi-currency transactions with historical exchange rate tracking for accurate global reporting.

### 2.3 Inventory & Supply Chain
* **Rule INV-01**: Inventory valuations must support standard methods like FIFO (First-In, First-Out) and Weighted Average Costing.
* **Rule INV-02**: Negative inventory is strictly prohibited. Transactions that would result in negative stock must be rejected or placed in a pending state awaiting fulfillment.
* **Rule INV-03**: Real-time stock reservation upon cart checkout/order creation to prevent overselling.

### 2.4 Human Resources (HR)
* **Rule HR-01**: PII (Personally Identifiable Information) must be encrypted at rest and in transit.
* **Rule HR-02**: Maintain complete, tamper-proof audit trails for salary changes, role modifications, and terminations.

## 3. High Availability & Disaster Recovery
* **Redundancy**: Deploy infrastructure across multiple Availability Zones (AZs) to prevent single points of failure.
* **Backups**: Automated daily Point-In-Time Recovery (PITR) backups for databases, with geo-redundant storage.
* **Rate Limiting**: Implement strict API rate limiting and throttling per tenant to prevent noisy-neighbor problems and protect system resources.

## 4. Maintainability & Code Quality
* **Testing Strategy**: Minimum 80% unit test coverage for core business logic. Mandatory integration/E2E tests for critical user flows (e.g., checkout, payroll execution, ledger entries).
* **CI/CD Pipeline**: Automated deployment pipelines requiring passing tests, linting, and mandatory peer review before code can reach staging or production environments.
* **Observability**: Centralized structured logging, distributed tracing (e.g., OpenTelemetry), and proactive alerting for system anomalies.


## 5. Detailed Module Constraints & Rules

### Inventory & Items
#### Item Master — Lifecycle & Deletion Rules
- **[BLOCKED] Cannot delete item with any open transaction**: If an item appears on any open PO, SO, GRN, delivery note, invoice, or transfer order — deletion is blocked. The item must be deactivated instead.
- **[BLOCKED] Cannot delete item with stock on hand**: If on-hand quantity > 0 in any warehouse or location, deletion is blocked. Stock must be fully issued, transferred out, or written off first.
- **[BLOCKED] Cannot delete item with historical movement**: Items with any posted stock ledger entry (even zero balance) cannot be hard-deleted. Only soft-delete (archive) is permitted to preserve audit history.
- **[WARNING] Deactivating an item locks it from new transactions**: A discontinued or inactive item cannot be added to new POs, SOs, or transfers. Existing open transactions are not affected and must be closed manually.
- **[BLOCKED] Item code must be unique and immutable**: Once an item code is saved and transactions exist, it cannot be edited. A new item must be created if a code change is needed.
- **[WARNING] Changing item type is restricted after first use**: Switching from 'stock item' to 'non-stock' (or vice versa) is blocked once any stock movement is posted. Type changes on unused items are permitted.
- **[ALLOWED] Non-destructive edits always permitted on active items**: Name, description, category, tags, and notes can be edited at any time regardless of transaction history.

#### Units of Measure — Conversion & Change Rules
- **[BLOCKED] Cannot change base UOM after stock exists**: The base unit of measure is the reference for all quantity calculations. Changing it after any stock movement has been posted is blocked — it would invalidate historical quantities.
- **[BLOCKED] Cannot delete a UOM in active use**: A unit of measure assigned to any item, PO line, or SO line cannot be deleted from the master list.
- **[WARNING] UOM conversion factor changes affect future transactions only**: Editing a conversion factor does not retroactively recalculate posted transactions. A warning must be shown before saving.
- **[ALLOWED] Secondary UOM can be added at any time**: Additional purchase or sales UOMs and their conversion factors can be added to an item without restriction, even after transactions exist.

#### Warehouse & Location — Structure Rules
- **[BLOCKED] Cannot delete a location with stock in it**: Any bin, rack, zone, or warehouse that holds quantity > 0 cannot be deleted or deactivated. Stock must be transferred out first.
- **[BLOCKED] Cannot delete a warehouse with open transactions**: A warehouse referenced in any open GRN, transfer, or delivery note cannot be deleted.
- **[WARNING] Renaming a location does not affect historical records**: Historical movement records retain the location name at time of transaction. Renaming is allowed but auditors should note the name in reports may differ from history.
- **[BLOCKED] Virtual locations cannot be deleted**: System-defined virtual locations (QC Hold, In Transit) are protected. They may be disabled but cannot be removed as they are referenced in stock movement logic.
- **[ALLOWED] New sub-locations can be added freely**: Bins and shelves can be added under any existing rack or zone at any time without restriction.

#### Stock Tracking — Lot, Serial & Expiry Rules
- **[BLOCKED] Cannot change lot tracking setting after stock movement**: If an item is configured for lot tracking, this cannot be disabled once any stock movement has been posted. Lot numbers become part of the audit trail.
- **[BLOCKED] Cannot receive a lot with no lot number if item requires one**: GRN posting is blocked if an item marked as lot-tracked has no lot number entered on the receipt line.
- **[BLOCKED] Cannot issue more than available lot quantity**: Issuing or selling from a specific lot is capped at the lot's available balance. Over-issue is blocked regardless of overall item on-hand quantity.
- **[BLOCKED] Expired lot cannot be issued or sold**: Any lot past its expiry date is automatically locked from goods issue and sales delivery. Can only be moved to a quarantine or scrap location.
- **[BLOCKED] Duplicate serial numbers within same item are blocked**: Two units of the same item cannot carry the same serial number simultaneously. A serial number is only freed after the item is fully disposed, returned to supplier, or written off.
- **[WARNING] Near-expiry lots trigger a configurable warning**: When a lot is within X days of expiry, a warning is raised on any transaction that touches it. The transaction is not blocked by default.
- **[AUTO] FEFO enforced automatically when configured**: If FEFO is enabled on the item or warehouse, the system auto-selects the lot with the earliest expiry date on any issue or sales pick.

#### Stock Movements — Posting Rules
- **[BLOCKED] Cannot post a movement to a closed period**: If the accounting period for the transaction date has been closed, the movement is rejected. The user must reopen the period or change the posting date.
- **[BLOCKED] Cannot issue more stock than on-hand quantity**: Negative stock is blocked by default unless explicitly enabled per warehouse. A goods issue or delivery that would take on-hand below zero is rejected.
- **[BLOCKED] Cannot delete a posted stock movement**: Posted GRNs, goods issues, and transfers are immutable. Corrections must be made via a reversal or return document — not direct deletion.
- **[BLOCKED] Cannot edit quantity or item on a posted movement**: Once a movement is posted to the stock ledger, quantity, item, and location fields are locked. Only reference fields may be editable.
- **[WARNING] Back-dated movements require authorisation**: A movement posted with a date earlier than the current date triggers an approval workflow or requires a supervisor override.
- **[AUTO] Every posted movement auto-generates a stock ledger entry**: The system creates an immutable ledger line for every posted movement: item, location, quantity in/out, running balance, cost, lot/serial, and posting timestamp.
- **[AUTO] GL journal auto-posted on stock movement (if integrated)**: When accounting integration is active, posting a stock movement automatically creates the corresponding debit/credit journal entry in the general ledger.
- **[ALLOWED] Draft movements can be edited or cancelled freely**: Any movement in draft or pending approval state can be fully edited or cancelled without restriction. No ledger entry is created until posting.

#### Inventory Valuation — Costing Rules
- **[BLOCKED] Cannot change costing method after stock movements exist**: FIFO, WAC, or Standard Cost is set per item or per company. Once stock movements are posted, switching costing methods requires a full stock write-off and re-entry.
- **[BLOCKED] Standard cost cannot be zero for stockable items**: A stockable item must have a non-zero standard cost before any receipt is posted, to prevent zero-value valuation entries distorting inventory value.
- **[WARNING] Cost change triggers revaluation journal**: Changing the standard cost of an item creates a revaluation entry for the existing on-hand quantity. This requires period-end authorisation and affects the P&L.
- **[AUTO] WAC recalculated on every receipt**: For weighted average cost items, the system recalculates the average unit cost automatically every time a GRN is posted.
- **[AUTO] Price list effective dates enforced**: A price list entry with a future effective date is not applied until that date. Expired price lists are automatically excluded from transaction lookups.

#### Reorder & Replenishment — Trigger Rules
- **[AUTO] Reorder point check runs after every goods issue**: After any stock-reducing movement is posted, the system compares on-hand quantity against the reorder point for that item + warehouse and flags items that have crossed the threshold.
- **[WARNING] Duplicate purchase requisition warning**: If an auto-generated PR for an item already exists and is open, the system warns before creating another.
- **[BLOCKED] Cannot set reorder point higher than max stock level**: Reorder point must be less than maximum stock level. Saving a configuration where reorder point >= max is blocked as it would trigger perpetual replenishment.
- **[ALLOWED] Reorder settings are per item per warehouse**: Each combination of item + warehouse can have independent reorder point, min, and max.

#### Physical Count & Audit — Integrity Rules
- **[BLOCKED] No stock movements allowed during an active count session**: Once a physical count is opened for a warehouse or location, all goods receipts, issues, and transfers for that location are frozen until the count is closed or cancelled.
- **[BLOCKED] Count variance above threshold requires approval before posting**: If variance between system quantity and counted quantity exceeds a configured % or absolute value, the adjustment journal cannot be posted without a supervisor approval.
- **[BLOCKED] Cannot reopen a posted count adjustment**: Once a count variance is approved and the adjustment journal is posted, it becomes an immutable stock movement. A new count session must be opened to correct further.
- **[AUTO] System quantity is frozen at count open time**: The expected quantity shown on the count sheet is the on-hand balance at the exact timestamp the count session was opened — not live quantity.
- **[ALLOWED] Cycle counts can run without freezing the whole warehouse**: A cycle count scoped to a specific bin or zone only freezes movements for that location, leaving the rest of the warehouse operational.


### Sales
#### Sales Order — Lifecycle & Amendment Rules
- **[BLOCKED] Cannot add items to a fully delivered SO**: Once all lines on a sales order are fully delivered, the SO is closed. No new lines or quantity increases are permitted. A new SO must be raised.
- **[BLOCKED] Cannot reduce SO quantity below already-delivered quantity**: If 8 units of a 10-unit line have been delivered, the line quantity cannot be amended to less than 8.
- **[BLOCKED] Cannot cancel an SO with a posted delivery against it**: An SO with any confirmed or posted delivery note cannot be cancelled. The delivery must be reversed first, then the SO can be cancelled.
- **[BLOCKED] Cannot delete a confirmed or approved SO**: Once an SO moves past draft status, deletion is blocked. It can only be cancelled, which creates an auditable cancelled record.
- **[WARNING] Amending a confirmed SO requires re-approval if above threshold**: Any quantity increase or new line added to an approved SO that pushes the order value above a configurable threshold re-triggers the approval workflow.
- **[WARNING] Selling a discontinued item requires override**: Adding a discontinued or inactive item to an SO is blocked by default. A sales manager override is required to proceed, and a warning is logged.
- **[ALLOWED] Delivery date and reference fields editable after confirmation**: Requested delivery date, customer PO reference, and notes can be updated on a confirmed SO without re-triggering approval.
- **[AUTO] SO status updates automatically based on delivery progress**: Status transitions from Confirmed to Partially Delivered to Fully Delivered are driven automatically by delivery postings.

#### Customer Credit & Pricing Rules
- **[BLOCKED] SO cannot be confirmed if customer exceeds credit limit**: If the customer's outstanding balance + this SO value exceeds their approved credit limit, confirmation is blocked. A credit controller must approve an exception.
- **[BLOCKED] Cannot apply an expired price list to an SO**: A price list past its end date cannot be manually selected on an SO. Only active, in-period price lists are available for selection.
- **[WARNING] Discount above approved threshold requires manager approval**: Any line or order-level discount that exceeds the salesperson's authorised discount ceiling flags the SO and routes it to a sales manager for approval.
- **[BLOCKED] Selling price cannot be below item floor price without override**: Each item can have a floor (minimum) price. Setting a unit price below the floor on an SO line is blocked unless a sales director explicitly overrides it.
- **[AUTO] Price list auto-applied based on customer tier and order date**: On adding a line, the system resolves the applicable price list from the customer's assigned price group and the SO date, then auto-populates unit price.
- **[AUTO] Customer credit balance recalculated on every SO confirmation and payment**: Available credit is a live figure: credit limit minus open SO value minus outstanding invoice balance. It updates in real time as transactions are posted.
- **[ALLOWED] Manual unit price entry permitted within authorised range**: Salespeople can override the auto-populated price as long as it falls between the floor price and no more than their authorised ceiling discount from the list price.

#### Sales Returns & Credit Notes
- **[BLOCKED] Return quantity cannot exceed original delivered quantity**: A sales return against a delivery note is capped at the quantity actually delivered on that note. Over-return is blocked.
- **[BLOCKED] Cannot process a return against a cancelled delivery**: A return must reference a valid, posted delivery note. Returns against cancelled or reversed deliveries are blocked.
- **[WARNING] Returned goods go to QC Hold location by default**: Stock received back from a customer lands in a quarantine location, not directly back to available stock. QC inspection must approve release to saleable inventory.
- **[AUTO] Credit note auto-generated on return approval**: When a sales return is approved and posted, the system automatically creates a draft credit note against the original invoice for the returned quantity and value.
- **[AUTO] Lot and serial numbers re-instated on return posting**: When a serialised or lot-tracked item is returned, its lot/serial record is automatically updated to reflect it back in the warehouse at original cost.


### Delivery
#### Delivery Order — Creation & Posting Rules
- **[BLOCKED] Cannot create a delivery note without a confirmed SO or transfer order**: Delivery notes must be sourced from an approved sales order or approved internal transfer. Stand-alone delivery notes with no source document are blocked.
- **[BLOCKED] Cannot deliver more than the open SO balance**: Delivery quantity per line is capped at the remaining undelivered quantity on the source SO line. Over-delivery requires a SO amendment first.
- **[BLOCKED] Cannot post a delivery if stock is insufficient**: At posting time, the system checks available stock (on-hand minus reserved) in the specified delivery location. If insufficient, the delivery is blocked.
- **[BLOCKED] Cannot post a delivery to a closed accounting period**: The delivery date must fall within an open accounting period. Backdated deliveries into a closed period are rejected.
- **[BLOCKED] Cannot edit item or quantity on a posted delivery note**: Once a delivery note is posted, item, quantity, location, and lot/serial fields are immutable. Corrections require a return delivery note.
- **[BLOCKED] Cannot delete a posted delivery note**: Posted delivery notes are permanent records. A reversal delivery note must be created to undo the stock movement.
- **[WARNING] Partial delivery must be explicitly confirmed by the user**: If a delivery covers only some lines or partial quantities of an SO, the system prompts the user to confirm partial dispatch before posting.
- **[ALLOWED] Delivery reference, driver, and vehicle fields editable after posting**: Non-financial reference fields (carrier, vehicle number, delivery note ref, remarks) can be updated on a posted delivery for logistics tracking purposes.
- **[AUTO] Stock decrement and ledger entry auto-posted on delivery confirmation**: Posting a delivery automatically reduces on-hand quantity, updates the stock ledger, and posts the cost of goods delivered to the GL.

#### Delivery Routing & Fulfilment Rules
- **[BLOCKED] Cannot dispatch from a location flagged as QC Hold**: Stock sitting in a quarantine or QC Hold location cannot be included in a sales delivery. It must be explicitly released to a saleable location first.
- **[BLOCKED] Lot-tracked items must have a lot number assigned before delivery**: A delivery line for a lot-tracked item cannot be posted without a specific lot number assigned. Unassigned lot deliveries are blocked.
- **[BLOCKED] Serialised items must have each serial number listed on delivery**: For serial-tracked items, each unit must have an individual serial number entered. Posting a delivery of quantity 3 without 3 distinct serial numbers is blocked.
- **[WARNING] Delivering a near-expiry lot to a customer triggers a warning**: If the selected lot has fewer than the configured shelf-life days remaining, a warning is shown to the warehouse operator. The delivery is not blocked but the warning is logged.
- **[AUTO] Picking list auto-generated from delivery order**: On saving a confirmed delivery order, the system generates a warehouse picking list ordered by bin location to optimise the pick path.
- **[ALLOWED] Multi-location picking allowed on a single delivery**: A delivery line can be fulfilled from multiple bins or locations (split sourcing). The system records each source location and quantity separately in the ledger.

#### Delivery Reversal & Return Rules
- **[BLOCKED] Cannot reverse a delivery that already has an invoice posted**: If a tax invoice has been raised and posted against a delivery, the delivery cannot be reversed until the invoice is credited first.
- **[BLOCKED] Reversal return quantity cannot exceed original delivery quantity**: A return delivery note referencing an original delivery is capped at the quantity on the original. Excess reversal is blocked.
- **[AUTO] Reversal re-instates stock and re-opens SO balance**: Posting a return delivery reverses the stock ledger entry, restores on-hand quantity, and re-opens the corresponding SO line balance for redelivery.
- **[WARNING] Reversing a delivery in a prior open period requires authorisation**: If the original delivery date falls in a prior but still open period, the reversal must be approved by a finance officer to prevent uncontrolled period restatement.


### Finance
#### Invoicing — Creation & Posting Rules
- **[BLOCKED] Cannot create an invoice without a source document**: A customer invoice must reference at least one posted delivery note or approved SO. Stand-alone invoices with no backing document are blocked.
- **[BLOCKED] Invoice quantity cannot exceed delivered quantity**: You cannot invoice for more than what has been delivered. The billable quantity is capped at the posted delivery quantity not yet invoiced.
- **[BLOCKED] Cannot post an invoice to a closed accounting period**: The invoice date must fall within an open period. Posting to a closed period is rejected regardless of the delivery date.
- **[BLOCKED] Cannot delete a posted invoice**: A posted invoice is a legal and financial document. Deletion is permanently blocked. Corrections must be made via a credit note.
- **[BLOCKED] Cannot edit amount, tax, or item on a posted invoice**: Once posted, all financial fields on an invoice are locked. Only non-financial fields may be editable, subject to configuration.
- **[BLOCKED] Cannot invoice a cancelled or reversed delivery**: A delivery that has been reversed or cancelled cannot be used as a billing source.
- **[WARNING] Invoice date earlier than delivery date triggers a warning**: An invoice date before its source delivery date is financially unusual. The system warns the user and logs it but does not block.
- **[AUTO] Tax calculated automatically based on item tax class and customer tax profile**: On adding an invoice line, the system resolves the correct tax rate from the item's tax classification, the customer's tax exemption status, and the applicable tax rule.
- **[AUTO] GL entries auto-posted on invoice confirmation**: Posting an invoice automatically generates: debit Accounts Receivable, credit Revenue per line, credit Tax Payable. No manual journal entry needed.

#### Credit Notes & Invoice Reversal Rules
- **[BLOCKED] Credit note amount cannot exceed the original invoice amount**: A credit note raised against a specific invoice is capped at the invoice's outstanding (uncredited) balance. Over-credit is blocked.
- **[BLOCKED] Cannot post a credit note to a closed period without authorisation**: A credit note posted to a prior closed period must be approved by a finance manager. It affects already-reported figures and requires explicit sign-off.
- **[AUTO] Credit note auto-reverses the original GL entries**: When a credit note is posted, the system automatically reverses the corresponding revenue, AR, and tax entries from the original invoice.
- **[AUTO] Credit note auto-applied to outstanding balance or held as credit**: The system either auto-allocates the credit note against the oldest outstanding invoice from that customer or holds it as an unallocated credit.
- **[ALLOWED] Partial credit note permitted**: A credit note can cover one or more lines — or a partial quantity on a line — of the original invoice. Full reversal is not required.

#### Payments & Allocation Rules
- **[BLOCKED] Cannot allocate a payment to an invoice in a different currency without exchange rate**: If a customer pays in a foreign currency, an exchange rate must be entered or fetched before the payment can be posted. Missing rate blocks posting.
- **[BLOCKED] Cannot allocate more payment than the invoice outstanding balance**: Over-allocation to a single invoice is blocked. Any excess payment amount must be left as an unallocated credit or allocated to another open invoice.
- **[BLOCKED] Cannot delete or edit a posted payment**: A posted customer receipt is immutable. Reversal requires a payment reversal document, not deletion, to maintain the audit trail.
- **[WARNING] Payment date earlier than invoice date triggers a warning**: Receiving payment before the invoice date is unusual. The system warns but allows it, and logs the discrepancy for audit.
- **[AUTO] Customer AR balance updates in real time on payment posting**: As soon as a payment is posted and allocated, the customer's outstanding balance, available credit, and ageing buckets are immediately recalculated.
- **[AUTO] Unallocated payments flagged in AR ageing report**: Any payment not yet matched to an invoice is automatically surfaced in the unallocated receipts section of the AR ageing report until allocated or refunded.
- **[ALLOWED] Advance / prepayment allowed before invoice exists**: A payment can be posted against a customer account before any invoice exists. It is held as an unallocated credit until an invoice is raised and matched.

#### Period Close & General Ledger Rules
- **[BLOCKED] Cannot post any transaction to a closed period**: Once an accounting period is closed, no journal, invoice, payment, delivery, or stock movement can be posted to it. The system enforces this across all modules.
- **[BLOCKED] Cannot close a period with unposted draft transactions**: Unposted invoices, receipts, or journals dated within the period must be either posted or deleted before the period can be closed.
- **[BLOCKED] Cannot close a period with unreconciled bank accounts**: If bank reconciliation is mandatory, all bank accounts must be reconciled up to the period-end date before the close can proceed.
- **[BLOCKED] Cannot manually edit an auto-posted GL journal**: Journals generated automatically by the system are locked. Only manually created journals can be edited before posting.
- **[BLOCKED] Cannot delete a posted GL journal**: Posted journal entries are permanent. Reversal journals must be created to correct errors, maintaining a full double-entry audit trail.
- **[WARNING] Opening a closed period requires authorisation and logs the action**: Re-opening a closed period requires CFO or finance admin approval and creates an immutable audit log entry recording who opened it, when, and why.
- **[AUTO] Period close automatically calculates and posts retained earnings**: When the fiscal year period is closed, the system automatically calculates net profit/loss for the year and posts the closing entry to retained earnings.
- **[AUTO] FX revaluation journal auto-generated at period end if multi-currency is active**: At period close, the system revalues all open foreign-currency AR, AP, and bank balances at the closing exchange rate and auto-posts the FX gain/loss journal.
- **[ALLOWED] A future period can be opened while the current period is still active**: Finance teams can open the next accounting period before closing the current one, allowing transactions to be posted into the new period in advance.

#### Tax Rules
- **[BLOCKED] Cannot post an invoice with no tax code on a taxable item**: If an item's tax classification requires a tax code and none is assigned, invoice posting is blocked. Every taxable line must have a valid, active tax code.
- **[BLOCKED] Cannot change tax code on a posted invoice**: Tax fields on a posted invoice are immutable. A credit note and re-invoice are required to correct a tax code error.
- **[BLOCKED] Tax exemption must be backed by a valid exemption certificate**: Applying a zero-rate or exempt tax code to a customer who is not marked as tax-exempt in their profile is blocked. Exemption status requires a certificate reference on the customer record.
- **[AUTO] Tax report auto-populated from posted invoices and credit notes**: The VAT/tax return report is driven entirely by posted transactions. No manual entry is required — it aggregates output tax, input tax, and credits per period automatically.
- **[WARNING] Tax rate change mid-period triggers a warning on affected items**: If a tax authority rate change takes effect during an open period, the system warns users when the change boundary is crossed on a transaction.


### Purchasing
#### Purchase Requisition — Rules & Controls
- **[BLOCKED] Cannot approve a PR above the requester's authorisation limit**: Each user role has a maximum PR value they can self-approve. A PR above that threshold is automatically escalated to the next approval tier.
- **[BLOCKED] Cannot convert a PR to a PO if the PR is not fully approved**: A purchase order cannot be raised from a requisition that is still in draft, pending, or partially approved state.
- **[BLOCKED] Cannot delete an approved PR**: Once a PR reaches fully approved status it cannot be deleted. It can only be cancelled, which creates an auditable cancelled record and releases any budget reservations.
- **[WARNING] Duplicate PR for the same item within the same period triggers a warning**: If an open, unconverted PR already exists for the same item, warehouse, and approximate period, the system warns the requester before allowing a new one to be submitted.
- **[AUTO] PR auto-generated when item crosses reorder point**: The inventory module triggers an auto-PR when on-hand quantity falls below the reorder point. The PR is created in draft and routed through the normal approval workflow.
- **[AUTO] Budget commitment raised on PR approval**: When a PR is approved, the system raises a budget commitment (encumbrance) against the relevant cost centre and budget line, reducing available budget immediately.
- **[ALLOWED] Requester can cancel their own unapproved PR at any time**: A PR that has not yet entered the approval workflow, or that has been sent back for revision, can be cancelled by the requester without restriction.

#### Purchase Order — Lifecycle & Amendment Rules
- **[BLOCKED] Cannot raise a PO to a supplier marked as inactive or blacklisted**: Supplier status is checked on PO creation. A blocked, inactive, or blacklisted supplier cannot be selected.
- **[BLOCKED] Cannot confirm a PO without a valid supplier price or agreed cost**: A PO line with zero unit cost cannot be confirmed unless the item is explicitly marked as zero-cost.
- **[BLOCKED] Cannot reduce PO quantity below already-received quantity**: If 6 of 10 ordered units have been received via GRN, the PO line quantity cannot be amended below 6.
- **[BLOCKED] Cannot delete a confirmed PO**: A confirmed PO is a legal commitment to a supplier. Deletion is blocked. It must be formally cancelled.
- **[BLOCKED] Cannot cancel a PO that has any posted GRN against it**: If goods have already been received against a PO line, that line cannot be cancelled. The GRN must be reversed first.
- **[WARNING] PO value above budget available triggers a warning before approval**: If the PO value would cause the budget line to exceed its approved limit, the approver is warned during the approval step.
- **[WARNING] Amending a confirmed PO re-triggers approval if value increases**: Any amendment that increases the total PO value sends the PO back through the approval workflow from the relevant tier.
- **[AUTO] PO auto-converts from approved PR with supplier and price pre-filled**: Converting an approved PR to a PO pre-populates supplier, item, quantity, and price from the preferred supplier record on the item master.
- **[AUTO] Delivery date overdue alert raised automatically**: If the PO expected delivery date passes without a GRN being posted, the system raises an overdue alert to the buyer.
- **[ALLOWED] Delivery date and supplier reference editable after PO confirmation**: Non-financial fields (expected delivery date, supplier order reference, remarks) can be updated on a confirmed PO without re-triggering approval.

#### Goods Receipt Note (GRN) — Rules
- **[BLOCKED] Cannot post a GRN without a confirmed source PO**: Every GRN must reference a confirmed purchase order. Ad-hoc receiving with no PO is blocked to enforce the three-way match discipline.
- **[BLOCKED] Cannot receive more than the open PO balance**: GRN quantity per line is capped at the remaining unreceived balance on the PO line. Over-receiving requires a PO amendment first.
- **[BLOCKED] Cannot post a GRN to a closed accounting period**: The GRN date must fall in an open period. Backdated receipts into a closed period are rejected.
- **[BLOCKED] Cannot edit item, quantity, or location on a posted GRN**: Once a GRN is posted, all stock-affecting fields are immutable. A purchase return note must be created to reverse a wrongly received quantity or item.
- **[BLOCKED] Lot-tracked items cannot be received without a lot number**: A GRN line for a lot-tracked item is blocked from posting if no lot number is entered.
- **[BLOCKED] Serialised items require a serial number per unit on the GRN**: Receiving 5 units of a serial-tracked item requires 5 distinct serial numbers entered before posting.
- **[WARNING] Receiving at a price that deviates from PO price triggers a variance warning**: If the GRN unit cost differs from the PO agreed price by more than a configurable tolerance %, a price variance warning is raised and flagged for review.
- **[AUTO] Stock incremented and ledger entry posted on GRN confirmation**: Posting a GRN automatically increases on-hand quantity at the receiving location, creates a stock ledger entry, and posts the inventory debit to the GL.
- **[AUTO] GRN auto-updates PO received quantity and closes line when fully received**: Each GRN posting updates the corresponding PO line's received quantity. When received quantity equals ordered quantity, the PO line status auto-closes.
- **[ALLOWED] Partial GRN permitted — remaining PO balance stays open**: A GRN can cover part of a PO line. The unreceived balance remains open on the PO for a subsequent GRN, until explicitly closed by the buyer.

#### Supplier Invoice & AP — Three-Way Match Rules
- **[BLOCKED] Cannot post a supplier invoice without matching GRN and PO**: Three-way matching is enforced: a supplier invoice must be matched to a GRN and the originating PO. An invoice with no GRN match is blocked from posting.
- **[BLOCKED] Cannot invoice above the GRN received value plus tolerance**: If the supplier invoice amount exceeds the total GRN value by more than the configured tolerance, posting is blocked until a buyer approves the variance.
- **[BLOCKED] Cannot post a duplicate supplier invoice**: The system checks supplier + invoice number + amount combination. A supplier invoice with the same reference already posted is rejected to prevent double-payment.
- **[BLOCKED] Cannot delete a posted supplier invoice**: Posted AP invoices are immutable legal documents. A debit note must be raised to reverse or partially credit it.
- **[BLOCKED] Cannot post a supplier invoice to a closed period**: Invoice date must fall within an open accounting period.
- **[WARNING] Invoice date outside PO date range triggers a review flag**: A supplier invoice dated before the PO confirmation date or significantly after the GRN date is flagged for AP review.
- **[AUTO] GL entries auto-posted on supplier invoice confirmation**: Posting a supplier invoice automatically generates: debit Purchases/Expense, credit Accounts Payable, credit Tax Input (if applicable).
- **[AUTO] Payment due date auto-calculated from supplier payment terms**: On posting, the system calculates the payment due date from the invoice date and the supplier's configured payment terms.

#### Purchase Returns — Rules
- **[BLOCKED] Return quantity cannot exceed the original GRN quantity**: A purchase return referencing a specific GRN line is capped at what was received on that line. Returning more than was received is blocked.
- **[BLOCKED] Cannot return goods from a GRN that has a fully settled supplier invoice**: If the supplier invoice has been fully paid and no dispute is open, a return requires a debit note to be raised against the supplier first.
- **[AUTO] Stock decremented from the return location on posting**: Posting a purchase return reverses the original GRN stock entry and the GL is reversed.
- **[AUTO] Debit note auto-drafted on purchase return approval**: When a purchase return is approved, the system auto-creates a draft debit note against the supplier for the returned value.
- **[ALLOWED] Return can be made against a partially invoiced GRN**: Goods from a GRN that has been partially invoiced can still be returned. The system tracks the return against the GRN quantity and flags the AP discrepancy for resolution.


### Manufacturing / Production
#### Bill of Materials (BOM) — Rules & Versioning
- **[BLOCKED] Cannot delete a BOM that is referenced by an open production order**: A BOM actively used on any open or in-progress production order is protected from deletion.
- **[BLOCKED] Cannot set a BOM component as its own parent (circular reference)**: The system validates the full BOM tree on save. Any component that directly or indirectly references itself as a parent is rejected.
- **[BLOCKED] Cannot activate a BOM with zero-quantity components**: Every component line on a BOM must have a non-zero quantity per finished unit. A zero-quantity component line blocks BOM activation.
- **[BLOCKED] Cannot have two active BOM versions for the same finished item simultaneously**: Only one BOM version can be active per finished good at any point in time. Activating a new version automatically supersedes and deactivates the previous one.
- **[WARNING] Editing an active BOM affects all production orders created from this point forward**: Changes to an active BOM's components or quantities do not retroactively affect already-created production orders. A warning is shown before saving.
- **[AUTO] New BOM version created on each major revision rather than overwriting**: Editing a BOM that already has historical production against it auto-creates a new version, preserving the previous version as a read-only historical record.
- **[ALLOWED] BOM components can be inactive items if flagged as phase-out**: A component that is being phased out can remain on the BOM as long as it has stock. The system warns when the component's stock drops to zero.
- **[ALLOWED] Scrap/yield percentage can be set per BOM component**: Each component line can carry a configurable scrap factor. The system inflates the material requirement automatically during production order creation to account for expected waste.

#### Production Order — Lifecycle Rules
- **[BLOCKED] Cannot release a production order if component stock is insufficient**: Before a production order can be released, the system checks that all BOM components have sufficient available stock. Insufficient stock blocks release.
- **[BLOCKED] Cannot release a production order without an active BOM**: A production order must reference a BOM version that is currently active. Drafting against an inactive or superseded BOM version is blocked at the release stage.
- **[BLOCKED] Cannot delete a released or in-progress production order**: Once a production order is released, it cannot be deleted. It must be cancelled through the proper cancellation process, which reverses any material reservations.
- **[BLOCKED] Cannot reduce planned quantity below already-produced quantity**: If production has partially completed, the planned quantity cannot be reduced below what has already been produced.
- **[BLOCKED] Cannot close a production order with unresolved material variances above threshold**: If the actual material consumed differs from the BOM-planned quantity by more than a configured tolerance, the order cannot be closed until the variance is reviewed and approved.
- **[WARNING] Producing against a BOM with a near-expiry component triggers a warning**: If any BOM component lot selected for issue is within the configured near-expiry window, a warning is raised to the production supervisor.
- **[AUTO] Component stock auto-reserved on production order release**: When a production order is released, the required BOM component quantities are automatically reserved from the designated raw material warehouse.
- **[AUTO] Production order status transitions automatically**: Status flows from Draft to Released to In Progress to Pending Close to Closed are driven by system events — no manual status toggling required.
- **[ALLOWED] Planned quantity can be increased after release subject to stock availability**: A production order quantity can be increased after release if additional component stock is available. The reservation is extended automatically.

#### Material Issuance & Consumption Rules
- **[BLOCKED] Cannot issue materials to a production order that is not yet released**: Material issue against a draft production order is blocked. The order must be formally released before any component stock can be consumed.
- **[BLOCKED] Cannot issue from a QC Hold or quarantine location**: Components sitting in a quarantine location cannot be issued to production. They must be inspected and released to a production-eligible location first.
- **[BLOCKED] Cannot issue an expired component lot to production**: A lot past its expiry date is locked from production issuance. An expired component must be either scrapped or sent back to the supplier.
- **[BLOCKED] Cannot issue more material than the BOM requirement plus allowed over-issue tolerance**: Material issuance above the BOM-required quantity plus a configured over-issue tolerance is blocked, preventing unauthorised excess consumption.
- **[WARNING] Issuing a substitute component requires supervisor approval**: If the standard BOM component is out of stock and an alternate is used, the substitution must be explicitly approved by the production supervisor.
- **[AUTO] Stock ledger updated immediately on material issue posting**: Each material issue posting reduces on-hand stock of the component, updates the stock ledger with the production order reference, and moves the cost into WIP on the GL.
- **[AUTO] Backflush auto-issues components on production completion (if configured)**: For items configured for backflushing, posting the production completion auto-issues all BOM components at standard quantities in one step.
- **[ALLOWED] Additional (unplanned) material issues can be posted against a production order**: Extra material consumption beyond the BOM requirement can be posted as an unplanned issue, subject to supervisor approval if above tolerance.

#### Production Completion & Finished Goods Rules
- **[BLOCKED] Cannot post a completion for more units than the production order planned quantity**: Producing more finished goods than the planned quantity is blocked by default. An authorised quantity increase on the production order is required first.
- **[BLOCKED] Cannot post completion without specifying the receiving location**: The finished goods must be directed to a specific warehouse location on completion posting. A missing destination location blocks the entry.
- **[BLOCKED] Cannot post completion if mandatory serial numbers are unassigned**: If the finished item is serial-tracked, a serial number must be assigned to each completed unit before the completion can be posted.
- **[BLOCKED] Cannot close a production order with zero completed quantity**: An order with no completion posted cannot be closed — only cancelled. Closing implies finished goods have been produced and received into inventory.
- **[WARNING] Completion quantity less than planned triggers under-production variance warning**: If fewer units than planned are completed and the order is being closed, the system warns of an under-production variance and requires a reason code.
- **[AUTO] Finished goods stock incremented and WIP account cleared on completion posting**: Posting a production completion adds the finished goods quantity to the destination inventory location and posts the GL entry: debit Finished Goods Inventory, credit WIP.
- **[AUTO] Production cost variance calculated and posted on order close**: When the production order is closed, the system compares actual costs against the standard BOM cost and auto-posts the variance to the relevant variance GL accounts.
- **[ALLOWED] Partial completions can be posted against an open production order**: Finished goods can be received into stock in multiple partial completion postings as the production run progresses.

#### Scrap, Rework & Byproduct Rules
- **[BLOCKED] Cannot post scrap against a closed production order**: Once an order is fully closed, no further scrap or rework entries can be posted against it. A standalone inventory write-off must be used instead.
- **[BLOCKED] Scrap quantity cannot exceed total material issued to the production order**: You cannot declare more scrap than the total input material issued. The system validates that issued quantity >= completed quantity + scrap quantity.
- **[WARNING] Scrap above configured threshold requires a quality investigation record**: If scrap quantity exceeds a configured % of planned output, the system blocks the scrap entry until a quality non-conformance record is created and linked.
- **[AUTO] Scrap cost auto-posted to scrap expense account on posting**: When a scrap entry is confirmed, the system calculates the cost of the scrapped material and auto-posts it: debit Scrap Expense, credit WIP or Inventory.
- **[AUTO] Byproducts received into inventory at their defined standard cost**: If a BOM defines byproducts, posting the production completion automatically receives them into the byproduct inventory location at their configured standard cost.
- **[ALLOWED] Rework orders can be raised against scrapped semi-finished goods**: Items scrapped mid-production can be designated for rework. A new rework production order is raised referencing the original order, with only the repair BOM applied.

#### Work Centres & Routing Rules
- **[BLOCKED] Cannot release a production order if a required work centre is inactive**: If the routing references a work centre that is currently inactive or under maintenance, the production order cannot be released until an alternate is specified or the work centre is reactivated.
- **[BLOCKED] Cannot delete a work centre with historical production entries**: A work centre that appears on any posted production entry cannot be deleted. It can be deactivated to prevent future use while preserving historical cost records.
- **[WARNING] Scheduling beyond work centre capacity triggers a capacity warning**: If a production order's routing would require a work centre beyond its defined capacity, the system warns the planner. It does not block scheduling but highlights the overload.
- **[AUTO] Machine and labour hours auto-logged from routing on completion**: When a production completion is posted, the system auto-calculates machine hours and direct labour hours from the routing definition and records them against the production order.
- **[AUTO] Overhead absorbed automatically based on machine or labour hours**: Manufacturing overhead is absorbed onto the production order at posting time using the pre-configured overhead absorption rate and posted to WIP automatically.


### Reporting & Audit
#### Report Access & Permission Rules
- **[BLOCKED] Cannot access a report outside your assigned module permissions**: Every report is tied to a module permission. A user without the relevant permission receives no data and no access to the report UI — not even a blank result.
- **[BLOCKED] Cannot view data from a branch or entity you are not assigned to**: Multi-entity setups enforce data isolation. A user's report results are automatically scoped to their assigned entities. There is no filter bypass that reveals data outside their scope.
- **[BLOCKED] Sensitive reports require an elevated, explicitly assigned permission**: Reports such as full payroll summaries, supplier pricing lists, customer credit limits, and user activity logs require a named elevated permission separate from general access.
- **[BLOCKED] Cannot schedule or email a report to a recipient who lacks access to the data**: Scheduled report delivery checks the recipient's permissions at send time. If access has been revoked, the send is blocked and the sender is notified.
- **[BLOCKED] Cannot embed a report in a shared dashboard that the viewer cannot access**: A dashboard widget linked to a restricted report renders empty for users who lack the underlying report permission.
- **[AUTO] Row-level filtering applied automatically based on user's data scope**: All report queries are automatically appended with the user's entity, branch, and cost-centre scope at the database level. No user-facing filter can override this restriction.
- **[ALLOWED] Read-only report access can be granted without any transaction permission**: A user can be given view-only access to specific reports without any ability to create, edit, or post transactions.

#### Financial Reports — Integrity Rules
- **[BLOCKED] Cannot generate a finalised Balance Sheet for a period with unposted transactions**: A Balance Sheet marked as final requires all transactions in that period to be posted. A draft Balance Sheet can still be generated with a watermark.
- **[BLOCKED] Trial Balance must net to zero before it can be exported as final**: If total debits do not equal total credits, the export is blocked. A non-zero trial balance indicates unbalanced journal entries that must be resolved.
- **[BLOCKED] Cannot generate a comparative report if the prior period has no posted data**: A comparative P&L or Balance Sheet requires the comparison period to contain at least one posted transaction.
- **[BLOCKED] Cannot backdate a financial report to before the system go-live date**: Reports cannot be run for periods before the ERP's opening balance date. Pre-migration data must be accessed separately.
- **[WARNING] Generating a P&L for an unclosed period shows a draft warning**: A P&L report for the current, still-open period is clearly watermarked as provisional. Values may change as more transactions are posted.
- **[WARNING] Balance Sheet items that do not cross-foot to zero trigger an integrity alert**: If Assets do not equal Liabilities + Equity, an integrity alert is raised on the report header. This signals an unbalanced GL entry that must be investigated.
- **[AUTO] All financial reports pull only from posted, period-locked transactions by default**: Report queries default to posted transactions only. Draft and pending transactions are excluded unless the user explicitly enables a include-drafts filter.
- **[ALLOWED] Financial reports can be run for any open or closed period at any time**: There is no restriction on re-running a prior-period financial report. Closed periods produce consistent, unchanging results.

#### Inventory & Stock Reports — Rules
- **[BLOCKED] Cannot generate a stock valuation report for a future date**: Stock valuation reports are point-in-time snapshots of posted transactions. A future date has no posted data and is blocked.
- **[BLOCKED] Stock valuation report total must reconcile to the inventory GL control account**: The system cross-checks the stock valuation report total against the inventory account balance in the GL. A discrepancy triggers a reconciliation alert.
- **[WARNING] Negative stock quantities shown in reports trigger a highlighted flag**: Any item-location combination showing a negative on-hand balance is highlighted on stock reports. Negative stock is never silently suppressed.
- **[WARNING] Stock ageing report flags items with no movement beyond the configured threshold**: Items with zero movement for more than the configured slow-moving threshold are automatically flagged for write-down or disposal review.
- **[AUTO] Stock movement report always shows the running balance per line**: Every line in a stock movement report includes the cumulative running balance after that transaction, so the trail from opening to closing balance is always traceable.
- **[AUTO] Lot traceability report auto-links forward and backward across all modules**: A lot traceability report for any lot number automatically shows: GRN it arrived on, production orders it was consumed in, delivery notes it was dispatched on.
- **[ALLOWED] Stock reports can be filtered to a single bin, zone, or warehouse**: Every stock report can be scoped down to any level of the warehouse hierarchy — from full multi-warehouse view down to a single bin.

#### Audit Trail — Immutability & Completeness Rules
- **[BLOCKED] Audit log entries cannot be edited or deleted by any user, including system administrators**: The audit trail is append-only. No role, including superadmin, can modify or delete an existing audit log entry through the application.
- **[BLOCKED] Audit logging cannot be disabled for any module, even temporarily**: There is no configuration switch to turn off audit logging for any module or transaction type. Every action is always logged, without exception.
- **[BLOCKED] Cannot view another user's personal audit trail without an elevated audit permission**: Viewing the activity log for a specific user requires an explicit audit-viewer permission. A regular user can see only their own activity.
- **[AUTO] Every data-changing action logs user, timestamp, IP, before-value, and after-value**: For every field changed on any record, the audit log stores: which user made the change, exact timestamp, IP address, the field name, the old value, and the new value.
- **[AUTO] All approval actions logged with approver identity and timestamp**: Every approval, rejection, and escalation in every workflow is logged as a discrete audit event with the approver's identity.
- **[AUTO] Failed login attempts, lockouts, and password changes are logged as security events**: Authentication events — successful logins, failed attempts, account lockouts, password resets, and MFA events — are written to the security audit log.
- **[AUTO] Every report export and print action is logged with user, report name, filters, and record count**: Any time a user exports data to Excel, PDF, or CSV, or sends a report by email, the event is logged with what was exported, the filter parameters, and the destination.
- **[AUTO] Permission changes are logged with the authorising administrator's identity**: Any change to a user's roles, permissions, entity scope, or access level creates an audit entry recording what changed and who made the change.
- **[ALLOWED] Audit log can be filtered and searched by user, date range, module, action type, or record ID**: Authorised audit viewers can search and filter the full audit log across all dimensions without restriction.

#### Data Export & Print — Controls
- **[BLOCKED] Cannot bulk-export above a configured row threshold without explicit approval**: Any export that would produce more than the configured row limit is held in a pending state and requires data owner approval before the file is generated.
- **[BLOCKED] Sensitive report exports require a named export permission separate from view permission**: Viewing a report on-screen and exporting it to a file are separately permissioned. A user can view but be blocked from downloading.
- **[BLOCKED] Cannot print or export a draft document without a DRAFT watermark**: Any document in draft or pending status that is printed or exported must carry a clearly visible DRAFT watermark. Removing the watermark requires the document to be posted.
- **[WARNING] Exporting to an external email address outside the company domain triggers a warning**: When a report is directed to an email address outside the configured company domain(s), the user must confirm the external destination before the send proceeds.
- **[AUTO] All exports timestamped and attributed to the exporting user in the audit log**: Every file generated by the system carries a metadata record of who generated it, when, and with what parameters.
- **[ALLOWED] Scheduled report exports can be configured by users with scheduling permission**: Authorised users can set up recurring exports. The schedule runs under the user's own permission scope — it cannot export data the user cannot access interactively.

#### Reconciliation Reports — Rules
- **[BLOCKED] AR ageing total must match the AR control account in the GL before period close**: The system runs a three-way check: AR ageing total = AR sub-ledger total = GL AR control account balance. Any discrepancy blocks the period close.
- **[BLOCKED] AP ageing total must match the AP control account in the GL before period close**: AP ageing total = AP sub-ledger = GL AP control. A mismatch blocks close. Common causes must be cleared first.
- **[BLOCKED] Bank reconciliation must be completed for all active bank accounts before period close**: If bank reconciliation is enabled, every active bank account must show a reconciled status for the period-end date.
- **[BLOCKED] Stock reconciliation must show zero variance between stock ledger and GL inventory account before year-end close**: At fiscal year-end, the stock valuation total must equal the inventory control account in the GL. A non-zero variance blocks the year-end close.
- **[WARNING] Unallocated receipts or payments older than a configurable threshold trigger an alert**: Any customer receipt or supplier payment sitting unallocated for more than the configured number of days is flagged in the reconciliation report.
- **[AUTO] Reconciliation status auto-updated whenever a transaction is posted in the period**: Each time an invoice, payment, journal, or stock movement is posted, the reconciliation status of the affected period and account is automatically recalculated.
- **[AUTO] Inter-company elimination report auto-generated on multi-entity consolidation**: When a consolidated financial report is generated across multiple entities, the system automatically identifies and surfaces inter-company transactions for elimination review.
- **[ALLOWED] Partial bank reconciliation is allowed — unmatched items can be saved as pending**: A bank reconciliation does not need to be completed in one session. Matched items are locked and unmatched items remain open for the next session.

#### User Activity & System Integrity Rules
- **[BLOCKED] Cannot assign a user a permission that their own role ceiling does not permit**: An administrator cannot grant a user a permission that exceeds the admin's own role ceiling. Privilege escalation via permission assignment is blocked.
- **[BLOCKED] A user cannot approve their own transaction at any approval tier**: Self-approval is blocked across every workflow in the system. The approver must always be a different user from the creator or last editor.
- **[BLOCKED] Cannot reuse a password within the configured password history window**: When a user changes their password, the system checks it against the last N passwords (typically 5-10). Reusing a recent password is blocked.
- **[BLOCKED] Account locked after configurable number of consecutive failed login attempts**: After the configured number of failed logins, the account is automatically locked. Unlocking requires a self-service password reset or administrator intervention.
- **[BLOCKED] Cannot delete a user account that has posted transactions**: A user who has created, approved, or posted any transaction cannot be deleted — they are part of the audit trail. The account must be deactivated instead.
- **[AUTO] Session automatically terminated after configurable inactivity period**: An authenticated session with no activity for the configured idle timeout is automatically invalidated server-side. The user must re-authenticate to continue.
- **[AUTO] Concurrent session limit enforced per user**: If a user attempts to log in while already having an active session on another device, the system either blocks the new login or terminates the older session.
- **[AUTO] Data integrity check runs automatically on system startup and logs results**: On each application startup, the system runs an internal integrity check: orphaned records, broken foreign key references, unbalanced journal totals.
- **[ALLOWED] A deactivated user's historical records and audit trail remain fully intact**: Deactivating a user does not purge or anonymise their historical records. All transactions, approvals, and audit log entries remain visible and attributable, indefinitely.

