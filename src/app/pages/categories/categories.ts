import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../services/categories.service';
import { RouterLink } from '@angular/router';

export interface Category {
  // real DB id (category_id)
  categoryId: number;
  // display ID used in your HTML: {{ category.id }} e.g. CAT-001
  id: string;
  name: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './categories.html',
  styleUrls: ['./categories.scss'],
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  searchTerm: string = '';

  // modal state
  isFormOpen: boolean = false;
  isEditMode: boolean = false;

  // form model
  formModel: {
    categoryId: number | null; // real DB id
    displayId: string | null;  // pretty ID like CAT-001 (for display only)
    name: string;
  } = this.getEmptyFormModel();

  constructor(private categoriesService: CategoriesService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  // ---------- helpers ----------

  private getEmptyFormModel() {
    return {
      categoryId: null,
      displayId: null,
      name: '',
    };
  }

  /**
   * Central place to apply search filter
   */
  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredCategories = [...this.categories];
      return;
    }

    this.filteredCategories = this.categories.filter((category) =>
      category.id.toLowerCase().includes(term) ||
      category.name.toLowerCase().includes(term)
    );
  }

  // ---------- load & search ----------

  /**
   * Load categories from backend and map to UI model.
   */
  loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: (rows: any[]) => {
        // rows look like: { category_id, category_name }
        this.categories = rows.map(
          (row: any): Category => ({
            categoryId: row.category_id,
            id: `CAT-${String(row.category_id).padStart(3, '0')}`,
            name: row.category_name,
          })
        );

        this.applyFilter();
      },
      error: (err: any) => {
        console.error('Failed to load categories', err);
        alert('Failed to load categories from server.');
      },
    });
  }

  onSearch(): void {
    this.applyFilter();
  }

  // ---------- open / close form ----------

  /**
   * Open modal for ADD
   */
  onAddCategory(): void {
    this.isEditMode = false;
    this.formModel = this.getEmptyFormModel();
    this.isFormOpen = true;
  }

  /**
   * Open modal for EDIT
   */
  onEdit(category: Category): void {
    this.isEditMode = true;
    this.formModel = {
      categoryId: category.categoryId,
      displayId: category.id,
      name: category.name,
    };
    this.isFormOpen = true;
  }

  onCancelForm(): void {
    this.isFormOpen = false;
  }

  // ---------- submit (add / edit) ----------

  /**
   * Submit form – add or edit
   */
  onSubmitForm(): void {
    const name = this.formModel.name?.trim();
    if (!name) {
      alert('Category name is required.');
      return;
    }

    const payload = { name };

    if (this.isEditMode && this.formModel.categoryId != null) {
      // ===== UPDATE =====
      const id = this.formModel.categoryId;

      this.categoriesService.updateCategory(id, payload).subscribe({
        next: () => {
          // optimistic local update
          this.categories = this.categories.map((c) =>
            c.categoryId === id ? { ...c, name } : c
          );

          this.isFormOpen = false;
          this.applyFilter(); // keeps current search term
        },
        error: (err: any) => {
          console.error('Failed to update category', err);
          alert('Failed to update category.');
        },
      });
    } else {
      // ===== ADD =====
      this.categoriesService.addCategory(payload).subscribe({
        next: (res: any) => {
          const newId: number =
            typeof res?.category_id === 'number'
              ? res.category_id
              : (this.categories[this.categories.length - 1]?.categoryId || 0) + 1;

          const newCategory: Category = {
            categoryId: newId,
            id: `CAT-${String(newId).padStart(3, '0')}`,
            name,
          };

          // local update so UI changes immediately
          this.categories = [...this.categories, newCategory];
          this.isFormOpen = false;
          this.applyFilter();
        },
        error: (err: any) => {
          console.error('Failed to add category', err);
          alert('Failed to add category.');
        },
      });
    }
  }

  // ---------- delete ----------

  /**
   * Delete Category
   */
  onDelete(category: Category): void {
    const confirmed = confirm(`Are you sure you want to delete "${category.name}"?`);

    if (!confirmed) {
      return;
    }

    this.categoriesService.deleteCategory(category.categoryId).subscribe({
      next: () => {
        // optimistic local remove
        this.categories = this.categories.filter(
          (c) => c.categoryId !== category.categoryId
        );
        this.applyFilter();
      },
      error: (err: any) => {
        console.error('Failed to delete category', err);
        alert('Failed to delete category.');
      },
    });
  }
}
