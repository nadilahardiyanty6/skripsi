type SendWAArgs = { to: string; message: string };

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function sendWhatsApp({ to, message }: SendWAArgs) {
  const provider = process.env.WA_PROVIDER ?? "fonnte";

  if (provider === "fonnte") {
    const token = must("FONNTE_TOKEN");
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ target: to, message }),
    });
    if (!res.ok) throw new Error(`Fonnte error: ${res.status}`);
    return;
  }

  if (provider === "whacenter") {
    const deviceId = must("WHACENTER_DEVICE_ID");
    const apiKey = must("WHACENTER_API_KEY");
    const res = await fetch("https://app.whacenter.com/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, number: to, message, api_key: apiKey }),
    });
    if (!res.ok) throw new Error(`Whacenter error: ${res.status}`);
    return;
  }

  throw new Error(`Unknown WA_PROVIDER: ${provider}`);
}
