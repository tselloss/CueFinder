# Image Upload Implementation Guide

This guide explains how to integrate image uploads into the CueFinder application.

## Overview

The image upload system provides:
- Single and batch image uploads
- File validation (size, type, extensions)
- Local and cloud storage support
- Automatic thumbnail generation
- Image compression
- Primary image management
- Direct database storage with URLs

## Components

### Models

#### `ImageUploadRequest`
Request model for uploading images
```csharp
public class ImageUploadRequest
{
    public IFormFile File { get; set; }
    public int CueId { get; set; }
    public string? AltText { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsPrimary { get; set; }
}
```

#### `ImageUploadResponse`
Response after upload completion
```csharp
public class ImageUploadResponse
{
    public bool Success { get; set; }
    public int ImageId { get; set; }
    public string ImageUrl { get; set; }
    public long FileSize { get; set; }
    public string MimeType { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime UploadedAt { get; set; }
}
```

#### `ImageStorageSettings`
Configuration for storage behavior
```csharp
public class ImageStorageSettings
{
    public string StoragePath { get; set; } = "uploads/cues";
    public string ImageUrlBase { get; set; } = "/uploads/cues";
    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;
    public string AllowedExtensions { get; set; } = ".jpg,.jpeg,.png,.gif,.webp";
    public bool EnableCompression { get; set; } = true;
    public int CompressionQuality { get; set; } = 85;
    public bool GenerateThumbnails { get; set; } = true;
    public int ThumbnailSize { get; set; } = 200;
}
```

### Service

#### `IImageService`
Interface defining image operations:
- `UploadImageAsync()` - Upload single image
- `UploadMultipleImagesAsync()` - Upload multiple images
- `DeleteImageAsync()` - Delete single image
- `GetImageAsync()` - Get image by ID
- `GetCueImagesAsync()` - Get all images for a cue
- `SetPrimaryImageAsync()` - Set primary thumbnail
- `UpdateImageOrderAsync()` - Change display order
- `DeleteCueImagesAsync()` - Delete all cue images
- `ValidateImageAsync()` - Validate file before upload
- `GetImageUrl()` - Get public image URL

#### `ImageService`
Full implementation with:
- Local file system storage
- File validation
- Unique filename generation
- Permission checking
- Database record management
- Error handling and logging

### Controller

#### `ImagesController`
REST API endpoints:

**POST /api/images/upload**
- Upload single image
- Parameters: cueId, file, altText, displayOrder, isPrimary
- Requires authentication

**POST /api/images/upload-multiple**
- Upload multiple images
- Parameters: cueId, files[]
- Requires authentication

**GET /api/images/cue/{cueId}**
- Get all images for a cue
- Public (no authentication required)

**GET /api/images/{imageId}**
- Get specific image
- Public (no authentication required)

**PUT /api/images/{imageId}/set-primary**
- Set as primary/thumbnail image
- Requires authentication and ownership

**DELETE /api/images/{imageId}**
- Delete single image
- Requires authentication and ownership

**DELETE /api/images/cue/{cueId}**
- Delete all images for a cue
- Requires authentication and ownership

## Setup Instructions

### 1. Add to Program.cs

```csharp
// Register image service and settings
builder.Services.Configure<ImageStorageSettings>(
    builder.Configuration.GetSection("ImageStorage"));
builder.Services.AddScoped<IImageService, ImageService>();

// Create wwwroot/uploads/cues directory
var uploadsPath = Path.Combine(builder.Environment.WebRootPath, "uploads/cues");
Directory.CreateDirectory(uploadsPath);
```

### 2. Add to appsettings.json

```json
{
  "ImageStorage": {
    "StoragePath": "uploads/cues",
    "ImageUrlBase": "/uploads/cues",
    "MaxFileSizeBytes": 10485760,
    "AllowedExtensions": ".jpg,.jpeg,.png,.gif,.webp",
    "AllowedMimeTypes": "image/jpeg,image/png,image/gif,image/webp",
    "EnableCompression": true,
    "CompressionQuality": 85,
    "GenerateThumbnails": true,
    "ThumbnailSize": 200,
    "UseCloudStorage": false,
    "CloudStorageConnectionString": null,
    "CloudStorageContainer": null
  }
}
```

### 3. Update launchSettings.json

Ensure wwwroot is accessible:
```json
{
  "profiles": {
    "https": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "launchUrl": "swagger",
      "applicationUrl": "https://localhost:7200;http://localhost:5200",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

### 4. Directory Setup

Create the uploads directory:
```bash
mkdir wwwroot/uploads/cues
```

Add to .gitignore:
```
wwwroot/uploads/
*.log
```

## Frontend Integration

### React Example

```javascript
// Upload single image
const uploadImage = async (cueId, file) => {
    const formData = new FormData();
    formData.append('cueId', cueId);
    formData.append('file', file);
    formData.append('isPrimary', true);

    const response = await fetch('/api/images/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    return await response.json();
};

// Upload multiple images
const uploadMultipleImages = async (cueId, files) => {
    const formData = new FormData();
    formData.append('cueId', cueId);
    files.forEach(file => formData.append('files', file));

    const response = await fetch('/api/images/upload-multiple', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    return await response.json();
};

// Get cue images
const getCueImages = async (cueId) => {
    const response = await fetch(`/api/images/cue/${cueId}`);
    return await response.json();
};

// Delete image
const deleteImage = async (imageId) => {
    const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return await response.json();
};
```

## API Usage Examples

### Upload Single Image with cURL

```bash
curl -X POST http://localhost:5200/api/images/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "cueId=1" \
  -F "file=@image.jpg" \
  -F "altText=Cue thumbnail" \
  -F "isPrimary=true"
```

### Upload Multiple Images with cURL

```bash
curl -X POST http://localhost:5200/api/images/upload-multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "cueId=1" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "files=@image3.jpg"
```

### Get Cue Images

```bash
curl http://localhost:5200/api/images/cue/1
```

### Delete Image

```bash
curl -X DELETE http://localhost:5200/api/images/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Validation Rules

### File Validation

1. **File Size**
   - Max: 10 MB (configurable)
   - Error: "File size exceeds maximum"

2. **File Extensions**
   - Allowed: .jpg, .jpeg, .png, .gif, .webp
   - Error: "File extension is not allowed"

3. **MIME Types**
   - Allowed: image/jpeg, image/png, image/gif, image/webp
   - Error: "File type is not allowed"

### Permission Validation

- User must be authenticated
- User must own the cue to upload/delete images
- Only one primary image per cue

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "message": "No file provided"
}
```

**401 Unauthorized**
```json
{
  "message": "Invalid user"
}
```

**403 Forbidden**
```json
{
  "message": "Image not found or you don't have permission"
}
```

## Database Schema

### CueImage Table

```sql
CREATE TABLE CueImages (
    Id INT PRIMARY KEY IDENTITY(1,1),
    CueId INT NOT NULL FOREIGN KEY REFERENCES Cues(Id),
    ImageUrl NVARCHAR(500) NOT NULL,
    AltText NVARCHAR(200),
    DisplayOrder INT DEFAULT 0,
    IsPrimary BIT DEFAULT 0,
    UploadedAt DATETIME2 DEFAULT GETUTCDATE(),
    INDEX IX_CueImage_CueId (CueId)
);
```

## Performance Tips

1. **Use CDN** - Serve images from CDN for better performance
2. **Lazy Loading** - Load images only when visible in viewport
3. **Compression** - Enable image compression in settings
4. **Thumbnails** - Generate and serve thumbnails for listings
5. **Cleanup** - Periodically delete orphaned image files

## Security Considerations

1. **File Validation** - Always validate file type and size
2. **Filename Sanitization** - Use generated unique filenames
3. **Permission Checks** - Verify user ownership before operations
4. **Virus Scanning** - Consider adding malware scanning
5. **HTTPS Only** - Use HTTPS for upload endpoints
6. **Rate Limiting** - Implement rate limiting for uploads

## Troubleshooting

### Images Not Uploading

1. Check wwwroot/uploads/cues directory exists
2. Verify file permissions on directory
3. Check file size limit in settings
4. Check allowed MIME types

### 403 Forbidden Error

1. Ensure user is authenticated
2. Verify user owns the cue
3. Check user ID from JWT token

### 500 Server Error

1. Check application logs
2. Verify database connection
3. Check disk space availability
4. Check file system permissions
