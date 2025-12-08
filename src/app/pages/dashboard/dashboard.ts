import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.dashboardService.getStats().subscribe({
      next: (data: DashboardStats) => {
        console.log('Dashboard stats from backend:', data);
        this.stats = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load dashboard stats', err);
        this.errorMessage = 'Failed to load dashboard statistics from server.';
        this.isLoading = false;
      }
    });
  }
}
