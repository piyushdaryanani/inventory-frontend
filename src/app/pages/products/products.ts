// src/app/pages/products/products.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { CategoriesService } from '../../services/categories.service';
import { SuppliersService, Supplier } from '../../services/suppliers.service';

// UI model used in the template
export interface Product {
  productId: number;          // DB product_id
  id: string;                 // display ID e.g. PRD-001
  sku: string;
  name: string;
  categoryId: number;
  supplierId: number | null;
  category: string;
  supplier: string;
  price: number;              // dollars
  stock: number;              // quantity
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products.html',
  styleUrls: ['./products.scss'],
})
export class ProductsComponent implements OnInit {
  // full list
  products: Product[] = [];
  // filtered for search
  filteredProducts: Product[] = [];

  // lookup maps for names
  private categoryNames = new Map<number, string>();
  private supplierNames = new Map<number, string>();

  // UI state
  searchTerm = '';
  isLoading = false;
  errorMessage: string | null = null;

  // slide-over form state
  isFormOpen = false;
  isEditMode = false;

  // form model
  formModel: {
    productId: number | null;
    name: string;
    sku: string;
    categoryId: number | null;
    supplierId: number | null;
    price: number | null;
    stock: number | null;
  } = this.getEmptyFormModel();

  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private suppliersService: SuppliersService
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    this.loadProducts();
  }

  // ---------- helpers ----------

  private getEmptyFormModel() {
    return {
      productId: null,
      name: '',
      sku: '',
      categoryId: 1,
      supplierId: 1,
      price: 0,
      stock: 0,
    };
  }

  private getCategoryName(categoryId: number | null | undefined): string {
    if (!categoryId) return 'Uncategorized';
    return this.categoryNames.get(categoryId) ?? 'Uncategorized';
  }

  private getSupplierName(supplierId: number | null | undefined): string {
    if (supplierId == null) return 'Unknown';
    return this.supplierNames.get(supplierId) ?? 'Unknown';
  }

  private mapRowToProduct(row: any): Product {
    const categoryId = row.category_id ?? 1;
    const supplierId = row.supplier_id ?? null;

    const categoryName =
      row.category_name ??
      this.getCategoryName(categoryId);

    const supplierName =
      row.supplier_name ??
      this.getSupplierName(supplierId);

    return {
      productId: row.product_id,
      id: `PRD-${String(row.product_id).padStart(3, '0')}`,
      sku: row.sku,
      name: row.name,
      categoryId,
      supplierId,
      category: categoryName,
      supplier: supplierName,
      price: (row.price_cents ?? 0) / 100,
      stock: row.quantity ?? 0,
    };
  }

  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter((p) =>
      p.id.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }

  // ---------- lookups ----------

  private loadLookups(): void {
    // categories
    this.categoriesService.getCategories().subscribe({
      next: (rows: any[]) => {
        this.categoryNames.clear();
        rows.forEach((row) => {
          if (row?.category_id != null) {
            this.categoryNames.set(row.category_id, row.category_name);
          }
        });
      },
      error: (err) => {
        console.error('Failed to load categories for products page', err);
      },
    });

    // suppliers
    this.suppliersService.getSuppliers().subscribe({
      next: (rows: Supplier[]) => {
        this.supplierNames.clear();
        rows.forEach((row) => {
          if (row?.supplierId != null) {
            this.supplierNames.set(row.supplierId, row.name);
          }
        });
      },
      error: (err) => {
        console.error('Failed to load suppliers for products page', err);
      },
    });
  }

  // ---------- loading & filtering ----------

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.productsService.getProducts().subscribe({
      next: (data: any[]) => {
        this.products = data.map((row) => this.mapRowToProduct(row));
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.errorMessage = 'Failed to load products from server.';
        this.isLoading = false;
      },
    });
  }

  onSearch(): void {
    this.applyFilter();
  }

  // ---------- form open / edit ----------

  onEdit(product: Product): void {
    this.isEditMode = true;
    this.formModel = {
      productId: product.productId,
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      price: product.price,
      stock: product.stock,
    };
    this.isFormOpen = true;
  }

  onAddProduct(): void {
    this.isEditMode = false;
    this.formModel = this.getEmptyFormModel();
    this.isFormOpen = true;
  }

  onCancelForm(): void {
    this.isFormOpen = false;
  }

  // ---------- submit (add / update) ----------

  onSubmitForm(): void {
    if (!this.formModel.name || !this.formModel.sku || this.formModel.price == null) {
      alert('Name, SKU, and Price are required.');
      return;
    }

    const payload = {
      name: this.formModel.name,
      sku: this.formModel.sku,
      category_id: this.formModel.categoryId ?? 1,
      supplier_id: this.formModel.supplierId ?? 1,
      price_cents: Math.round((this.formModel.price ?? 0) * 100),
      quantity: this.formModel.stock ?? 0,
    };

    if (this.isEditMode && this.formModel.productId != null) {
      // -------- UPDATE --------
      const id = this.formModel.productId;

      this.productsService.updateProduct(id, payload).subscribe({
        next: () => {
          const categoryName = this.getCategoryName(this.formModel.categoryId ?? 1);
          const supplierName = this.getSupplierName(this.formModel.supplierId);

          // optimistic local update
          this.products = this.products.map((p) =>
            p.productId === id
              ? {
                  ...p,
                  name: this.formModel.name,
                  sku: this.formModel.sku,
                  categoryId: this.formModel.categoryId ?? 1,
                  supplierId: this.formModel.supplierId ?? null,
                  category: categoryName,
                  supplier: supplierName,
                  price: this.formModel.price ?? 0,
                  stock: this.formModel.stock ?? 0,
                }
              : p
          );
          this.applyFilter();
          this.isFormOpen = false;
        },
        error: (err) => {
          console.error('Failed to update product', err);
          alert('Failed to update product on server.');
        },
      });
    } else {
      // -------- ADD --------
      this.productsService.addProduct(payload).subscribe({
        next: (res) => {
          const newId: number =
            typeof res?.product_id === 'number'
              ? res.product_id
              : (this.products[this.products.length - 1]?.productId || 0) + 1;

          const categoryName = this.getCategoryName(this.formModel.categoryId ?? 1);
          const supplierName = this.getSupplierName(this.formModel.supplierId);

          const newProduct: Product = {
            productId: newId,
            id: `PRD-${String(newId).padStart(3, '0')}`,
            sku: this.formModel.sku,
            name: this.formModel.name,
            categoryId: this.formModel.categoryId ?? 1,
            supplierId: this.formModel.supplierId ?? null,
            category: categoryName,
            supplier: supplierName,
            price: this.formModel.price ?? 0,
            stock: this.formModel.stock ?? 0,
          };

          this.products = [...this.products, newProduct];
          this.applyFilter();

          this.isFormOpen = false;
          this.formModel = this.getEmptyFormModel();
        },
        error: (err) => {
          console.error('Failed to add product', err);

          let msg = 'Failed to add product on server.';

          // If backend sent a custom message, use it
          if (err?.status === 400 && err.error) {
            // our explicit duplicate code
            if (err.error.code === 'SKU_EXISTS') {
              msg = err.error.error || 'SKU already exists. Please use a different SKU.';
            } else if (typeof err.error === 'string') {
              msg = err.error;
            } else if (typeof err.error.error === 'string') {
              msg = err.error.error;
            }
          }

  alert(msg);
},

      });
    }
  }

  // ---------- delete ----------

  onDelete(product: Product): void {
    if (!confirm(`Delete product "${product.name}"?`)) {
      return;
    }

    this.productsService.deleteProduct(product.productId).subscribe({
      next: () => {
        this.products = this.products.filter(
          (p) => p.productId !== product.productId
        );
        this.applyFilter();
      },
      error: (err) => {
        console.error('Failed to delete product', err);
        alert('Failed to delete product on server.');
      },
    });
  }
}
