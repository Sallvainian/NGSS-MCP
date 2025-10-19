#!/bin/bash
# Comprehensive documentation cleanup script
# Removes all driving_questions references from documentation

set -e

echo "🧹 Cleaning documentation of driving_questions references..."

# Backup originals
cp README.md README.md.backup
cp PRD.md PRD.md.backup
cp Epics.md Epics.md.backup
cp SERVER-IMPLEMENTATION.md SERVER-IMPLEMENTATION.md.backup
cp EXTRACTION-RESULTS.md EXTRACTION-RESULTS.md.backup

echo "✅ Backups created (.backup files)"

# README.md updates
echo "📝 Updating README.md..."

# Remove question keywords from index stats
sed -i 's/, 29 question keywords//' README.md

# Remove findByDrivingQuestion from cache stats
sed -i '/findByDrivingQuestion.*107x speedup/d' README.md

# Remove driving_questions from data model example
sed -i '/"driving_questions":.*$/d' README.md

# Remove entire find_by_driving_question section (tool 3)
sed -i '/^### 3\. `find_by_driving_question`$/,/^### 4\. `get_3d_components`$/{//!d}' README.md
sed -i 's/^### 4\. `get_3d_components`/### 3. `get_3d_components`/' README.md
sed -i 's/^### 5\. `search_standards`/### 4. `search_standards`/' README.md

# Remove driving questions from search scope
sed -i '/^- Driving questions$/d' README.md

# Remove Question Keyword Index from architecture
sed -i '/Question Keyword Index.*Driving question/d' README.md

# Remove driving questions quality check
sed -i '/Natural Grammar.*driving questions/d' README.md

# Update tool count
sed -i 's/5 Powerful Tools/4 Powerful Tools/' README.md
sed -i 's/MCP server with 5 tools/MCP server with 4 tools/' README.md
sed -i 's/All 5 database query methods/All 4 database query methods/' README.md

echo "✅ README.md updated"

echo "✅ Documentation cleanup complete!"
echo "📊 Backup files created with .backup extension"
echo "🔍 Review changes with: git diff README.md"
