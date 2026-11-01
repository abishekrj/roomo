const prisma = require("../lib/prisma");

async function completeTripWithCommission(tx, bookingId) {
  const booking = await tx.transportBooking.findUnique({ where: { id: bookingId } });
  if (!booking) return { error: "Transport booking not found.", status: 404 };
  if (booking.status === "COMPLETED") return { booking, alreadyCompleted: true };
  if (booking.status === "CANCELLED") return { error: "A cancelled trip cannot be completed.", status: 409 };
  if (!booking.assignedDriverId) return { error: "Assign a driver before completing this trip.", status: 400 };
  if (booking.totalTripFare === null || Number(booking.totalTripFare) <= 0) return { error: "Enter the customer's total trip fare before completing this trip.", status: 400 };

  const settings = await tx.walletSettings.findUnique({ where: { id: "default" } });
  if (!settings || !settings.isEnabled) return { error: "Driver wallet commission is disabled or not configured.", status: 409 };
  const fare = Number(booking.totalTripFare);
  const configuredValue = Number(settings.commissionValue);
  const commission = Math.round((settings.commissionModel === "PERCENTAGE" ? fare * configuredValue / 100 : configuredValue) * 100) / 100;

  const changed = await tx.transportBooking.updateMany({
    where: { id: booking.id, status: { in: ["CONFIRMED", "IN_PROGRESS", "PENDING"] } },
    data: { status: "COMPLETED" }
  });
  if (changed.count !== 1) return { error: "The booking status changed. Refresh and try again.", status: 409 };

  const walletRecord = await tx.driverWallet.upsert({
    where: { driverId: booking.assignedDriverId },
    create: { driverId: booking.assignedDriverId, balance: 0, status: "LOW_BALANCE" },
    update: {}
  });
  await tx.$queryRaw`SELECT id FROM driver_wallets WHERE id = ${walletRecord.id}::uuid FOR UPDATE`;
  const wallet = await tx.driverWallet.findUnique({ where: { id: walletRecord.id } });
  const before = Number(wallet.balance);
  const after = Math.round((before - commission) * 100) / 100;

  if (commission > 0) {
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id, driverId: booking.assignedDriverId, type: "DEBIT", category: "COMMISSION",
        amount: commission.toFixed(2), balanceBefore: before.toFixed(2), balanceAfter: after.toFixed(2),
        bookingId: booking.id, commissionBaseAmount: fare.toFixed(2), commissionRateSnapshot: configuredValue.toFixed(2),
        referenceId: "booking-commission:" + booking.id, idempotencyKey: "booking-commission:" + booking.id,
        description: settings.commissionModel === "PERCENTAGE"
          ? "ROOMO commission (" + configuredValue + "%) on total customer trip fare"
          : "ROOMO fixed commission on completed trip",
        metadata: { commissionModel: settings.commissionModel, configuredValue, totalCustomerTripFare: fare, currency: "INR" }
      }
    });
  }
  await tx.driverWallet.update({
    where: { id: wallet.id },
    data: {
      balance: after.toFixed(2),
      totalCommission: { increment: commission },
      status: wallet.status === "RESTRICTED" ? "RESTRICTED" : after >= Number(settings.minimumBalance) ? "ACTIVE" : "LOW_BALANCE"
    }
  });
  const completed = await tx.transportBooking.findUnique({ where: { id: booking.id } });
  return { booking: completed, commission, walletBalance: after };
}

module.exports = { completeTripWithCommission };
