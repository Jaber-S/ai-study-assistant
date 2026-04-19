import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { sendImageWithPrompt, createImageInput, isValidImageFormat } from '../utils/imageUploadHandler';
import { ImageIcon, Send, X } from 'lucide-react';

/**
 * Image Upload Component for Chat
 * Allows users to upload an image and send it with a text prompt to the AI
 */
export function ImageUploadComponent({ onSendMessage, apiKey, loading }) {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [textPrompt, setTextPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (file) => {
    setError(null);

    if (!isValidImageFormat(file)) {
      setError('Please select a PNG or JPG image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image file is too large. Maximum size is 5MB.');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Trigger file input
  const handleUploadClick = () => {
    const input = createImageInput(handleFileSelect);
    input.click();
  };

  // Send image with prompt to AI
  const handleSendImage = async () => {
    if (!selectedImage || !textPrompt.trim()) {
      setError('Please select an image and enter a prompt.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await sendImageWithPrompt(
        selectedImage,
        textPrompt,
        apiKey
      );

      // Call parent callback with the AI response
      onSendMessage({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });

      // Reset form
      setSelectedImage(null);
      setPreview(null);
      setTextPrompt('');
    } catch (err) {
      setError(err.message || 'Failed to process image. Please try again.');
      console.error('Image upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel image selection
  const handleCancel = () => {
    setSelectedImage(null);
    setPreview(null);
    setTextPrompt('');
    setError(null);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-gray-800/50 p-4 space-y-3">
      {/* Image Preview Section */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 rounded-lg object-contain w-full"
          />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-500 rounded-full transition"
            title="Remove image"
          >
            <X size={16} className="text-white" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-950/50 border border-red-500/30 p-3">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Image Selection and Prompt */}
      <div className="space-y-2">
        {!selectedImage ? (
          <button
            onClick={handleUploadClick}
            disabled={isProcessing || loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition"
          >
            <ImageIcon size={18} />
            <span>Select Image (PNG/JPG)</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleUploadClick}
              disabled={isProcessing || loading}
              className="flex-1 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-sm text-white transition"
            >
              Change Image
            </button>
            <button
              onClick={handleCancel}
              disabled={isProcessing || loading}
              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-sm text-white transition"
            >
              Clear
            </button>
          </div>
        )}

        {/* Text Prompt Input */}
        <textarea
          value={textPrompt}
          onChange={(e) => setTextPrompt(e.target.value)}
          placeholder="Enter your question or prompt about the image..."
          disabled={isProcessing || loading || !selectedImage}
          className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-white/10 text-white placeholder-gray-400 disabled:bg-gray-800 disabled:cursor-not-allowed resize-none h-20"
        />
      </div>

      {/* Send Button */}
      {selectedImage && (
        <button
          onClick={handleSendImage}
          disabled={!textPrompt.trim() || isProcessing || loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition"
        >
          <Send size={18} />
          <span>{isProcessing ? 'Processing...' : 'Send Image'}</span>
        </button>
      )}
    </div>
  );
}
