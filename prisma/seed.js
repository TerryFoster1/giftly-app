const { PrismaClient } = require("@prisma/client");
const { scryptSync } = require("crypto");

const prisma = new PrismaClient();

const now = new Date("2026-04-30T09:00:00.000Z");
const demoUser = {
  id: "user_demo_parent",
  email: "demo@giftly.local",
  name: "Kathryn",
  passwordHash: `scrypt:giftly_demo_salt:${scryptSync("giftly-demo-123", "giftly_demo_salt", 64).toString("hex")}`,
  createdAt: now,
  updatedAt: now
};

const profiles = [
  {
    id: "profile_kathryn",
    ownerUserId: demoUser.id,
    linkedUserId: demoUser.id,
    displayName: "Kathryn",
    slug: "kathryn",
    relationship: "Me",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
    bio: "Coffee, useful tech, cozy weekends, and small luxuries I would forget to mention.",
    birthday: new Date("1990-04-12T00:00:00.000Z"),
    anniversary: null,
    primaryEventType: "BIRTHDAY",
    isPrimary: true,
    isManagedProfile: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "profile_ethan",
    ownerUserId: demoUser.id,
    linkedUserId: null,
    displayName: "Ethan",
    slug: "ethan",
    relationship: "Son",
    photoUrl: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=400&auto=format&fit=crop",
    bio: "Science kits, building toys, soccer, and anything with a good challenge.",
    birthday: new Date("2014-05-12T00:00:00.000Z"),
    anniversary: null,
    primaryEventType: "BIRTHDAY",
    isPrimary: false,
    isManagedProfile: true,
    createdAt: now,
    updatedAt: now
  }
];

const gifts = [
  {
    id: "gift_lego",
    profileId: "profile_ethan",
    createdByUserId: demoUser.id,
    title: "Lego Mars Rover Set",
    productUrl: "https://example.com/lego-mars-rover",
    originalUrl: "https://example.com/lego-mars-rover",
    monetizedUrl: "https://example.com/lego-mars-rover",
    affiliateStatus: "not_checked",
    storeName: "Example Toys",
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=600&auto=format&fit=crop",
    price: 64.99,
    currency: "USD",
    notes: "He mentioned this twice after watching the space documentary.",
    eventTag: "Birthday",
    wantRating: 5,
    visibility: "public",
    hiddenFromRecipient: false,
    allowContributions: false,
    fundingGoalAmount: 0,
    currentContributionAmount: 0,
    reservedStatus: "available",
    purchasedStatus: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "gift_scooter",
    profileId: "profile_ethan",
    createdByUserId: demoUser.id,
    title: "Foldable Scooter",
    productUrl: "https://example.com/scooter",
    originalUrl: "https://example.com/scooter",
    monetizedUrl: "https://example.com/scooter",
    affiliateStatus: "not_checked",
    storeName: "Outdoor Co.",
    imageUrl: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=600&auto=format&fit=crop",
    price: 129,
    currency: "USD",
    notes: "Good group gift candidate.",
    eventTag: "Christmas",
    wantRating: 4,
    visibility: "public",
    hiddenFromRecipient: true,
    allowContributions: true,
    fundingGoalAmount: 129,
    currentContributionAmount: 35,
    reservedStatus: "available",
    purchasedStatus: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "gift_mug",
    profileId: "profile_kathryn",
    createdByUserId: demoUser.id,
    title: "Ceramic Travel Mug",
    productUrl: "https://example.com/travel-mug",
    originalUrl: "https://example.com/travel-mug",
    monetizedUrl: "https://example.com/travel-mug",
    affiliateStatus: "not_checked",
    storeName: "Studio Goods",
    imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=600&auto=format&fit=crop",
    price: 34,
    currency: "USD",
    notes: "Prefer matte finish, dishwasher safe.",
    eventTag: "General_Wishlist",
    wantRating: 3,
    visibility: "public",
    hiddenFromRecipient: false,
    allowContributions: false,
    fundingGoalAmount: 0,
    currentContributionAmount: 0,
    reservedStatus: "reserved",
    reservedBy: "A friend",
    purchasedStatus: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "gift_private_watch",
    profileId: "profile_kathryn",
    createdByUserId: demoUser.id,
    title: "Vintage-inspired watch",
    productUrl: "https://example.com/watch",
    originalUrl: "https://example.com/watch",
    monetizedUrl: "https://example.com/watch",
    affiliateStatus: "not_checked",
    storeName: "Time House",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop",
    price: 220,
    currency: "USD",
    notes: "Private idea for anniversary planning.",
    eventTag: "Birthday",
    wantRating: 5,
    visibility: "private",
    hiddenFromRecipient: true,
    allowContributions: true,
    fundingGoalAmount: 220,
    currentContributionAmount: 0,
    reservedStatus: "available",
    purchasedStatus: false,
    createdAt: now,
    updatedAt: now
  }
];

async function main() {
  await prisma.contributionPlaceholder.deleteMany();
  await prisma.session.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.giftItem.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({ data: demoUser });
  await prisma.profile.createMany({ data: profiles });
  await prisma.giftItem.createMany({ data: gifts });
  await prisma.reservation.create({
    data: {
      id: "reservation_mug",
      giftItemId: "gift_mug",
      reserverName: "A friend",
      reserverEmail: "friend@example.com",
      status: "active",
      createdAt: now,
      updatedAt: now
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
