# Image Upload & Multimodal AI Documentation

This solution provides JavaScript utilities to upload images and send them to OpenRouter's API with text prompts for multimodal AI analysis.

## Components & Files

### 1. **Utility Functions** (`client/src/utils/imageUploadHandler.js`)

Core functions for image handling and API communication.

#### `fileToBase64(file)`
Converts a File object to a Base64 data URL.

```javascript
import { fileToBase64 } from './utils/imageUploadHandler';

const imageFile = document.querySelector('input[type="file"]').files[0];
const base64 = await fileToBase64(imageFile);
console.log(base64); // "data:image/png;base64,iVBORw0KG..."
```

#### `isValidImageFormat(file)`
Validates that the file is PNG or JPG format.

```javascript
import { isValidImageFormat } from './utils/imageUploadHandler';

const file = document.querySelector('input[type="file"]').files[0];
if (isValidImageFormat(file)) {
  console.log('Valid image');
} else {
  console.log('Invalid format');
}
```

#### `sendImageWithPrompt(imageFile, textPrompt, apiKey)`
Sends image + text to OpenRouter's multimodal API and returns AI response.

**Parameters:**
- `imageFile` (File): The image file from input
- `textPrompt` (string): The question/prompt about the image
- `apiKey` (string): Your OpenRouter API key

**Returns:** Promise<string> - AI's response text

**Example:**
```javascript
import { sendImageWithPrompt } from './utils/imageUploadHandler';

try {
  const imageFile = document.querySelector('input[type="file"]').files[0];
  const response = await sendImageWithPrompt(
    imageFile,
    "Describe what's in this image",
    "sk-or-..." // Your OpenRouter API key
  );
  console.log('AI Response:', response);
} catch (error) {
  console.error('Error:', error.message);
}
```

#### `createImageInput(onFileSelected)`
Creates and returns a file input element for image selection.

```javascript
import { createImageInput } from './utils/imageUploadHandler';

const input = createImageInput((file) => {
  console.log('Selected file:', file.name);
});
input.click(); // Opens file picker dialog
```

---

### 2. **React Component** (`client/src/components/ImageUploadComponent.jsx`)

Drop-in React component for image upload UI.

**Props:**
- `onSendMessage(message)` - Callback when AI responds
- `apiKey` (string) - OpenRouter API key
- `loading` (boolean) - Whether a request is in progress

**Usage in your Chat component:**

```jsx
import { ImageUploadComponent } from './components/ImageUploadComponent';

export function ChatView({ messages, loading }) {
  const apiKey = process.env.VITE_OPENROUTER_API_KEY;

  const handleImageResponse = (message) => {
    // Add AI response to messages array
    setMessages(prev => [...prev, message]);
  };

  return (
    <div>
      {/* Your chat messages */}
      
      {/* Image upload component */}
      <ImageUploadComponent 
        onSendMessage={handleImageResponse}
        apiKey={apiKey}
        loading={loading}
      />
    </div>
  );
}
```

---

### 3. **Standalone HTML Example** (`client/public/image-upload-example.html`)

A complete, self-contained HTML/CSS/JS example. Open it in a browser to test image uploads without any build process.

**Features:**
- ✅ File validation (PNG/JPG only)
- ✅ Image preview
- ✅ Error/success messages
- ✅ Loading state
- ✅ Clean, responsive UI
- ✅ Copy-paste ready code

**To use:**
1. Open `client/public/image-upload-example.html` in your browser
2. Enter your OpenRouter API key
3. Select an image
4. Enter a prompt
5. Click "Send to AI"

---

## Message Format (Multimodal)

The API expects messages with mixed content types:

```javascript
const message = {
  role: 'user',
  content: [
    {
      type: 'text',
      text: 'What is in this image?'
    },
    {
      type: 'image_url',
      image_url: {
        url: 'data:image/png;base64,iVBORw0KG...' // Base64 data URL
      }
    }
  ]
};
```

**Key points:**
- `content` is an **array** (not a string)
- Each object has `type` and appropriate fields
- Images use `image_url` with a `url` field
- The URL should be a data URL with Base64-encoded image
- Both text and images can be in the same message

---

## API Configuration

**Endpoint:** `https://openrouter.ai/api/v1/chat/completions`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer sk-or-...',
  'HTTP-Referer': window.location.origin,  // Your app URL
  'X-Title': 'VibeStudy'
}
```

**Request payload:**
```javascript
{
  model: 'google/gemini-2.0-flash-001',
  messages: [
    {
      role: 'user',
      content: [ /* text and image objects */ ]
    }
  ],
  temperature: 0.7,
  max_tokens: 2000
}
```

---

## Integration Steps

### Option 1: React Component Integration

1. **Add the component to your chat view:**
```jsx
import { ImageUploadComponent } from './components/ImageUploadComponent';

// In your chat component
<ImageUploadComponent 
  onSendMessage={(aiResponse) => {
    // Handle AI response
    setMessages(prev => [...prev, aiResponse]);
  }}
  apiKey={process.env.VITE_OPENROUTER_API_KEY}
  loading={isLoading}
/>
```

2. **Store API key in environment:**
```
# client/.env
VITE_OPENROUTER_API_KEY=sk-or-...
```

### Option 2: Using Utility Functions Directly

```jsx
import { sendImageWithPrompt } from './utils/imageUploadHandler';

const handleImageSubmit = async (imageFile, prompt) => {
  try {
    const response = await sendImageWithPrompt(
      imageFile,
      prompt,
      process.env.VITE_OPENROUTER_API_KEY
    );
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Option 3: Backend Integration (Express)

For added security, you could relay requests through your Express backend:

```javascript
// server/src/routes/imageAnalysis.js
import express from 'express';

const router = express.Router();

router.post('/analyze-image', async (req, res) => {
  const { base64Image, prompt } = req.body;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.CLIENT_ORIGIN,
        'X-Title': 'VibeStudy'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## Supported Image Formats

- ✅ PNG (.png)
- ✅ JPG/JPEG (.jpg, .jpeg)
- ❌ GIF, WebP, SVG, BMP (not supported)

**File size limit:** 5MB (recommended)

---

## Error Handling

The utilities throw descriptive errors that you should catch:

```javascript
try {
  const response = await sendImageWithPrompt(imageFile, prompt, apiKey);
} catch (error) {
  if (error.message.includes('Invalid image format')) {
    console.log('User selected wrong file type');
  } else if (error.message.includes('too large')) {
    console.log('File exceeds size limit');
  } else if (error.message.includes('API error')) {
    console.log('OpenRouter API error - check API key');
  } else {
    console.log('Network or other error');
  }
}
```

---

## Example Prompts for AI Analysis

```
"What text appears in this image? Extract it exactly."
"Describe the mood and emotions conveyed by this image."
"Identify all objects in this image and their positions."
"What is the main subject of this photo?"
"Analyze the composition and lighting of this image."
"Is there any text in this image? If so, transcribe it."
"Describe what's happening in this scene in detail."
```

---

## Testing

**Quick test without integration:**

1. Open `client/public/image-upload-example.html` in browser
2. Get your OpenRouter API key from https://openrouter.ai
3. Enter key and upload test image
4. See response immediately

**In React app:**

Add ImageUploadComponent to any view and test with your app's API key.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API key format (should start with `sk-or-`) |
| Network error | Verify CORS headers, check browser console for details |
| "Invalid image format" | Only PNG/JPG supported, not GIF/WebP |
| Image appears corrupted | Check file isn't corrupted before upload |
| Very slow response | API may be throttled, add retry logic with backoff |

---

## Performance Tips

1. **Compress images** before upload (reduce file size)
2. **Add loading states** during API calls
3. **Cache responses** if same image analyzed multiple times
4. **Use smaller prompts** when possible (API charges per token)
5. **Consider backend relay** to hide API key from client

---

## Next Steps

- Integrate ImageUploadComponent into your ChatView
- Add image upload button to chat UI
- Test with sample images
- Consider adding image compression library (sharp, sharp-web)
