# NGSS MCP Server - Complete Project Context

**Date:** 2025-10-15
**Status:** Ready to start - awaiting workflow-status execution
**Location:** `/home/sallvain/dev/mcp-servers/NGSS-MCP`

## Project Purpose

Build an MCP (Model Context Protocol) server that provides token-efficient NGSS (Next Generation Science Standards) lookup for the TeachFlow education module.

**Problem:** Massive PDFs (hundreds of pages) would waste 5K-10K tokens per lookup if agents had to search through entire documents repeatedly.

**Solution:** MCP server with filtering tools - agents request exactly what they need (e.g., "MS-PS1 Matter and its Interactions") and get only that standard back.

**Token Efficiency:** 95% reduction (7,500 tokens → 350 tokens per lookup)

## Origin Story

This MCP server emerged from the TeachFlow module brief session (2025-10-14). User (Frank, middle school science teacher) had the insight that repeatedly searching massive NGSS documents would be inefficient. Instead of JSON files that agents would load entirely, an MCP server returns only requested data.

**Related Project:** BMAD-Education-Module at `/home/sallvain/dev/personal/BMAD-Education-Module`
**TeachFlow Module Brief:** `/home/sallvain/dev/personal/BMAD-Education-Module/docs/module-brief-teachflow-2025-10-14.md`
**Session Memory:** `teachflow-module-brief-session-2025-10-14` in BMAD-Education-Module Serena project

## Technical Specifications

### 5 MCP Tools (Core Requirements)

**1. get_standard(code: str)**
- Input: "MS-LS1-6"
- Output: Full standard with SEP, DCI, CCC, text
- Use case: Instructional Designer needs complete standard details
- Token cost: ~350 tokens (vs 7,500 for full file)

**2. search_by_domain(domain: str, grade_level: str)**
- Input: domain="Life Science", grade_level="MS"
- Output: List of all Life Science MS standards
- Use case: Browse available standards in a domain

**3. find_by_driving_question(question: str)**
- Input: "How do plants get energy?"
- Output: Matched standard with fuzzy matching
- Use case: Alpha agent (student support) helping student identify their lesson
- Critical feature: Fuzzy matching with Levenshtein distance

**4. get_3d_components(code: str)**
- Input: "MS-LS1-6"
- Output: Just SEP/DCI/CCC breakdown (minimal response)
- Use case: Quick 3D scope check
- Token cost: ~200 tokens (very lightweight)

**5. search_standards(query: str, filters: dict)**
- Input: query="photosynthesis", filters={domain: "Life Science"}
- Output: Standards mentioning photosynthesis
- Use case: Flexible keyword search

### Data Structure Design

**Dual-Index JSON Database:**

```json
{
  "standards": [
    {
      "code": "MS-LS1-6",
      "grade_level": "MS",
      "domain": "Life Science",
      "topic": "From Molecules to Organisms",
      "performance_expectation": "Construct a scientific explanation based on evidence for the role of photosynthesis in the cycling of matter and flow of energy into and out of organisms.",
      "sep": {
        "code": "SEP-6",
        "name": "Constructing Explanations and Designing Solutions",
        "description": "Students construct explanations using evidence about how photosynthesis transforms light energy into chemical energy"
      },
      "dci": {
        "code": "LS1.C",
        "name": "Organization for Matter and Energy Flow in Organisms",
        "description": "Plants, algae, and many microorganisms use the energy from light to make sugars (food) from carbon dioxide from the atmosphere and water through the process called photosynthesis"
      },
      "ccc": {
        "code": "CCC-5",
        "name": "Energy and Matter",
        "description": "Within a natural system, the transfer of energy drives the motion and/or cycling of matter. Track energy flow from light to chemical energy stored in glucose."
      },
      "driving_questions": [
        "How do plants get energy?",
        "How do plants get the energy they need to live and grow?"
      ],
      "keywords": ["photosynthesis", "energy", "matter", "organisms"],
      "lesson_scope": {
        "key_concepts": ["photosynthesis", "light energy", "chemical energy", "glucose"],
        "prerequisite_knowledge": ["cells", "energy basics", "matter"],
        "common_misconceptions": [
          "Plants eat soil for food",
          "Photosynthesis happens at night"
        ],
        "depth_boundaries": {
          "include": ["energy transformation from light to chemical", "matter cycling"],
          "exclude": ["detailed molecular mechanisms", "ATP/ADP cycle details"]
        }
      }
    }
  ]
}
```

**Search Indexes:**
- By code: O(1) lookup via hash map
- By driving question: Fuzzy matching with Levenshtein distance
- By keyword: Full-text search
- By domain: Filter by field

### Integration with TeachFlow

**TeachFlow Agents that will use this MCP server:**

1. **Standards Aligner Agent** (Critical Infrastructure Agent #10)
   - Role: 3D Learning Intelligence Hub
   - Uses: get_standard(), find_by_driving_question(), get_3d_components()
   - Purpose: Provides 3D framework for both lesson planning and student tutoring

2. **Instructional Designer Agent** (Core Agent #1)
   - Delegates to Standards Aligner for 3D components
   - Uses standards data for lesson planning

3. **Alpha - Student Support Agent** (Core Agent #5)
   - Uses find_by_driving_question() as primary entry point
   - Student asks: "What's your lesson's driving question?"
   - Alpha retrieves 3D scope and teaches within that scope

### 3-Dimensional Learning Context

**NGSS 3D Learning Framework:**
- **SEP** (Science & Engineering Practices): What students DO (8 practices like "Constructing Explanations")
- **DCI** (Disciplinary Core Ideas): What students LEARN (core concepts in Life/Physical/Earth science)
- **CCC** (Crosscutting Concepts): HOW students THINK (7 thinking patterns like "Energy and Matter")

**Critical Insight:** Every NGSS standard includes all three dimensions. The MCP server must return complete 3D information for each standard.

## Development Approach

**Framework:** BMAD Method Module (BMM) workflows
**Starting Point:** Run `/bmad:bmm:workflows:workflow-status` to create workflow planning
**Then:** Run `/bmad:bmm:workflows:plan-project` for scale-adaptive planning

**Expected Project Level:** Level 1-2 (5-15 stories, 1-2 epics)
- Level 1: Tech spec + epic + 2-3 stories (if simple)
- Level 2: Focused PRD + tech spec (if more complex)

**Technology Stack:** TypeScript (MCP SDK supports Python or TypeScript)
**Development Estimate:** 12-18 hours total
- Data structuring: 4-6 hours
- MCP server scaffold: 2-3 hours
- Tool implementations: 4-6 hours
- Testing: 2-3 hours

## Data Source Requirements

**User (Frank) will provide:** NGSS Middle School standards in PDF format

**Domains needed:**
- Life Science (MS-LS)
- Physical Science (MS-PS)
- Earth and Space Science (MS-ESS)

**Grade level:** Middle School (grades 6-8)

**Source:** Download from nextgenscience.org official site
**Format:** PDF (preferred over images for text extraction)
**Alternative:** Check for CSV/Excel exports first (would be ideal)

## Performance Targets

**Token Efficiency:**
- Current approach (JSON files): 7,500 tokens per lookup
- MCP server approach: 350 tokens per lookup
- **Savings: 95% reduction**

**Speed Targets:**
- Standards lookup: <1 second
- Driving question fuzzy match: <2 seconds
- Keyword search: <3 seconds

**Quality Metrics:**
- 98%+ standards alignment accuracy
- 95%+ driving question match rate (with fuzzy matching)
- 100% of standards include all 3 dimensions (SEP, DCI, CCC)

## Architecture Benefits

**Separation of Concerns:**
- MCP server = data service (independent project)
- TeachFlow module = consumer (uses MCP tools)
- Clean microservice architecture

**Reusability:**
- Other education modules can use same MCP server
- Other teachers could use/contribute
- Could be published as open-source educational tool

**Scalability:**
- Easy to extend to other grade levels (elementary, high school)
- Could add other standards frameworks (Common Core, state-specific)
- Could add other subjects beyond science

## Current Status

**Completed:**
- ✅ Project directory created: `/home/sallvain/dev/mcp-servers/NGSS-MCP`
- ✅ Serena project activated
- ✅ Complete project context documented in memory

**Next Immediate Steps:**

1. **Run workflow-status** to create workflow planning
   ```bash
   /bmad:bmm:workflows:workflow-status
   ```
   - Answers questions about project type, level, approach
   - Creates bmm-workflow-status.md file
   - Sets up planned workflow journey

2. **Run plan-project** for scale-adaptive planning
   ```bash
   /bmad:bmm:workflows:plan-project
   ```
   - Generates PRD or tech-spec based on level
   - Creates story backlog
   - Sets up Phase 4 implementation tracking

3. **Implement using story-based workflow**
   - `/bmad:bmm:workflows:create-story` - Draft stories
   - `/bmad:bmm:workflows:dev-story` - Implement stories
   - Iterative development cycle

## Key Design Decisions

1. **MCP Server over JSON files** - Token efficiency is critical
2. **Dual-index database** - Supports both teacher workflows (standard codes) and student workflows (driving questions)
3. **Fuzzy matching for driving questions** - Students don't remember exact phrasing
4. **Separate greenfield project** - Clean architecture, reusable across modules
5. **TypeScript implementation** - MCP SDK support, familiar to many developers

## Related Documentation

**TeachFlow Module Brief:** `/home/sallvain/dev/personal/BMAD-Education-Module/docs/module-brief-teachflow-2025-10-14.md`
- See Section: "Technical Planning - 3D Learning Data Structure"
- See Appendix A: "3D Learning Framework Reference"

**BMM Workflows README:** `/home/sallvain/dev/personal/BMAD-Education-Module/bmad/bmm/workflows/README.md`
- Complete guide to BMM workflow system
- Phase 1 (Analysis) - Optional
- Phase 2 (Planning) - Required (workflow-status → plan-project)
- Phase 3 (Solutioning) - For Level 3-4 only
- Phase 4 (Implementation) - Story-based development

## Restoration Prompt

**When starting fresh session, use this prompt:**

```
I need to continue work on the NGSS MCP Server project at ~/dev/mcp-servers/NGSS-MCP.

Read the memory 'ngss-mcp-project-context' to restore full context, then execute:
1. /bmad:bmm:workflows:workflow-status (create workflow plan)
2. /bmad:bmm:workflows:plan-project (generate PRD/tech-spec)

Project purpose: Token-efficient MCP server for NGSS standards lookup (95% token reduction).
5 tools to implement: get_standard, search_by_domain, find_by_driving_question, get_3d_components, search_standards.
```

---

**Session Value:** Complete greenfield project setup with comprehensive technical specifications ready for immediate implementation.