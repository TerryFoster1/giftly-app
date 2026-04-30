import { NextResponse } from "next/server";
import { createReservation, getOwnerStore } from "@/lib/db";
import { withUser } from "@/lib/api";

export async function GET() {
  return withUser(async (user) => {
    const store = await getOwnerStore(user);
    return store.reservations;
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reservation = await createReservation(body.giftId, body.reserverName, body.reserverEmail);
    return NextResponse.json(reservation, { status: 201 });
  } catch {
    return NextResponse.json({ message: "This gift is not available to reserve." }, { status: 403 });
  }
}
