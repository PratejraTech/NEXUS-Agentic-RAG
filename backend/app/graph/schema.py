from typing import Optional, List
from gqlalchemy import Node, Field

class DocumentNode(Node):
    id: str = Field(index=True, unique=True, db=True)
    filename: str = Field()
    created_at: str = Field()

class ChunkNode(Node):
    id: str = Field(index=True, unique=True, db=True)
    text: str = Field()
    chunk_index: int = Field()

class EntityNode(Node):
    name: str = Field(index=True, unique=True, db=True)
    type: str = Field()
