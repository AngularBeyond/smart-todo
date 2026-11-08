import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  LucideArrowUpRight,
  LucideBriefcaseBusiness,
  LucideCode2,
  LucideMessageCircle,
} from '@lucide/angular';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { CREATOR_LINKS, TECHNOLOGIES } from '../../constants';

@Component({
  selector: 'app-about-page',
  imports: [
    LucideArrowUpRight,
    LucideBriefcaseBusiness,
    LucideCode2,
    LucideMessageCircle,
    HlmSeparator,
  ],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {
  readonly technologies = TECHNOLOGIES;
  readonly links = CREATOR_LINKS;
}
