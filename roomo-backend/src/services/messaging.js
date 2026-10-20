const prisma = require("../lib/prisma");

function twilioConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

async function sendTwilioMessage({ to, channel, body, contentSid, contentVariables }) {
  if (!twilioConfigured()) {
    throw new Error("Twilio messaging is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
  }
  const from = channel === "WHATSAPP"
    ? process.env.TWILIO_WHATSAPP_FROM
    : process.env.TWILIO_SMS_FROM;
  if (!from) throw new Error(`Twilio ${channel} sender is not configured.`);

  const form = new URLSearchParams({ To: channel === "WHATSAPP" && !to.startsWith("whatsapp:") ? `whatsapp:${to}` : to, From: from });
  if (contentSid) {
    form.set("ContentSid", contentSid);
    if (contentVariables) form.set("ContentVariables", JSON.stringify(contentVariables));
  } else {
    form.set("Body", body);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    }
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `Twilio ${channel} send failed (${response.status}).`);
  return { id: result.sid || null, status: result.status || "queued" };
}

async function sendOtp(phoneNumber, otp) {
  const results = [];
  const smsBody = `Your ROOMO verification code is ${otp}. It expires in 5 minutes. Do not share this code.`;
  const otpContentSid = process.env.TWILIO_WHATSAPP_OTP_CONTENT_SID;
  for (const channel of ["SMS", "WHATSAPP"]) {
    try {
      const result = await sendTwilioMessage({
        to: phoneNumber,
        channel,
        body: smsBody,
        contentSid: channel === "WHATSAPP" ? otpContentSid : null,
        contentVariables: channel === "WHATSAPP" && otpContentSid ? { "1": otp } : null,
      });
      results.push({ channel, ok: true, providerMessageId: result.id });
    } catch (error) {
      console.error(`ROOMO OTP ${channel} delivery failed:`, error.message);
      results.push({ channel, ok: false, error: error.message });
    }
  }
  return results;
}

async function sendReservationConfirmation(reservation) {
  const guestPhone = reservation.guest?.phoneNumber;
  const ownerPhone = reservation.property?.owner?.phoneNumber;
  const recipients = [
    { recipientType: "GUEST", phone: guestPhone, name: reservation.guest?.fullName },
    { recipientType: "OWNER", phone: ownerPhone, name: reservation.property?.owner?.fullName },
  ].filter((recipient) => recipient.phone);

  const checkIn = new Date(reservation.checkIn).toISOString().slice(0, 10);
  const checkOut = new Date(reservation.checkOut).toISOString().slice(0, 10);
  const amount = Number(reservation.totalAmount).toFixed(2);
  const textBody = `ROOMO reservation confirmed: ${reservation.reservationCode} | ${reservation.property.title} | ${checkIn} to ${checkOut} | Total INR ${amount}. Keep this reference for your records.`;
  const contentSid = process.env.TWILIO_WHATSAPP_RESERVATION_CONTENT_SID;

  for (const recipient of recipients) {
    for (const channel of ["SMS", "WHATSAPP"]) {
      let log;
      try {
        log = await prisma.notificationLog.create({
          data: {
            reservationId: reservation.id,
            channel,
            recipientType: recipient.recipientType,
            recipientPhone: recipient.phone,
            messageType: "RESERVATION_CONFIRMED",
            status: "PENDING",
          },
        });
        const result = await sendTwilioMessage({
          to: recipient.phone,
          channel,
          body: `Hello ${recipient.name || ""}. ${textBody}`,
          contentSid: channel === "WHATSAPP" ? contentSid : null,
          contentVariables: channel === "WHATSAPP" && contentSid
            ? { "1": recipient.name || "there", "2": reservation.reservationCode, "3": reservation.property.title, "4": checkIn, "5": checkOut, "6": amount }
            : null,
        });
        await prisma.notificationLog.update({
          where: { id: log.id },
          data: { status: String(result.status || "submitted").toUpperCase(), providerMessageId: result.id, sentAt: new Date() },
        });
      } catch (error) {
        console.error(`ROOMO reservation ${channel} notification failed:`, error.message);
        if (log) {
          await prisma.notificationLog.update({
            where: { id: log.id },
            data: { status: "FAILED", errorMessage: error.message.slice(0, 1000) },
          }).catch(() => {});
        }
      }
    }
  }
}

module.exports = { sendOtp, sendReservationConfirmation };
