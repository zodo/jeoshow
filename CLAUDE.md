## Edit Tool - Whitespace Handling

  The Read tool uses `→` to mark where line numbers end and file content begins.

  **Rule:** Copy the EXACT whitespace that appears after the `→` marker.
  - Whatever appears between `→` and the code text is what's actually in the file
  - That whitespace must be used EXACTLY in Edit tool's old_string
  - Don't count arrows, don't interpret - just copy what's after the `→`

  **Example:**
  14→		private byte tag;
  For Edit, use: `		private byte tag;` (copy everything after →, including the two tabs)

  **If Edit fails:** Stop and explain the problem. Do not attempt sed/awk/bash workarounds.

  **IMPORTANT**: Trust the Read tool output. Copy what's after `→` into Edit immediately. DO NOT verify with sed/od/grep first - that's wasting time and the instructions already tell you to stop if Edit fails, not to pre-verify.
