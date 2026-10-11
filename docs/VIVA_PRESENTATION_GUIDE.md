# Receipt Radar — College Viva & Project Presentation Defense Guide

This document equips the student with clear, concise, and academically rigorous answers to the most frequently asked questions by college professors and external examiners during final-year project presentations.

---

## 1. 60-Second Elevator Pitch

> *"Receipt Radar is a cloud-native smart expense intelligence and digital receipt vault platform built with React 19, TypeScript, and TailwindCSS. It tackles three major real-world problems: first, it automates manual expense data entry using client and cloud Optical Character Recognition (OCR); second, it combats fraud through client-side SHA-256 cryptographic duplicate detection; and third, it prevents consumer financial loss by tracking warranty expirations and return deadlines. Architecturally, it is grounded in Third Normal Form (3NF) relational database design with Row-Level Security, scalable cloud object storage, and aligns with Microsoft Azure DP-900 data workload principles."*

---

## 2. Top 15 Viva Questions & Examiner-Ready Model Answers

### Q1: What makes your database design normalized to 3NF?
**Answer:**
- **1NF:** Every column contains atomic values (e.g., individual item names and prices), and every record has a unique primary key (`UUID v4`).
- **2NF:** It is in 1NF, and all non-key attributes are fully functionally dependent on the primary key. Line items are decoupled into a separate `receipt_line_items` table rather than repeating within the `receipts` table.
- **3NF:** It has no transitive dependencies. For example, user budget allocations and category definitions are decoupled into `budgets` and `budget_categories` rather than stored repeatedly on every individual receipt row.

### Q2: Why did you use UUIDv4 instead of auto-incrementing integer IDs (`SERIAL`)?
**Answer:**
- In distributed systems and microservices, sequential integer IDs leak business intelligence (e.g., exposing invoice counts via enumeration) and make the system vulnerable to Insecure Direct Object Reference (IDOR) attacks.
- UUIDv4 provides 128-bit collision-resistant keys that can be generated locally by client or worker nodes without needing a centralized database coordination lock.

### Q3: What is Row Level Security (RLS) and why is it important here?
**Answer:**
- Most traditional applications enforce authorization only at the application/API layer. If a developer forgets a `WHERE user_id = ...` clause, tenant data leaks.
- RLS enforces security at the **database engine level**. Even if a query runs `SELECT * FROM receipts;`, the PostgreSQL engine inspects the current user session claim (`auth.uid()`) and returns solely the records owned by that user.

### Q4: Explain the difference between OLTP and OLAP in your project.
**Answer:**
- **OLTP (Online Transaction Processing):** Powers day-to-day operations—inserting a newly scanned receipt, updating user budget totals, and changing warranty statuses. It requires ACID compliance and low-latency single-row transactions.
- **OLAP (Online Analytical Processing):** Powers the Analytics dashboard—aggregating spending by category, computing monthly trends, and tracking category budget burn rates across thousands of records. It performs bulk analytical aggregations.

### Q5: How did you implement DP-900 (Azure Data Fundamentals) in this project?
**Answer:**
- We classified data into three distinct DP-900 workloads:
  1. **Structured Data:** Metadata stored in Relational Tables (Azure SQL / PostgreSQL) with strict schemas and foreign key constraints.
  2. **Semi-Structured Data:** Variable JSON extraction output from OCR stored in Azure Cosmos DB / PostgreSQL `JSONB`.
  3. **Unstructured Data:** High-resolution receipt image scans stored as binary objects in Azure Blob Storage with Hot/Cool/Archive access tiers.

### Q6: How does Receipt Radar detect duplicate or fraudulent receipts?
**Answer:**
- We use a two-tier verification strategy:
  1. **Cryptographic Checksum:** The client computes the raw file's `SHA-256` hash before upload. The database maintains an index on `sha256_hash`. If a user uploads the exact same receipt image twice, it is caught in $O(1)$ time.
  2. **Heuristic Matching:** We also compare merchant name, purchase date, invoice number, and total amount to detect re-photographed identical transactions.

### Q7: Why use direct pre-signed URLs instead of uploading images through your backend API server?
**Answer:**
- Uploading 5MB–10MB images directly through the API server ties up web server sockets, spikes memory usage, and creates a network bottleneck.
- By issuing a temporary pre-signed URL with a 5-minute Time-To-Live (TTL), the client uploads directly to object storage (S3/Azure Blob). The API server only handles lightweight JSON control metadata, allowing it to scale to thousands of concurrent users with minimal hardware.

### Q8: What encryption standards are used in the project?
**Answer:**
- **In-Transit:** TLS 1.3 encryption across all client-to-server and server-to-cloud communications.
- **At-Rest:** AES-256-GCM encryption on object storage vaults with Cloud KMS (AWS KMS or Azure Key Vault) for master key management.
- **Password Security:** Salted Argon2id / bcrypt hashing with high work factors to prevent rainbow table attacks.

### Q9: How are indexes selected to optimize query performance?
**Answer:**
- We created indexes on high-cardinality search columns: `user_id`, `purchase_date`, `merchant_name`, and `category`.
- Crucially, we implemented **Partial Conditional Indexes**:
  ```sql
  CREATE INDEX idx_receipts_warranty ON receipts(has_warranty, warranty_expiry_date) 
  WHERE has_warranty = TRUE;
  ```
  Since only a fraction of receipts have warranties, indexing only rows where `has_warranty = TRUE` saves up to 80% index storage and keeps cache memory lean.

### Q10: How do you handle OCR inaccuracies or low-quality receipt scans?
**Answer:**
- Tesseract.js returns an `ocr_confidence_score` (0-100%).
- If the confidence score falls below 70%, the receipt status is marked as `NEEDS_REVIEW`, and the UI prompts the user with an interactive manual editing modal to verify extracted amounts before finalizing.

### Q11: What is the benefit of Tailwind CSS v4 and React 19 in this application?
**Answer:**
- React 19 provides enhanced concurrent rendering, optimized state updates, and better asset preloading.
- Tailwind CSS v4 introduces a high-performance engine with CSS-native theme variables and zero runtime overhead, ensuring sub-50ms UI response times even with complex chart re-renders.

### Q12: How does the system handle data privacy laws like India's DPDP Act or GDPR?
**Answer:**
- The schema separates PII (Personally Identifiable Information) in the `users` table and supports cascading deletion (`ON DELETE CASCADE`) to respect the "Right to be Forgotten".
- Sensitive payment details are strictly restricted to the last 4 digits (`card_last_4`); full card numbers or CVVs are never stored, ensuring PCI-DSS compliance.

### Q13: What happens when an S3 or Azure Blob object is tampered with or deleted?
**Answer:**
- When a user views or downloads a receipt, the server can re-verify the file's hash against the `sha256_hash` stored in the database. A mismatch indicates tampering or bit-rot, immediately triggering a security audit log.

### Q14: How does the warranty tracking feature work?
**Answer:**
- During OCR ingestion or manual entry, warranty duration in months is extracted. The system calculates `warranty_expiry_date = purchase_date + duration`.
- Background scheduler queries use the partial index to fetch expiring warranties (e.g., within 30 days) and trigger proactive notifications.

### Q15: If this project grows to 1,000,000 active users, how would you scale the architecture?
**Answer:**
1. **Database:** Implement PostgreSQL horizontal table partitioning by `purchase_date` (range partitioning) and database read-replicas.
2. **Caching:** Deploy a Redis cluster for caching frequent queries like monthly budget summaries.
3. **Queueing:** Decouple OCR ingestion using Apache Kafka or Azure Event Hubs with auto-scaling worker nodes.
4. **Storage Tiering:** Automatically transition receipts older than 90 days from Azure Blob Hot tier to Cool/Archive tier.
