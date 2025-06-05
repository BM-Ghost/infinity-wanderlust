import PocketBase, { ListResult } from 'pocketbase';

const pb = new PocketBase('https://remain-faceghost.pockethost.io');

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  created: string;
  updated: string;
  verified: boolean;
  emailVisibility: boolean;
  auth_number: number;
  about?: string;
  Links?: string;
  followers?: string[];
  followers_count?: number;
}

export interface UseUsersOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  expand?: string;
}

// ✅ Async function for React Query
export const fetchUsers = async ({
  page = 1,
  perPage = 30,
  sort = '-created',
  filter = '',
  expand = '',
}: UseUsersOptions = {}): Promise<UserRecord[]> => {
  const result: ListResult<UserRecord> = await pb.collection('users').getList(page, perPage, {
    sort,
    filter,
    expand,
  });

  console.log('Fetched users:', result.items);
  return result.items;
};
