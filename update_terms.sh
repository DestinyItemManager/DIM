#!/bin/bash
curl -X POST https://poeditor.com/api/ \
     -F api_token="${POEDITOR_API}" \
     -F action="upload" \
     -F id="116191" \
     -F updating="terms_definitions" \
     -F file=@"src\i18n\dim_en.json" \
     -F language="en" \
     -F overwrite="1" \
     -F sync_terms="0" \
     -F fuzzy_trigger="1"

