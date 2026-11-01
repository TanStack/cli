---
id: templates
title: Templates
---

Templates are reusable starting points for projects. They include source files and metadata, and can also declare add-on dependencies.

## Use a Template

```bash
tanstack create my-app --template ecommerce
tanstack create my-app --template https://example.com/template.json
tanstack create my-app --template ./template.json
```

`--template` accepts both URL/path values and built-in template IDs.

## Create a Template

```bash
# 1. Create a project with the shape you want
tanstack create my-template --add-ons clerk,drizzle,sentry

# 2. Initialize template metadata
cd my-template
tanstack template init

# 3. Edit template-info.json, then compile the output JSON
tanstack template compile

# 4. Use or distribute the compiled template file
tanstack create new-app --template ./template.json
```

## Maintain a Template

When the source project changes:

```bash
cd my-template
tanstack template compile
```

Then publish the updated `template.json` to the URL your team uses.

## Registry Format

Registry entries can expose templates under `templates` or `starters`.
