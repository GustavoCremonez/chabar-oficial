import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatDialog } from '@angular/material/dialog';
import { RouterOutlet } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger, TextPlugin } from 'gsap/all';
import { ToastrService } from 'ngx-toastr';
import { catchError, interval, Subject, Subscription, takeUntil } from 'rxjs';
import { CheckinModalComponent } from './checkin-modal/checkin-modal.component';
import { SupabaseService } from './core/supabase.service';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

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
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  @HostListener('window:resize')
  onResize() {
    this.updateMapSize();
  }
  @ViewChild('heartSVG', { static: true }) heartSVG!: ElementRef;
  @ViewChild('suggestionsContainer') suggestionsContainer!: ElementRef;
  @ViewChild('receivedContainer') receivedContainer!: ElementRef;

  private subscription?: Subscription;
  private readonly _destroyed$: Subject<void> = new Subject<void>();
  private readonly _supabaseService: SupabaseService = inject(SupabaseService);
  private readonly _dialogService: MatDialog = inject(MatDialog);
  private readonly _toastr: ToastrService = inject(ToastrService);

  countdown: Countdown = { days: 0, hours: 0, minutes: 0 };

  mapWidth: string = '100%';
  mapHeight: string = '300px';

  marker: GeoMarker = {
    lat: -23.271449160067455,
    lng: -51.16413054110437,
  };
  options: google.maps.MapOptions = {
    mapId: 'DEMO_MAP_ID',
    center: { lat: -23.271449160067455, lng: -51.16413054110437 },
    zoom: 17,
  };

  listGifts: Set<string> = new Set();
  alreadyReceivedGifts: Set<string> = new Set();

  ngOnInit() {
    this.subscription = interval(1000).subscribe(() => {
      this.updateCountdown();
    });

    this.updateMapSize();
    this.getGiftList();
    this.animateHeart();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.setupScrollTrigger();
    }, 0);
  }

  setupScrollTrigger() {
    const suggestionsItems =
      this.suggestionsContainer.nativeElement.querySelectorAll('li');
    const receivedItems =
      this.receivedContainer.nativeElement.querySelectorAll('li');

    const allItems = [...suggestionsItems, ...receivedItems];

    gsap.set(allItems, { opacity: 0, x: -50 });

    ScrollTrigger.create({
      trigger: this.suggestionsContainer.nativeElement,
      start: 'top bottom-=100',
      end: 'bottom top+=100',
      onEnter: () => {
        this.animateItems(suggestionsItems, true);
      },
      toggleActions: 'play none none reverse',
    });

    ScrollTrigger.create({
      trigger: this.receivedContainer.nativeElement,
      start: 'top bottom-=100',
      end: 'bottom top+=100',
      onEnter: () => {
        this.animateItems(receivedItems, true);
      },
      toggleActions: 'play none none reverse',
    });
  }

  private animateItems(items: Element[], show: boolean) {
    gsap.to(items, {
      opacity: show ? 1 : 0,
      x: show ? 0 : -50,
      duration: 0.5,
      scrub: true,
      stagger: 0.1,
      ease: show ? 'power2.out' : 'power2.in',
      delay: 0.02,
    });
  }

  openCheckinModal() {
    this._dialogService
      .open(CheckinModalComponent, {
        width: '90vw',
        maxHeight: '90vh',
        enterAnimationDuration: 140,
        exitAnimationDuration: 140,
      })
      .afterClosed()
      .pipe(takeUntil(this._destroyed$))
      .subscribe((result) => {
        if (result?.success) {
          this._toastr.success('Presença confirmada com sucesso!', 'Sucesso');
        }
      });
  }

  animateHeart() {
    gsap.to(this.heartSVG.nativeElement, {
      scale: 1.2,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });
  }

  private async getGiftList(): Promise<void> {
    const receivedGifts = await this._supabaseService.getAllGifts(true);
    this.alreadyReceivedGifts = new Set(
      receivedGifts?.map((gift: { name: string }) => gift.name)
    );

    const availableGifts = await this._supabaseService.getAllGifts(false);
    this.listGifts = new Set(
      availableGifts?.map((gift: { name: string }) => gift.name)
    );

    this.syncRealtimeGiftsChanges();
    setTimeout(() => this.setupScrollTrigger(), 0);
  }

  private async syncRealtimeGiftsChanges(): Promise<void> {
    this._supabaseService
      .getGiftChanges()
      .pipe(
        takeUntil(this._destroyed$),
        catchError((error) => {
          console.error('Erro na sincronização em tempo real:', error);
          return [];
        })
      )
      .subscribe({
        next: (change) => {
          if (change.new) {
            const gift = change.new;

            if (gift.selected) {
              this.alreadyReceivedGifts = new Set([
                ...this.alreadyReceivedGifts,
                gift.name,
              ]);
              this.listGifts.delete(gift.name);
            } else {
              this.listGifts = new Set([...this.listGifts, gift.name]);
              this.alreadyReceivedGifts.delete(gift.name);
            }
          }
        },
        error: (error) => console.error('Erro na subscrição:', error),
      });
  }

  private updateMapSize() {
    const width = window.innerWidth;
    if (width < 640) {
      this.mapWidth = '100%';
      this.mapHeight = '250px';
    } else if (width < 768) {
      this.mapWidth = '100%';
      this.mapHeight = '300px';
    } else if (width < 1024) {
      this.mapWidth = '100%';
      this.mapHeight = '350px';
    } else {
      this.mapWidth = '100%';
      this.mapHeight = '400px';
    }
  }

  private updateCountdown() {
    const targetDate = new Date('2024-11-24T11:30:00');
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

    this._destroyed$.next();
    this._destroyed$.complete();
  }
}
