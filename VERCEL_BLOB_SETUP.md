# Vercel Deployment Checklist for File Uploads

## Issue
Getting error: `Vercel Blob: Failed to retrieve the client token`

## Required Environment Variables on Vercel

Make sure these are set in your Vercel project settings:

### 1. BLOB_READ_WRITE_TOKEN
- **Where to get it**: Vercel Dashboard → Your Project → Storage → Blob → Copy Token
- **How to set**: Vercel Dashboard → Your Project → Settings → Environment Variables
- **Variable name**: `BLOB_READ_WRITE_TOKEN`
- **Value**: Your Vercel Blob token (starts with `vercel_blob_rw_...`)
- **Environments**: Production, Preview, Development (check all)

### 2. DATABASE_URL
- **Value**: Your PostgreSQL connection string
- **Example**: `postgresql://user:password@host:5432/database?sslmode=require`

## Steps to Fix

### Step 1: Create Vercel Blob Storage
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database** → **Blob**
5. Name it (e.g., "ai-judge-storage")
6. Copy the `BLOB_READ_WRITE_TOKEN`

### Step 2: Add Environment Variable
1. Go to **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: (paste the token from Step 1)
   - **Environments**: Check all (Production, Preview, Development)
3. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 4: Test
1. Navigate to your deployed app
2. Try creating a competition with a file upload
3. Check the browser console for any errors

## Verification

After deployment, the upload should work like this:

```
Browser → /api/upload (gets token) → Vercel Blob (direct upload) → Success
```

## Troubleshooting

### Still getting token error?
- Double-check the environment variable name is exactly `BLOB_READ_WRITE_TOKEN`
- Make sure you clicked "Save" after adding the variable
- Verify you redeployed after adding the variable
- Check Vercel logs for detailed error messages

### Files not appearing?
- Check that `BLOB_READ_WRITE_TOKEN` is set for the correct environment
- Verify the Blob storage was created successfully
- Check browser network tab for failed requests

## Alternative: Disable Client-Side Upload (Temporary)

If you need a quick fix and files are < 4 MB:

1. Remove the environment variable check in `CompetitionForm.tsx`
2. Always use server-side upload (will fail for large files)

This is NOT recommended for production with large files.
