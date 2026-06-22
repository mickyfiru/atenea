export type VoiceListeningResult = {
  text: string;
  isMock: true;
};

export async function startListening(): Promise<VoiceListeningResult> {
  console.log('[voice] startListening mock');

  return {
    text: '',
    isMock: true,
  };
}

export async function stopListening() {
  console.log('[voice] stopListening mock');
}
