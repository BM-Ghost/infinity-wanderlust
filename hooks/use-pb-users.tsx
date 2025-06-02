import { useEffect, useState, useCallback } from 'react';
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
  // Add more fields if needed
}

interface UseUsersOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  expand?: string;
}

export const getUsers = ({
  page = 1,
  perPage = 30,
  sort = '-created',
  filter = '',
  expand = '',
}: UseUsersOptions = {}) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result: ListResult<UserRecord> = await pb.collection('users').getList(page, perPage, {
        sort,
        filter,
        expand,
      });

      setUsers(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, sort, filter, expand]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    totalPages,
    totalItems,
    refetch: fetchUsers,
  };
};
