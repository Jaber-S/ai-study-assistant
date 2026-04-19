/**
 * Converts a File object to a Base64 string
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} Base64 encoded string
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Validates that the file is a supported image format
 * @param {File} file - The file to validate
 * @returns {boolean} True if file is PNG or JPG
 */
export function isValidImageFormat(file) {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  return validTypes.includes(file.type);
}

/**
 * Sends an image with a text prompt to OpenRouter's multimodal API
 * @param {File} imageFile - The image file to analyze
 * @param {string} textPrompt - The text prompt to send with the image
 * @param {string} apiKey - OpenRouter API key
 * @returns {Promise<string>} AI response text
 */
export async function sendImageWithPrompt(imageFile, textPrompt, apiKey) {
  // Validate inputs
  if (!imageFile) {
    throw new Error('No image file provided');
  }
  
  if (!isValidImageFormat(imageFile)) {
    throw new Error('Invalid image format. Please upload a PNG or JPG image.');
  }
  
  if (!textPrompt || textPrompt.trim() === '') {
    throw new Error('Please provide a text prompt');
  }
  
  if (!apiKey) {
    throw new Error('API key is required');
  }

  // Convert image to Base64
  let base64Image;
  try {
    base64Image = await fileToBase64(imageFile);
  } catch (error) {
    throw new Error('Failed to read image file: ' + error.message);
  }

  // Prepare the multimodal message content
  const messageContent = [
    {
      type: 'text',
      text: textPrompt
    },
    {
      type: 'image_url',
      image_url: {
        url: base64Image // Data URL including base64 data
      }
    }
  ];

  // Prepare the request payload
  const payload = {
    model: 'google/gemini-2.0-flash-001',
    messages: [
      {
        role: 'user',
        content: messageContent
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  };

  // Make the API request
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'VibeStudy'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || 
        `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    
    // Extract the response text
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error: Unable to reach the API');
    }
    throw error;
  }
}

/**
 * Creates a file input element and triggers image selection
 * @param {Function} onFileSelected - Callback when file is selected
 * @returns {HTMLInputElement} The created input element
 */
export function createImageInput(onFileSelected) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,.png,.jpg,.jpeg';
  input.onchange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };
  return input;
}
