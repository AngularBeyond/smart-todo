import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-main',
  imports: [Header, Sidebar, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './main.css',
  templateUrl: './main.html',
})
export class Main {}
