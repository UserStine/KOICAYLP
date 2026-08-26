export async function deliverEmail(to, subject, text) {
  const url = process.env.EMAIL_DELIVERY_WEBHOOK_URL;
  if (!url) {
    console.warn('[mail] EMAIL_DELIVERY_WEBHOOK_URL is not configured; message not sent.');
    return false;
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.EMAIL_DELIVERY_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.EMAIL_DELIVERY_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ to, subject, text }),
    });
    return response.ok;
  } catch (error) {
    console.error(`[mail] delivery_failed to=${to} error=${error.message}`);
    return false;
  }
}
