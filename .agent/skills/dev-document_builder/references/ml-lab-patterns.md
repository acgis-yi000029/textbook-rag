# ML Course Lab Patterns

## Pattern 1: From Scratch (New Template)

Create a complete markdown template from scratch with all structure.

### Structure

```markdown
# CST8506 - Lab N: Lab Title

**Student Name:** [Your Name]
**Student Number:** [Your Number]
**Section:** [Your Section]

---

## Step 1: Step Title

**Code:**
![Code](images/step01_step_title_code.png)

**Description:**
[Explain what you're doing in this step and why]

**Results:**
![Output](images/step01_step_title.png)

---

## Summary and Discussion
[Write a brief summary discussing the results and insights]
```

### Workflow

1. Generate Python script (use `learning-code_generation` skill)
2. Run Python script to generate visualization images
3. Generate code screenshots: `generate_code_screenshots.py`
4. Generate output screenshots: `generate_output_screenshots.py`
5. Create markdown template with image paths
6. Fill in descriptions/analysis
7. Convert to .docx (use `learning-md_to_docx` skill)

### Image Naming Convention

- Code: `step{NN}_{description}_code.png`
- Output: `step{NN}_{description}.png`
- Plots: `lab{N}_{plot_name}.png`

---

## Pattern 2: From DOCX Template (Preserve Format)

Work with instructor-provided .docx template, preserving all original formatting.

### Critical Rules

**DO NOT:**
- Change title format
- Change step numbering or titles
- Change document structure
- Modify any original text

**ONLY:**
- Add image references under each step
- Fill in description placeholders
- Add your analysis

### Workflow

1. Convert .docx to .md: `dev-docx_to_md` skill
2. Generate screenshots (code and output)
3. Insert image references under existing steps
4. Fill in descriptions/analysis
5. Convert back to .docx: `learning-md_to_docx` skill

### Example

**Original from .docx:**
```markdown
**CST8506 - Lab 1**
**Dimensionality Reduction – PCA**
**Student Name:**
**Student Number:**

1. Load file
2. Print stats
```

**After adding images (preserve exact format):**
```markdown
**CST8506 - Lab 1**
**Dimensionality Reduction – PCA**
**Student Name:**
**Student Number:**

For **every** step, include screenshot of the code...

---

### 1. Load file

**Code:**
![Code](images/step01_load_the_csv_file_code.png)

**Description:**
[Your explanation]

**Results:**
![Output](images/step01_load_the_csv_file.png)

---

### 2. Print stats

**Code:**
![Code](images/step02_print_dataset_information_code.png)

**Description:**
[Your explanation]

**Results:**
![Output](images/step02_print_dataset_information.png)
```

### Key Points

- Keep instructor's exact wording for titles
- Maintain original formatting (bold, numbering, etc.)
- Only add Code/Description/Results sections
- Use heading level that matches original (### for numbered lists)
