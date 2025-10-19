# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-19

### Fixed
- Remove duplicate domain enum values (6→3 domains) in search_by_domain tool
- Fix pagination support in search_by_domain handler using array.slice()
- Add descriptive examples to get_3d_components tool description
- Add descriptive examples to search_standards tool description
- Remove stale test for deleted find_by_driving_question tool
- Update README installation instructions to use npx command

### Changed
- Add `total` field to search_by_domain response for pagination context
- Package size: 44.7 KB (60 files)

## [1.0.0] - 2025-01-19

### Added
- Initial release of NGSS MCP Server
- 4 tools for accessing NGSS Middle School standards:
  - `search_by_domain`: Find standards by science domain
  - `get_3d_components`: Extract 3D framework components (SEP/DCI/CCC)
  - `search_standards`: Full-text search across all content
  - `get_standard_by_code`: Retrieve specific standard by code
- Token-efficient data access with 3 detail levels (minimal/summary/full)
- Query validation and caching for performance
- Fuzzy search with Levenshtein distance for error tolerance
- Complete NGSS MS standards dataset (Physical Science, Life Science, Earth and Space Science)
- MCP protocol integration via @modelcontextprotocol/sdk

### Technical
- TypeScript implementation with type safety
- Optimized JSON data storage (106.3 KB)
- Comprehensive test coverage
- Token metadata tracking for LLM context management

[1.0.1]: https://github.com/Sallvainian/NGSS-MCP/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Sallvainian/NGSS-MCP/releases/tag/v1.0.0
