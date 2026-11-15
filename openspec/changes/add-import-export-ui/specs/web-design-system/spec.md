# Spec Delta

## MODIFIED Requirements

### Requirement: File drop zone
The drop zone SHALL show its Over state while a file is dragged over it, SHALL hand dropped files to the screen, and SHALL let keyboard and pointer users choose a file through the system file picker. The drop zone SHALL accept one file at a time. It SHALL show the Over state only for drags that carry files, and SHALL ignore drops without files. The Over state SHALL show the Figma Over content: the download icon and the over title, without the hint line.

#### Scenario: Drag a file over
- **WHEN** the user drags a file over the drop zone
- **THEN** it shows the Over state, and returns to Default when the file leaves without being dropped

#### Scenario: Over content
- **WHEN** a file is dragged over the import drop zone
- **THEN** it shows the download icon and "Release to import", and neither "Drop a board export here" nor the "or browse files" line

#### Scenario: Drop a file
- **WHEN** the user drops a file on the drop zone
- **THEN** the screen receives that file, the zone returns to Default, and the page does not navigate

#### Scenario: Choose with the keyboard
- **WHEN** the user tabs to the drop zone's browse control and presses Enter
- **THEN** the system file picker opens
