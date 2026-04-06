export async function sendToDiscord(imageUrl: string, message: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not set");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
        embeds: [
          {
            image: {
              url: imageUrl,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send to Discord: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error("Error sending to Discord:", error);
  }
}
