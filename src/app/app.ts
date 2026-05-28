import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styleUrl: './app.css'
})
export class App implements OnInit {
  private auth = inject(AuthService);
  protected readonly title = signal('mimesita-front');

  ngOnInit() {
    this.auth.sincronizarPerfil().subscribe();
  }
}
