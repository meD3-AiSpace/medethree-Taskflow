const TOKEN = "8OBUXdfTk10sKwL/o1KvCTbx0C4TbUA/q+q2/Fb9jniS8AQCKmO/jUvxioGUflsM2iLIDricYT5Qt7H8EfjrUbiLncPUXbueDD0rjnjGu8xuiJ01r0w55V0SBHdaogsMTivcHwHxw71UmjhXjFIVHAdB04t89/1O/w1cDnyilFU=";

export async function sendTestPush(userId: string) {
  console.log(`Sending LINE Push Notification to User ID: ${userId}...`);

  const flexMessage = {
    type: "flex",
    altText: "🔔 [TaskFlow] ยินดีต้อนรับ! ระบบแจ้งเตือนงานเชื่อมต่อกับ LINE OA สำเร็จแล้ว",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#059669",
        paddingAll: "lg",
        contents: [
          {
            type: "text",
            text: "TASKFLOW MANAGER",
            weight: "bold",
            color: "#FFFFFF",
            size: "xxs",
          },
          {
            type: "text",
            text: "✅ เชื่อมต่อระบบ LINE OA สำเร็จ",
            weight: "bold",
            color: "#FFFFFF",
            size: "md",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "lg",
        contents: [
          {
            type: "text",
            text: "บอท Faraday-ARCH เชื่อมต่อกับระบบติดตามงาน MeDTree เรียบร้อยแล้ว พร้อมส่งการแจ้งเตือนงานด่วน, ใบขออนุญาต และข้อติดขัด (Blockers) เข้ามือถือแบบเรียลไทม์ 🚀",
            wrap: true,
            size: "sm",
            color: "#374151",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            paddingAll: "md",
            backgroundColor: "#F3F4F6",
            cornerRadius: "md",
            contents: [
              {
                type: "text",
                text: "🏢 บริษัท: MeDTree Design & Build",
                size: "xs",
                color: "#1F2937",
                weight: "bold",
              },
              {
                type: "text",
                text: "🤖 บอท: Faraday-ARCH (@739cutlg)",
                size: "xs",
                color: "#4B5563",
                margin: "xs",
              },
              {
                type: "text",
                text: "👤 ผู้รับ: เฮีย (Admin / Project Director)",
                size: "xs",
                color: "#059669",
                weight: "bold",
                margin: "xs",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "md",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#059669",
            height: "sm",
            action: {
              type: "uri",
              label: "เปิดระบบติดตามงาน Dashboard",
              uri: "http://localhost:3000/dashboard",
            },
          },
        ],
      },
    },
  };

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [flexMessage],
    }),
  });

  const status = response.status;
  const data = await response.json().catch(async () => await response.text());
  console.log("LINE Server Response Status:", status);
  console.log("LINE Server Response Body:", JSON.stringify(data, null, 2));
  return { status, data };
}

const targetUserId = process.argv[2];
if (targetUserId) {
  sendTestPush(targetUserId);
}
