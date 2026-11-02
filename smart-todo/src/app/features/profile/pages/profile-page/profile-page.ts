import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { AppStore } from '@core';
import { ProfileStore } from '../../store';
import { ChangePasswordFormComponent, ProfileFormComponent } from '../../components';

@Component({
  selector: 'app-profile-page',
  imports: [
    RouterLink,
    LucideArrowLeft,
    ProfileFormComponent,
    ChangePasswordFormComponent,
  ],
  providers: [ProfileStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './profile-page.css',
  templateUrl: './profile-page.html',
})
export class ProfilePage implements OnInit {
  protected readonly store = inject(ProfileStore);
  protected readonly appStore = inject(AppStore);

  ngOnInit(): void {
    const cachedProfile = this.appStore.profile();
    if (cachedProfile) {
      this.store.setProfile(cachedProfile);
    }
    this.store.loadProfile();
  }
}
