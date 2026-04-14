#!/bin/bash

# File: check-classes.sh
# Purpose: Ensure important elements have corresponding class in CSS and no id-based styling.

CSS_DIR="css"
ELEMENT_CLASSES=(
  "crypto-send-panel"
  "crypto-send-title"
  "crypto-send-input"
  "crypto-send-fee-input"
  "crypto-send-max-amount-link"
  "crypto-send-help-icon"
  "crypto-send-button"
  "receiveAddressContainer"
  "cryptoDetailTitle"
)

for cls in "${ELEMENT_CLASSES[@]}"; do
    echo "Checking class: .$cls"

    # Check for class selector
    class_found=$(grep -R "^\s*\.$cls" "$CSS_DIR")
    if [ -n "$class_found" ]; then
        echo "  ✅ Class found in CSS"
    else
        echo "  ❌ Class NOT found in CSS"
    fi

    # Check for id selector
    id_found_files=$(grep -Rl "^\s*#$cls" "$CSS_DIR")
    if [ -n "$id_found_files" ]; then
        echo "  ⚠️  ID selector found in CSS (should avoid). Found in:"
        echo "$id_found_files" | sed 's/^/    - /'
    fi
done

