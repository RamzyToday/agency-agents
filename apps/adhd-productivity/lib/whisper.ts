import * as FileSystem from 'expo-file-system';

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

export async function transcribeAudio(audioUri: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not set. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');

  // expo-file-system uploadAsync handles multipart/form-data with file URIs
  const result = await FileSystem.uploadAsync(WHISPER_URL, audioUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: 'audio/m4a',
    parameters: {
      model: 'whisper-1',
      language: 'en',
    },
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (result.status !== 200) {
    throw new Error(`Whisper API error: ${result.status}`);
  }

  const body = JSON.parse(result.body);
  return body.text?.trim() ?? '';
}
