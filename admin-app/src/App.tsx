import { getConfig } from './api/client';
import { DashboardPage } from './pages/DashboardPage';
import { ProductEditPage } from './pages/ProductEditPage';
import { MenuPage } from './pages/MenuPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const page = getConfig().page;

  switch (page) {
    case 'menu':
      return <MenuPage />;
    case 'product-edit':
      return <ProductEditPage />;
    case 'settings':
      return <SettingsPage />;
    case 'reviews':
      return <ReviewsPage />;
    default:
      return <DashboardPage />;
  }
}
