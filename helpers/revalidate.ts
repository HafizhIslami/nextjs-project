export const revalidateTag = async (tag: string) => {
  const apiUrl = process.env.API_URL;
  const secret = process.env.REVALIDATE_TOKEN;

  if (!apiUrl || !secret) return;

  await fetch(
    `${apiUrl}/api/revalidate?tag=${encodeURIComponent(tag)}`,
    {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      cache: "no-store",
    }
  );
};
