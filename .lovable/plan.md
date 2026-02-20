

## Stakeholders Section Modifications

### Changes (all in `src/components/DealExpandedPanel.tsx`)

### 1. Remove "Replace Contact" -- Add "+" to allow multiple contacts per role

**Current**: Each role shows one contact with a replace/swap button. The "+" add button only shows when no contact exists.

**Change**:
- Remove the entire replace/swap `Popover` block (lines 530-589) -- delete the `ArrowRight` button and its popover
- Remove the `replacingRole` state and `promptReplace` function usage from UI
- Always show the `StakeholderAddDropdown` "+" button for every role, even when contacts already exist (move it from the `!hasContact` conditional to always render after the contact list)
- This allows adding multiple contacts per role

### 2. Increase all icon sizes

**Current**: Icons are `h-3 w-3` or `h-3.5 w-3.5` throughout the section.

**Change**:
- Header Users icon: `h-3.5 w-3.5` -> `h-4 w-4`
- Header FileText icon: `h-3 w-3` -> `h-3.5 w-3.5`
- Info/Note icon: `h-3 w-3` -> `h-3.5 w-3.5`
- Remove X icon: `h-3 w-3` -> `h-3.5 w-3.5`
- Add Plus icon in `StakeholderAddDropdown`: `h-3.5 w-3.5` -> `h-4 w-4`
- AlertTriangle in confirm dialog: keep `h-5 w-5` (already good)
- Increase touch target buttons from `w-5 h-5` to `w-6 h-6`

### 3. Fix Note popover position and enhance notes with bullet points

**Current**: Note popover opens with `side="top"` (line 512), width is `w-60`.

**Change**:
- Change `side="top"` to `side="bottom"` so the note popup always opens below the info icon
- Change width from `w-60` to `w-[480px]` (double the current ~240px)
- Replace the single `Textarea` with a bullet-point style notes editor:
  - Store notes as newline-separated bullet items
  - Display each line as a bullet point (`• `) prefixed entry
  - Add a small helper text "Each line becomes a bullet point"
  - When saving, join lines with newlines; when displaying in summary, show as bullet list

### 4. Make the section more compact

**Current**: Padding is `p-2.5` per cell, header has `py-2`, outer wrapper has `px-3 pt-2.5 pb-2`.

**Change**:
- Reduce outer padding: `px-3 pt-2.5 pb-2` -> `px-3 pt-1.5 pb-1`
- Reduce header padding: `px-3 py-2` -> `px-3 py-1.5`
- Reduce cell padding: `p-2.5` -> `px-2 py-1.5`
- Reduce notes summary padding and max-height
- Remove extra gap between contacts in multi-contact scenario: `gap-1` -> `gap-0.5`

### Summary of line changes

| Area | Lines | What changes |
|------|-------|-------------|
| `replacingRole` state removal | 316 | Remove state |
| Replace popover block | 530-589 | Delete entirely |
| Add "+" always visible | 602-612 | Remove `!hasContact` condition |
| Icon sizes | 435, 444, 509, 540, 597, 255 | Increase sizes |
| Note popover | 512 | `side="top"` -> `side="bottom"`, double width, bullet UI |
| Compact spacing | 430, 433, 466 | Reduce padding values |

No new files needed. No database changes.
