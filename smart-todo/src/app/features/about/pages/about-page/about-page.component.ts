import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LucideArrowUpRight } from '@lucide/angular';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { environment } from '../../../../../environments/environment';
import { CREATOR_LINKS, TECHNOLOGIES } from '../../constants';

@Component({
  selector: 'app-about-page',
  imports: [
    LucideArrowUpRight,
    HlmSeparator,
  ],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {
  readonly technologies = TECHNOLOGIES;
  readonly links = CREATOR_LINKS;
  readonly version = environment.version;

  get versionLabel(): string {
    if (this.version.startsWith('commit ')) {
      return this.version;
    }
    if (this.version.startsWith('v')) {
      return this.version;
    }
    if (/^[0-9a-f]{7,40}$/i.test(this.version)) {
      return `commit ${this.version}`;
    }
    return `v${this.version}`;
  }

  get versionUrl(): string {
    const rawCommit = this.version.startsWith('commit ')
      ? this.version.replace('commit ', '').trim()
      : /^[0-9a-f]{7,40}$/i.test(this.version)
        ? this.version
        : null;

    if (rawCommit) {
      return `https://github.com/AngularBeyond/smart-todo/commit/${rawCommit}`;
    }
    return 'https://github.com/AngularBeyond/smart-todo/releases';
  }
}
