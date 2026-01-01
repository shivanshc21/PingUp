import User from "../models/User.js";
import { clerkClient } from "@clerk/express";

const ensureMongoUser = async (req, res, next) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1. Check MongoDB
    let user = await User.findById(userId);
    if (user) return next();

    // 2. Fetch from Clerk (source of truth)
    const clerkUser = await clerkClient.users.getUser(userId);

    // 3. Create Mongo user (self-healing)
    await User.create({
      _id: userId,
      email: clerkUser.emailAddresses[0].emailAddress,
      full_name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      username: clerkUser.emailAddresses[0].emailAddress.split("@")[0],
      profile_picture: clerkUser.imageUrl,
      connections: [],
      followers: [],
      following: [],
    });

    next();
  } catch (error) {
    console.error("ensureMongoUser error:", error);
    res.status(500).json({ success: false, message: "User sync failed" });
  }
};

export default ensureMongoUser;
