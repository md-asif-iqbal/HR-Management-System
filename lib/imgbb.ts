export const uploadToImgBB = async (
  file: Buffer,
  fileName?: string
): Promise<{ url: string; deleteUrl: string }> => {
  const base64 = file.toString('base64');
  const formData = new FormData();
  formData.append('image', base64);
  if (fileName) formData.append('name', fileName);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
    { method: 'POST', body: formData }
  );

  const data = await res.json();
  if (!data.success) throw new Error('ImgBB upload failed');

  return {
    url: data.data.url,
    deleteUrl: data.data.delete_url,
  };
};
