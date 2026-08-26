// Quick test script for LINE Channel Access Token verification
async function testLineBotInfo(token: string) {
  try {
    const res = await fetch("https://api.line.me/v2/bot/info", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const status = res.status;
    const body = await res.json().catch(async () => await res.text());
    console.log("HTTP Status:", status);
    console.log("Response:", JSON.stringify(body, null, 2));
    return { status, body };
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// Let's test with candidate strings read from the image:
const testToken = process.argv[2] || "";
if (testToken) {
  testLineBotInfo(testToken);
} else {
  console.log("Please provide token as arg");
}
