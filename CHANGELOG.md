# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 10-20-2025

### Added
- GitHub Actions automated publishing workflow with OIDC authentication
- Automatic npm publishing on version tag push
- GitHub Release creation with changelog integration
- Build and test verification before publishing

### Infrastructure
- No more manual npm publish required - fully automated via GitHub Actions
- Secure OIDC authentication (no NPM_TOKEN needed in secrets)
- Provenance attestation for supply chain security

## [1.1.2] - 10-20-2025

### Fixed
- Documentation: Corrected tool count from 9 to 8 (Tool 4 was removed)
- Documentation: Corrected DCI count from 14 to 35 in README
- Added prominent middle school standards disclaimer at top of README

## [1.1.1] - 10-20-2025

### Fixed
- **Critical Data Quality Fix**: Corrected DCI assignments across 29 standards
- Expanded DCI_VALUES enum from 14 to 35 complete middle school DCIs
- Fixed Unicode smart quote in "Earth Materials and Systems" DCI name
- All 55 standards now have correct DCI mappings (32 of 35 DCIs mapped to standards)
- Tool 8 (search_by_disciplinary_core_idea) now supports all 35 NGSS middle school DCIs

### Technical
- DCI coverage: 14 → 35 DCIs (100% NGSS middle school coverage)
- Standards corrected: 29 of 55 standards updated with correct DCIs
- Test count: 99 tests passing (87 → 99, added 12 Tool 8 tests)
- Missing DCIs (not mapped to standards): PS3.C, PS4.B, ESS2.E

## [1.1.0] - 10-20-2025

### Added
- **Tool 5: search_by_practice** - Filter standards by Science and Engineering Practice (10 SEP values)
- **Tool 6: search_by_crosscutting_concept** - Filter standards by Crosscutting Concept (8 CCC values)
- **Tool 8: get_unit_suggestions** - Intelligent unit planning recommendations with binary compatibility scoring
- Complete 3D framework filtering support across all SEP and CCC dimensions
- Binary compatibility scoring algorithm for unit planning (domain +3, SEP +2, CCC +2, DCI +1)
- Data validation tests enforcing ADR-001 single-object model (sep.name, ccc.name, dci.name)
- Backward compatibility regression tests for Tools 1-4
- Tool regression smoke tests for Tools 5, 6, 8
- Comprehensive integration test suite: 87 tests total (79 existing + 8 new)

### Changed
- Data model enforces single objects per ADR-001 (not breaking - backward compatible)
- Improved test coverage: 79 tests → 87 tests (100% code coverage maintained)
- Enhanced README with Tools 5, 6, 8 documentation, SEP/CCC enum values, and ADR-001 alignment note
- Updated project structure documentation to reflect 8 tools

### Technical
- ADR-001: Single-object 3D framework structure for consistent data model
- Test count: 87 comprehensive tests (54 baseline + 25 Tools 5-6-8 + 8 integration)
- 100% backward compatibility verified (all 54 v1.0.1 baseline tests pass)
- Package size: Optimized for 8 tools with minimal overhead

## [1.0.1] - 01-19-2025

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

## [1.0.0] - 01-19-2025

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
