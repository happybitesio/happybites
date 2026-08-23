import { useEffect, useState } from 'react';
import { MenuData } from '../types/menu';
import { getMenuUrl } from '../api/config';

export const useMenuData = () => {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const response = await fetch(getMenuUrl());

        if (!response.ok) {
          throw new Error('Failed to fetch menu data');
        }

        const data: MenuData = await response.json();

        if (data.success) {
          setMenuData(data);
        } else {
          throw new Error('Invalid menu data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  return { menuData, loading, error, refetch: () => window.location.reload() };
};
