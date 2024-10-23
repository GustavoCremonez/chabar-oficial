import { Injectable } from '@angular/core';
import {
  createClient,
  RealtimeChannel,
  SupabaseClient,
} from '@supabase/supabase-js';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment.development';

const GIFT_TABLE = 'gift';
const CHECKIN_TABLE = 'checkin';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabaseClient: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey
  );

  private giftChangesChannel!: RealtimeChannel;
  private readonly giftChangesSubject: Subject<any> = new Subject<any>();

  constructor() {
    this.initializeGiftChangesChannel();
  }

  async getAllGifts(selecteds: boolean): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from(GIFT_TABLE)
      .select('name')
      .eq('selected', selecteds)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching gifts:', error);
      return [];
    }

    return data;
  }

  async getGiftList(): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from(GIFT_TABLE)
      .select('id, name, selected, url_image, url_shop')
      .eq('selected', false)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching gifts:', error);
      return [];
    }

    return data;
  }

  async checkin(checkin: { name: string; companions: number }): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from(CHECKIN_TABLE)
      .insert([checkin])
      .select();

    if (error) {
      console.error('Error fetching gifts:', error);
      return { error: true, message: error.message };
    }

    return data;
  }

  async setGiftSelected(giftId: string, checkinId: number): Promise<any> {
    const { data, error } = await this.supabaseClient
      .from(GIFT_TABLE)
      .update({ selected: true, checkin_id: checkinId })
      .eq('id', giftId);

    if (error) {
      console.error('Error fetching gifts:', error);
      return { error: true, message: error.message };
    }

    return data;
  }

  private initializeGiftChangesChannel() {
    this.giftChangesChannel = this.supabaseClient
      .channel('gift_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gift' },
        (payload) => {
          this.giftChangesSubject.next(payload);
        }
      )
      .subscribe((status) => {});
  }

  getGiftChanges(): Observable<any> {
    return this.giftChangesSubject.asObservable();
  }

  unsubscribeGiftChanges() {
    if (this.giftChangesChannel) {
      this.giftChangesChannel.unsubscribe();
    }
  }
}
