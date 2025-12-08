import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuppliersService, Supplier } from '../../services/suppliers.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './suppliers.html',
  styleUrls: ['./suppliers.scss'],
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];

  searchTerm: string = '';

  isFormOpen: boolean = false;
  isEditMode: boolean = false;

  formModel: {
    supplierId: number | null;
    name: string;
    email: string;
    phone: string;
    address: string;
  } = {
    supplierId: null,
    name: '',
    email: '',
    phone: '',
    address: '',
  };

  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(private suppliersService: SuppliersService) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  // ---------- helpers ----------

  private applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredSuppliers = [...this.suppliers];
      return;
    }

    this.filteredSuppliers = this.suppliers.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.phone.toLowerCase().includes(term) ||
      String(s.supplierId).includes(term)
    );
  }

  // ---------- load & search ----------

  loadSuppliers(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.suppliersService.getSuppliers().subscribe({
      next: (data: Supplier[]) => {
        this.suppliers = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load suppliers', err);
        this.errorMessage = 'Failed to load suppliers from server.';
        this.isLoading = false;
      },
    });
  }

  onSearch(): void {
    this.applyFilter();
  }

  // ---------- open / close form ----------

  openAddForm(): void {
    this.isFormOpen = true;
    this.isEditMode = false;
    this.formModel = {
      supplierId: null,
      name: '',
      email: '',
      phone: '',
      address: '',
    };
  }

  openEditForm(supplier: Supplier): void {
    this.isFormOpen = true;
    this.isEditMode = true;
    this.formModel = {
      supplierId: supplier.supplierId,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
    };
  }

  cancelForm(): void {
    this.isFormOpen = false;
  }

  // ---------- submit (add / edit) ----------
submitForm(): void {
  const name = this.formModel.name.trim();
  const email = this.formModel.email.trim();
  const phone = this.formModel.phone.trim();
  const address = this.formModel.address.trim();

  // ---------- BASIC REQUIRED CHECK ----------
  if (!name || !email || !phone || !address) {
    alert('All fields are required.');
    return;
  }

  // ---------- EMAIL VALIDATION ----------
  if (!email.includes('@') || !email.includes('.')) {
    alert('Please enter a valid email address (must contain @ and .)');
    return;
  }

  // ---------- PHONE VALIDATION ----------
  const digitsOnly = phone.replace(/\D/g, ''); // strip non-numbers

  if (digitsOnly.length < 7) {
    alert('Please enter a valid phone number (minimum 7 digits).');
    return;
  }

  const payload = {
    name,
    email,
    phone,
    address,
  };

  // ---------- EDIT ----------
  if (this.isEditMode && this.formModel.supplierId !== null) {
    const id = this.formModel.supplierId;

    this.suppliersService.updateSupplier(id, payload).subscribe({
      next: () => {
        this.suppliers = this.suppliers.map((s) =>
          s.supplierId === id ? { ...s, ...payload } : s
        );
        this.isFormOpen = false;
        this.applyFilter();
      },
      error: (err) => {
        console.error('Failed to update supplier', err);
        alert('Failed to update supplier.');
      },
    });

  // ---------- ADD ----------
  } else {
    this.suppliersService.addSupplier(payload).subscribe({
      next: (res: any) => {
        const newId =
          typeof res?.supplier_id === 'number'
            ? res.supplier_id
            : (this.suppliers[this.suppliers.length - 1]?.supplierId || 0) + 1;

        const newSupplier = {
          supplierId: newId,
          ...payload,
        };

        this.suppliers = [...this.suppliers, newSupplier];
        this.isFormOpen = false;
        this.applyFilter();
      },
      error: (err) => {
        console.error('Failed to add supplier', err);
        alert('Failed to add supplier.');
      },
    });
  }
}

  // ---------- delete ----------

  onDelete(supplier: Supplier): void {
    const confirmed = confirm(`Delete supplier "${supplier.name}"?`);

    if (!confirmed) return;

    this.suppliersService.deleteSupplier(supplier.supplierId).subscribe({
      next: () => {
        this.suppliers = this.suppliers.filter(
          (s) => s.supplierId !== supplier.supplierId
        );
        this.applyFilter();
      },
      error: (err: any) => {
        console.error('Failed to delete supplier', err);
        alert('Failed to delete supplier.');
      },
    });
  }
}
