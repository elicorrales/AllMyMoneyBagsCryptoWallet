#!/usr/bin/env bash

# Patterns to look for
patterns="script|onload=|onclick=|onerror=|xlink:href|href=|data:|url\("

shopt -s nullglob
for file in *.svg; do
    echo "=============================================="
    echo "Testing $file ..."

    # 1️⃣ Regex / base64 / URL checks
    # Match patterns, then remove any url(#...) internal references
    matches=$(grep -Eio "$patterns" "$file" | grep -vE 'xlink:href="#[^"]*"|href="#[^"]*"|url\(#')

    # Filter out false positives for xlink:href and href pointing to internal IDs
    safe_links=$(grep -Eo 'xlink:href="#[^"]*"|href="#[^"]*"' "$file")
    # Remove safe links from matches
    matches=$(grep -vFf <(echo "$safe_links" | sed 's/="[^"]*"//') <<< "$matches")


    # Further filter out standalone "url(" if it’s only used internally
    matches=$(grep -vE "^url\($" <<< "$matches")

    if [[ -n "$matches" ]]; then
        echo "⚠️  Potentially unsafe content (regex/base64) found:"
        echo "$matches"
    else
        echo "✅ No suspicious content detected via regex/base64."
    fi


    # 2️⃣ XML parsing checks with xmllint
    echo "Checking XML structure and suspicious elements/attributes..."
    if xmllint --noout "$file" 2>/dev/null; then
        echo "✅ Well-formed XML."
    else
        echo "❌ Invalid XML."
    fi

    echo "Suspicious XML nodes/attributes:"
    xmllint --xpath "//*[name()='script' or name()='foreignObject' or @onload or @onclick or @onerror]" "$file" 2>/dev/null || echo "None found"
    echo
done

