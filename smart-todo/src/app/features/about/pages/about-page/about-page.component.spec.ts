import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AboutPageComponent } from './about-page.component';
import { CREATOR_LINKS, TECHNOLOGIES } from '../../constants';

describe('AboutPageComponent', () => {
  let fixture: ComponentFixture<AboutPageComponent>;
  let component: AboutPageComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutPageComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the about page component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the hero section, headline, and project philosophy', () => {
    const heroHeadline = element.querySelector('h1');
    expect(heroHeadline).not.toBeNull();
    expect(heroHeadline?.textContent).toContain('A calmer starting point for building better products.');

    expect(element.textContent).toContain('A project worth sharing');
    expect(element.textContent).toContain('Smart Todo is an open, thoughtfully designed template');
    expect(element.textContent).toContain('Copy it. Learn from it. Make it yours.');
  });

  it('should render the three core value pillars', () => {
    expect(element.textContent).toContain('01');
    expect(element.textContent).toContain('Learn in context');
    expect(element.textContent).toContain('See how product thinking, visual systems, and real interactions fit together');

    expect(element.textContent).toContain('02');
    expect(element.textContent).toContain('Start with momentum');
    expect(element.textContent).toContain('Use the foundation for your next experiment');

    expect(element.textContent).toContain('03');
    expect(element.textContent).toContain('Make it personal');
    expect(element.textContent).toContain('Treat every screen as an invitation to improve');
  });

  it('should render the modern stack section with all 5 real technology cards', () => {
    expect(element.textContent).toContain('Built with');
    expect(element.textContent).toContain('A modern, readable stack');

    for (const tech of TECHNOLOGIES) {
      expect(element.textContent).toContain(tech.name);
      expect(element.textContent).toContain(tech.detail);
    }

    const techCards = element.querySelectorAll('section:nth-of-type(3) .grid > div');
    expect(techCards.length).toBe(TECHNOLOGIES.length);
  });

  it('should render all external project and creator links with security attributes', () => {
    expect(element.textContent).toContain('Keep exploring');
    expect(element.textContent).toContain('Find the source');

    const linkElements = element.querySelectorAll<HTMLAnchorElement>('section:nth-of-type(4) a');
    expect(linkElements.length).toBe(CREATOR_LINKS.length);

    linkElements.forEach((anchor, index) => {
      const expectedLink = CREATOR_LINKS[index];
      expect(anchor.getAttribute('href')).toBe(expectedLink.href);
      expect(anchor.getAttribute('target')).toBe('_blank');
      expect(anchor.getAttribute('rel')).toBe('noreferrer');
      expect(anchor.textContent).toContain(expectedLink.label);
    });
  });

  it('should render the template footer with remix notice and year badge', () => {
    const footer = element.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer?.textContent).toContain('Smart Todo is made to be remixed.');
    expect(footer?.textContent).toContain('Open template · 2026');
  });
});
