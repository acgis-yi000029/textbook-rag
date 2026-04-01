"""readers — data source readers for the textbook RAG engine."""

from engine_v2.readers.cover_extractor import extract_cover, extract_cover_for_book
from engine_v2.readers.mineru_reader import MinerUReader

__all__ = ["MinerUReader", "extract_cover", "extract_cover_for_book"]
