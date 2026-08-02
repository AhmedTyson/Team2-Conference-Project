#!/usr/bin/env pwsh
# This script uses the Notion CLI (ntn) to create the Master Plan page and its subpages.
# Ensure you have run `ntn login` before executing this script!

$docsDir = "C:\Programming\conference\Team2-Conference-Project\docs"
$databaseId = "884c2e77-8a84-46a8-852f-07651d2eed5e" # Target database

Write-Host "Creating Parent Page: Master Plan..."
$masterOutput = npx --yes ntn pages create --parent "database:$databaseId" --file "$docsDir\ThreeDOS_Notion_Master_Plan.md" --json

# Extract the newly created page ID to use as the parent for subpages
$masterPageId = ($masterOutput | ConvertFrom-Json).id
Write-Host "Parent Page Created! ID: $masterPageId"

Write-Host "Creating Subpage: Sprint 1..."
npx --yes ntn pages create --parent "page:$masterPageId" --file "$docsDir\ThreeDOS_Notion_Sprint1.md"

Write-Host "Creating Subpage: Future Sprints..."
npx --yes ntn pages create --parent "page:$masterPageId" --file "$docsDir\ThreeDOS_Notion_Future_Sprints.md"

Write-Host "All Notion pages created successfully!"
