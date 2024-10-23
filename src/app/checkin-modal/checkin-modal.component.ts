import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import {
  MatDialogModule,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { SupabaseService } from '../core/supabase.service';

interface Gift {
  id: string;
  name: string;
  selected: string;
  url_image: string;
  url_shop: string;
}

@Component({
  selector: 'app-checkin-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    MatDialogTitle,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatProgressSpinner,
    MatCheckbox,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './checkin-modal.component.html',
})
export class CheckinModalComponent implements OnInit, OnDestroy {
  private readonly _destroyed$: Subject<void> = new Subject<void>();
  private readonly _formBuilder: FormBuilder = new FormBuilder();
  private readonly _supabaseService: SupabaseService = inject(SupabaseService);
  private readonly _toastr: ToastrService = inject(ToastrService);

  constructor(public _dialogRef: MatDialogRef<CheckinModalComponent>) {}

  formGroup = this._formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    companions: [0],
  });

  isLoading: boolean = false;
  giftList: Array<Gift> = [];
  selectedGifts: Array<Gift> = [];

  ngOnInit(): void {
    this.getGiftList();
  }

  async handleCheckin(): Promise<void> {
    if (this.formGroup.valid) {
      let name = '';
      let companions = 0;

      if (this.formGroup.get('name')?.value) {
        name = this.formGroup.get('name')?.value as string;
      }

      if (this.formGroup.get('companions')?.value) {
        companions = this.formGroup.get('companions')?.value as number;
      }

      const response = await this._supabaseService.checkin({
        name,
        companions,
      });

      if (response.error) {
        this._toastr.error(
          'Falha ao confirmar presença, tente novamente mais tarde!'
        );
        return;
      }

      for (const gift of this.selectedGifts) {
        await this._supabaseService.setGiftSelected(gift.id, response[0].id);
      }

      this.formGroup.reset();
      this.selectedGifts = [];
      this._dialogRef.close({ success: true });
    }
  }

  handleCancel() {
    this._dialogRef.close();
  }

  handleSelectedGift(gift: Gift): void {
    const giftIndex = this.selectedGifts.findIndex((x) => x.id === gift.id);

    if (giftIndex !== -1) {
      this.selectedGifts.splice(giftIndex, 1);
    } else {
      this.selectedGifts.push(gift);
    }
  }

  private async getGiftList(): Promise<void> {
    const giftList = await this._supabaseService.getGiftList();

    this.giftList = giftList.map((gift: Gift) => ({
      id: gift.id,
      name: gift.name,
      selected: gift.selected,
      url_image: gift.url_image,
      url_shop: gift.url_shop,
    }));

    this.syncRealtimeGiftsChanges();
  }

  private async syncRealtimeGiftsChanges(): Promise<void> {
    this._supabaseService
      .getGiftChanges()
      .pipe(takeUntil(this._destroyed$))
      .subscribe((change) => {
        if (change.new) {
          const gift = change.new;

          if (gift.selected) {
            const giftIndex = this.giftList.findIndex(
              (x) => x.name === gift.name
            );

            if (giftIndex !== -1) {
              this.giftList.splice(giftIndex, 1);
            }
          } else {
            this.giftList.push({
              id: gift.id,
              name: gift.name,
              selected: gift.selected,
              url_image: gift.url_image,
              url_shop: gift.url_shop,
            });
          }
        }

        this.giftList.sort((a, b) => a.name.localeCompare(b.name));
      });
  }

  ngOnDestroy(): void {
    this._destroyed$.next();
    this._destroyed$.complete();
  }
}
