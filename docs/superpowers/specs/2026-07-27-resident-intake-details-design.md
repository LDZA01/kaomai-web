# Resident Intake Details Design

## Goal

Extend the shelter participant intake flow with chronic-condition notes, preferred work type, preferred payment method, and private supporting-document uploads while preserving existing participant records and edit behavior.

## Scope

The participant create/edit modal will add:

- An optional `โรคประจำตัว` textarea.
- A required preferred-work-type choice: `งานเต็มเวลา` or `งานพาร์ทไทม์`.
- A required payment-preference choice: `เงินสด` or `โอนเข้าบัญชีธนาคาร`.
- Up to five supporting documents, each no larger than 5 MB.

Accepted document formats are PDF, JPEG, PNG, and WebP. Supported categories are:

- `วุฒิการศึกษา`
- `ใบรับรองการฝึกอบรม`
- `เอกสารรับรองการทำงาน`
- `เอกสารอื่น ๆ`

Bank-account numbers and other banking credentials are out of scope. The form records only the participant's preferred payment method.

## User Experience

### Medical information

`โรคประจำตัว` is an optional multiline field. Its placeholder is:

> เช่น เบาหวาน, ความดันโลหิตสูง หรือไม่มี

A blank value means the participant did not provide medical information. The value is available only in the shelter participant-management flow and is not rendered on employer matching screens.

### Work type

`รูปแบบงานที่ต้องการ` is a required radio group with exactly one selected value:

- `งานเต็มเวลา`
- `งานพาร์ทไทม์`

### Payment preference

`วิธีรับค่าจ้างที่สะดวก` is a required radio group with exactly one selected value:

- `เงินสด`
- `โอนเข้าบัญชีธนาคาร`

### Documents

The document section supports selecting multiple files. Each staged file displays:

- Original file name.
- File size.
- Document category selector.
- Remove action.

Invalid file type, file size above 5 MB, or more than five total documents produces an inline validation message. Files are staged locally until the resident form is submitted. A failed upload leaves the form open and reports which file failed.

While editing, existing documents are listed with download and remove actions. Removing an existing document deletes its metadata and private storage object only after the user saves the edit.

## Data Model

### Resident fields

The `Resident` interface and `homeless_profiles` table gain:

- `chronicConditions?: string`
- `preferredWorkType?: 'full_time' | 'part_time'`
- `paymentPreference?: 'cash' | 'bank_transfer'`

The database columns are:

- `chronic_conditions text`
- `preferred_work_type text`
- `payment_preference text`

Database check constraints restrict the two enum-like columns to their specified values while allowing `null` for existing records.

### Document metadata

Add a `resident_documents` table:

- `id uuid primary key`
- `resident_id uuid not null references homeless_profiles(id) on delete cascade`
- `category text not null`
- `original_name text not null`
- `storage_path text not null unique`
- `mime_type text not null`
- `size_bytes integer not null`
- `created_at timestamptz not null default now()`

Category values are restricted to:

- `education`
- `training`
- `employment`
- `other`

The application type is:

```ts
export interface ResidentDocument {
  id: string;
  residentId: string;
  category: 'education' | 'training' | 'employment' | 'other';
  originalName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}
```

`Resident` gains `documents?: ResidentDocument[]`.

## Storage and Privacy

Create a private Supabase Storage bucket named `resident-documents`.

Objects use this path format:

```text
<shelter-id>/<resident-id>/<document-id>-<sanitized-file-name>
```

The application never stores document file contents in `homeless_profiles`. It stores only metadata and storage paths. Downloads use short-lived signed URLs created on demand.

Storage and table policies permit shelter users to manage documents belonging to residents in their own shelter. Employer-facing screens do not query or render chronic conditions or document metadata.

## Data Flow

### Create

1. Validate required participant fields, work type, payment preference, skills, days, and staged documents.
2. Upsert the resident and receive the resident ID.
3. Upload staged documents to the private bucket.
4. Insert document metadata rows.
5. Refresh the resident item with its document metadata.
6. Close the modal and show the success notice.

If a document upload fails, delete objects uploaded during that submission attempt, keep the modal open, and show an inline error.

### Edit

1. Load the resident and document metadata.
2. Populate the new fields and existing-document list.
3. Validate changes.
4. Upsert resident fields.
5. Upload new documents and insert their metadata.
6. Delete documents the user marked for removal.
7. Refresh the resident item and show the success notice.

### Legacy records

Existing rows with `null` values remain valid. Shelter participant cards display `ยังไม่ระบุ` for missing work type or payment preference. Existing records do not receive fabricated defaults.

## Presentation

Shelter participant cards show:

- Preferred work type.
- Preferred payment method.
- Existing availability days and times.

Chronic conditions and document names remain inside the shelter-only participant detail/edit modal. Employer matching screens continue to show employment-relevant availability and skills without medical information.

## Error Handling

- Unsupported document type: `รองรับเฉพาะ PDF, JPG, PNG และ WebP`
- File above 5 MB: `ไฟล์ต้องมีขนาดไม่เกิน 5 MB`
- More than five documents: `อัปโหลดเอกสารได้ไม่เกิน 5 ไฟล์`
- Upload failure: identify the failed file and keep the modal open.
- Database failure: preserve form state and show a general save error.
- Document removal failure: preserve the metadata row and show an error instead of hiding the document.

## Testing

Automated tests cover:

- New row-to-domain and domain-to-row mappings.
- Legacy resident rows with missing new fields.
- File type, size, and count validation.
- Document storage-path sanitization.
- Work-type and payment-preference labels.

Rendered validation covers:

- Required radio-group behavior.
- Staging and removing a supported document.
- Rejection of an unsupported or oversized document.
- Edit-form population.
- Modal usability at desktop and mobile widths.
- No chronic-condition or document rendering on employer screens.

## Non-Goals

- Collecting bank names, account numbers, or banking credentials.
- Medical diagnosis workflows or clinical decision support.
- Employer access to medical information.
- OCR or automated extraction from uploaded documents.
- More than five documents per participant.
