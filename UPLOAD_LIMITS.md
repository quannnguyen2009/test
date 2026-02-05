# Handling Large File Uploads on Vercel

## Problem
Vercel serverless functions have a **4.5 MB payload limit** (Hobby tier) or **5 MB** (Pro tier). When creating competitions with large PDFs or datasets, you'll hit this limit.

## Solution: Client-Side Direct Upload

Instead of sending files through server actions, upload them directly from the browser to Vercel Blob.

### Implementation Steps

#### 1. Install Required Package
```bash
npm install @vercel/blob
```

#### 2. Use the Upload API Route
I've created `/app/api/upload/route.ts` that handles client-side uploads.

#### 3. Modify CompetitionForm (Next Step)
Update the form to upload files directly to Blob before submitting the competition data.

### Alternative: Use Vercel Blob Upload Widget

For a simpler solution, use Vercel's pre-built upload widget:

```tsx
import { upload } from '@vercel/blob/client';

async function handleFileUpload(file: File) {
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
  });
  
  return blob.url; // Use this URL in your competition data
}
```

### Current Workaround (Temporary)

**Limit file sizes to under 4 MB** when creating competitions on Vercel until we implement direct uploads.

---

## Next Steps

Would you like me to:
1. **Implement client-side direct uploads** in CompetitionForm (recommended)
2. **Add file size validation** to show warnings before upload
3. **Keep current approach** and just document the 4MB limit

Let me know which approach you prefer!
