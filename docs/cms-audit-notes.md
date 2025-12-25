# CMS Audit Script

## Purpose

The CMS audit script (`scripts/cms-audit.mjs`) validates that all 12 Frontend System Design topics are properly seeded in Payload CMS with complete content.

## How to Run

```bash
npm run cms:audit
```

## What It Checks

### Structural Validation

- **Count**: Exactly 12 topics exist
- **Order**: Topics have orders 1-12 with no gaps or duplicates
- **Slugs**: All slugs are unique

### Per-Topic Validation

For each of the 12 topics:

1. **Title Match**: Compares against canonical titles in `docs/curriculum-index.md`
   - ✓ Match: Exact match (normalized)
   - ~ Partial: 70%+ word overlap
   - ✗ Mismatch: Significant difference

2. **Theory Status**: Validates theory content is not empty
   - ✓ OK: Contains ≥100 characters of meaningful text
   - ✗ Missing: Theory field is null/undefined
   - ✗ Empty root: Theory exists but has no content nodes
   - ✗ Too short: Less than 100 characters

3. **References Count**: Number of reference entries
   - ✓ Good: ≥2 references
   - ⚠ Warning: <2 references (need at least 2 for credibility)

4. **Practice Demo**: Validates practice configuration
   - Must have `practiceDemo` object
   - Must have `demoType` field

5. **Practice Steps**: Number of interactive learning steps
   - ✓ Good: ≥4 steps (recommended)
   - ⚠ Warning: <4 steps

6. **Practice Tasks**: Number of hands-on exercises
   - ✓ Good: ≥2 tasks (minimum required)
   - ⚠ Warning: <2 tasks

## Exit Codes

- **0**: All validations passed OR only warnings (no critical issues)
- **1**: Critical issues found (missing topics, empty theory, structural problems)

## Understanding Theory Status

The theory field uses Lexical richText format with this structure:

```json
{
  "root": {
    "children": [
      {
        "children": [{ "text": "Content here..." }],
        "type": "paragraph"
      }
    ]
  }
}
```

The audit:

- Traverses the entire richText tree
- Counts all text content across all nodes
- Requires at least 100 characters to be considered "complete"
- This is a structural check only (not content quality validation)

## Fixing Issues

### Missing/Placeholder Theory

**DO NOT** auto-generate content. Instead:

1. Reference `docs/_source/curriculum.txt` or the PDF for verification
2. Manually add proper theory content via Payload admin UI or seed script
3. Mark as "Needs verification" in summary field if uncertain

### Missing References

Add placeholder references marked with "Needs verification":

```javascript
{
  label: "Reference Title [Needs verification]",
  url: "https://example.com",
  note: "Placeholder - requires proper source"
}
```

### Structural Issues (Count/Order/Slug)

Fix via seed script or CMS admin panel to ensure:

- Exactly 12 topics
- Orders 1-12 (no gaps)
- Unique slugs matching expected values

## Next Steps After Audit

If audit shows missing theory:

1. Review PDF/curriculum source for that specific topic
2. Add content through Payload CMS admin
3. Re-run audit to confirm
4. Do NOT paste large curriculum chunks into repo
