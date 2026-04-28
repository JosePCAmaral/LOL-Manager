import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

interface ApiHealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

interface DatabaseHealthResponse {
  status: string;
  database: string;
  result?: { ok?: number };
  message?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  apiHealth: ApiHealthResponse | null = null;
  dbHealth: DatabaseHealthResponse | null = null;
  loading = true;
  error = '';

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      api: this.http.get<ApiHealthResponse>('/api/health'),
      db: this.http.get<DatabaseHealthResponse>('/api/db/health'),
    }).subscribe({
      next: ({ api, db }) => {
        this.apiHealth = api;
        this.dbHealth = db;
        this.loading = false;
      },
      error: () => {
        this.apiHealth = null;
        this.dbHealth = null;
        this.loading = false;
        this.error = 'Não foi possível consultar a API neste momento.';
      },
    });
  }

  get apiOk(): boolean {
    return this.apiHealth?.status === 'ok';
  }

  get dbOk(): boolean {
    return this.dbHealth?.status === 'ok';
  }

  get apiLabel(): string {
    if (this.loading) {
      return 'carregando';
    }

    return this.apiOk ? 'online' : 'indisponível';
  }

  get dbLabel(): string {
    if (this.loading) {
      return 'carregando';
    }

    return this.dbOk ? 'conectado' : 'sem conexão';
  }

  get apiJson(): string {
    return this.apiHealth ? JSON.stringify(this.apiHealth, null, 2) : 'Nenhum dado ainda.';
  }

  get dbJson(): string {
    return this.dbHealth ? JSON.stringify(this.dbHealth, null, 2) : 'Nenhum dado ainda.';
  }
}