const notImplemented = (name) => async () => {
  console.warn(`Integration "${name}" is not available in standalone mode.`);
  return null;
};

export const Core = {
  InvokeLLM: notImplemented('InvokeLLM'),
  SendEmail: notImplemented('SendEmail'),
  SendSMS: notImplemented('SendSMS'),
  UploadFile: notImplemented('UploadFile'),
  GenerateImage: notImplemented('GenerateImage'),
  ExtractDataFromUploadedFile: notImplemented('ExtractDataFromUploadedFile'),
};

export const InvokeLLM = notImplemented('InvokeLLM');
export const SendEmail = notImplemented('SendEmail');
export const SendSMS = notImplemented('SendSMS');
export const UploadFile = notImplemented('UploadFile');
export const GenerateImage = notImplemented('GenerateImage');
export const ExtractDataFromUploadedFile = notImplemented('ExtractDataFromUploadedFile');
