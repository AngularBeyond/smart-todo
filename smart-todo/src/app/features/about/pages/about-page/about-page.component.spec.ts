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
    expect(heroHeadline?.textContent).toContain('The Agentic way of building modern applications in Angular.');

    expect(element.textContent).toContain('An Agentic Blueprint');
    expect(element.textContent).toContain('Smart Todo is an open-source reference template demonstrating how to adopt Agentic AI');
    expect(element.textContent).toContain('Explore the code. Adopt the pattern. Build the future.');
  });

  it('should render the three core value pillars', () => {
    expect(element.textContent).toContain('01');
    expect(element.textContent).toContain('The Agentic Way');
    expect(element.textContent).toContain('See how autonomous AI agents, AG-UI visual patterns');

    expect(element.textContent).toContain('02');
    expect(element.textContent).toContain('AG-UI & A2UI in Action');
    expect(element.textContent).toContain('Discover how agents interact with typed signal stores');

    expect(element.textContent).toContain('03');
    expect(element.textContent).toContain('A Production Template');
    expect(element.textContent).toContain('Fork a rock-solid foundation with Angular 22');
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
    expect(footer?.textContent).toContain('Smart Todo is made to be remixed for Agentic AI.');
    expect(footer?.textContent).toContain('Open template · 2026');
  });
});
