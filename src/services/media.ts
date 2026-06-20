import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from './firebase';

type UploadAlertMediaInput = {
  uri: string;
  userId: string;
  contentType?: string;
};

function assertStorage() {
  if (!storage) {
    throw new Error('Firebase Storage no esta configurado.');
  }

  return storage;
}

function getFileExtension(contentType?: string) {
  if (contentType?.includes('mp4')) {
    return 'mp4';
  }

  if (contentType?.includes('quicktime')) {
    return 'mov';
  }

  if (contentType?.includes('png')) {
    return 'png';
  }

  if (contentType?.includes('webp')) {
    return 'webp';
  }

  return 'jpg';
}

export async function uploadAlertMedia({
  uri,
  userId,
  contentType = 'image/jpeg',
}: UploadAlertMediaInput) {
  const readyStorage = assertStorage();
  const response = await fetch(uri);
  const blob = await response.blob();
  const extension = getFileExtension(contentType);
  const mediaRef = ref(
    readyStorage,
    `alerts/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`,
  );

  await uploadBytes(mediaRef, blob, {
    contentType,
  });

  return getDownloadURL(mediaRef);
}
