import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { RouterOutlet } from '@angular/router';
import { interval, Subscription } from 'rxjs';

interface GeoMarker {
  lat: number;
  lng: number;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GoogleMapsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  @HostListener('window:resize')
  onResize() {
    this.updateMapSize();
  }

  private subscription?: Subscription;

  countdown: Countdown = { days: 0, hours: 0, minutes: 0 };

  mapWidth: string = '100%';
  mapHeight: string = '300px';

  marker: GeoMarker = {
    lat: -23.24981434279823,
    lng: -51.187648190056926,
  };

  options: google.maps.MapOptions = {
    mapId: 'DEMO_MAP_ID',
    center: { lat: -23.24981434279823, lng: -51.187648190056926 },
    zoom: 17,
  };

  ngOnInit() {
    this.subscription = interval(1000).subscribe(() => {
      this.updateCountdown();
    });
    this.updateMapSize();
  }

  private updateMapSize() {
    const width = window.innerWidth;
    if (width < 640) {
      // sm
      this.mapWidth = '100%';
      this.mapHeight = '250px';
    } else if (width < 768) {
      // md
      this.mapWidth = '100%';
      this.mapHeight = '300px';
    } else if (width < 1024) {
      // lg
      this.mapWidth = '100%';
      this.mapHeight = '350px';
    } else {
      // xl and above
      this.mapWidth = '100%';
      this.mapHeight = '400px';
    }
  }

  private updateCountdown() {
    const targetDate = new Date('2024-11-24T12:00:00');
    const now = new Date();
    const timeDiff = targetDate.getTime() - now.getTime();

    if (timeDiff > 0) {
      this.countdown.days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      this.countdown.hours = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      this.countdown.minutes = Math.floor(
        (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
      );
    } else {
      this.countdown = { days: 0, hours: 0, minutes: 0 };
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
