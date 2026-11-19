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
}
