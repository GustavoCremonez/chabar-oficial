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
    lat: -23.271449160067455,
    lng: -51.16413054110437,
  };

  options: google.maps.MapOptions = {
    mapId: 'DEMO_MAP_ID',
    center: { lat: -23.271449160067455, lng: -51.16413054110437 },
    zoom: 17,
  };

  listGifts: Set<string> = new Set([
    'Jogo de Cama 4 Peças Queen',
    'Jogo de Jantar',
    'Escorredor de Pratos de metal',
    'Jogo de Toalha',
    'Tábua de Roupa',
    'Kit de Limpeza',
    'Jogo de Facas',
    'Galheteiro',
    'Cesto de Roupas',
    'Escorredores',
    'Cortinas',
    'Frigideiras',
    'Formas em Geral',
    'Assadeiras/Travessas',
    'Jarra de Suco',
    'Mantinha Queen ou King',
    'Tigelas/Bowl',
    'Raladores/Espremedor/Descascador',
    'Kit de Saladeiras Bowl',
    'Toalha de Mesa',
    'Conjunto de Sobremesa',
    'Jogo de Tapetes',
    'Jogo de Colcha Queen 3 Peças',
    'Jogo de Xícaras',
    'Tupperware Eletrolux',
    'Varal Recolhivel',
    'Rodo Mob Spray',
    'Sanduicheira',
    'Ferro',
    'Manta p/ Sofá',
    'Xixer',
    'Edredom',
    'Tapete Peludinho',
    'Lixeiras p/ Cozinha e Banheiro',
    'Kit de Utensílios p/ Banheiro',
    'Porta Filtro de Café 102',
    'Itens de Decoracao',
    'Itens de Decoracao Parede',
    'Organizador de Mantimentos',
    'Porta Talheres Bambu',
    'Chaleira',
    'Bomboniere',
  ]);
  alreadyReceivedGifts: Set<string> = new Set([
    'Liquidificador',
    'Batedeira',
    'Potes de Plastico',
    'Copos de Vidro',
    'Utensílios de Silicone',
    'Talheres',
    'Porta Temperos',
    'Panelas',
    'Garrafa de Café',
    'Panela de Pressão',
    'Petisqueira',
    'Jogo de Panelas',
  ]);

  ngOnInit() {
    this.subscription = interval(1000).subscribe(() => {
      this.updateCountdown();
    });
    this.updateMapSize();
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
