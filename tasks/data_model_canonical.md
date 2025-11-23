# Nexus Graph-RAG: Canonical Data Model

**Version**: 1.0
**Date**: 2025-11-23

This document serves as the source of truth for the data schemas used across the three persistence layers of the application.

---

## 1. Relational Store (PostgreSQL)
**Purpose**: Source of truth for document binary metadata, full text content, and audit logs.

### Table: `documents`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the file |
| `filename` | String | Original name of the PDF |
| `file_hash` | String | SHA-256 hash for deduplication |
| `upload_date` | DateTime | Timestamp of ingestion |
| `status` | String | `pending`, `processing`, `completed`, `failed` |
| `metadata_json` | JSON | Extensible field for file size, page count, etc. |

### Table: `chunks`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the chunk |
| `document_id` | UUID (FK) | Reference to parent document |
| `chunk_index` | Integer | Sequential order in the doc |
| `text_content` | Text | The actual text used for RAG |
| `page_number` | Integer | Physical page location |
| `token_count` | Integer | Size of the chunk |

### Table: `pipeline_logs`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Log ID |
| `run_id` | String | Trace ID for a specific file ingestion run |
| `agent_name` | String | Name of the LangGraph node (e.g., `EntityAgent`) |
| `level` | String | `INFO`, `ERROR` |
| `message` | Text | Log content |

---

## 2. Graph Topology (Memgraph)
**Purpose**: Stores the semantic structure, entities, and their relationships.

### Node Labels

#### `:Document`
*   `id`: UUID (matches Postgres)
*   `filename`: String
*   `upload_date`: String

#### `:Chunk`
*   `id`: UUID (matches Postgres)
*   `chunk_index`: Integer
*   `preview`: String (First 50 chars of text)

#### `:Entity`
*   `id`: UUID
*   `name`: String (Index)
*   `entity_type`: String (`Person`, `Organization`, `Concept`, `Event`)
*   `description`: String (LLM generated summary)

### Relationship Types

#### `[:PART_OF]`
*   **Source**: `:Chunk`
*   **Target**: `:Document`
*   **Semantics**: Structural hierarchy.

#### `[:MENTIONED_IN]`
*   **Source**: `:Entity`
*   **Target**: `:Chunk`
*   **Semantics**: Grounding. Evidence that an entity appears in a specific text segment.

#### `[:RELATES_TO]`
*   **Source**: `:Entity`
*   **Target**: `:Entity`
*   **Properties**:
    *   `relation_type`: String (e.g., `WORKS_FOR`, `LOCATED_IN`)
    *   `description`: String (Context of the relationship)
    *   `weight`: Float (Strength of connection)

---

## 3. Vector Store (ChromaDB)
**Purpose**: Similarity search for unstructured text.

### Collection: `nexus_chunks`
*   **ID**: UUID (matches Chunk ID in Postgres)
*   **Embedding**: 768-dim vector (Gemini `text-embedding-004`)
*   **Metadata**:
    *   `document_id`: UUID
    *   `page_number`: Integer
    *   `chunk_index`: Integer
    *   `source`: Filename

---

## 4. Mapping Strategy

When performing a Hybrid Search:
1.  **Vector Step**: Query ChromaDB → Get `chunk_id`s.
2.  **Text Retrieval**: Use `chunk_id`s to select `text_content` from Postgres `chunks` table.
3.  **Graph Step**: Use `chunk_id`s in Memgraph: `MATCH (c:Chunk {id: $id})<-[:MENTIONED_IN]-(e:Entity) RETURN e`.
4.  **Reasoning**: Traverse `(e)-[:RELATES_TO]->(neighbor)` to expand context.
