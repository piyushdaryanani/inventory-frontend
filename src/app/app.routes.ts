import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ProductsComponent } from './pages/products/products';
import { CategoriesComponent } from './pages/categories/categories';
import { SuppliersComponent } from './pages/suppliers/suppliers';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'suppliers', component: SuppliersComponent },

  // default route → dashboard
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  // wildcard → dashboard
  { path: '**', redirectTo: 'dashboard' }
];
