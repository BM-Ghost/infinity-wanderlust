import { getPocketBase } from "@/lib/pocketbase"

export type User = {
  id: string
  username: string
  email: string
  emailVisibility: boolean
  verified: boolean
  created: string
  updated: string
  name?: string
  avatar?: string
  auth_number?: number
  about?: string
  Links?: string
  followers: string[]
  followers_count: number
  expand?: {
    followers?: User[]
  }
}

export type UserWithAvatar = User & {
  avatarUrl?: string
  formattedDate: string
}

// Fetch a single user by ID
export async function fetchUserById(id: string): Promise<UserWithAvatar | null> {
  const pb = getPocketBase()

  try {
    const record = await pb.collection("users").getOne(id, {
      expand: "followers",
    })

    return formatUser(record)
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error)
    return null
  }
}

// Fetch users with pagination
export async function fetchUsers(
  page = 1,
  perPage = 10,
  sort = "-created",
  filter = "",
): Promise<{ items: UserWithAvatar[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase()

  try {
    const resultList = await pb.collection("users").getList(page, perPage, {
      sort,
      filter,
    })

    const formattedUsers = resultList.items.map(formatUser)

    return {
      items: formattedUsers,
      totalItems: resultList.totalItems,
      totalPages: resultList.totalPages,
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { items: [], totalItems: 0, totalPages: 0 }
  }
}

// Update user profile
export async function updateUserProfile(
  data: {
    name?: string
    about?: string
    Links?: string
  },
  avatar?: File | null,
): Promise<UserWithAvatar | null> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to update your profile")
  }

  try {
    const formData = new FormData()

    if (data.name !== undefined) formData.append("name", data.name)
    if (data.about !== undefined) formData.append("about", data.about)
    if (data.Links !== undefined) formData.append("Links", data.Links)

    if (avatar) {
      formData.append("avatar", avatar)
    } else if (avatar === null) {
      // If avatar is explicitly set to null, remove the current avatar
      formData.append("avatar", "")
    }

    const record = await pb.collection("users").update(pb.authStore.model?.id, formData)

    // Update the auth store model
    pb.authStore.save(pb.authStore.token, record)

    return formatUser(record)
  } catch (error: any) {
    console.error("Error updating profile:", error)
    throw new Error(error.message || "Failed to update profile. Please try again.")
  }
}

// Follow a user
export async function followUser(userId: string): Promise<boolean> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to follow users")
  }

  try {
    // Get the user to follow
    const userToFollow = await pb.collection("users").getOne(userId)

    // Check if already following
    const isAlreadyFollowing = userToFollow.followers?.includes(pb.authStore.model?.id)

    if (isAlreadyFollowing) {
      return true // Already following
    }

    // Add current user to followers
    const followers = userToFollow.followers || []
    followers.push(pb.authStore.model?.id)

    // Update followers count
    const followers_count = (userToFollow.followers_count || 0) + 1

    // Update the user
    await pb.collection("users").update(userId, {
      followers,
      followers_count,
    })

    return true
  } catch (error: any) {
    console.error("Error following user:", error)
    throw new Error(error.message || "Failed to follow user. Please try again.")
  }
}

// Unfollow a user
export async function unfollowUser(userId: string): Promise<boolean> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to unfollow users")
  }

  try {
    // Get the user to unfollow
    const userToUnfollow = await pb.collection("users").getOne(userId)

    // Remove current user from followers
    const followers = userToUnfollow.followers?.filter((id) => id !== pb.authStore.model?.id) || []

    // Update followers count
    const followers_count = Math.max(0, (userToUnfollow.followers_count || 1) - 1)

    // Update the user
    await pb.collection("users").update(userId, {
      followers,
      followers_count,
    })

    return true
  } catch (error: any) {
    console.error("Error unfollowing user:", error)
    throw new Error(error.message || "Failed to unfollow user. Please try again.")
  }
}

// Check if current user is following a user
export async function isFollowingUser(userId: string): Promise<boolean> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    return false
  }

  try {
    const user = await pb.collection("users").getOne(userId)
    return user.followers?.includes(pb.authStore.model?.id) || false
  } catch (error) {
    console.error("Error checking follow status:", error)
    return false
  }
}

// Get followers of a user
export async function getUserFollowers(userId: string): Promise<UserWithAvatar[]> {
  const pb = getPocketBase()

  try {
    const user = await pb.collection("users").getOne(userId, {
      expand: "followers",
    })

    if (!user.expand?.followers) {
      return []
    }

    return user.expand.followers.map(formatUser)
  } catch (error) {
    console.error("Error fetching followers:", error)
    return []
  }
}

// Helper function to format a user record
function formatUser(record: any): UserWithAvatar {
  const baseUrl = "https://remain-faceghost.pockethost.io/api/files/"

  // Format the date
  const date = new Date(record.created)
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Get avatar URL
  let avatarUrl = undefined
  if (record.avatar) {
    avatarUrl = `${baseUrl}${record.collectionId}/${record.id}/${record.avatar}`
  }

  return {
    ...record,
    avatarUrl,
    formattedDate,
  }
}

